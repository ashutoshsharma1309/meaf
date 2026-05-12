"""Research-paper-grade visualization for the MEAF ensemble classifier.

Generates the following figures (all IEEE-style, 300dpi):
  Fig 1.  class_distribution_pie.png       real vs augmented counts per class
  Fig 2.  leaf_samples_grid.png            qualitative samples per class
  Fig 3.  confusion_matrix.png             counts + percentages
  Fig 4.  per_class_metrics.png            P / R / F1 bars
  Fig 5.  roc_curves.png                   one-vs-rest ROC + AUC
  Fig 6.  pr_curves.png                    one-vs-rest precision-recall + AP
  Fig 7.  feature_importance.png           feature-group importance from RF
  Fig 8.  pca_projection.png               2-D PCA of feature space
  Fig 9.  learning_curve.png               accuracy vs training-set size
  Fig 10. calibration_curve.png            reliability diagram per class
  Fig 11. confidence_distribution.png      class-conditional confidence
  Fig 12. model_comparison.png             RF/HGB/SVM/Voting bar chart
  Fig 13. sample_predictions.png           qualitative test predictions
  Fig 14. metrics_table.png                full IEEE-style results table
"""
from __future__ import annotations

import json
import pickle
from pathlib import Path

import numpy as np
import matplotlib.pyplot as plt
from matplotlib.patches import Patch
from PIL import Image
from sklearn.decomposition import PCA
from sklearn.metrics import (
    precision_recall_fscore_support, roc_curve, auc,
    precision_recall_curve, average_precision_score,
    accuracy_score, balanced_accuracy_score, cohen_kappa_score,
    matthews_corrcoef, log_loss, roc_auc_score, f1_score, confusion_matrix,
)
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import label_binarize
from sklearn.calibration import calibration_curve

from utils.features import extract

ROOT = Path(__file__).resolve().parent.parent
DATASET = ROOT / "dataset"
MODELS = ROOT / "models"
OUTPUTS = ROOT / "outputs"
CLASSES = ["Potato_Early_Blight", "Potato_Healthy", "Tomato_Early_Blight", "Tomato_Healthy"]
SHORT = ["P-Early Blight", "P-Healthy", "T-Early Blight", "T-Healthy"]
COLORS = ["#c0392b", "#27ae60", "#d35400", "#1e8449"]
SEED = 42

plt.rcParams.update({
    "font.family": "serif",
    "font.size": 10,
    "axes.titlesize": 11,
    "axes.labelsize": 10,
    "axes.spines.top": False,
    "axes.spines.right": False,
    "figure.dpi": 110,
})


def load_paths_and_labels():
    paths, labels, is_aug = [], [], []
    for idx, c in enumerate(CLASSES):
        for f in sorted((DATASET / c).iterdir()):
            if f.suffix.lower() in {".jpg", ".jpeg", ".png"}:
                paths.append(str(f))
                labels.append(idx)
                is_aug.append(f.name.startswith("aug_"))
    return paths, np.array(labels), np.array(is_aug, dtype=bool)


# ---------- Fig 1 ----------
def fig_class_pie(labels, is_aug, out):
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(13, 6))
    counts = [int((labels == i).sum()) for i in range(len(CLASSES))]
    ax1.pie(
        counts, labels=SHORT, colors=COLORS,
        autopct=lambda p: f"{p:.1f}%\n({int(round(p*sum(counts)/100))})",
        startangle=90, wedgeprops={"edgecolor": "white", "linewidth": 2},
        textprops={"fontsize": 10},
    )
    ax1.set_title(f"(a) Class distribution after augmentation\n(N = {sum(counts)})")

    reals = [int(((labels == i) & ~is_aug).sum()) for i in range(len(CLASSES))]
    augs = [int(((labels == i) & is_aug).sum()) for i in range(len(CLASSES))]
    x = np.arange(len(CLASSES))
    w = 0.4
    ax2.bar(x - w / 2, reals, w, label="Real (PlantVillage)", color="#2c3e50")
    ax2.bar(x + w / 2, augs, w, label="Augmented", color="#bdc3c7", edgecolor="#2c3e50")
    for i, (r, a) in enumerate(zip(reals, augs)):
        ax2.text(i - w / 2, r + 25, str(r), ha="center", fontsize=8)
        ax2.text(i + w / 2, a + 25, str(a), ha="center", fontsize=8)
    ax2.set_xticks(x)
    ax2.set_xticklabels(SHORT, fontsize=9)
    ax2.set_ylabel("Number of images")
    ax2.set_title("(b) Real vs. augmented samples per class")
    ax2.legend(loc="upper right")
    ax2.grid(axis="y", alpha=0.3)
    fig.suptitle("Fig. 1.  Dataset Composition", fontsize=12, fontweight="bold")
    fig.tight_layout()
    fig.savefig(out, dpi=300, bbox_inches="tight")
    plt.close(fig)


# ---------- Fig 2 ----------
def fig_leaf_grid(paths, labels, is_aug, out, per_class=6):
    rows, cols = len(CLASSES), per_class
    fig, axes = plt.subplots(rows, cols, figsize=(cols * 2.2, rows * 2.4))
    for i, c in enumerate(CLASSES):
        # show 3 real + 3 augmented if available
        cls_real = [p for p, l, a in zip(paths, labels, is_aug) if l == i and not a][:3]
        cls_aug = [p for p, l, a in zip(paths, labels, is_aug) if l == i and a][:3]
        cls_paths = cls_real + cls_aug
        for j in range(cols):
            ax = axes[i, j]
            ax.axis("off")
            if j < len(cls_paths):
                img = Image.open(cls_paths[j]).convert("RGB").resize((160, 160))
                ax.imshow(img)
                tag = "real" if j < len(cls_real) else "aug"
                ax.text(0.95, 0.05, tag, transform=ax.transAxes, ha="right", va="bottom",
                        fontsize=7, color="white",
                        bbox=dict(boxstyle="round,pad=0.2", facecolor="black", alpha=0.6))
            if j == 0:
                ax.text(-0.20, 0.5, SHORT[i], transform=ax.transAxes,
                        ha="right", va="center", fontsize=10, fontweight="bold",
                        color=COLORS[i])
    fig.suptitle("Fig. 2.  Representative samples (3 real + 3 augmented per class)",
                 fontsize=12, fontweight="bold")
    fig.tight_layout()
    fig.savefig(out, dpi=300, bbox_inches="tight")
    plt.close(fig)


# ---------- Fig 3 ----------
def fig_confusion(cm, out):
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12.5, 5.5))
    # counts
    im = ax1.imshow(cm, cmap="Blues")
    ax1.set_xticks(range(len(CLASSES)))
    ax1.set_yticks(range(len(CLASSES)))
    ax1.set_xticklabels(SHORT, rotation=30, ha="right", fontsize=9)
    ax1.set_yticklabels(SHORT, fontsize=9)
    ax1.set_xlabel("Predicted")
    ax1.set_ylabel("True")
    ax1.set_title("(a) Counts")
    for i in range(cm.shape[0]):
        for j in range(cm.shape[1]):
            ax1.text(j, i, str(cm[i, j]), ha="center", va="center",
                     color="white" if cm[i, j] > cm.max() / 2 else "black", fontsize=10)
    fig.colorbar(im, ax=ax1, fraction=0.046, pad=0.04)
    # normalised
    cmn = cm.astype(float) / cm.sum(axis=1, keepdims=True)
    im2 = ax2.imshow(cmn, cmap="Greens", vmin=0, vmax=1)
    ax2.set_xticks(range(len(CLASSES)))
    ax2.set_yticks(range(len(CLASSES)))
    ax2.set_xticklabels(SHORT, rotation=30, ha="right", fontsize=9)
    ax2.set_yticklabels(SHORT, fontsize=9)
    ax2.set_xlabel("Predicted")
    ax2.set_ylabel("True")
    ax2.set_title("(b) Row-normalised (recall)")
    for i in range(cmn.shape[0]):
        for j in range(cmn.shape[1]):
            ax2.text(j, i, f"{cmn[i, j]*100:.1f}%", ha="center", va="center",
                     color="white" if cmn[i, j] > 0.5 else "black", fontsize=9)
    fig.colorbar(im2, ax=ax2, fraction=0.046, pad=0.04)
    fig.suptitle("Fig. 3.  Confusion matrix (test set)", fontsize=12, fontweight="bold")
    fig.tight_layout()
    fig.savefig(out, dpi=300, bbox_inches="tight")
    plt.close(fig)


# ---------- Fig 4 ----------
def fig_per_class_metrics(y_test, y_pred, out):
    p, r, f1, _ = precision_recall_fscore_support(y_test, y_pred, labels=list(range(len(CLASSES))), zero_division=0)
    x = np.arange(len(CLASSES))
    w = 0.27
    fig, ax = plt.subplots(figsize=(9.5, 5))
    ax.bar(x - w, p, w, label="Precision", color="#3498db", edgecolor="black", linewidth=0.5)
    ax.bar(x, r, w, label="Recall", color="#e67e22", edgecolor="black", linewidth=0.5)
    ax.bar(x + w, f1, w, label="F1-score", color="#27ae60", edgecolor="black", linewidth=0.5)
    ax.set_xticks(x)
    ax.set_xticklabels(SHORT, fontsize=10)
    ax.set_ylim(0.85, 1.005)
    ax.set_ylabel("Score")
    ax.set_title("Fig. 4.  Per-class precision / recall / F1 (test set)")
    ax.legend(loc="lower right")
    for i, vals in enumerate(zip(p, r, f1)):
        for k, v in enumerate(vals):
            ax.text(x[i] + (k - 1) * w, v + 0.003, f"{v:.3f}", ha="center", fontsize=7.5)
    ax.grid(axis="y", alpha=0.3)
    fig.tight_layout()
    fig.savefig(out, dpi=300, bbox_inches="tight")
    plt.close(fig)


# ---------- Fig 5 ----------
def fig_roc(y_test, proba, out):
    y_bin = label_binarize(y_test, classes=list(range(len(CLASSES))))
    fig, ax = plt.subplots(figsize=(7.5, 6.5))
    aucs = []
    for i, c in enumerate(SHORT):
        fpr, tpr, _ = roc_curve(y_bin[:, i], proba[:, i])
        a = auc(fpr, tpr)
        aucs.append(a)
        ax.plot(fpr, tpr, color=COLORS[i], lw=2, label=f"{c}  (AUC = {a:.4f})")
    # micro-average
    fpr_m, tpr_m, _ = roc_curve(y_bin.ravel(), proba.ravel())
    a_m = auc(fpr_m, tpr_m)
    ax.plot(fpr_m, tpr_m, color="black", lw=2, linestyle=":", label=f"Micro-avg  (AUC = {a_m:.4f})")
    ax.plot([0, 1], [0, 1], "k--", lw=1, alpha=0.5)
    ax.set_xlabel("False Positive Rate")
    ax.set_ylabel("True Positive Rate")
    ax.set_title(f"Fig. 5.  One-vs-Rest ROC curves  (macro AUC = {np.mean(aucs):.4f})")
    ax.legend(loc="lower right", fontsize=9)
    ax.grid(alpha=0.3)
    fig.tight_layout()
    fig.savefig(out, dpi=300, bbox_inches="tight")
    plt.close(fig)


# ---------- Fig 6 ----------
def fig_pr(y_test, proba, out):
    y_bin = label_binarize(y_test, classes=list(range(len(CLASSES))))
    fig, ax = plt.subplots(figsize=(7.5, 6.5))
    aps = []
    for i, c in enumerate(SHORT):
        prec, rec, _ = precision_recall_curve(y_bin[:, i], proba[:, i])
        ap = average_precision_score(y_bin[:, i], proba[:, i])
        aps.append(ap)
        ax.plot(rec, prec, color=COLORS[i], lw=2, label=f"{c}  (AP = {ap:.4f})")
    ax.set_xlabel("Recall")
    ax.set_ylabel("Precision")
    ax.set_title(f"Fig. 6.  Precision-Recall curves  (mAP = {np.mean(aps):.4f})")
    ax.legend(loc="lower left", fontsize=9)
    ax.grid(alpha=0.3)
    fig.tight_layout()
    fig.savefig(out, dpi=300, bbox_inches="tight")
    plt.close(fig)


# ---------- Fig 7 ----------
def fig_feature_importance(model, out):
    rf = model.named_estimators_["rf"]
    imp = rf.feature_importances_
    n = len(imp)
    lbp_n = 18
    hog_end = n - lbp_n
    groups = [
        ("Red histogram (8 bins)", 0, 8, "#e74c3c"),
        ("Green histogram (8 bins)", 8, 16, "#27ae60"),
        ("Blue histogram (8 bins)", 16, 24, "#2980b9"),
        ("HSV stats + green/brown", 24, 35, "#f39c12"),
        ("HOG texture", 35, hog_end, "#8e44ad"),
        ("LBP (uniform, P=16, R=2)", hog_end, n, "#16a085"),
    ]
    totals = [(name, imp[a:b].sum(), color, b - a) for name, a, b, color in groups]
    fig, ax = plt.subplots(figsize=(10, 5.2))
    bars = ax.barh([t[0] for t in totals], [t[1] for t in totals],
                    color=[t[2] for t in totals], edgecolor="black", linewidth=0.5)
    for bar, (_, v, _, n_f) in zip(bars, totals):
        ax.text(v + 0.005, bar.get_y() + bar.get_height() / 2,
                f"{v*100:.1f}%  ({n_f} features)", va="center", fontsize=9)
    ax.set_xlabel("Aggregated Random-Forest feature importance")
    ax.set_title("Fig. 7.  Importance of each handcrafted feature group")
    ax.invert_yaxis()
    ax.grid(axis="x", alpha=0.3)
    ax.set_xlim(0, max(t[1] for t in totals) * 1.25)
    fig.tight_layout()
    fig.savefig(out, dpi=300, bbox_inches="tight")
    plt.close(fig)


# ---------- Fig 8 ----------
def fig_pca(X, y, out):
    pca = PCA(n_components=2, random_state=SEED)
    Z = pca.fit_transform(X)
    fig, ax = plt.subplots(figsize=(8.5, 6.5))
    for i, c in enumerate(SHORT):
        mask = y == i
        ax.scatter(Z[mask, 0], Z[mask, 1], s=10, alpha=0.55, c=COLORS[i],
                   label=f"{c}  (n={int(mask.sum())})", edgecolors="none")
    ev = pca.explained_variance_ratio_ * 100
    ax.set_xlabel(f"PC1  ({ev[0]:.1f}% var.)")
    ax.set_ylabel(f"PC2  ({ev[1]:.1f}% var.)")
    ax.set_title(f"Fig. 8.  2-D PCA projection of the 1621-D feature space\n"
                 f"(total explained variance: {ev.sum():.1f}%)")
    ax.legend(loc="best", fontsize=9, framealpha=0.95)
    ax.grid(alpha=0.3)
    fig.tight_layout()
    fig.savefig(out, dpi=300, bbox_inches="tight")
    plt.close(fig)


# ---------- Fig 9 ----------
def fig_learning_curve(out):
    lc = json.loads((OUTPUTS / "learning_curve.json").read_text())
    sizes = np.array(lc["train_sizes"])
    tm, ts = np.array(lc["train_mean"]), np.array(lc["train_std"])
    vm, vs = np.array(lc["val_mean"]), np.array(lc["val_std"])
    fig, ax = plt.subplots(figsize=(8.5, 5.5))
    ax.plot(sizes, tm, "o-", color="#2980b9", label="Training accuracy")
    ax.fill_between(sizes, tm - ts, tm + ts, alpha=0.2, color="#2980b9")
    ax.plot(sizes, vm, "s-", color="#c0392b", label="Validation accuracy (3-fold CV)")
    ax.fill_between(sizes, vm - vs, vm + vs, alpha=0.2, color="#c0392b")
    ax.set_xlabel("Number of training samples")
    ax.set_ylabel("Accuracy")
    ax.set_title("Fig. 9.  Learning curve of the MEAF Voting ensemble")
    ax.set_ylim(min(vm.min() - 0.02, 0.85), 1.005)
    ax.legend(loc="lower right")
    ax.grid(alpha=0.3)
    fig.tight_layout()
    fig.savefig(out, dpi=300, bbox_inches="tight")
    plt.close(fig)


# ---------- Fig 10 ----------
def fig_calibration(y_test, proba, out):
    y_bin = label_binarize(y_test, classes=list(range(len(CLASSES))))
    fig, ax = plt.subplots(figsize=(7.5, 6.5))
    ax.plot([0, 1], [0, 1], "k--", lw=1, alpha=0.5, label="Perfect calibration")
    for i, c in enumerate(SHORT):
        frac_pos, mean_pred = calibration_curve(y_bin[:, i], proba[:, i], n_bins=10, strategy="quantile")
        ax.plot(mean_pred, frac_pos, "o-", color=COLORS[i], lw=2, label=c)
    ax.set_xlabel("Mean predicted probability")
    ax.set_ylabel("Empirical positive fraction")
    ax.set_title("Fig. 10.  Reliability diagram (calibration)")
    ax.legend(loc="lower right", fontsize=9)
    ax.grid(alpha=0.3)
    fig.tight_layout()
    fig.savefig(out, dpi=300, bbox_inches="tight")
    plt.close(fig)


# ---------- Fig 11 ----------
def fig_confidence_distribution(y_test, y_pred, proba, out):
    max_p = proba.max(axis=1)
    correct = y_test == y_pred
    fig, ax = plt.subplots(figsize=(8.5, 5.5))
    bins = np.linspace(0.25, 1.0, 31)
    ax.hist(max_p[correct], bins=bins, color="#27ae60", alpha=0.75,
            label=f"Correct (n={int(correct.sum())})", edgecolor="black", linewidth=0.4)
    ax.hist(max_p[~correct], bins=bins, color="#c0392b", alpha=0.85,
            label=f"Incorrect (n={int((~correct).sum())})", edgecolor="black", linewidth=0.4)
    ax.set_xlabel("Maximum predicted probability")
    ax.set_ylabel("Number of test samples")
    ax.set_title("Fig. 11.  Distribution of top-1 confidence on the test set")
    ax.legend(loc="upper left")
    ax.grid(axis="y", alpha=0.3)
    fig.tight_layout()
    fig.savefig(out, dpi=300, bbox_inches="tight")
    plt.close(fig)


# ---------- Fig 12 ----------
def fig_model_comparison(per_est, ensemble_metrics, out):
    fig, ax = plt.subplots(figsize=(10, 5.5))
    metric_names = ["accuracy", "macro_f1", "kappa", "mcc"]
    name_pretty = ["Accuracy", "Macro F1", "Cohen's κ", "MCC"]
    models = list(per_est.keys()) + ["voting"]
    pretty_models = ["Random Forest", "HGBoost", "SVM (RBF)", "Voting (ours)"]
    x = np.arange(len(models))
    w = 0.20
    palette = ["#3498db", "#e67e22", "#9b59b6", "#27ae60"]
    for k, m in enumerate(metric_names):
        vals = [per_est[mod][m] for mod in per_est] + [ensemble_metrics[m] if m in ensemble_metrics
                                                       else ensemble_metrics[f"{m}_v"]]
        ax.bar(x + (k - 1.5) * w, vals, w, label=name_pretty[k], color=palette[k],
               edgecolor="black", linewidth=0.4)
        for xi, v in zip(x + (k - 1.5) * w, vals):
            ax.text(xi, v + 0.005, f"{v:.3f}", ha="center", fontsize=7, rotation=90)
    ax.set_xticks(x)
    ax.set_xticklabels(pretty_models, fontsize=10)
    ax.set_ylim(0.85, 1.03)
    ax.set_ylabel("Score")
    ax.set_title("Fig. 12.  Individual classifiers vs. soft-voting ensemble")
    ax.legend(loc="lower right", ncol=4, fontsize=9)
    ax.grid(axis="y", alpha=0.3)
    fig.tight_layout()
    fig.savefig(out, dpi=300, bbox_inches="tight")
    plt.close(fig)


# ---------- Fig 13 ----------
def fig_sample_predictions(paths_test, y_test, y_pred, proba, out, n=12):
    import random as _r
    rng = _r.Random(SEED)
    idxs = rng.sample(range(len(paths_test)), min(n, len(paths_test)))
    cols = 4
    rows = (len(idxs) + cols - 1) // cols
    fig, axes = plt.subplots(rows, cols, figsize=(cols * 3, rows * 3.2))
    axes = np.array(axes).reshape(rows, cols)
    for ax in axes.flat:
        ax.axis("off")
    for k, i in enumerate(idxs):
        r, c = divmod(k, cols)
        ax = axes[r, c]
        img = Image.open(paths_test[i]).convert("RGB").resize((160, 160))
        ok = y_pred[i] == y_test[i]
        ax.imshow(img)
        title = f"Pred: {SHORT[y_pred[i]]}\nTrue: {SHORT[y_test[i]]}  ({proba[i, y_pred[i]]*100:.0f}%)"
        ax.set_title(title, color=("green" if ok else "red"), fontsize=8)
    fig.suptitle("Fig. 13.  Sample predictions on the held-out test set\n(green = correct, red = mis-classified)",
                 fontsize=12, fontweight="bold")
    fig.tight_layout()
    fig.savefig(out, dpi=300, bbox_inches="tight")
    plt.close(fig)


# ---------- Fig 14 ----------
def fig_metrics_table(metrics, y_test, y_pred, out):
    p, r, f1, sup = precision_recall_fscore_support(y_test, y_pred, labels=list(range(len(CLASSES))), zero_division=0)
    rows = []
    for i, c in enumerate(CLASSES):
        errors = int(sup[i] - r[i] * sup[i] + 0.5)
        rows.append([c, f"{p[i]*100:.2f}", f"{r[i]*100:.2f}", f"{f1[i]*100:.2f}",
                     str(int(sup[i])), str(errors)])
    rows.append(["─" * 5] * 6)
    rows.append(["Macro average", f"{p.mean()*100:.2f}", f"{r.mean()*100:.2f}",
                 f"{f1.mean()*100:.2f}", str(int(sup.sum())), str(int(sup.sum() - r.mean()*sup.sum() + 0.5))])

    # Aggregate / global metrics block
    ci_lo, ci_hi = metrics["test_accuracy_ci95"]
    f1_lo, f1_hi = metrics["macro_f1_ci95"]
    agg_rows = [
        ["Test accuracy", f"{metrics['test_accuracy']*100:.2f}%",
         f"[{ci_lo*100:.2f}, {ci_hi*100:.2f}] %", "(bootstrap 95% CI, B=1000)"],
        ["Balanced accuracy", f"{metrics['balanced_accuracy']*100:.2f}%", "", ""],
        ["Macro F1", f"{metrics['macro_f1']*100:.2f}%",
         f"[{f1_lo*100:.2f}, {f1_hi*100:.2f}] %", "(bootstrap 95% CI)"],
        ["Cohen's kappa  (κ)", f"{metrics['cohen_kappa']:.4f}", "", ""],
        ["Matthews corr. coef.", f"{metrics['matthews_corrcoef']:.4f}", "", ""],
        ["Macro AUC (OvR)", f"{metrics['macro_auc_ovr']:.4f}", "", ""],
        ["Log-loss", f"{metrics['log_loss']:.4f}", "", "(lower is better)"],
        ["Training accuracy", f"{metrics['train_accuracy']*100:.2f}%", "", ""],
        ["5-fold CV accuracy",
         f"{metrics['cv_mean']*100:.2f} ± {metrics['cv_std']*100:.2f}%",
         "", "(mean ± std over folds)"],
    ]

    fig = plt.figure(figsize=(13.5, 12.5))
    gs = fig.add_gridspec(
        6, 1,
        height_ratios=[1.6, 0.25, 2.0, 0.25, 0.25, 2.6],
        hspace=0.05,
    )

    # ---- Header info ----
    ax0 = fig.add_subplot(gs[0])
    ax0.axis("off")
    ax0.add_patch(plt.Rectangle((0, 0), 1, 1, transform=ax0.transAxes,
                                 facecolor="#ecf0f1", edgecolor="#2c3e50", linewidth=1.2))
    ax0.text(0.5, 0.93, "TABLE I",
             transform=ax0.transAxes, fontsize=15, fontweight="bold",
             ha="center", va="top", family="serif", color="#2c3e50")
    ax0.text(0.5, 0.76, "MEAF Ensemble Classifier — Detailed Test-Set Performance Report",
             transform=ax0.transAxes, fontsize=12, fontweight="bold",
             ha="center", va="top", family="serif")
    header_lines = [
        f"Dataset:  4 classes (Potato/Tomato × Healthy/Early-Blight) from PlantVillage",
        f"Total samples:  {metrics['n_train'] + metrics['n_test']}   "
        f"(real: {metrics['n_real']},  augmented: {metrics['n_aug']})",
        f"Train / Test split:  {metrics['n_train']} / {metrics['n_test']}   "
        f"(stratified, seed = {SEED})",
        f"Feature vector:  {metrics['feature_dim']}-D   (RGB hist + HSV stats + HOG + LBP)",
        f"Model:  Soft-voting ensemble  =  RandomForest(400) + HistGradBoost(400) + SVM(RBF, C=8)",
        f"Training time:  {metrics['train_time_seconds']:.1f} s on CPU",
    ]
    for i, line in enumerate(header_lines):
        ax0.text(0.06, 0.58 - i * 0.095, line,
                 transform=ax0.transAxes, fontsize=10.5, va="top", family="serif")

    # ---- Sub-title (a) ----
    ax_t1 = fig.add_subplot(gs[1])
    ax_t1.axis("off")
    ax_t1.text(0.0, 0.3, "(a)  Per-class metrics",
               transform=ax_t1.transAxes, fontsize=12, fontweight="bold", va="center")

    # ---- Per-class table ----
    ax1 = fig.add_subplot(gs[2])
    ax1.axis("off")
    t1 = ax1.table(
        cellText=rows,
        colLabels=["Class", "Precision (%)", "Recall (%)", "F1 (%)", "Support", "Errors"],
        cellLoc="center", loc="upper center",
        colWidths=[0.30, 0.14, 0.13, 0.12, 0.12, 0.12],
    )
    t1.auto_set_font_size(False)
    t1.set_fontsize(11)
    t1.scale(1, 1.85)
    for j in range(6):
        t1[(0, j)].set_facecolor("#2c3e50")
        t1[(0, j)].set_text_props(color="white", fontweight="bold")
        t1[(0, j)].set_height(0.18)
    for i in range(len(CLASSES)):
        for j in range(6):
            t1[(i + 1, j)].set_facecolor("#f4f8fb" if i % 2 == 0 else "#e8eff5")
        t1[(i + 1, 0)].set_text_props(color=COLORS[i], fontweight="bold")

    # ---- Spacer ----
    ax_sp = fig.add_subplot(gs[3])
    ax_sp.axis("off")

    # ---- Sub-title (b) ----
    ax_t2 = fig.add_subplot(gs[4])
    ax_t2.axis("off")
    ax_t2.text(0.0, 0.3, "(b)  Aggregate and probabilistic metrics",
               transform=ax_t2.transAxes, fontsize=12, fontweight="bold", va="center")

    # ---- Aggregate metrics table ----
    ax2 = fig.add_subplot(gs[5])
    ax2.axis("off")
    t2 = ax2.table(
        cellText=agg_rows,
        colLabels=["Metric", "Value", "95% CI", "Notes"],
        cellLoc="left", loc="upper center",
        colWidths=[0.30, 0.22, 0.22, 0.26],
    )
    t2.auto_set_font_size(False)
    t2.set_fontsize(11)
    t2.scale(1, 1.75)
    for j in range(4):
        t2[(0, j)].set_facecolor("#2c3e50")
        t2[(0, j)].set_text_props(color="white", fontweight="bold")
        t2[(0, j)].set_height(0.10)
    for i in range(len(agg_rows)):
        for j in range(4):
            t2[(i + 1, j)].set_facecolor("#fff7e6" if i % 2 == 0 else "#fdecd0")
        t2[(i + 1, 0)].set_text_props(fontweight="bold")

    # add small left padding to all cells of both tables
    for tab in (t1, t2):
        for cell in tab.get_celld().values():
            cell.PAD = 0.04

    fig.savefig(out, dpi=300, bbox_inches="tight", facecolor="white")
    plt.close(fig)


def main():
    print("Loading model and arrays ...")
    with open(MODELS / "meaf_ensemble.pkl", "rb") as f:
        bundle = pickle.load(f)
    model, scaler = bundle["model"], bundle["scaler"]

    cache = np.load(MODELS / "features_cache.npz", allow_pickle=True)
    X, y, all_paths = cache["X"], cache["y"], list(cache["paths"])

    # re-derive is_aug from filenames
    is_aug = np.array([Path(p).name.startswith("aug_") for p in all_paths])

    X_train, X_test, y_train, y_test, p_train, p_test = train_test_split(
        X, y, all_paths, test_size=0.20, stratify=y, random_state=SEED
    )
    X_test_s = scaler.transform(X_test)

    y_pred = np.load(OUTPUTS / "y_pred.npy")
    y_test = np.load(OUTPUTS / "y_test.npy")
    proba = np.load(OUTPUTS / "proba_test.npy")
    cm = np.load(OUTPUTS / "confusion.npy")
    metrics = json.loads((OUTPUTS / "metrics.json").read_text())

    # voting metrics formatted for fig_model_comparison
    voting_for_cmp = {
        "accuracy": metrics["test_accuracy"],
        "macro_f1": metrics["macro_f1"],
        "kappa": metrics["cohen_kappa"],
        "mcc": metrics["matthews_corrcoef"],
    }

    OUTPUTS.mkdir(exist_ok=True)
    print("Generating Fig 1 (class distribution) ...");      fig_class_pie(y, is_aug, OUTPUTS / "class_distribution_pie.png")
    print("Generating Fig 2 (leaf samples) ...");            fig_leaf_grid(all_paths, y, is_aug, OUTPUTS / "leaf_samples_grid.png")
    print("Generating Fig 3 (confusion matrix) ...");        fig_confusion(cm, OUTPUTS / "confusion_matrix.png")
    print("Generating Fig 4 (per-class metrics) ...");       fig_per_class_metrics(y_test, y_pred, OUTPUTS / "per_class_metrics.png")
    print("Generating Fig 5 (ROC) ...");                     fig_roc(y_test, proba, OUTPUTS / "roc_curves.png")
    print("Generating Fig 6 (PR) ...");                      fig_pr(y_test, proba, OUTPUTS / "pr_curves.png")
    print("Generating Fig 7 (feature importance) ...");      fig_feature_importance(model, OUTPUTS / "feature_importance.png")
    print("Generating Fig 8 (PCA) ...");                     fig_pca(X, y, OUTPUTS / "pca_projection.png")
    print("Generating Fig 9 (learning curve) ...");          fig_learning_curve(OUTPUTS / "learning_curve.png")
    print("Generating Fig 10 (calibration) ...");            fig_calibration(y_test, proba, OUTPUTS / "calibration_curve.png")
    print("Generating Fig 11 (confidence dist.) ...");       fig_confidence_distribution(y_test, y_pred, proba, OUTPUTS / "confidence_distribution.png")
    print("Generating Fig 12 (model comparison) ...");       fig_model_comparison(metrics["per_estimator"], voting_for_cmp, OUTPUTS / "model_comparison.png")
    print("Generating Fig 13 (sample predictions) ...");     fig_sample_predictions(p_test, y_test, y_pred, proba, OUTPUTS / "sample_predictions.png")
    print("Generating Fig 14 (metrics table) ...");          fig_metrics_table(metrics, y_test, y_pred, OUTPUTS / "metrics_table.png")
    print(f"\nAll 14 figures saved -> {OUTPUTS}/")


if __name__ == "__main__":
    main()

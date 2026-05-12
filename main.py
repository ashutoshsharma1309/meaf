"""MEAF — Multi-class Ensemble for Agricultural Foliage disease detection.

Pipeline:
  1. Real-image collection from PlantVillage (4 classes)
  2. Offline class-balancing via standard augmentation
  3. 1621-D handcrafted feature vector  (RGB hist + HSV + HOG + LBP)
  4. Soft-voting ensemble: RandomForest + HistGradientBoosting + SVM(RBF)
  5. Research-grade evaluation: accuracy, balanced acc, macro-F1, Cohen's k,
     Matthews correlation, log-loss, macro AUC, 5-fold CV, 1000-iter
     bootstrap 95% confidence intervals on the test accuracy.
"""
from __future__ import annotations

import json
import pickle
import random
import time
from pathlib import Path

import numpy as np
import matplotlib.pyplot as plt
from PIL import Image
from sklearn.ensemble import RandomForestClassifier, HistGradientBoostingClassifier, VotingClassifier
from sklearn.svm import SVC
from sklearn.metrics import (
    classification_report, confusion_matrix, accuracy_score, balanced_accuracy_score,
    cohen_kappa_score, matthews_corrcoef, log_loss, roc_auc_score, f1_score,
)
from sklearn.model_selection import train_test_split, cross_val_score, learning_curve
from sklearn.preprocessing import StandardScaler

from utils.features import extract

ROOT = Path(__file__).resolve().parent
DATASET = ROOT / "dataset"
MODELS = ROOT / "models"
OUTPUTS = ROOT / "outputs"
CACHE = MODELS / "features_cache.npz"
CLASSES = ["Potato_Early_Blight", "Potato_Healthy", "Tomato_Early_Blight", "Tomato_Healthy"]
SEED = 42


def collect_paths():
    paths, labels, is_aug = [], [], []
    for idx, c in enumerate(CLASSES):
        cdir = DATASET / c
        files = sorted([p for p in cdir.iterdir() if p.suffix.lower() in {".jpg", ".jpeg", ".png"}])
        reals = [p for p in files if not p.name.startswith("aug_")]
        augs = [p for p in files if p.name.startswith("aug_")]
        print(f"  {c:25s} real={len(reals):4d}  aug={len(augs):4d}  total={len(files):4d}")
        for f in files:
            paths.append(str(f))
            labels.append(idx)
            is_aug.append(f.name.startswith("aug_"))
    return paths, np.array(labels), np.array(is_aug, dtype=bool)


def load_features(paths, labels):
    if CACHE.exists():
        data = np.load(CACHE, allow_pickle=True)
        cached_paths = list(data["paths"])
        if cached_paths == paths:
            print(f"[cache] using cached features ({CACHE})")
            return data["X"], data["y"]
        print("[cache] paths changed, recomputing ...")
    t0 = time.time()
    X = np.zeros((len(paths), len(extract(paths[0]))), dtype=np.float32)
    X[0] = extract(paths[0])
    for i, p in enumerate(paths[1:], start=1):
        X[i] = extract(p)
        if (i + 1) % 500 == 0:
            print(f"  extracted {i+1}/{len(paths)}  ({time.time()-t0:.1f}s)")
    print(f"[features] {len(paths)} images in {time.time()-t0:.1f}s, dim={X.shape[1]}")
    MODELS.mkdir(exist_ok=True)
    np.savez_compressed(CACHE, X=X, y=labels, paths=np.array(paths))
    return X, labels


def build_ensemble():
    rf = RandomForestClassifier(
        n_estimators=400, max_depth=None, min_samples_leaf=1,
        n_jobs=-1, random_state=SEED,
    )
    gb = HistGradientBoostingClassifier(
        max_iter=400, learning_rate=0.08, max_depth=8, random_state=SEED,
    )
    svm = SVC(C=8.0, gamma="scale", kernel="rbf", probability=True, random_state=SEED)
    return VotingClassifier(
        estimators=[("rf", rf), ("gb", gb), ("svm", svm)],
        voting="soft",
        weights=[2, 2, 1],
        n_jobs=-1,
    )


def bootstrap_ci(y_true, y_pred, metric_fn, n_boot=1000, alpha=0.05, seed=SEED):
    rng = np.random.default_rng(seed)
    n = len(y_true)
    stats = []
    for _ in range(n_boot):
        idx = rng.integers(0, n, n)
        try:
            stats.append(metric_fn(y_true[idx], y_pred[idx]))
        except Exception:
            continue
    lo, hi = np.percentile(stats, [100 * alpha / 2, 100 * (1 - alpha / 2)])
    return float(lo), float(hi)


def compute_full_metrics(model, X_train, y_train, X_test, y_test):
    y_pred = model.predict(X_test)
    proba_test = model.predict_proba(X_test)

    metrics = {
        "test_accuracy": float(accuracy_score(y_test, y_pred)),
        "balanced_accuracy": float(balanced_accuracy_score(y_test, y_pred)),
        "macro_f1": float(f1_score(y_test, y_pred, average="macro")),
        "weighted_f1": float(f1_score(y_test, y_pred, average="weighted")),
        "cohen_kappa": float(cohen_kappa_score(y_test, y_pred)),
        "matthews_corrcoef": float(matthews_corrcoef(y_test, y_pred)),
        "log_loss": float(log_loss(y_test, proba_test, labels=list(range(len(CLASSES))))),
        "macro_auc_ovr": float(roc_auc_score(y_test, proba_test, multi_class="ovr", average="macro")),
        "train_accuracy": float(accuracy_score(y_train, model.predict(X_train))),
    }
    # bootstrap CIs
    lo, hi = bootstrap_ci(y_test, y_pred, accuracy_score)
    metrics["test_accuracy_ci95"] = [lo, hi]
    lo, hi = bootstrap_ci(y_test, y_pred, lambda a, b: f1_score(a, b, average="macro"))
    metrics["macro_f1_ci95"] = [lo, hi]
    return metrics, y_pred, proba_test


def main():
    print("Collecting images ...")
    paths, y, is_aug = collect_paths()
    print(f"\nTotal samples: {len(paths)}  (real {(~is_aug).sum()},  aug {is_aug.sum()})\n")

    X, y = load_features(paths, y)

    X_train, X_test, y_train, y_test, p_train, p_test = train_test_split(
        X, y, paths, test_size=0.20, stratify=y, random_state=SEED
    )

    scaler = StandardScaler().fit(X_train)
    X_train_s = scaler.transform(X_train)
    X_test_s = scaler.transform(X_test)

    print("Training Voting ensemble (RF + HGB + SVM) ...")
    t0 = time.time()
    clf = build_ensemble()
    clf.fit(X_train_s, y_train)
    train_time = time.time() - t0
    print(f"  trained in {train_time:.1f}s")

    print("Running 5-fold CV ...")
    cv_scores = cross_val_score(build_ensemble(), X_train_s, y_train, cv=5, n_jobs=-1)
    print(f"  CV accuracy = {cv_scores.mean()*100:.2f}% (+/- {cv_scores.std()*100:.2f}%)")

    print("Computing learning curve ...")
    sizes_frac = np.linspace(0.1, 1.0, 8)
    train_sizes, lc_train, lc_val = learning_curve(
        build_ensemble(), X_train_s, y_train,
        train_sizes=sizes_frac, cv=3, n_jobs=-1, random_state=SEED,
    )
    learning_curve_data = {
        "train_sizes": train_sizes.tolist(),
        "train_mean": lc_train.mean(axis=1).tolist(),
        "train_std": lc_train.std(axis=1).tolist(),
        "val_mean": lc_val.mean(axis=1).tolist(),
        "val_std": lc_val.std(axis=1).tolist(),
    }

    metrics, y_pred, proba_test = compute_full_metrics(clf, X_train_s, y_train, X_test_s, y_test)
    metrics.update({
        "cv_mean": float(cv_scores.mean()),
        "cv_std": float(cv_scores.std()),
        "cv_scores": cv_scores.tolist(),
        "n_train": int(len(X_train)),
        "n_test": int(len(X_test)),
        "n_real": int((~is_aug).sum()),
        "n_aug": int(is_aug.sum()),
        "feature_dim": int(X.shape[1]),
        "classes": CLASSES,
        "train_time_seconds": float(train_time),
    })

    # per-estimator metrics
    per_est = {}
    for name, est in clf.named_estimators_.items():
        p = est.predict(X_test_s)
        per_est[name] = {
            "accuracy": float(accuracy_score(y_test, p)),
            "macro_f1": float(f1_score(y_test, p, average="macro")),
            "kappa": float(cohen_kappa_score(y_test, p)),
            "mcc": float(matthews_corrcoef(y_test, p)),
        }
    metrics["per_estimator"] = per_est

    print("\n=== Test set results ===")
    for k, v in metrics.items():
        if isinstance(v, float):
            print(f"  {k:22s} {v:.4f}")
        elif isinstance(v, list) and len(v) == 2 and all(isinstance(x, float) for x in v):
            print(f"  {k:22s} [{v[0]:.4f}, {v[1]:.4f}]")
    print()
    print(classification_report(y_test, y_pred, target_names=CLASSES, zero_division=0))
    cm = confusion_matrix(y_test, y_pred, labels=list(range(len(CLASSES))))

    MODELS.mkdir(exist_ok=True)
    OUTPUTS.mkdir(exist_ok=True)

    with open(MODELS / "meaf_ensemble.pkl", "wb") as f:
        pickle.dump({"model": clf, "scaler": scaler, "classes": CLASSES}, f)
    print(f"Saved model -> {MODELS/'meaf_ensemble.pkl'}")

    (OUTPUTS / "metrics.json").write_text(json.dumps(metrics, indent=2))
    (OUTPUTS / "learning_curve.json").write_text(json.dumps(learning_curve_data, indent=2))
    np.save(OUTPUTS / "confusion.npy", cm)
    np.save(OUTPUTS / "proba_test.npy", proba_test)
    np.save(OUTPUTS / "y_test.npy", y_test)
    np.save(OUTPUTS / "y_pred.npy", y_pred)
    print(f"Saved metrics + arrays -> {OUTPUTS}/")


def predict_one(image_path: str):
    with open(MODELS / "meaf_ensemble.pkl", "rb") as f:
        bundle = pickle.load(f)
    feat = bundle["scaler"].transform(extract(image_path).reshape(1, -1))
    proba = bundle["model"].predict_proba(feat)[0]
    pred = int(np.argmax(proba))
    print(f"\nImage: {image_path}")
    print(f"Predicted class: {bundle['classes'][pred]}  (confidence {proba[pred]*100:.1f}%)")
    for c, p in zip(bundle["classes"], proba):
        print(f"  {c:25s} {p*100:5.1f}%")


if __name__ == "__main__":
    import sys
    if len(sys.argv) >= 3 and sys.argv[1] == "predict":
        predict_one(sys.argv[2])
    else:
        main()

"""Compute out-of-distribution statistics so the API can reject non-leaf inputs.

We use the cached training features (already StandardScaler-normalised by main.py)
to compute:
    * per-class centroids (mean feature vector)
    * the distribution of per-sample distances to the nearest class centroid
    * a 99th-percentile distance threshold

At inference, an image whose feature vector is farther than the threshold from
*all* class centroids is flagged as out-of-distribution (not a recognised leaf).
"""
from __future__ import annotations

import pickle
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
MODELS = ROOT / "models"


def main():
    print("Loading model bundle + features cache ...")
    with open(MODELS / "meaf_ensemble.pkl", "rb") as f:
        bundle = pickle.load(f)
    scaler = bundle["scaler"]

    cache = np.load(MODELS / "features_cache.npz", allow_pickle=True)
    X, y = cache["X"], cache["y"]
    # Use the SAME split as main.py so we only fit stats on train data
    from sklearn.model_selection import train_test_split
    X_train, _, y_train, _ = train_test_split(
        X, y, test_size=0.20, stratify=y, random_state=42
    )

    X_train_s = scaler.transform(X_train)
    classes = np.unique(y_train)

    centroids = np.stack([X_train_s[y_train == c].mean(axis=0) for c in classes])
    print(f"  centroids shape: {centroids.shape}")

    # min Euclidean distance from each training point to any centroid
    dists = np.linalg.norm(
        X_train_s[:, None, :] - centroids[None, :, :], axis=2
    ).min(axis=1)
    print(f"  train distance stats:  mean={dists.mean():.2f}  std={dists.std():.2f}  "
          f"min={dists.min():.2f}  max={dists.max():.2f}")

    p95 = float(np.percentile(dists, 95))
    p99 = float(np.percentile(dists, 99))
    threshold = float(np.percentile(dists, 99.5))  # a little tolerant
    print(f"  p95={p95:.2f}  p99={p99:.2f}  threshold(p99.5)={threshold:.2f}")

    np.savez(
        MODELS / "outlier_stats.npz",
        centroids=centroids,
        classes=classes,
        threshold=threshold,
        p95=p95, p99=p99,
        mean_dist=float(dists.mean()),
        std_dist=float(dists.std()),
    )
    print(f"Saved -> {MODELS/'outlier_stats.npz'}")


if __name__ == "__main__":
    main()

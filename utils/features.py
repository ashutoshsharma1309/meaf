"""Image feature extractor: color hist + HSV stats + HOG + LBP texture."""
import numpy as np
from PIL import Image
from skimage.feature import hog, local_binary_pattern
from skimage.color import rgb2hsv, rgb2gray

IMG_SIZE = (128, 128)
LBP_P = 16
LBP_R = 2
LBP_BINS = LBP_P + 2  # 'uniform' method produces P+2 bins


def load_image(path, size=IMG_SIZE):
    img = Image.open(path).convert("RGB").resize(size)
    return np.asarray(img, dtype=np.float32) / 255.0


def color_histogram(rgb, bins=8):
    feats = []
    for ch in range(3):
        hist, _ = np.histogram(rgb[..., ch], bins=bins, range=(0.0, 1.0), density=True)
        feats.append(hist)
    return np.concatenate(feats)


def hsv_stats(rgb):
    hsv = rgb2hsv(rgb)
    stats = []
    for ch in range(3):
        x = hsv[..., ch]
        stats += [x.mean(), x.std(), np.median(x)]
    # green-ness vs. brown-ness proxy (healthy vs blighted leaves)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    green_ratio = float((g > r).mean())
    brown_score = float(((r > 0.35) & (g > 0.2) & (b < 0.3) & (r > b)).mean())
    stats += [green_ratio, brown_score]
    return np.array(stats, dtype=np.float32)


def hog_features(rgb):
    gray = rgb2gray(rgb)
    return hog(
        gray,
        orientations=8,
        pixels_per_cell=(16, 16),
        cells_per_block=(2, 2),
        feature_vector=True,
    )


def lbp_features(rgb):
    """Local Binary Pattern histogram — strong texture descriptor."""
    gray = (rgb2gray(rgb) * 255).astype(np.uint8)
    lbp = local_binary_pattern(gray, P=LBP_P, R=LBP_R, method="uniform")
    hist, _ = np.histogram(lbp, bins=LBP_BINS, range=(0, LBP_BINS), density=True)
    return hist.astype(np.float32)


def extract(path):
    rgb = load_image(path)
    return np.concatenate([
        color_histogram(rgb),
        hsv_stats(rgb),
        hog_features(rgb),
        lbp_features(rgb),
    ])

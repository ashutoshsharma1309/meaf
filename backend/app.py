"""MEAF Farmer Portal — FastAPI backend.

Endpoints
---------
GET  /health                         service check
GET  /classes                        list of disease classes
POST /predict                        image upload -> diagnosis + severity
GET  /treatment/{class_name}         treatment plan (organic + chemical + prevention)
GET  /economics/{class_name}?acres=  yield-loss and cost-to-treat estimate (INR)
GET  /spray-window?lat=&lon=         mock weather-aware spray-window advisor
GET  /support                        helpline + govt scheme info
"""
from __future__ import annotations

import io
import json
import pickle
import sys
import time
from pathlib import Path
from typing import Optional

import numpy as np
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from skimage.color import rgb2hsv

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
from utils.features import extract

MODELS = ROOT / "models"
DATA = Path(__file__).resolve().parent / "data"

app = FastAPI(title="MEAF Farmer Portal API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- Load model once ----------
print("Loading MEAF ensemble model ...")
with open(MODELS / "meaf_ensemble.pkl", "rb") as f:
    BUNDLE = pickle.load(f)
MODEL = BUNDLE["model"]
SCALER = BUNDLE["scaler"]
CLASSES: list[str] = BUNDLE["classes"]
print(f"  loaded — classes: {CLASSES}")

with (DATA / "treatments.json").open() as f:
    TREATMENTS = json.load(f)

# ---------- OOD detector ----------
OOD_PATH = MODELS / "outlier_stats.npz"
OOD = np.load(OOD_PATH) if OOD_PATH.exists() else None
if OOD is None:
    print("[warn] outlier_stats.npz not found — OOD rejection disabled")
else:
    print(f"  OOD threshold: {float(OOD['threshold']):.2f}")


# ---------- helpers ----------
def leaf_likeness(rgb: np.ndarray) -> dict:
    """Fast HSV-based check: does this image actually look like a leaf?

    Rejects:
      - mostly-grey / low-saturation images (screenshots, scans)
      - images with too few green/yellow leaf-coloured pixels
      - solid-colour or near-uniform images
      - random-noise / multicolour images whose hue distribution is uniform
        (real leaves have a strong peak in green/brown hues)
    """
    if rgb.dtype != np.float32 and rgb.dtype != np.float64:
        rgb = rgb.astype(np.float32) / 255.0
    hsv = rgb2hsv(rgb)
    h, s, v = hsv[..., 0], hsv[..., 1], hsv[..., 2]
    # leaf-coloured pixel: greens/yellows (hue 60-160 deg -> 0.16-0.45)
    leaf_mask = (h >= 0.16) & (h <= 0.45) & (s >= 0.12) & (v >= 0.10)
    leaf_ratio = float(leaf_mask.mean())
    # "diseased brown" pixels (early blight)
    brown_mask = (h <= 0.10) & (s >= 0.18) & (v >= 0.10) & (v <= 0.60)
    brown_ratio = float(brown_mask.mean())
    plant_ratio = leaf_ratio + brown_ratio

    sat_mean = float(s.mean())
    var = float(rgb.var())

    # Hue-distribution shape: real leaves have a dominant hue band;
    # random / multicoloured images have a flat hue histogram.
    valid = (s >= 0.10) & (v >= 0.10)
    if valid.sum() > 100:
        hue_hist, _ = np.histogram(h[valid], bins=12, range=(0.0, 1.0), density=True)
        hue_hist = hue_hist / (hue_hist.sum() + 1e-9)
        dominant_hue_share = float(hue_hist.max())
        # entropy: low = concentrated (leaf), high = uniform (noise)
        hue_entropy = float(-(hue_hist * np.log(hue_hist + 1e-9)).sum())
    else:
        dominant_hue_share = 0.0
        hue_entropy = 0.0

    # Decision
    is_leaf = bool(
        plant_ratio >= 0.18
        and sat_mean >= 0.10
        and var >= 0.003
        and dominant_hue_share >= 0.22
        and hue_entropy <= 2.20
    )
    reason = None
    if not is_leaf:
        if plant_ratio < 0.18:
            reason = "too_little_foliage"
        elif sat_mean < 0.10:
            reason = "low_saturation"
        elif var < 0.003:
            reason = "uniform_image"
        elif dominant_hue_share < 0.22 or hue_entropy > 2.20:
            reason = "noisy_or_multicoloured"
    return {
        "is_leaf": is_leaf,
        "plant_pixel_ratio": round(plant_ratio, 3),
        "saturation_mean": round(sat_mean, 3),
        "variance": round(var, 4),
        "dominant_hue_share": round(dominant_hue_share, 3),
        "hue_entropy": round(hue_entropy, 3),
        "reason": reason,
    }


def feature_outlier_check(feat_scaled: np.ndarray) -> dict:
    """Distance to nearest class centroid in the scaled feature space.
    Returns the distance plus an `is_outlier` flag relative to training threshold."""
    if OOD is None:
        return {"distance": None, "threshold": None, "is_outlier": False}
    centroids = OOD["centroids"]
    dists = np.linalg.norm(centroids - feat_scaled, axis=1)
    min_d = float(dists.min())
    threshold = float(OOD["threshold"])
    return {
        "distance": round(min_d, 2),
        "threshold": round(threshold, 2),
        "is_outlier": min_d > threshold,
        "z_score": round((min_d - float(OOD["mean_dist"])) / float(OOD["std_dist"]), 2),
    }


def severity_from_confidence(conf: float, is_healthy: bool) -> dict:
    """Return urgency band based on disease confidence."""
    if is_healthy:
        return {
            "level": "none",
            "label_en": "Healthy",
            "label_hi": "स्वस्थ",
            "color": "#27ae60",
            "action_en": "No action needed. Continue regular scouting.",
            "action_hi": "कोई कार्रवाई नहीं। नियमित निगरानी जारी रखें।",
        }
    if conf >= 0.85:
        return {
            "level": "severe",
            "label_en": "Severe — act today",
            "label_hi": "गंभीर — आज ही कार्रवाई करें",
            "color": "#c0392b",
            "action_en": "Begin treatment within 24 hours. Spray fungicide following label dose.",
            "action_hi": "24 घंटे के भीतर उपचार शुरू करें। लेबल के अनुसार खुराक में फफूंदनाशी का छिड़काव करें।",
        }
    if conf >= 0.65:
        return {
            "level": "moderate",
            "label_en": "Moderate — act this week",
            "label_hi": "मध्यम — इस सप्ताह कार्रवाई करें",
            "color": "#e67e22",
            "action_en": "Treatment recommended in 2-3 days. Start with organic option if available.",
            "action_hi": "2-3 दिन में उपचार सुझाया गया है। यदि उपलब्ध हो तो जैविक विकल्प से शुरू करें।",
        }
    return {
        "level": "mild",
        "label_en": "Mild / uncertain — re-photograph",
        "label_hi": "हल्का / अनिश्चित — फिर से फोटो लें",
        "color": "#f1c40f",
        "action_en": "Confidence is low. Take 2-3 more photos from different angles and re-check.",
        "action_hi": "विश्वास कम है। अलग-अलग कोणों से 2-3 और फोटो लेकर पुनः जाँच करें।",
    }


# ---------- routes ----------
@app.get("/health")
def health():
    return {"ok": True, "model_classes": CLASSES, "version": "1.0"}


@app.get("/classes")
def classes():
    return {"classes": CLASSES}


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(400, "file must be an image")
    raw = await file.read()
    try:
        img = Image.open(io.BytesIO(raw)).convert("RGB").resize((128, 128))
    except Exception as e:
        raise HTTPException(400, f"could not decode image: {e}")

    t0 = time.time()
    rgb = np.asarray(img, dtype=np.float32) / 255.0

    # GATE 1 — leaf-likeness heuristic on raw pixels
    leaf_check = leaf_likeness(rgb)

    # save to temp so we can reuse the same feature pipeline
    tmp = ROOT / "_tmp_predict.jpg"
    img.save(tmp, "JPEG", quality=92)
    feat_raw = extract(tmp).reshape(1, -1)
    feat = SCALER.transform(feat_raw)
    tmp.unlink(missing_ok=True)

    # GATE 2 — feature-space outlier (distance to nearest class centroid)
    ood = feature_outlier_check(feat[0])

    proba = MODEL.predict_proba(feat)[0]
    pred = int(np.argmax(proba))
    conf = float(proba[pred])
    inference_ms = (time.time() - t0) * 1000

    # combined rejection rule:
    #   - non-leaf colour signature  OR
    #   - feature outlier  OR
    #   - low classifier confidence (< 60%) AND any of the above is borderline
    is_leaf = leaf_check["is_leaf"] and not ood["is_outlier"]
    if (not is_leaf) or conf < 0.55:
        # build a friendly rejection payload
        reason_code = "low_confidence"
        if not leaf_check["is_leaf"]:
            reason_code = leaf_check["reason"] or "not_a_leaf"
        elif ood["is_outlier"]:
            reason_code = "out_of_distribution"

        reason_text = {
            "too_little_foliage": (
                "This doesn't look like a leaf photo — too little green/brown foliage.",
                "यह पत्ती की फोटो नहीं लग रही — हरे/भूरे रंग की पत्ती बहुत कम है।",
            ),
            "low_saturation":    (
                "Image looks grey or washed out — please retake in daylight.",
                "फोटो धुँधली है — कृपया दिन की रोशनी में फिर से लें।",
            ),
            "uniform_image":     (
                "The image looks like a solid colour — please upload a leaf.",
                "फोटो एक रंग जैसी है — कृपया पत्ती की फोटो डालें।",
            ),
            "noisy_or_multicoloured": (
                "This image is too noisy or multi-coloured to be a leaf photo.",
                "यह फोटो बहुत धुँधली या कई रंगों की है — पत्ती की फोटो नहीं लग रही।",
            ),
            "out_of_distribution": (
                "This may not be a potato or tomato leaf — our model only knows those two crops.",
                "यह आलू या टमाटर की पत्ती नहीं लग रही — हमारा मॉडल केवल इन्हीं दो फसलों को पहचानता है।",
            ),
            "low_confidence":    (
                "We're not sure — please take a clearer photo of one leaf, filling the frame.",
                "हमें यकीन नहीं — कृपया एक पत्ती की साफ़ फोटो लें, पूरी पत्ती दिखाई दे।",
            ),
            "not_a_leaf":        (
                "This doesn't look like a plant leaf.",
                "यह पौधे की पत्ती नहीं लग रही।",
            ),
        }[reason_code]

        return {
            "is_leaf": False,
            "reason": reason_code,
            "message_en": reason_text[0],
            "message_hi": reason_text[1],
            "tips_en": [
                "Hold the leaf flat against a plain background.",
                "Take the photo in daylight, not under yellow indoor lights.",
                "Fill at least 70% of the frame with a single leaf.",
                "Supported crops: potato and tomato (healthy or early blight).",
            ],
            "tips_hi": [
                "पत्ती को सपाट पकड़ें, सादे बैकग्राउंड पर रखें।",
                "पीली रोशनी की बजाय दिन की रोशनी में फोटो लें।",
                "एक पत्ती फ्रेम के कम-से-कम 70% भाग में हो।",
                "समर्थित फसलें: आलू और टमाटर (स्वस्थ या अगेती झुलसा)।",
            ],
            "checks": {
                "leaf_pixels": leaf_check,
                "outlier": ood,
                "top_class_confidence": round(conf, 3),
            },
            "inference_ms": round(inference_ms, 1),
        }

    label = CLASSES[pred]
    sev = severity_from_confidence(conf, is_healthy=label.endswith("_Healthy"))
    info = TREATMENTS.get(label, {})

    return {
        "is_leaf": True,
        "class": label,
        "class_display_en": info.get("disease_en", label.replace("_", " ")),
        "class_display_hi": info.get("disease_hi", ""),
        "pathogen": info.get("pathogen", ""),
        "description_en": info.get("description_en", ""),
        "description_hi": info.get("description_hi", ""),
        "confidence": conf,
        "probabilities": {c: float(p) for c, p in zip(CLASSES, proba)},
        "severity": sev,
        "inference_ms": round(inference_ms, 1),
        "checks": {
            "leaf_pixels": leaf_check,
            "outlier": ood,
        },
    }


@app.get("/treatment/{class_name}")
def treatment(class_name: str):
    if class_name not in TREATMENTS:
        raise HTTPException(404, f"unknown class: {class_name}")
    t = TREATMENTS[class_name]
    return {
        "class": class_name,
        "disease_en": t.get("disease_en"),
        "disease_hi": t.get("disease_hi"),
        "pathogen": t.get("pathogen"),
        "organic": t.get("organic", []),
        "chemical": t.get("chemical", []),
        "prevention_en": t.get("prevention_en", []),
        "prevention_hi": t.get("prevention_hi", []),
    }


@app.get("/economics/{class_name}")
def economics(class_name: str, acres: float = 1.0):
    if class_name not in TREATMENTS:
        raise HTTPException(404, f"unknown class: {class_name}")
    t = TREATMENTS[class_name]
    yield_q = float(t.get("expected_yield_per_acre_quintal", 0)) * acres
    price = float(t.get("market_price_per_quintal_inr", 0))
    expected_revenue = yield_q * price
    loss_pct = float(t.get("yield_loss_pct_if_untreated", 0)) / 100.0
    loss_inr = expected_revenue * loss_pct
    # cheapest organic + cheapest chemical
    organic_costs = [o.get("cost_per_acre_inr", 0) for o in t.get("organic", [])]
    chem_costs = [c.get("cost_per_acre_inr", 0) for c in t.get("chemical", [])]
    organic_cost = (min(organic_costs) if organic_costs else 0) * acres
    chemical_cost = (min(chem_costs) if chem_costs else 0) * acres
    return {
        "class": class_name,
        "acres": acres,
        "expected_yield_quintal": round(yield_q, 1),
        "market_price_per_quintal_inr": price,
        "expected_revenue_inr": round(expected_revenue),
        "yield_loss_pct_if_untreated": round(loss_pct * 100, 1),
        "potential_loss_inr_if_untreated": round(loss_inr),
        "cheapest_organic_treatment_cost_inr": round(organic_cost),
        "cheapest_chemical_treatment_cost_inr": round(chemical_cost),
        "roi_organic_x": (round(loss_inr / organic_cost, 1) if organic_cost else None),
        "roi_chemical_x": (round(loss_inr / chemical_cost, 1) if chemical_cost else None),
    }


@app.get("/spray-window")
def spray_window(lat: Optional[float] = None, lon: Optional[float] = None):
    """Deterministic mock that mimics a 3-day weather window.
    Real deployment can swap in OpenWeatherMap / IMD API."""
    import hashlib
    key = f"{lat or 0:.2f}_{lon or 0:.2f}_{time.strftime('%Y%m%d')}"
    h = int(hashlib.md5(key.encode()).hexdigest()[:8], 16)
    rng = np.random.default_rng(h)
    forecast = []
    labels_en = ["Today", "Tomorrow", "Day after"]
    labels_hi = ["आज", "कल", "परसों"]
    for i in range(3):
        rain_pct = int(rng.integers(0, 100))
        wind = float(rng.uniform(2, 22))
        temp_c = float(rng.uniform(22, 34))
        humidity = int(rng.integers(45, 90))
        good = (rain_pct < 30) and (wind < 12)
        forecast.append({
            "day_en": labels_en[i],
            "day_hi": labels_hi[i],
            "rain_chance_pct": rain_pct,
            "wind_kmph": round(wind, 1),
            "temp_c": round(temp_c, 1),
            "humidity_pct": humidity,
            "spray_ok": bool(good),
            "reason_en": ("Good spray window" if good else
                          ("Too windy — drift risk" if wind >= 12 else "Rain likely — wash-off risk")),
            "reason_hi": ("छिड़काव के लिए अच्छा समय" if good else
                          ("हवा बहुत तेज़ — दवा उड़ जाएगी" if wind >= 12 else "बारिश की संभावना — दवा बह जाएगी")),
        })
    best = next((f for f in forecast if f["spray_ok"]), None)
    return {
        "lat": lat,
        "lon": lon,
        "forecast": forecast,
        "recommended_day_en": best["day_en"] if best else "Wait — no good window in 3 days",
        "recommended_day_hi": best["day_hi"] if best else "रुकें — 3 दिनों में अच्छा समय नहीं है",
        "note_en": "Mock forecast for demo — swap in OpenWeatherMap/IMD in production.",
    }


@app.get("/support")
def support():
    return {
        "helplines": [
            {
                "name_en": "Kisan Call Centre (toll-free)",
                "name_hi": "किसान कॉल सेंटर (निःशुल्क)",
                "number": "1800-180-1551",
                "hours_en": "Mon-Sat 06:00 - 22:00",
                "languages": ["Hindi", "English", "22 regional languages"],
            },
            {
                "name_en": "PM-KISAN Helpline",
                "name_hi": "पीएम-किसान हेल्पलाइन",
                "number": "155261",
                "hours_en": "All days 09:30 - 18:00",
                "languages": ["Hindi", "English"],
            },
        ],
        "schemes": [
            {
                "name_en": "PM-KISAN Samman Nidhi",
                "name_hi": "पीएम-किसान सम्मान निधि",
                "benefit_en": "₹6,000 per year direct to bank (3 instalments of ₹2,000).",
                "benefit_hi": "हर साल ₹6,000 सीधे बैंक में (₹2,000 की 3 किस्तें)।",
                "eligibility_en": "Landholding farmer families with cultivable land.",
                "link": "https://pmkisan.gov.in",
            },
            {
                "name_en": "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
                "name_hi": "प्रधानमंत्री फसल बीमा योजना",
                "benefit_en": "Crop insurance against yield loss from pests, disease, weather. Farmer pays only 2% (kharif) / 1.5% (rabi) of sum insured.",
                "benefit_hi": "कीट, रोग, मौसम से उपज हानि पर फसल बीमा। किसान केवल 2% (खरीफ) / 1.5% (रबी) प्रीमियम भरते हैं।",
                "eligibility_en": "All farmers growing notified crops in notified areas.",
                "link": "https://pmfby.gov.in",
            },
            {
                "name_en": "Soil Health Card Scheme",
                "name_hi": "मृदा स्वास्थ्य कार्ड योजना",
                "benefit_en": "Free soil testing every 2 years with crop-specific fertilizer recommendations.",
                "benefit_hi": "हर 2 साल में निःशुल्क मिट्टी जाँच और फसल-अनुरूप उर्वरक सलाह।",
                "eligibility_en": "All farmers.",
                "link": "https://soilhealth.dac.gov.in",
            },
        ],
    }

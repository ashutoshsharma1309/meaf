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


# ---------- helpers ----------
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

    # save to temp to reuse the same feature pipeline
    tmp = ROOT / "_tmp_predict.jpg"
    img.save(tmp, "JPEG", quality=92)
    t0 = time.time()
    feat = SCALER.transform(extract(tmp).reshape(1, -1))
    proba = MODEL.predict_proba(feat)[0]
    pred = int(np.argmax(proba))
    inference_ms = (time.time() - t0) * 1000
    tmp.unlink(missing_ok=True)

    label = CLASSES[pred]
    conf = float(proba[pred])
    sev = severity_from_confidence(conf, is_healthy=label.endswith("_Healthy"))
    info = TREATMENTS.get(label, {})

    return {
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

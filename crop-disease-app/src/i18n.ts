import { createContext, useContext } from "react";

export type Lang = "en" | "hi";

const dict = {
  appTitle: { en: "KisanCare", hi: "किसानकेयर" },
  appSubtitle: {
    en: "AI leaf doctor for Indian farmers",
    hi: "भारतीय किसानों के लिए AI पत्ती डॉक्टर",
  },
  uploadCta: { en: "Upload leaf photo", hi: "पत्ती की फोटो अपलोड करें" },
  takePhoto: { en: "Take photo", hi: "फोटो लें" },
  choosePhoto: { en: "Choose from gallery", hi: "गैलरी से चुनें" },
  analyzing: { en: "Analysing leaf…", hi: "पत्ती की जाँच हो रही है…" },
  diagnosis: { en: "Diagnosis", hi: "निदान" },
  confidence: { en: "Confidence", hi: "विश्वास" },
  severity: { en: "Severity", hi: "गंभीरता" },
  pathogen: { en: "Pathogen", hi: "रोगकारक" },
  description: { en: "What it looks like", hi: "लक्षण" },
  recommendedAction: { en: "Recommended action", hi: "सुझाई गई कार्रवाई" },
  speak: { en: "🔊 Read aloud", hi: "🔊 सुनें" },
  stopSpeak: { en: "■ Stop", hi: "■ रोकें" },
  treatment: { en: "Treatment plan", hi: "उपचार योजना" },
  organic: { en: "Organic", hi: "जैविक" },
  chemical: { en: "Chemical", hi: "रासायनिक" },
  prevention: { en: "Prevention", hi: "रोकथाम" },
  dose: { en: "Dose", hi: "खुराक" },
  frequency: { en: "How often", hi: "कितनी बार" },
  costPerAcre: { en: "Cost / acre", hi: "लागत / एकड़" },
  phi: { en: "Pre-harvest interval", hi: "कटाई-पूर्व अंतराल" },
  days: { en: "days", hi: "दिन" },
  sprayWindow: { en: "Spray-window advisor", hi: "छिड़काव-समय सलाहकार" },
  bestDayToSpray: { en: "Best day to spray", hi: "छिड़काव के लिए सबसे अच्छा दिन" },
  rainChance: { en: "Rain", hi: "बारिश" },
  wind: { en: "Wind", hi: "हवा" },
  temp: { en: "Temp", hi: "तापमान" },
  humidity: { en: "Humidity", hi: "नमी" },
  economics: { en: "Economics calculator", hi: "लागत-लाभ कैलकुलेटर" },
  acres: { en: "Field size (acres)", hi: "खेत का आकार (एकड़)" },
  expectedRevenue: { en: "Expected revenue", hi: "अनुमानित आय" },
  potentialLoss: { en: "Potential loss if untreated", hi: "बिना उपचार संभावित हानि" },
  organicCost: { en: "Organic treatment cost", hi: "जैविक उपचार लागत" },
  chemicalCost: { en: "Chemical treatment cost", hi: "रासायनिक उपचार लागत" },
  roi: { en: "Return on each ₹1 spent", hi: "हर ₹1 खर्च पर वापसी" },
  support: { en: "Help & schemes", hi: "सहायता और योजनाएँ" },
  helplines: { en: "Helplines", hi: "हेल्पलाइन" },
  schemes: { en: "Govt schemes", hi: "सरकारी योजनाएँ" },
  callNow: { en: "Call", hi: "कॉल करें" },
  learnMore: { en: "Learn more", hi: "और जानें" },
  history: { en: "Recent diagnoses", hi: "पिछले निदान" },
  clearHistory: { en: "Clear", hi: "साफ़ करें" },
  noHistory: { en: "No previous diagnoses yet.", hi: "अभी तक कोई निदान नहीं।" },
  error: { en: "Could not connect to the diagnosis server.", hi: "सर्वर से कनेक्ट नहीं हो सका।" },
  inferenceTime: { en: "Inference time", hi: "जाँच समय" },
  newScan: { en: "Scan another leaf", hi: "नई पत्ती जाँचें" },
} as const;

export type DictKey = keyof typeof dict;

export const LangContext = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({
  lang: "en",
  setLang: () => {},
});

export function useLang() {
  return useContext(LangContext);
}

export function t(key: DictKey, lang: Lang): string {
  return dict[key][lang];
}

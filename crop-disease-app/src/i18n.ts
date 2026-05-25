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

  // Nav
  navDiagnose: { en: "Diagnose", hi: "निदान" },
  navTreatments: { en: "Treatments", hi: "उपचार" },
  navAdvisory: { en: "Advisory", hi: "सलाह" },
  navAbout: { en: "About", hi: "परिचय" },

  // Hero
  heroTitle: {
    en: "Diagnose crop disease.\nGet a treatment plan.\nIn under 30 seconds.",
    hi: "फसल रोग पहचानें।\nउपचार पाएँ।\n30 सेकंड से कम में।",
  },
  heroSub: {
    en: "Built for Indian farmers. Snap a leaf with your phone and our MEAF AI model identifies the disease, suggests organic + chemical treatment, and tells you the best day to spray.",
    hi: "भारतीय किसानों के लिए। फोन से पत्ती की फोटो लें — MEAF AI रोग पहचानता है, जैविक + रासायनिक उपचार सुझाता है, और बताता है किस दिन छिड़काव करना चाहिए।",
  },
  trustAccuracy: { en: "Test accuracy", hi: "जाँच सटीकता" },
  trustLatency:  { en: "Avg inference",  hi: "औसत समय" },
  trustLangs:    { en: "Languages",      hi: "भाषाएँ" },
  trustFree:     { en: "Always free",    hi: "हमेशा मुफ़्त" },

  // How it works
  howTitle: { en: "How it works", hi: "कैसे काम करता है" },
  step1Title: { en: "1. Snap a leaf", hi: "1. पत्ती की फोटो लें" },
  step1Body:  { en: "Hold the leaf flat, photograph in daylight — front or back side both work.", hi: "पत्ती को सीधा रखें, दिन की रोशनी में फोटो लें — आगे या पीछे दोनों चलेंगे।" },
  step2Title: { en: "2. AI diagnoses", hi: "2. AI रोग पहचानता है" },
  step2Body:  { en: "Our ensemble model (RF + GBM + SVM) checks 1621 visual features and grades disease severity.", hi: "हमारा एनसेम्बल मॉडल 1621 दृश्य गुण देखता है और रोग की गंभीरता बताता है।" },
  step3Title: { en: "3. Act with confidence", hi: "3. विश्वास से कार्य करें" },
  step3Body:  { en: "Get organic + chemical options, costs, the best day to spray, and a yield-loss estimate.", hi: "जैविक + रासायनिक विकल्प, लागत, छिड़काव का सबसे अच्छा दिन और संभावित हानि का अनुमान पाएँ।" },

  // Sample preview (right side of hero)
  sampleEyebrow: { en: "Sample diagnosis", hi: "नमूना निदान" },
  sampleDisease: { en: "Tomato Early Blight", hi: "टमाटर अगेती झुलसा" },
  sampleConfidence: { en: "92% confident", hi: "92% विश्वास" },
  sampleSeverity: { en: "Severe — act today", hi: "गंभीर — आज ही कार्रवाई करें" },
  sampleSymptoms: {
    en: "Symptoms detected",
    hi: "पहचाने गए लक्षण",
  },
  sampleSymptom1: {
    en: "Concentric brown target-shaped rings",
    hi: "गहरे भूरे गोलाकार छल्ले",
  },
  sampleSymptom2: {
    en: "Yellow halo around lesions",
    hi: "धब्बों के चारों ओर पीला घेरा",
  },
  sampleSymptom3: {
    en: "Lower-leaf necrosis spreading upward",
    hi: "निचली पत्तियों से ऊपर तक सूखना",
  },
  sampleAction: {
    en: "Spray within 24 hours",
    hi: "24 घंटे में छिड़काव करें",
  },

  // Disease deep dive
  symptomsDetected: { en: "Symptoms detected", hi: "पहचाने गए लक्षण" },
  whyItSpreads: { en: "Why it spreads", hi: "कैसे फैलता है" },
  urgency: { en: "Urgency", hi: "अत्यावश्यकता" },
  whyHumidity: {
    en: "High humidity (above 80%) and warm nights (24-29°C) accelerate spore germination on the leaf surface.",
    hi: "अधिक नमी (80% से ऊपर) और गर्म रातें (24-29°C) पत्ती की सतह पर बीजाणुओं को तेज़ी से फैलाती हैं।",
  },
  whyRain: {
    en: "Rain-splash and overhead irrigation move spores from infected lower leaves to healthy upper leaves.",
    hi: "बारिश की छींटें और ऊपर से सिंचाई संक्रमित निचली पत्तियों से बीजाणु ऊपरी स्वस्थ पत्तियों तक पहुँचाती हैं।",
  },
  whyStress: {
    en: "Plant stress from poor nutrition, drought, or fruit load makes leaves more susceptible.",
    hi: "खराब पोषण, सूखा या फलों के बोझ से पौधे पर तनाव पत्तियों को कमज़ोर करता है।",
  },

  // Step-by-step cure
  curePlan: { en: "Step-by-step cure plan", hi: "चरण-दर-चरण उपचार योजना" },
  curePlanSub: {
    en: "Follow these steps in order over the next 14 days.",
    hi: "अगले 14 दिनों में इन चरणों का क्रम से पालन करें।",
  },
  step: { en: "Step", hi: "चरण" },
  day: { en: "Day", hi: "दिन" },
  cureStep1Title: { en: "Sanitise — remove infected leaves", hi: "सफ़ाई — संक्रमित पत्तियाँ हटाएँ" },
  cureStep1Body: {
    en: "Pluck all leaves with target spots and burn or deep-bury them away from the field. Never compost.",
    hi: "धब्बों वाली सभी पत्तियाँ तोड़कर खेत से दूर जलाएँ या गहराई में दफनाएँ। कंपोस्ट में न डालें।",
  },
  cureStep2Title: { en: "Spray fungicide — first round", hi: "फफूंदनाशी छिड़काव — पहला दौर" },
  cureStep2Body: {
    en: "Mix Mancozeb 75% WP @ 2.5 g/L water, OR Neem oil @ 5 ml/L. Spray entire canopy in cool morning hours.",
    hi: "मैंकोज़ेब 75% WP @ 2.5 ग्राम/लीटर पानी, या नीम तेल @ 5 मि.ली./लीटर मिलाएँ। ठंडी सुबह पूरे पौधे पर छिड़काव करें।",
  },
  cureStep3Title: { en: "Improve airflow", hi: "हवा का प्रवाह बढ़ाएँ" },
  cureStep3Body: {
    en: "Stake tall plants, prune crowded lower branches, switch overhead irrigation to drip or furrow.",
    hi: "ऊँचे पौधे बाँधें, घनी निचली शाखाएँ छाँटें, ऊपरी सिंचाई को ड्रिप या नाली में बदलें।",
  },
  cureStep4Title: { en: "Repeat spray — second round", hi: "दूसरा छिड़काव" },
  cureStep4Body: {
    en: "Re-spray after 10-12 days. Rotate fungicide chemistry (e.g. Chlorothalonil) to prevent resistance.",
    hi: "10-12 दिन बाद फिर छिड़काव करें। प्रतिरोध से बचने के लिए अलग दवा (जैसे क्लोरोथैलोनिल) चुनें।",
  },
  cureStep5Title: { en: "Monitor weekly", hi: "साप्ताहिक निगरानी" },
  cureStep5Body: {
    en: "Scan a new leaf every 7 days. If symptoms persist after the second spray, consult the Kisan Call Centre.",
    hi: "हर 7 दिन पर नई पत्ती की जाँच करें। दूसरे छिड़काव के बाद भी लक्षण रहें तो किसान कॉल सेंटर से संपर्क करें।",
  },
  doneIn: { en: "Done in", hi: "समय" },
  estimatedDays: { en: "~14 days", hi: "~14 दिन" },

  // Quick stats
  affectsCrop: { en: "Affects", hi: "प्रभावित फसल" },
  yieldRisk: { en: "Yield risk", hi: "उपज जोखिम" },
  spreadSpeed: { en: "Spread speed", hi: "फैलने की गति" },
  spreadFast: { en: "Fast (3-5 days)", hi: "तेज़ (3-5 दिन)" },
  spreadModerate: { en: "Moderate", hi: "मध्यम" },
  spreadNone: { en: "None", hi: "कोई नहीं" },

  // CTA
  scrollToDetails: { en: "See full analysis", hi: "पूरी जाँच देखें" },
  hint: { en: "Tip", hi: "सुझाव" },

  // Footer
  footerProduct: { en: "Product", hi: "उत्पाद" },
  footerResources: { en: "Resources", hi: "संसाधन" },
  footerCompany: { en: "Built at", hi: "विकसित" },
  footerCopy: {
    en: "© 2026 KisanCare · A MEAF research initiative · Made for Indian farmers",
    hi: "© 2026 किसानकेयर · MEAF अनुसंधान पहल · भारतीय किसानों के लिए",
  },
  poweredBy: { en: "Powered by", hi: "द्वारा संचालित" },
  meafFull: { en: "Multimodal Edge-AI Framework", hi: "मल्टीमॉडल एज-AI फ्रेमवर्क" },
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

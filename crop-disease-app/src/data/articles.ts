/**
 * Knowledge-library content. Static, hand-curated — no CMS required.
 * Each article has a list-card summary and a full body for the detail page.
 */
export type Category = "Disease" | "Pest" | "Crop" | "Practice" | "Scheme";

export type Section = { heading: string; body: string; bullets?: string[] };

export type Article = {
  slug: string;
  title: string;
  category: Category;
  excerpt: string;
  reading_min: number;
  tags: string[];
  popular?: boolean;

  // detail-page content
  hero_note?: string;
  sections: Section[];
  related?: string[]; // slugs
  sources?: string[];
};

export const CAT_TINT: Record<Category, string> = {
  Disease:  "bg-red-50 text-red-700 border-red-200",
  Pest:     "bg-harvest-50 text-harvest-700 border-harvest-200",
  Crop:     "bg-leaf-50 text-leaf-800 border-leaf-200",
  Practice: "bg-sky-50 text-sky-700 border-sky-200",
  Scheme:   "bg-earth-50 text-earth-700 border-earth-200",
};

export const ARTICLES: Article[] = [
  {
    slug: "tomato-early-blight",
    title: "Tomato Early Blight",
    category: "Disease",
    excerpt: "Concentric brown rings on lower leaves, often with yellow halo. Severe in warm humid weather after flowering.",
    reading_min: 4,
    tags: ["fungus", "tomato", "Alternaria"],
    popular: true,
    hero_note: "Caused by Alternaria solani · favoured by warm humid weather · 25–35% yield loss if untreated.",
    sections: [
      {
        heading: "What it looks like",
        body: "Early blight first appears on the oldest leaves as small dark brown spots that quickly enlarge into concentric ring 'target' patterns, often surrounded by a yellow halo. Severely infected leaves yellow and drop. Stems develop dark, slightly sunken lesions; fruit can develop leathery, dark sunken spots at the stem end.",
      },
      {
        heading: "When it strikes",
        body: "Warm temperatures (24–29 °C), high humidity (>75% at night), and free moisture on leaves — typical Indian conditions right after the first monsoon showers. Plants under nutrient or water stress are far more susceptible.",
      },
      {
        heading: "Treatment",
        body: "Start treatment at first 5% leaf-area infection. Rotate active ingredients to avoid resistance.",
        bullets: [
          "Mancozeb 75% WP — 2.5 g/L water, every 10–12 days. Most affordable.",
          "Chlorothalonil 75% WP — 2 g/L, max 3 sprays per season.",
          "Azoxystrobin 23% SC — 1 ml/L, two sprays 10–14 days apart.",
          "Neem oil (0.03% azadirachtin) — 5 ml/L for organic farms.",
        ],
      },
      {
        heading: "Prevention",
        body: "Long-term hygiene matters more than any one spray.",
        bullets: [
          "Use resistant varieties (Pusa Rohini, Arka Rakshak).",
          "Stake and prune lower leaves for airflow.",
          "Drip rather than flood irrigation; mulch with straw.",
          "Crop rotation with maize / onion every 2–3 seasons.",
          "Burn or compost infected debris — do not leave on the field.",
        ],
      },
    ],
    related: ["potato-early-blight", "tomato-late-blight", "neem-oil"],
    sources: ["ICAR-IIHR advisory", "PlantVillage dataset", "MEAF Treatment KB"],
  },
  {
    slug: "potato-early-blight",
    title: "Potato Early Blight",
    category: "Disease",
    excerpt: "Small dark concentric rings on older leaves first; spreads upward causing leaf drop.",
    reading_min: 4,
    tags: ["fungus", "potato", "Alternaria"],
    popular: true,
    hero_note: "Same pathogen family as tomato early blight · loss to potato can hit 30% in warm humid years.",
    sections: [
      { heading: "What it looks like", body: "Begins as small dark spots on older leaves, expanding into concentric brown rings. Tubers can develop dark dry sunken lesions if rain splashes spores onto exposed tubers." },
      {
        heading: "Treatment",
        body: "Start at first symptom; rotate fungicides.",
        bullets: [
          "Mancozeb 75% WP — 1 kg/acre, every 10–12 days.",
          "Chlorothalonil 75% WP — 2 g/L; rotate with Mancozeb.",
          "Trichoderma viride bio-fungicide — 5 g/L foliar, organic option.",
        ],
      },
      { heading: "Prevention", body: "Use certified disease-free seed tubers and maintain crop rotation for 2–3 years with non-solanaceous crops." },
    ],
    related: ["tomato-early-blight", "potato-best-practices"],
    sources: ["CPRI Shimla", "PlantVillage"],
  },
  {
    slug: "tomato-late-blight",
    title: "Tomato Late Blight",
    category: "Disease",
    excerpt: "Greenish-black water-soaked patches on leaves and stems. Spreads fast in cool wet weather.",
    reading_min: 5,
    tags: ["Phytophthora", "tomato"],
    hero_note: "Caused by Phytophthora infestans · the same pathogen behind the Irish potato famine.",
    sections: [
      { heading: "What it looks like", body: "Pale to dark green water-soaked patches on leaves, expanding rapidly to brown / black necrosis. White downy growth on the underside of leaves in wet conditions. Stems blacken; fruit develops greasy brown blotches." },
      { heading: "Treatment", body: "Late blight moves fast — act within 24 hours.", bullets: [
        "Metalaxyl + Mancozeb (Ridomil Gold) 2 g/L — first spray immediately.",
        "Repeat every 7 days during wet weather.",
        "Remove and burn infected plants entirely — do not compost.",
      ]},
    ],
    related: ["tomato-early-blight"],
    sources: ["ICAR-IIHR"],
  },
  {
    slug: "fall-armyworm",
    title: "Fall Armyworm (Maize)",
    category: "Pest",
    excerpt: "Voracious caterpillar that destroys young maize. Whorl damage is the giveaway.",
    reading_min: 6,
    tags: ["maize", "Spodoptera"],
    popular: true,
    hero_note: "Spodoptera frugiperda · invaded India in 2018 · can destroy a maize field in days.",
    sections: [
      { heading: "How to identify", body: "Look for ragged, window-pane feeding damage on young whorl leaves and characteristic 'sawdust' frass at the whorl. Mature larvae have a distinct inverted Y on the head and four dark spots in a square pattern on the second-last segment." },
      { heading: "Control", body: "Combine cultural + biological + chemical control for best results.", bullets: [
        "Hand-pick egg masses and early larvae in small fields.",
        "Spinetoram 11.7% SC — 0.5 ml/L, target whorl directly.",
        "Pheromone traps (4 / acre) for monitoring + mass-trapping.",
        "Trichogramma chilonis egg-parasitoid releases (50,000/ha).",
      ]},
    ],
    related: ["ipm-basics", "whitefly"],
    sources: ["CABI Plantwise", "ICAR-NRCM"],
  },
  {
    slug: "whitefly",
    title: "Whitefly (Cotton, Tomato)",
    category: "Pest",
    excerpt: "Tiny white insects under the leaf. Suck sap, secrete honeydew, vector viruses.",
    reading_min: 4,
    tags: ["cotton", "tomato", "vector"],
    sections: [
      { heading: "What to look for", body: "Cloud of tiny white insects flying up when foliage is disturbed. Yellowing and curling leaves. Sticky honeydew with sooty mould. Vectors Cotton Leaf Curl Virus and Tomato Yellow Leaf Curl Virus." },
      { heading: "Control", body: "Use yellow sticky traps for monitoring and mass-trapping.", bullets: [
        "Yellow sticky traps — 10–20 per acre, refresh every 2 weeks.",
        "Neem oil 0.03% — 5 ml/L, covers undersides where the pest lives.",
        "Diafenthiuron 50% WP — 1 g/L for severe outbreaks.",
        "Encourage natural enemies (Encarsia formosa parasitoid).",
      ]},
    ],
    related: ["ipm-basics", "neem-oil"],
    sources: ["ICAR-NBAIR"],
  },
  {
    slug: "drip-irrigation",
    title: "Setting up drip irrigation",
    category: "Practice",
    excerpt: "How to size laterals, choose emitters, and run your first 30-minute cycle.",
    reading_min: 8,
    tags: ["water", "infrastructure"],
    popular: true,
    hero_note: "Drip saves 40–60% of water and 30% of fertiliser compared to flood irrigation.",
    sections: [
      { heading: "System parts", body: "A basic drip layout has 5 parts: pump → filter → fertigation tank → mainline → submains → laterals with emitters. For a 1-acre tomato field budget 40–60k for a basic setup; PMKSY subsidises 55% (general) / 75% (SC/ST/small farmer)." },
      { heading: "Sizing", body: "Use 16 mm laterals for plot widths up to 60 m. Emitters at 4 L/h every 30 cm for closely-spaced crops; 8 L/h every 50 cm for tomato/chilli. Maintain 1 kgf/cm² operating pressure." },
      { heading: "First run", body: "Open all submains, flush for 5 minutes to clear debris, close, then run normally. Daily cycle is typically 30–45 minutes early morning. Add fertiliser via venturi or dosing pump." },
      { heading: "Maintenance", body: "Flush filter weekly. Acid-wash drip lines monthly to dissolve mineral deposits. Replace clogged emitters; don't try to clean them with wire." },
    ],
    related: ["ipm-basics", "soil-health-card"],
    sources: ["NMSA-MIDH", "Jain Irrigation manual"],
  },
  {
    slug: "ipm-basics",
    title: "IPM basics for small farms",
    category: "Practice",
    excerpt: "Combine cultural + biological + chemical control to reduce input cost and resistance.",
    reading_min: 7,
    tags: ["ipm", "sustainable"],
    sections: [
      { heading: "The five rules", body: "IPM is not 'no pesticides' — it's 'pesticides last and least'.", bullets: [
        "Prevention first: resistant varieties + crop rotation + clean seed.",
        "Monitor weekly: pheromone traps, sticky traps, scouting.",
        "Establish economic threshold — don't spray below it.",
        "Use biological + cultural controls before chemical.",
        "When you must spray, rotate modes of action to delay resistance.",
      ]},
    ],
    related: ["whitefly", "fall-armyworm", "neem-oil"],
    sources: ["FAO IPM manual"],
  },
  {
    slug: "soil-health-card",
    title: "Soil Health Card scheme",
    category: "Scheme",
    excerpt: "Free soil testing every 2 years with crop-specific fertilizer recommendations.",
    reading_min: 3,
    tags: ["soil", "govt"],
    sections: [
      { heading: "What you get", body: "A printed/digital card showing N-P-K, secondary nutrients, micronutrients, and pH for your specific field, with crop-specific fertiliser recommendations." },
      { heading: "How to apply", body: "Visit soilhealth.dac.gov.in or your local Krishi Vigyan Kendra. Collect a 0–15 cm soil sample (1 kg, mixed from 8–10 spots), submit at your block office, get results back in 2–3 weeks." },
    ],
    related: ["drip-irrigation"],
    sources: ["soilhealth.dac.gov.in"],
  },
  {
    slug: "pmfby",
    title: "PM Fasal Bima Yojana (PMFBY)",
    category: "Scheme",
    excerpt: "Crop insurance against yield loss. Farmer premium just 2% (kharif) / 1.5% (rabi).",
    reading_min: 3,
    tags: ["insurance", "govt"],
    popular: true,
    hero_note: "Covers yield loss from drought, flood, pest, disease and unseasonal rain.",
    sections: [
      { heading: "Coverage", body: "Sum insured is the scale-of-finance for that crop in your district. Loss is assessed at the unit area (village/panchayat) by yield estimation. Local-event (hailstorm, landslide) and post-harvest (cyclone, unseasonal rain) losses are assessed individually." },
      { heading: "Enrol", body: "Apply within the cut-off date (usually 31 Jul kharif / 31 Dec rabi) at any bank, CSC, or pmfby.gov.in. Premium is auto-debited if you have a Kisan Credit Card." },
    ],
    related: ["soil-health-card"],
    sources: ["pmfby.gov.in"],
  },
  {
    slug: "tomato-best-practices",
    title: "Tomato growing checklist",
    category: "Crop",
    excerpt: "Spacing, staking, pruning, irrigation, and pest scouting through the season.",
    reading_min: 10,
    tags: ["tomato", "checklist"],
    sections: [
      { heading: "Pre-planting", body: "Choose disease-resistant variety. Treat seed with Trichoderma viride 5 g/kg. Raise nursery in plug-trays for 25–30 days to minimise transplant shock." },
      { heading: "Spacing & support", body: "60 × 45 cm spacing for staked varieties. Drive bamboo stakes 6 ft apart; train with twine. Prune to single or double leader for disease control." },
      { heading: "Through the season", body: "Drip-irrigate at 4–6 L/plant/day depending on stage. Scout twice a week for whitefly, early blight, leaf miner. Top-dress urea + MOP at flowering + first picking." },
      { heading: "Harvest", body: "Pick fully red fruits from oldest cluster every 3–4 days. Refrigerate within 4 hours of harvest. Grade for size before sending to mandi." },
    ],
    related: ["tomato-early-blight", "drip-irrigation", "ipm-basics"],
    sources: ["ICAR-IIHR"],
  },
  {
    slug: "potato-best-practices",
    title: "Potato growing checklist",
    category: "Crop",
    excerpt: "From seed-tuber selection to hilling, watering schedule, and harvest indicators.",
    reading_min: 9,
    tags: ["potato", "checklist"],
    sections: [
      { heading: "Seed & planting", body: "Use certified seed tubers (30–40 g each). Pre-sprout for 2 weeks before planting. Plant 60 × 20 cm, 5 cm deep, with FYM 10 t/ha + 120:60:80 NPK." },
      { heading: "Hilling", body: "First hilling at 30 days, second at 50 days. This buries stolons and improves tuber set; also helps with weed control." },
      { heading: "Harvest", body: "Cut haulms 10 days before harvest to set the skin. Harvest in cool, dry weather. Grade for size; reject any with rot or greening before bagging." },
    ],
    related: ["potato-early-blight", "soil-health-card"],
    sources: ["CPRI Shimla"],
  },
  {
    slug: "neem-oil",
    title: "Neem oil: when it actually works",
    category: "Practice",
    excerpt: "Dose, timing, mixing — and the four conditions where neem outperforms chemicals.",
    reading_min: 5,
    tags: ["organic", "neem"],
    sections: [
      { heading: "Active ingredient", body: "Azadirachtin (0.03% in commercial formulations) — disrupts insect moulting and feeding. Works best against soft-bodied insects (whitefly, aphids, mealybug, mites, early larvae)." },
      { heading: "Mixing", body: "5 ml of 0.03% neem per litre of water + 0.5 ml of liquid soap (emulsifier). Use within 8 hours of mixing — azadirachtin degrades quickly in light." },
      { heading: "Best conditions", body: "Spray at cool morning or evening. Skip if rain within 8 hours. Combine with sticky traps. Repeat every 7 days during pest pressure." },
    ],
    related: ["ipm-basics", "whitefly"],
    sources: ["KVK extension manual"],
  },
];

export function findArticle(slug: string): Article | undefined {
  return ARTICLES.find(a => a.slug === slug);
}

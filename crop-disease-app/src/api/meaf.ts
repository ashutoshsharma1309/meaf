// Typed client for the MEAF Farmer Portal backend.
const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? "http://127.0.0.1:8000";

export type ClassName =
  | "Potato_Early_Blight"
  | "Potato_Healthy"
  | "Tomato_Early_Blight"
  | "Tomato_Healthy";

export type SeverityLevel = "none" | "mild" | "moderate" | "severe";

export interface Severity {
  level: SeverityLevel;
  label_en: string;
  label_hi: string;
  color: string;
  action_en: string;
  action_hi: string;
}

export interface PredictResponse {
  is_leaf: true;
  class: ClassName;
  class_display_en: string;
  class_display_hi: string;
  pathogen: string;
  description_en: string;
  description_hi: string;
  confidence: number;
  probabilities: Record<string, number>;
  severity: Severity;
  inference_ms: number;
  checks?: unknown;
}

export interface RejectResponse {
  is_leaf: false;
  reason: string;
  message_en: string;
  message_hi: string;
  tips_en: string[];
  tips_hi: string[];
  checks: Record<string, unknown>;
  inference_ms: number;
}

export type PredictResult = PredictResponse | RejectResponse;

export interface TreatmentItem {
  name_en: string;
  name_hi: string;
  dose: string;
  frequency: string;
  cost_per_acre_inr: number;
  phi_days?: number;
  notes_en: string;
  notes_hi: string;
}

export interface TreatmentResponse {
  class: ClassName;
  disease_en: string;
  disease_hi: string;
  pathogen: string;
  organic: TreatmentItem[];
  chemical: TreatmentItem[];
  prevention_en: string[];
  prevention_hi: string[];
}

export interface EconomicsResponse {
  class: ClassName;
  acres: number;
  expected_yield_quintal: number;
  market_price_per_quintal_inr: number;
  expected_revenue_inr: number;
  yield_loss_pct_if_untreated: number;
  potential_loss_inr_if_untreated: number;
  cheapest_organic_treatment_cost_inr: number;
  cheapest_chemical_treatment_cost_inr: number;
  roi_organic_x: number | null;
  roi_chemical_x: number | null;
}

export interface SprayDay {
  day_en: string;
  day_hi: string;
  rain_chance_pct: number;
  wind_kmph: number;
  temp_c: number;
  humidity_pct: number;
  spray_ok: boolean;
  reason_en: string;
  reason_hi: string;
}

export interface SprayWindowResponse {
  lat?: number;
  lon?: number;
  forecast: SprayDay[];
  recommended_day_en: string;
  recommended_day_hi: string;
}

export interface SupportResponse {
  helplines: Array<{
    name_en: string;
    name_hi: string;
    number: string;
    hours_en: string;
    languages: string[];
  }>;
  schemes: Array<{
    name_en: string;
    name_hi: string;
    benefit_en: string;
    benefit_hi: string;
    eligibility_en: string;
    link: string;
  }>;
}

async function get<T>(path: string): Promise<T> {
  const r = await fetch(`${API_BASE}${path}`);
  if (!r.ok) throw new Error(`${path} failed: ${r.status}`);
  return r.json();
}

export async function predict(file: File): Promise<PredictResult> {
  const fd = new FormData();
  fd.append("file", file);
  const r = await fetch(`${API_BASE}/predict`, { method: "POST", body: fd });
  if (!r.ok) throw new Error(`predict failed: ${r.status}`);
  return r.json();
}

export const getTreatment = (cls: ClassName) => get<TreatmentResponse>(`/treatment/${cls}`);
export const getEconomics = (cls: ClassName, acres: number) =>
  get<EconomicsResponse>(`/economics/${cls}?acres=${acres}`);
export const getSprayWindow = (lat?: number, lon?: number) =>
  get<SprayWindowResponse>(`/spray-window${lat && lon ? `?lat=${lat}&lon=${lon}` : ""}`);
export const getSupport = () => get<SupportResponse>("/support");

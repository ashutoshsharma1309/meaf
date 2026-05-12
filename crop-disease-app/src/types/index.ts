export interface ModelOption {
  id: string;                 // Hugging Face model ID
  name: string;                // short display name
  architecture: string;        // e.g. "MobileNetV2"
  parameters: string;          // e.g. "3.5M"
  testAccuracy: number;        // 0-1, reported on PlantVillage test set
  description: string;
  classes: number;             // number of output classes
  source: string;              // human-readable provenance
  link: string;                // url to model card
}

export interface Prediction {
  label: string;
  score: number;
}

export interface ClassificationResult {
  top: Prediction;
  others: Prediction[];
  raw: Prediction[];
  filtered: boolean;           // true if a crop filter narrowed the picks
  model: ModelOption;
}

export type ToastKind = "success" | "error" | "info";

export interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

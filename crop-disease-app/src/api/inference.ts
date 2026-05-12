import type {
  ClassificationResult,
  ModelOption,
  Prediction,
} from "../types";

/**
 * Catalog of pretrained plant-disease classifiers we expose to the user.
 * Test-accuracy values come from each model's published model card / paper
 * (PlantVillage benchmark, 38 classes unless noted).
 */
export const MODELS: ModelOption[] = [
  {
    id: "linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification",
    name: "MobileNetV2",
    architecture: "MobileNetV2 (CNN)",
    parameters: "3.5M",
    testAccuracy: 0.9531,
    classes: 38,
    description:
      "Lightweight CNN fine-tuned on PlantVillage. Fastest of the three.",
    source: "linkanjarad · Hugging Face model card",
    link: "https://huggingface.co/linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification",
  },
  {
    id: "wambugu1738/crop_leaf_diseases_vit",
    name: "ViT",
    architecture: "Vision Transformer (ViT-Base/16)",
    parameters: "86M",
    testAccuracy: 0.9907,
    classes: 38,
    description:
      "Transformer trained on PlantVillage. Highest accuracy, slower than MobileNet.",
    source: "wambugu1738 · Hugging Face model card",
    link: "https://huggingface.co/wambugu1738/crop_leaf_diseases_vit",
  },
];

/**
 * Crops covered by the PlantVillage label set. The values are matched
 * case-insensitively against the model's class-name prefix
 * (labels look like `Tomato___Early_blight`).
 */
export const CROPS: { value: string; label: string }[] = [
  { value: "any", label: "Any crop (don't filter)" },
  { value: "Apple", label: "Apple" },
  { value: "Blueberry", label: "Blueberry" },
  { value: "Cherry", label: "Cherry" },
  { value: "Corn", label: "Corn (Maize)" },
  { value: "Grape", label: "Grape" },
  { value: "Orange", label: "Orange" },
  { value: "Peach", label: "Peach" },
  { value: "Pepper", label: "Bell Pepper" },
  { value: "Potato", label: "Potato" },
  { value: "Raspberry", label: "Raspberry" },
  { value: "Soybean", label: "Soybean" },
  { value: "Squash", label: "Squash" },
  { value: "Strawberry", label: "Strawberry" },
  { value: "Tomato", label: "Tomato" },
];

const ENDPOINT_BASE = "https://api-inference.huggingface.co/models";
const HF_TOKEN = import.meta.env.VITE_HF_TOKEN as string | undefined;

export class ModelLoadingError extends Error {
  estimatedSeconds: number;
  constructor(message: string, estimatedSeconds: number) {
    super(message);
    this.estimatedSeconds = estimatedSeconds;
  }
}

export class InferenceError extends Error {}

interface HFErrorResponse {
  error?: string;
  estimated_time?: number;
}

export function humanizeLabel(raw: string): string {
  // PlantVillage labels: "Tomato___Early_blight", "Pepper,_bell___Bacterial_spot"
  const parts = raw.split("___");
  if (parts.length === 2) {
    const crop = parts[0].replace(/_/g, " ").replace(/,\s*/, ", ").trim();
    const disease = parts[1].replace(/_/g, " ").trim();
    const titled = disease
      .split(" ")
      .map((w) => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w))
      .join(" ");
    return `${crop} — ${titled}`;
  }
  return raw.replace(/_/g, " ").trim();
}

export function isHealthy(label: string): boolean {
  return /healthy/i.test(label);
}

function applyCropFilter(
  predictions: Prediction[],
  cropPrefix: string
): { filtered: Prediction[]; matched: boolean } {
  const prefix = cropPrefix.toLowerCase();
  const matches = predictions.filter((p) =>
    p.label.toLowerCase().startsWith(prefix)
  );
  if (matches.length === 0) {
    return { filtered: predictions, matched: false };
  }
  return { filtered: matches, matched: true };
}

export async function classifyImage(
  file: File,
  modelId: string,
  cropFilter: string,
  options: { signal?: AbortSignal } = {}
): Promise<ClassificationResult> {
  const model = MODELS.find((m) => m.id === modelId);
  if (!model) throw new InferenceError(`Unknown model: ${modelId}`);

  const headers: Record<string, string> = {
    "Content-Type": file.type || "application/octet-stream",
  };
  if (HF_TOKEN) headers.Authorization = `Bearer ${HF_TOKEN}`;

  let response: Response;
  try {
    response = await fetch(`${ENDPOINT_BASE}/${model.id}`, {
      method: "POST",
      headers,
      body: file,
      signal: options.signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    throw new InferenceError(
      "Network error — check your connection and try again."
    );
  }

  const text = await response.text();
  let parsed: unknown;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    throw new InferenceError(
      `Unexpected response from model server (status ${response.status}).`
    );
  }

  if (!response.ok) {
    const err = parsed as HFErrorResponse | null;
    const message = err?.error ?? `Request failed (${response.status})`;
    if (response.status === 503 && err?.estimated_time != null) {
      throw new ModelLoadingError(message, Math.ceil(err.estimated_time));
    }
    if (response.status === 401 || response.status === 403) {
      throw new InferenceError(
        "Hugging Face rejected the request. Set VITE_HF_TOKEN in your .env file."
      );
    }
    if (response.status === 429) {
      throw new InferenceError(
        "Rate limit hit. Wait a moment, or set VITE_HF_TOKEN to your own token."
      );
    }
    if (response.status === 404) {
      throw new InferenceError(
        `Model "${model.id}" was not found on the Inference API. Try another model.`
      );
    }
    throw new InferenceError(message);
  }

  if (!Array.isArray(parsed)) {
    throw new InferenceError("Model returned an unexpected payload shape.");
  }

  const sorted = (parsed as Prediction[])
    .filter((p) => typeof p?.label === "string" && typeof p?.score === "number")
    .sort((a, b) => b.score - a.score);

  if (sorted.length === 0) {
    throw new InferenceError("Model returned no predictions.");
  }

  let working = sorted;
  let filtered = false;
  if (cropFilter && cropFilter !== "any") {
    const { filtered: narrowed, matched } = applyCropFilter(sorted, cropFilter);
    working = narrowed;
    filtered = matched;
  }

  return {
    top: working[0],
    others: working.slice(1, 5),
    raw: sorted,
    filtered,
    model,
  };
}

export const inferenceConfig = {
  hasToken: Boolean(HF_TOKEN),
};

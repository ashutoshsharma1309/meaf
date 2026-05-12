import { useEffect, useRef, useState } from "react";
import {
  UploadCloud,
  X,
  Sparkles,
  Loader2,
  ImageIcon,
  CheckCircle2,
  AlertTriangle,
  Info,
  Cpu,
  Leaf,
} from "lucide-react";
import {
  classifyImage,
  CROPS,
  humanizeLabel,
  inferenceConfig,
  InferenceError,
  isHealthy,
  MODELS,
  ModelLoadingError,
} from "../api/inference";
import { useToast } from "../components/Toast";
import ConfidenceRing from "../components/ConfidenceRing";
import EmptyState from "../components/EmptyState";
import type { ClassificationResult, ModelOption, Prediction } from "../types";

const ACCEPTED = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_BYTES = 10 * 1024 * 1024;

export default function Detect() {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  const [modelId, setModelId] = useState<string>(MODELS[0].id);
  const [crop, setCrop] = useState<string>("any");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [result, setResult] = useState<ClassificationResult | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // Stop the browser from opening the file if the user drops outside the zone.
  useEffect(() => {
    const block = (e: DragEvent) => {
      e.preventDefault();
    };
    window.addEventListener("dragover", block);
    window.addEventListener("drop", block);
    return () => {
      window.removeEventListener("dragover", block);
      window.removeEventListener("drop", block);
    };
  }, []);

  const handleFile = (f: File | undefined | null) => {
    if (!f) return;
    const typeOk =
      ACCEPTED.includes(f.type) ||
      /\.(jpe?g|png|webp)$/i.test(f.name);
    if (!typeOk) {
      toast.error("Only JPG, PNG, or WebP images are accepted.");
      return;
    }
    if (f.size > MAX_BYTES) {
      toast.error("Image exceeds 10 MB limit.");
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setResult(null);
    setStatusMessage(null);
  };

  const extractDroppedFile = (dt: DataTransfer): File | null => {
    if (dt.files && dt.files.length > 0) return dt.files[0];
    if (dt.items && dt.items.length > 0) {
      for (const item of Array.from(dt.items)) {
        if (item.kind === "file") {
          const f = item.getAsFile();
          if (f) return f;
        }
      }
    }
    return null;
  };

  const openFilePicker = () => inputRef.current?.click();

  const clearFile = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setResult(null);
    setStatusMessage(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setSubmitting(true);
    setResult(null);
    setStatusMessage(null);
    try {
      const r = await classifyImage(file, modelId, crop);
      setResult(r);
      if (crop !== "any" && !r.filtered) {
        toast.info(
          `No ${crop} class in the model's top predictions — showing best overall match.`
        );
      }
    } catch (err) {
      if (err instanceof ModelLoadingError) {
        setStatusMessage(
          `Model is warming up (≈${err.estimatedSeconds}s). Try again in a moment.`
        );
        toast.info("Model is loading on Hugging Face — try again shortly.");
      } else if (err instanceof InferenceError) {
        toast.error(err.message);
      } else {
        toast.error("Unexpected error during classification.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const selectedModel = MODELS.find((m) => m.id === modelId)!;

  return (
    <div className="space-y-6">
      <ModelPicker value={modelId} onChange={setModelId} />

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="card p-6 lg:col-span-3">
          <h3 className="font-display text-lg font-semibold text-ink">
            Upload & analyze
          </h3>

          <div className="mt-4">
            <label htmlFor="crop-select" className="label">
              <span className="inline-flex items-center gap-1.5">
                <Leaf className="h-3.5 w-3.5 text-primary" />
                Crop / tree
              </span>
            </label>
            <select
              id="crop-select"
              className="input"
              value={crop}
              onChange={(e) => setCrop(e.target.value)}
            >
              {CROPS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-ink-muted">
              Used to narrow predictions to diseases of the selected crop.
            </p>
          </div>

          <div
            role="button"
            tabIndex={0}
            aria-label="Upload leaf image"
            onClick={openFilePicker}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                openFilePicker();
              }
            }}
            onDragEnter={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDragOver(true);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              e.dataTransfer.dropEffect = "copy";
              setDragOver(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDragOver(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDragOver(false);
              const dropped = extractDroppedFile(e.dataTransfer);
              if (dropped) handleFile(dropped);
              else toast.error("Couldn't read the dropped file.");
            }}
            className={`mt-5 flex min-h-[260px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
              dragOver
                ? "border-primary bg-primary-light/40"
                : "border-border bg-surface-2 hover:border-primary/60 hover:bg-primary-light/20"
            }`}
          >
            {previewUrl ? (
              <div className="w-full" onClick={(e) => e.stopPropagation()}>
                <img
                  src={previewUrl}
                  alt="Selected leaf"
                  className="mx-auto max-h-72 rounded-md object-contain"
                />
                {file && (
                  <div className="mt-4 flex items-center justify-between rounded-md border border-border bg-white px-3 py-2 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-ink">{file.name}</p>
                      <p className="text-xs text-ink-muted">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearFile();
                      }}
                      className="btn-ghost px-2 py-1 text-xs"
                    >
                      <X className="h-3.5 w-3.5" /> Remove
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="pointer-events-none flex h-12 w-12 items-center justify-center rounded-full bg-primary-light text-primary">
                  <UploadCloud className="h-5 w-5" />
                </div>
                <p className="pointer-events-none mt-3 text-sm font-medium text-ink">
                  Drop your image here, or{" "}
                  <span className="text-primary">click to browse</span>
                </p>
                <p className="pointer-events-none mt-1 text-xs text-ink-muted">
                  Clear, well-lit photos of a single leaf give the best results.
                </p>
              </>
            )}
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                handleFile(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </div>

          <button
            onClick={handleAnalyze}
            disabled={!file || submitting}
            className="btn-primary mt-5 w-full py-3 text-base"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing with {selectedModel.name}…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" /> Identify disease
              </>
            )}
          </button>

          {statusMessage && (
            <div className="mt-4 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-warning">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{statusMessage}</p>
            </div>
          )}

          {!inferenceConfig.hasToken && (
            <p className="mt-4 text-xs text-ink-muted">
              No <code className="rounded bg-surface-2 px-1 py-0.5">VITE_HF_TOKEN</code>{" "}
              configured — public Hugging Face rate limits apply. Add one to{" "}
              <code className="rounded bg-surface-2 px-1 py-0.5">.env</code> for
              smoother requests.
            </p>
          )}
        </div>

        <div className="lg:col-span-2">
          {result ? (
            <ResultPanel result={result} />
          ) : (
            <div className="card flex h-full min-h-[420px] items-center justify-center">
              <EmptyState
                icon={ImageIcon}
                title="Awaiting analysis"
                description="Pick a model, choose your crop, drop in a leaf image, and click Identify disease."
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ModelPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <Cpu className="h-4 w-4 text-primary" />
        <h3 className="font-display text-lg font-semibold text-ink">
          Choose a model
        </h3>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {MODELS.map((m) => {
          const active = m.id === value;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onChange(m.id)}
              className={`text-left rounded-lg border p-4 transition ${
                active
                  ? "border-primary bg-primary-light/40 shadow-card"
                  : "border-border bg-white hover:border-primary/40 hover:bg-surface-2"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-display text-base font-semibold text-ink">
                    {m.name}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-muted">{m.architecture}</p>
                </div>
                <span className="badge bg-primary-light text-primary">
                  {(m.testAccuracy * 100).toFixed(2)}% acc
                </span>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-ink-muted">
                {m.description}
              </p>
              <div className="mt-3 flex items-center justify-between text-[11px] text-ink-muted">
                <span>{m.parameters} params · {m.classes} classes</span>
                <a
                  href={m.link}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-primary hover:underline"
                >
                  Model card ↗
                </a>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ResultPanel({ result }: { result: ClassificationResult }) {
  const { top, others, model } = result;
  const confidencePct = top.score * 100;
  const accuracyPct = model.testAccuracy * 100;
  const healthy = isHealthy(top.label);
  const humanized = humanizeLabel(top.label);

  return (
    <div className="card animate-fade-in p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
            {healthy ? "Status" : "Diagnosis"}
          </p>
          <h3 className="mt-1 font-display text-2xl font-semibold leading-tight text-ink">
            {humanized}
          </h3>
        </div>
        <span
          className={`badge ${
            healthy
              ? "border border-primary/20 bg-primary-light text-primary"
              : "border border-red-200 bg-red-50 text-danger"
          }`}
        >
          {healthy ? (
            <CheckCircle2 className="h-3 w-3" />
          ) : (
            <AlertTriangle className="h-3 w-3" />
          )}
          {healthy ? "Healthy" : "Disease detected"}
        </span>
      </div>

      <div className="mt-6 flex justify-center">
        <ConfidenceRing value={confidencePct} label="Confidence" />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <Stat label="Model" value={model.name} sub={model.architecture} />
        <Stat
          label="Reported test accuracy"
          value={`${accuracyPct.toFixed(2)}%`}
          sub={`on PlantVillage · ${model.classes} classes`}
        />
      </div>

      {others.length > 0 && (
        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
            Other possibilities
          </p>
          <ul className="mt-2 space-y-2">
            {others.map((p) => (
              <PredictionRow key={p.label} prediction={p} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-md border border-border bg-surface-2 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-ink">{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-ink-muted">{sub}</p>}
    </div>
  );
}

function PredictionRow({ prediction }: { prediction: Prediction }) {
  const pct = prediction.score * 100;
  return (
    <li className="rounded-md border border-border bg-surface-2 px-3 py-2">
      <div className="flex items-center justify-between text-sm">
        <span className="truncate text-ink">{humanizeLabel(prediction.label)}</span>
        <span className="ml-2 text-xs font-semibold tabular-nums text-ink-muted">
          {pct.toFixed(1)}%
        </span>
      </div>
      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-border">
        <div
          className="h-full bg-primary/60 transition-all"
          style={{ width: `${Math.max(pct, 1)}%` }}
        />
      </div>
    </li>
  );
}

// Re-export so ConfidenceRing's prop signature is type-checked against ours.
export type { ModelOption };

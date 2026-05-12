# CropScan — MVP

Single-page web app that identifies crop diseases from a leaf photo. Pick a
pretrained PlantVillage model, choose your crop, drop in an image, and see the
predicted disease with confidence + the model's published accuracy.

**No backend, no training, no Python.** All inference runs through the Hugging
Face Inference API.

## Stack

- React + Vite + TypeScript
- Tailwind CSS
- Hugging Face Inference API (image classification)

## Quick start

```bash
npm install
cp .env.example .env       # optional, but recommended
npm run dev                # http://localhost:5173
```

Drop in a leaf image, choose your crop, click **Identify disease**.

## Hugging Face token (recommended)

The public Inference API works without a token but is rate-limited and may
return 429s after a few requests.

1. Create a free Hugging Face account: <https://huggingface.co/join>
2. Generate a **read** token: <https://huggingface.co/settings/tokens>
3. Paste it into `.env`:

```
VITE_HF_TOKEN=hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

4. Restart `npm run dev`.

## Models

Two pretrained PlantVillage classifiers ship in the model picker. Both expose
all 38 PlantVillage classes (apples, corn, grapes, potatoes, tomatoes, etc.).

| Model         | Architecture          | Params | Reported test accuracy | Notes                   |
| ------------- | --------------------- | ------ | ---------------------- | ----------------------- |
| MobileNetV2   | MobileNetV2 (CNN)     | 3.5M   | 95.31%                 | Fastest, smallest       |
| ViT           | Vision Transformer    | 86M    | 99.07%                 | Highest accuracy        |

Accuracy values come from each model's published model card on Hugging Face
(PlantVillage benchmark, standard test split). They're displayed in the result
panel alongside the per-image **confidence** that the model returns for your
specific upload.

To add more models, edit the `MODELS` array in
[`src/api/inference.ts`](src/api/inference.ts) — any image-classification model
on the Hugging Face Inference API will work.

## "Model is currently loading"

If you see a banner saying the model is warming up, that's the Hugging Face
serverless cold start — typically 20–30 seconds the first time after a long
idle. Click **Identify disease** again once the timer suggests; subsequent
calls are fast.

## Build

```bash
npm run build      # outputs to dist/
npm run preview    # serve the production build locally
```

## Project layout

```
src/
  api/inference.ts        Model catalog, crop list, HF API call
  components/
    Toast.tsx             Toast provider + useToast hook
    ConfidenceRing.tsx    SVG circular progress
    EmptyState.tsx        Reusable empty state
  pages/Detect.tsx        Model picker + upload UI + result panel
  types/index.ts          Shared types
  App.tsx                 Header + main + footer shell
  main.tsx                Vite entry
  index.css               Tailwind + design tokens
```

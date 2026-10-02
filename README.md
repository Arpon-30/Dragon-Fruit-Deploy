---
title: DragonKrishok
emoji: 🐉
colorFrom: pink
colorTo: green
sdk: docker
app_port: 7860
---

# DragonKrishok (ড্রাগন কৃষক)

AI dragon fruit quality check for farmers. Point a phone at a dragon fruit and DragonKrishok tells you
whether it is **Mature, Immature, Defect or Bad**, shows a Grad-CAM heatmap of where the model looked,
outlines the likely affected area, and gives a one page PDF report in **English or Bangla**.

Designed and developed by **Arpon Paul Amit**. Supervisor: **Nuzhat Tabassum**, Assistant Professor, AIUB.

## Features

- **Live camera**: grade updates about 4 to 6 times a second over a WebSocket
- **Take photo** with the phone camera, or **pick from the gallery**, and save photos back to the gallery
- **Heatmap and affected area** with a drag slider to compare against the photo
- **PDF reports** in English and Bangla (Hind Siliguri font, proper Bangla letter joining)
- **English / বাংলা** switch and **light / dark** mode, both remembered
- History timeline, Bangladesh and world maps, farmer guide (PDF in both languages), installable as an app
- Fully animated (Framer Motion), and respects the phone's reduced motion setting
- Developer API with examples; interactive docs at `/docs`

## Model

`Model/Deploy modelDFCViT4C_MGAS_CCBS_final_torchscript.pt` (TorchScript, 12.8 MB):
MobileNetV2 + CBAM + Transformer, 224 x 224 input, classes `Bad, Defect, Immature, Mature`.
Training code: `Code/DFCViT4C_Q1_Dragon (2).ipynb`. Preprocessing matches the notebook exactly
(resize to 256, then 224 with area interpolation, ImageNet mean and std).

Photos that are not dragon fruit are rejected by a CLIP zero-shot check (`openai/clip-vit-base-patch32`),
the same approach as the Mango project. Set `DK_FRUIT_CHECK=off` to skip it on small servers.

## Folder structure

```
backend/      Python: FastAPI server, model, Grad-CAM, PDF reports, tests
  dragonkrishok/   server.py, model.py, analysis.py, fruit_check.py, report.py, guide.py,
                   grades.json (EN/BN grade info), guide.json (EN/BN farmer guide), fonts/
  tests/
frontend/     React + Vite website
  src/components/  one file per section
  src/i18n/        every English and Bangla string
  src/data/        history, places, sources, map shapes
animations/   all motion: scroll reveals, ring, bars, scanner, seeds (imported as @animations)
Model/        trained model (unchanged)
Code/         training notebook (unchanged)
```

## Run locally

Needs Python 3.10+ and Node.js 20+ (Node only to build the website once).

```bash
pip install -r backend/requirements.txt
python run.py                 # builds the site if needed, then http://localhost:7860
```

Frontend development with hot reload (API proxied to port 7860):

```bash
cd backend && uvicorn dragonkrishok.server:app --port 7860   # terminal 1
cd frontend && npm install && npm run dev                     # terminal 2
```

Tests: `cd backend && pip install pytest httpx && pytest`

## Deploy (Docker, Hugging Face Spaces)

```bash
docker build -t dragonkrishok .                            # add --build-arg FRUIT_CHECK=off for small servers
docker run -p 7860:7860 dragonkrishok
```

On Hugging Face, create a Docker Space and push this repository; the header above configures it.

## Deploy on Streamlit Community Cloud

The same website, same design, runs inside Streamlit: `streamlit_app.py` shows `frontend/dist` full screen
and `frontend/streamlit/bridge.js` sends the page's API calls to the Python backend in memory.

1. Push this repository to GitHub (with `frontend/dist` committed: Streamlit Cloud cannot build the site).
2. On [share.streamlit.io](https://share.streamlit.io): **Create app** → pick the repo and branch →
   main file `streamlit_app.py` → **Advanced settings** → Python **3.11** or **3.12** → **Deploy**.
3. The first start installs PyTorch and downloads CLIP, so it takes a few minutes.

Notes: live camera uses plain requests on Streamlit (about 1 to 2 updates a second; the Docker version uses
a WebSocket and is faster). The free tier has little memory, so the fruit check runs CLIP in half precision
(`DK_LOW_MEMORY=1`, set by `streamlit_app.py`). If the app still runs out of memory, add `DK_FRUIT_CHECK = "off"`
under **Settings → Secrets**. After changing anything in `frontend/` or `animations/`, run
`cd frontend && npm run build` and commit `frontend/dist`.

Run it locally: `pip install -r requirements.txt` then `streamlit run streamlit_app.py`.

## API

| Method | Path | What it does |
| --- | --- | --- |
| GET | `/api/health` | Status |
| GET | `/api/grades` | The 4 grades with signs and actions in English and Bangla |
| POST | `/api/analyze` | `image` file in; grade, scores, `photo`, `heatmap`, `marked` (base64 JPEG), `affected_percent` out |
| WS | `/ws/live` | Send a JPEG frame, get the grade back, then send the next frame |
| POST | `/api/quick` | `image` in; grade and scores only (live mode without WebSocket) |
| POST | `/api/report` | `image`, `name`, `lang=en|bn` in; PDF out |
| GET | `/api/guide`, `/api/guide.pdf?lang=` | Farmer guide as JSON or PDF |

Errors: 400 unreadable image, 413 larger than 10 MB, 422 not a dragon fruit.

## Data sources

History and map facts are listed with links in `frontend/src/data/sources.js` and in the site footer.
Map shapes come from Natural Earth (public domain) through `world-atlas`; regenerate with `npm run maps`.

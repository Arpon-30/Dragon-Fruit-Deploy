# DragonKrishok: project guide

Dragon fruit quality grading website. Owner: Arpon Paul Amit (supervisor Nuzhat Tabassum, AIUB).
The sibling project with the same approach is `Arpon-30/UI-Changes-Mango` (AmropaliNet).

## Layout
- `backend/dragonkrishok/`: FastAPI (`server.py`), model loading and Grad-CAM (`model.py`), pipeline
  (`analysis.py`), CLIP dragon fruit gate (`fruit_check.py`), PDFs (`report.py`, `guide.py`).
  Content in `grades.json` and `guide.json` (English and Bangla); the website reads them from the API.
- `frontend/`: React 19 + Vite. Sections in `src/components/`, all UI text in `src/i18n/strings.js`.
- `animations/`: all motion code, imported as `@animations` (alias and dedupe in `frontend/vite.config.js`).
- `Model/` and `Code/`: the trained TorchScript model and notebook. Do not modify.

## Rules
- Never use long dashes in UI or PDF text; use a single hyphen.
- Every UI string exists in both `en` and `bn`. Bangla digits via `num()` from `useLang()`.
- Grad-CAM: the traced attention layer has no backward pass, so `model._head` recomputes the
  Transformer blocks from the same weights. `predict()` must use `torch.no_grad()`, not
  `inference_mode()` (inference tensors cached by TorchScript break later backward passes).
- Affected area is outlined only for `Bad` and `Defect`.
- PDFs use Hind Siliguri and need `uharfbuzz`; text is wrapped manually (`_PDF.para`).
- Keep layouts free of overlap from 320 px to desktop, in both languages.

## Commands
- `python run.py`: build the site if needed and serve on :7860
- `cd backend && pytest`: API, Grad-CAM, PDF and WebSocket tests
- `cd frontend && npm run dev | build | maps`
- Env: `DK_MODEL_PATH`, `DK_FRUIT_CHECK=off`, `DK_WEB_ROOT`

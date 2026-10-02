"""DragonKrishok REST API and website server.

    uvicorn dragonkrishok.server:app --port 7860      (run from backend/)

Serves the built React site from frontend/dist when it exists.
"""

from __future__ import annotations

import os
import re
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, File, Form, HTTPException, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import FileResponse, Response
from fastapi.staticfiles import StaticFiles

from . import __version__, guide
from .analysis import InvalidImage, analyze, grades, load_rgb, quick
from .model import load_model
from .report import BanglaPdfUnavailable, generate_report

MAX_BYTES = 10 * 1024 * 1024
MAX_FRAME = 1024 * 1024
WEB_ROOT = Path(os.environ.get("DK_WEB_ROOT", Path(__file__).resolve().parents[2] / "frontend" / "dist"))
NOT_FRUIT = "This does not look like a dragon fruit. Please take a clear photo of one dragon fruit."


@asynccontextmanager
async def _lifespan(_app: FastAPI):
    load_model()  # fail fast and keep the first request quick
    yield


app = FastAPI(title="DragonKrishok API", version=__version__, lifespan=_lifespan,
              description="Dragon fruit quality grading with Grad-CAM, by Arpon Paul Amit (AIUB).")


async def _read_image(image: UploadFile):
    data = await image.read(MAX_BYTES + 1)
    if len(data) > MAX_BYTES:
        raise HTTPException(413, "Image is larger than 10 MB.")
    try:
        return await run_in_threadpool(load_rgb, data)
    except InvalidImage as exc:
        raise HTTPException(400, str(exc)) from exc


async def _analyze(image: UploadFile) -> dict:
    result = await run_in_threadpool(analyze, await _read_image(image))
    if not result["is_dragon_fruit"]:
        raise HTTPException(422, NOT_FRUIT)
    return result


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok", "version": __version__}


@app.get("/api/grades")
def get_grades() -> dict:
    return grades()


@app.post("/api/analyze")
async def api_analyze(image: UploadFile = File(...)) -> dict:
    return await _analyze(image)


@app.post("/api/quick")
async def api_quick(image: UploadFile = File(...)) -> dict:
    """Live mode without a WebSocket (used on Streamlit): grade only, no heatmap."""
    return await run_in_threadpool(quick, await _read_image(image))


@app.post("/api/report")
async def api_report(image: UploadFile = File(...), name: str = Form(""), lang: str = Form("en")) -> Response:
    lang = "bn" if lang == "bn" else "en"
    result = await _analyze(image)
    try:
        pdf = await run_in_threadpool(generate_report, result, name, lang)
    except BanglaPdfUnavailable as exc:
        raise HTTPException(500, str(exc)) from exc
    safe = re.sub(r"[^A-Za-z0-9]+", "_", name).strip("_") or "farmer"
    return Response(pdf, media_type="application/pdf", headers={
        "Content-Disposition": f'attachment; filename="DragonKrishok_{safe}_{lang}.pdf"'})


@app.get("/api/guide")
def api_guide() -> dict:
    return guide.content()


@app.get("/api/guide.pdf")
async def api_guide_pdf(lang: str = "en") -> Response:
    lang = "bn" if lang == "bn" else "en"
    pdf = await run_in_threadpool(guide.farmer_guide, lang)
    return Response(pdf, media_type="application/pdf", headers={
        "Content-Disposition": f'attachment; filename="DragonKrishok_farmer_guide_{lang}.pdf"'})


@app.websocket("/ws/live")
async def live(ws: WebSocket) -> None:
    """Client sends one JPEG frame, waits for the answer, then sends the next."""
    await ws.accept()
    try:
        while True:
            frame = await ws.receive_bytes()
            if len(frame) > MAX_FRAME:
                await ws.send_json({"error": "frame too large"})
                continue
            try:
                await ws.send_json(await run_in_threadpool(lambda: quick(load_rgb(frame))))
            except InvalidImage:
                await ws.send_json({"error": "bad frame"})
    except WebSocketDisconnect:
        pass


if WEB_ROOT.is_dir():
    app.mount("/assets", StaticFiles(directory=WEB_ROOT / "assets"), name="assets")

    @app.get("/{path:path}", include_in_schema=False)
    def site(path: str) -> FileResponse:
        file = (WEB_ROOT / path).resolve()
        if path and file.is_file() and WEB_ROOT.resolve() in file.parents:
            return FileResponse(file)
        return FileResponse(WEB_ROOT / "index.html")

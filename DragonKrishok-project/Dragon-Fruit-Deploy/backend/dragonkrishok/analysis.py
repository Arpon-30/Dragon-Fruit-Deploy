"""One call from photo to result: fruit check, grade, Grad-CAM heatmap and affected area."""

from __future__ import annotations

import base64
import io
import json
from functools import lru_cache
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageOps

from . import fruit_check
from .model import CLASSES, predict, predict_with_cam

DISPLAY = 448            # heatmap and photo size sent to the page and the PDF
AFFECTED_LEVEL = 0.55    # Grad-CAM level treated as "likely affected"
MARKED_GRADES = {"Bad", "Defect"}
MAX_PIXELS = 40_000_000  # refuse decompression bombs
# Both unsure -> most likely not a dragon fruit (same second gate as the Mango site)
UNSURE_FRUIT, UNSURE_MODEL = 0.80, 0.60


class InvalidImage(ValueError):
    """The upload is not a readable image."""


@lru_cache(maxsize=1)
def grades() -> dict:
    return json.loads((Path(__file__).with_name("grades.json")).read_text(encoding="utf-8"))


def load_rgb(data: bytes) -> np.ndarray:
    try:
        img = Image.open(io.BytesIO(data))
        if img.width * img.height > MAX_PIXELS:
            raise InvalidImage("Image is too large.")
        return np.asarray(ImageOps.exif_transpose(img).convert("RGB"))
    except InvalidImage:
        raise
    except Exception as exc:
        raise InvalidImage("Could not read this file as an image.") from exc


def to_b64(rgb: np.ndarray, quality: int = 88) -> str:
    buf = io.BytesIO()
    Image.fromarray(rgb).save(buf, format="JPEG", quality=quality)
    return base64.b64encode(buf.getvalue()).decode()


def _scores(probs: np.ndarray) -> list[dict]:
    order = np.argsort(-probs)
    return [{"grade": CLASSES[i], "score": round(float(probs[i]), 4)} for i in order]


def _mark(base: np.ndarray, cam: np.ndarray) -> tuple[np.ndarray, float]:
    """Outline where Grad-CAM >= AFFECTED_LEVEL. Returns the marked photo and its share in %."""
    h, w = cam.shape
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))
    mask = cv2.morphologyEx((cam >= AFFECTED_LEVEL).astype(np.uint8), cv2.MORPH_OPEN, kernel)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    contours = [c for c in contours if cv2.contourArea(c) >= 0.004 * h * w]
    keep = np.zeros_like(mask)
    marked = base.copy()
    if contours:
        cv2.drawContours(keep, contours, -1, 1, thickness=cv2.FILLED)
        inside = keep.astype(bool)
        marked[~inside] = (marked[~inside] * 0.72).astype(np.uint8)
        marked[inside] = (marked[inside] * 0.7 + np.array([233, 30, 122]) * 0.3).astype(np.uint8)
        smooth = [cv2.approxPolyDP(c, 1.5, True) for c in contours]
        cv2.drawContours(marked, smooth, -1, (255, 255, 255), 6, cv2.LINE_AA)
        cv2.drawContours(marked, smooth, -1, (233, 30, 122), 3, cv2.LINE_AA)
    return marked, round(float(keep.mean()) * 100, 1)


def _gate(rgb: np.ndarray, confidence: float) -> tuple[bool, float | None]:
    fruit = fruit_check.check(rgb)
    if fruit is None:
        return True, None
    ok = fruit >= fruit_check.THRESHOLD and not (fruit < UNSURE_FRUIT and confidence < UNSURE_MODEL)
    return ok, fruit


def quick(rgb: np.ndarray) -> dict:
    """Live mode: grade only, no heatmap."""
    probs = predict(rgb)
    i = int(probs.argmax())
    ok, fruit = _gate(rgb, float(probs[i]))
    if not ok:
        return {"is_dragon_fruit": False, "fruit_score": fruit}
    return {"is_dragon_fruit": True, "fruit_score": fruit, "grade": CLASSES[i],
            "confidence": round(float(probs[i]), 4), "scores": _scores(probs)}


def analyze(rgb: np.ndarray) -> dict:
    """Full result for one photo."""
    probs, cam = predict_with_cam(rgb)
    i = int(probs.argmax())
    grade, confidence = CLASSES[i], float(probs[i])
    ok, fruit = _gate(rgb, confidence)
    if not ok:
        return {"is_dragon_fruit": False, "fruit_score": fruit}

    base = cv2.resize(rgb, (DISPLAY, DISPLAY), interpolation=cv2.INTER_AREA)
    cam = cv2.GaussianBlur(cv2.resize(cam, (DISPLAY, DISPLAY), interpolation=cv2.INTER_CUBIC), (0, 0), 6)
    cam = (cam - cam.min()) / max(float(cam.max() - cam.min()), 1e-8)
    color = cv2.cvtColor(cv2.applyColorMap((cam * 255).astype(np.uint8), cv2.COLORMAP_JET), cv2.COLOR_BGR2RGB)
    heatmap = (0.55 * base + 0.45 * color).astype(np.uint8)

    marked, affected = (_mark(base, cam) if grade in MARKED_GRADES else (None, None))
    return {
        "is_dragon_fruit": True,
        "fruit_score": fruit,
        "grade": grade,
        "confidence": round(confidence, 4),
        "scores": _scores(probs),
        "photo": to_b64(base),
        "heatmap": to_b64(heatmap),
        "marked": to_b64(marked) if marked is not None else None,
        "affected_percent": affected,
    }

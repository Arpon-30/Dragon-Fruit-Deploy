import io
import os

os.environ["DK_FRUIT_CHECK"] = "off"  # CLIP needs a download; tested via monkeypatch below

import numpy as np
import pytest
import torch
from fastapi.testclient import TestClient
from PIL import Image

from dragonkrishok import fruit_check, model
from dragonkrishok.server import app


def jpeg(size=(320, 240), seed=0) -> bytes:
    rgb = np.random.default_rng(seed).integers(0, 255, (*size[::-1], 3), dtype=np.uint8)
    buf = io.BytesIO()
    Image.fromarray(rgb).save(buf, format="JPEG")
    return buf.getvalue()


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


def test_gradcam_forward_matches_torchscript():
    rgb = np.random.default_rng(1).integers(0, 255, (300, 400, 3), dtype=np.uint8)
    model.predict(rgb)  # a plain prediction first must not break the backward pass
    with torch.no_grad():
        ref = model.load_model()(model.preprocess(rgb)).softmax(1)[0].numpy()
    probs, cam = model.predict_with_cam(rgb)
    assert np.allclose(probs, ref, atol=1e-5)
    assert cam.shape == (7, 7) and 0 <= cam.min() and cam.max() <= 1


def test_health_and_content(client):
    assert client.get("/api/health").json()["status"] == "ok"
    grades = client.get("/api/grades").json()
    assert set(grades) == set(model.CLASSES)
    assert all(g[lang]["actions"] for g in grades.values() for lang in ("en", "bn"))
    guide = client.get("/api/guide").json()
    assert len(guide["en"]["sections"]) == len(guide["bn"]["sections"])


def test_analyze(client):
    r = client.post("/api/analyze", files={"image": ("f.jpg", jpeg(), "image/jpeg")})
    assert r.status_code == 200
    body = r.json()
    assert body["grade"] in model.CLASSES
    assert abs(sum(s["score"] for s in body["scores"]) - 1) < 1e-3
    assert body["photo"] and body["heatmap"]
    assert (body["marked"] is not None) == (body["grade"] in {"Bad", "Defect"})


def test_bad_uploads(client):
    assert client.post("/api/analyze", files={"image": ("x.jpg", b"not an image", "image/jpeg")}).status_code == 400
    big = b"0" * (10 * 1024 * 1024 + 1)
    assert client.post("/api/analyze", files={"image": ("x.jpg", big, "image/jpeg")}).status_code == 413


def test_not_dragon_fruit(client, monkeypatch):
    monkeypatch.setattr(fruit_check, "check", lambda rgb: 0.1)
    r = client.post("/api/analyze", files={"image": ("f.jpg", jpeg(), "image/jpeg")})
    assert r.status_code == 422


@pytest.mark.parametrize("lang", ["en", "bn"])
def test_pdfs(client, lang):
    r = client.post("/api/report", data={"name": "Arpon", "lang": lang},
                    files={"image": ("f.jpg", jpeg(), "image/jpeg")})
    assert r.status_code == 200 and r.content.startswith(b"%PDF")
    assert f"_{lang}.pdf" in r.headers["content-disposition"]
    g = client.get(f"/api/guide.pdf?lang={lang}")
    assert g.status_code == 200 and g.content.startswith(b"%PDF")


def test_quick(client):
    r = client.post("/api/quick", files={"image": ("f.jpg", jpeg((160, 120)), "image/jpeg")})
    assert r.status_code == 200 and r.json()["grade"] in model.CLASSES and "heatmap" not in r.json()


def test_live_socket(client):
    with client.websocket_connect("/ws/live") as ws:
        ws.send_bytes(jpeg((160, 120)))
        msg = ws.receive_json()
        assert msg["is_dragon_fruit"] and msg["grade"] in model.CLASSES
        ws.send_bytes(b"junk")
        assert ws.receive_json() == {"error": "bad frame"}

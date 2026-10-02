"""DragonKrishok on Streamlit Community Cloud.

Shows the real website (frontend/dist) unchanged and full screen as a Streamlit component.
The page's fetch("/api/...") calls go through frontend/streamlit/bridge.js to Python, which
answers them with the same FastAPI app in memory: same results, errors and PDFs as `python run.py`.

Run locally:  streamlit run streamlit_app.py
Deploy:       share.streamlit.io, main file streamlit_app.py, Python 3.11 or 3.12
"""

import os

# Before the backend is imported: half-precision CLIP for the ~1 GB free tier
os.environ.setdefault("DK_LOW_MEMORY", "1")
os.environ.setdefault("USE_TF", "0")

import base64
import gc
import json
import re
import shutil
import sys
import tempfile
from pathlib import Path

import streamlit as st
import streamlit.components.v1 as components

ROOT = Path(__file__).resolve().parent
DIST = ROOT / "frontend" / "dist"
sys.path.insert(0, str(ROOT / "backend"))
API_PATH = re.compile(r"/api/[a-z_]+(\.pdf)?(\?lang=(en|bn))?")

st.set_page_config(page_title="DragonKrishok | Dragon fruit quality AI", page_icon="🐉",
                   layout="wide", initial_sidebar_state="collapsed")


@st.cache_resource(show_spinner=False)
def build_site() -> str:
    """Copy the built website into a folder Streamlit serves as a component, with the bridge."""
    if not (DIST / "index.html").exists():
        st.error("frontend/dist is missing. Run `cd frontend && npm ci && npm run build` and commit frontend/dist.")
        st.stop()
    out = Path(tempfile.gettempdir()) / "dragonkrishok_site"
    shutil.rmtree(out, ignore_errors=True)
    shutil.copytree(DIST, out)
    shutil.copy(ROOT / "frontend" / "streamlit" / "bridge.js", out / "bridge.js")
    html = (out / "index.html").read_text(encoding="utf-8")
    if '<script type="module"' not in html:
        raise RuntimeError("streamlit_app.py: module script not found in frontend/dist/index.html")
    html = html.replace('<script type="module"', '<script src="./bridge.js"></script>\n    <script type="module"', 1)
    (out / "index.html").write_text(html, encoding="utf-8")
    return str(out)


@st.cache_resource(show_spinner=False)
def api():
    """The DragonKrishok FastAPI app in memory. Entering the client loads the model."""
    from fastapi.testclient import TestClient

    from dragonkrishok.server import app

    client = TestClient(app, raise_server_exceptions=False)
    client.__enter__()
    return client


def answer(req: dict) -> dict:
    """Answer one fetch() from the page."""
    out = {"id": req.get("id")}
    path = str(req.get("path", ""))
    if not API_PATH.fullmatch(path):
        return {**out, "status": 404, "content_type": "application/json", "text": '{"detail": "Not found"}'}
    try:
        client = api()
        if req.get("method") == "POST":
            files = {k: (f.get("name") or "photo.jpg", base64.b64decode(f.get("b64", "")), f.get("type") or "image/jpeg")
                     for k, f in (req.get("files") or {}).items()}
            r = client.post(path, data=req.get("fields") or {}, files=files or None)
        else:
            r = client.get(path)
    except Exception as exc:  # keep the page alive; it shows its own error message
        return {**out, "status": 500, "content_type": "application/json", "text": json.dumps({"detail": str(exc)[:200]})}
    ctype = r.headers.get("content-type", "application/octet-stream")
    if "json" in ctype or ctype.startswith("text/"):
        return {**out, "status": r.status_code, "content_type": ctype, "text": r.text}
    return {**out, "status": r.status_code, "content_type": ctype, "b64": base64.b64encode(r.content).decode()}


api()  # load the model as soon as the first visitor arrives

request = st.session_state.get("site")
if isinstance(request, dict) and request.get("id") and request["id"] != st.session_state.get("answered"):
    st.session_state.response = answer(request)
    st.session_state.answered = request["id"]
    gc.collect()

# Full screen website: hide Streamlit's own header, padding and "stale" fading
st.markdown(
    """
    <style>
      header[data-testid="stHeader"], [data-testid="stToolbar"], [data-testid="stDecoration"],
      [data-testid="stStatusWidget"], footer { display: none !important; }
      html, body, [data-testid="stApp"], [data-testid="stAppViewContainer"], [data-testid="stMain"] { overflow: hidden !important; }
      [data-testid="stMainBlockContainer"], .block-container { padding: 0 !important; max-width: 100% !important; }
      [data-testid="stVerticalBlock"] { gap: 0 !important; }
      [data-testid="stElementContainer"]:has(> [data-testid="stMarkdown"] style) { display: none !important; }
      iframe[title*="dragonkrishok_site"] {
        display: block; width: 100vw !important; border: 0; height: 100vh !important; height: 100dvh !important;
      }
      .stale-element, [data-stale="true"] { opacity: 1 !important; transition: none !important; }
    </style>
    """,
    unsafe_allow_html=True,
)

site = components.declare_component("dragonkrishok_site", path=build_site())
site(key="site", response=st.session_state.get("response"), default=None)

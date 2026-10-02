"""Start DragonKrishok locally: builds the website once if needed, then serves everything.

    pip install -r backend/requirements.txt
    python run.py            # http://localhost:7860
"""

import os
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
FRONTEND = ROOT / "frontend"

if not (FRONTEND / "dist" / "index.html").exists():
    npm = shutil.which("npm")
    if not npm:
        sys.exit("Node.js is needed once to build the website: install it, then run this again.")
    if not (FRONTEND / "node_modules").exists():
        subprocess.run([npm, "ci"], cwd=FRONTEND, check=True)
    subprocess.run([npm, "run", "build"], cwd=FRONTEND, check=True)

port = os.environ.get("PORT", "7860")
print(f"DragonKrishok: open http://localhost:{port}  (Ctrl+C to stop)")
# subprocess, not os.exec*: on Windows os.exec* breaks paths that contain spaces
try:
    sys.exit(subprocess.call([sys.executable, "-m", "uvicorn", "dragonkrishok.server:app",
                              "--host", "0.0.0.0", "--port", port], cwd=ROOT / "backend"))
except KeyboardInterrupt:
    pass

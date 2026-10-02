# DragonKrishok: one container with the React site and the FastAPI + PyTorch backend.
# Works on Hugging Face Spaces (Docker SDK, port 7860).

# 1. Build the website
FROM node:22-slim AS web
WORKDIR /app
COPY animations ./animations
COPY frontend/package.json frontend/package-lock.json ./frontend/
RUN cd frontend && npm ci --no-audit --no-fund
COPY frontend ./frontend
RUN cd frontend && npm run build

# 2. Python runtime (CPU only PyTorch keeps the image small)
FROM python:3.11-slim
ENV PYTHONUNBUFFERED=1 PIP_NO_CACHE_DIR=1 HF_HOME=/home/user/.cache/huggingface
RUN useradd -m -u 1000 user
WORKDIR /home/user/app

COPY backend/requirements.txt backend/requirements.txt
RUN pip install --index-url https://download.pytorch.org/whl/cpu torch \
 && pip install -r backend/requirements.txt

USER user
# Fruit check (CLIP, about 600 MB). Build with --build-arg FRUIT_CHECK=off for small servers.
ARG FRUIT_CHECK=on
ENV DK_FRUIT_CHECK=$FRUIT_CHECK
# Download CLIP at build time, so the app starts without internet
RUN if [ "$FRUIT_CHECK" = "on" ]; then python -c "from transformers import CLIPModel, CLIPProcessor as P; \
    m='openai/clip-vit-base-patch32'; CLIPModel.from_pretrained(m); P.from_pretrained(m)"; fi

COPY --chown=user Model ./Model
COPY --chown=user backend ./backend
COPY --chown=user --from=web /app/frontend/dist ./frontend/dist

WORKDIR /home/user/app/backend
EXPOSE 7860
CMD ["uvicorn", "dragonkrishok.server:app", "--host", "0.0.0.0", "--port", "7860"]

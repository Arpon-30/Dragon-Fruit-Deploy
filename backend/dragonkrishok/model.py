"""DFCViT4C dragon fruit grading model: loading, preprocessing, prediction and Grad-CAM.

The TorchScript file keeps the model's parts (backbone, proj, cbam, blocks, ...) as
callable sub-modules, so Grad-CAM runs the same forward pass step by step and keeps
the gradient of the CBAM output (the last 7x7 spatial map before the Transformer).
"""

from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path

import cv2
import numpy as np
import torch

CLASSES = ["Bad", "Defect", "Immature", "Mature"]
IMG_SIZE = 224
CACHE_SIZE = 256  # the notebook decodes images at 256 x 256 before the 224 resize
MEAN = np.array([0.485, 0.456, 0.406], np.float32)
STD = np.array([0.229, 0.224, 0.225], np.float32)

_REPO = Path(__file__).resolve().parents[2]
MODEL_PATH = Path(os.environ.get(
    "DK_MODEL_PATH", _REPO / "Model" / "Deploy modelDFCViT4C_MGAS_CCBS_final_torchscript.pt"))

torch.set_num_threads(max(1, min(4, os.cpu_count() or 1)))


@lru_cache(maxsize=1)
def load_model() -> torch.jit.ScriptModule:
    if not MODEL_PATH.is_file():
        raise FileNotFoundError(f"Model file not found: {MODEL_PATH} (set DK_MODEL_PATH)")
    model = torch.jit.load(str(MODEL_PATH), map_location="cpu").eval()
    for p in model.parameters():
        p.requires_grad_(False)
    return model


def preprocess(rgb: np.ndarray) -> torch.Tensor:
    """RGB uint8 HxWx3 -> normalised 1x3x224x224 tensor, exactly as in the notebook."""
    x = cv2.resize(rgb, (CACHE_SIZE, CACHE_SIZE), interpolation=cv2.INTER_AREA)
    x = cv2.resize(x, (IMG_SIZE, IMG_SIZE), interpolation=cv2.INTER_AREA).astype(np.float32) / 255.0
    return torch.from_numpy(((x - MEAN) / STD).transpose(2, 0, 1)).float()[None]


def _attention(attn, x: torch.Tensor, heads: int = 8) -> torch.Tensor:
    """Multi-head self-attention from the traced weights. The traced layer calls a fused
    kernel without a backward pass, so Grad-CAM needs this differentiable version."""
    b, n, d = x.shape
    q, k, v = torch.nn.functional.linear(x, attn.in_proj_weight, attn.in_proj_bias).chunk(3, -1)
    q, k, v = (t.view(b, n, heads, d // heads).transpose(1, 2) for t in (q, k, v))
    out = torch.nn.functional.scaled_dot_product_attention(q, k, v).transpose(1, 2).reshape(b, n, d)
    return torch.nn.functional.linear(out, attn.out_proj.weight, attn.out_proj.bias)


def _head(model, feat: torch.Tensor) -> torch.Tensor:
    """Everything after CBAM, mirroring the TorchScript forward()."""
    tokens = feat.flatten(2).transpose(1, 2)
    t = torch.cat([model.cls_token.expand(feat.shape[0], -1, -1), tokens], 1) + model.pos_embed
    for block in model.blocks.children():
        t = t + _attention(block.attn, block.n1(t))
        t = t + block.ffn(block.n2(t))
    return model.classifier(model.head_norm(model.norm(t)[:, 0]))


def predict(rgb: np.ndarray) -> np.ndarray:
    """Class probabilities (4,) for one RGB image.

    no_grad, not inference_mode: the TorchScript executor caches tensors from its first
    runs, and inference-mode tensors would then break the Grad-CAM backward pass."""
    with torch.no_grad():
        return load_model()(preprocess(rgb)).softmax(1)[0].numpy()


def predict_with_cam(rgb: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """Class probabilities and a 0..1 Grad-CAM map (7x7) for the top class."""
    model = load_model()
    with torch.enable_grad():
        feat = model.cbam(model.proj(model.backbone(preprocess(rgb)))).detach().requires_grad_(True)
        logits = _head(model, feat)
        probs = logits.softmax(1)[0].detach().numpy()
        logits[0, int(probs.argmax())].backward()
    weights = feat.grad.mean((2, 3), keepdim=True)
    cam = torch.relu((weights * feat.detach()).sum(1))[0].numpy()
    cam -= cam.min()
    return probs, cam / cam.max() if cam.max() > 1e-8 else cam

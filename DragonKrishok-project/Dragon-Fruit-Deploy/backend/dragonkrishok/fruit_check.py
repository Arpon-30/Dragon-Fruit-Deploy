"""Is this a dragon fruit? CLIP zero-shot check (openai/clip-vit-base-patch32).

The grading model always picks one of its 4 grades, even for a mango or a face, so
photos are checked first. Label embeddings are computed once; each photo then costs
one CLIP vision pass. If CLIP cannot be loaded (no `transformers`, no internet on
first run) or DK_FRUIT_CHECK=off, the check is skipped and reported as such.
"""

from __future__ import annotations

import logging
import os
from functools import lru_cache

import numpy as np

log = logging.getLogger(__name__)

CLIP_ID = "openai/clip-vit-base-patch32"
THRESHOLD = 0.5
LABELS = [
    # dragon fruit (positive)
    "a photo of a dragon fruit",
    "a photo of a pink pitaya fruit with green scales",
    "a photo of a green unripe dragon fruit",
    "a photo of a rotten or damaged dragon fruit",
    "a photo of a cut dragon fruit with white or red flesh and black seeds",
    # not dragon fruit (negative)
    "a photo of a mango",
    "a photo of an apple, pomegranate or peach",
    "a photo of an orange, lemon or other citrus fruit",
    "a photo of a banana, papaya, pineapple or other tropical fruit",
    "a photo of a potato, tomato, onion or other vegetable",
    "a photo of a cactus plant or a flower",
    "a photo of a leaf or a tree",
    "a photo of cooked food on a plate",
    "a photo of a person or a face",
    "a photo of an animal",
    "a photo of a ball, toy or other object",
    "a photo of a phone, computer or car",
    "a photo of a room, building or street",
    "a screenshot, drawing, document or text",
]
POSITIVE = 5  # the first 5 labels are dragon fruit


def _emb(out):
    """transformers 4 returns the embedding tensor, transformers 5 an output object."""
    return out if hasattr(out, "shape") else out.pooler_output


@lru_cache(maxsize=1)
def _clip():
    if os.environ.get("DK_FRUIT_CHECK", "on").lower() == "off":
        return None
    try:
        import torch
        from transformers import CLIPModel, CLIPProcessor

        model = CLIPModel.from_pretrained(CLIP_ID).eval()
        processor = CLIPProcessor.from_pretrained(CLIP_ID)
        with torch.inference_mode():
            text = _emb(model.get_text_features(**processor(text=LABELS, return_tensors="pt", padding=True)))
        del model.text_model  # only the vision side is needed from now on
        return model, processor, torch.nn.functional.normalize(text, dim=-1)
    except Exception as exc:  # missing package, offline, out of memory
        log.warning("Fruit check disabled: %s", exc)
        return None


def check(rgb: np.ndarray) -> float | None:
    """Probability (0..1) that the photo shows a dragon fruit, or None if the check is off."""
    loaded = _clip()
    if loaded is None:
        return None
    import torch

    model, processor, text = loaded
    with torch.inference_mode():
        image = _emb(model.get_image_features(**processor(images=rgb, return_tensors="pt")))
        probs = (model.logit_scale.exp() * torch.nn.functional.normalize(image, dim=-1) @ text.T).softmax(-1)[0]
    return round(float(probs[:POSITIVE].sum()), 4)

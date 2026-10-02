"""Farmer guide content (guide.json) and its one page PDF in English or Bangla."""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

from .report import CONTENT_W, MAGENTA, MARGIN, MUTED, _PDF, header


@lru_cache(maxsize=1)
def content() -> dict:
    return json.loads(Path(__file__).with_name("guide.json").read_text(encoding="utf-8"))


def farmer_guide(lang: str = "en") -> bytes:
    lang = "bn" if lang == "bn" else "en"
    g = content()[lang]
    pdf = _PDF(lang)
    pdf.add_page()
    header(pdf, g["title"], report_id=False)

    pdf.use(9.5, color=MUTED)
    y = pdf.para(g["intro"], MARGIN, 36, CONTENT_W, 5) + 4
    col = (CONTENT_W - 8) / 2
    lh = 4.8
    for row in range(0, len(g["sections"]), 2):
        bottoms = []
        for k, sec in enumerate(g["sections"][row:row + 2]):
            x = MARGIN + k * (col + 8)
            pdf.use(11, True, MAGENTA)
            pdf.text_at(x, y, col, 7, pdf.num(f"{row + k + 1}. ") + sec["title"])
            yy = y + 8
            for item in sec["items"]:
                pdf.use(9, True, MAGENTA)
                pdf.text_at(x, yy, 4, lh, "•")
                pdf.use(9)
                yy = pdf.para(item, x + 4, yy, col - 4, lh) + 1.5
            bottoms.append(yy)
        y = max(bottoms) + 5
    return bytes(pdf.output())

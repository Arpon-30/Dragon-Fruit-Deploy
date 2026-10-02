"""One page A4 PDF report in English or Bangla.

Bangla uses the bundled Hind Siliguri font (SIL OFL, fonts/OFL.txt) and needs `uharfbuzz`
for correct letter joining. Lines are wrapped here and drawn one by one, because fpdf2's
own multi_cell wrapping can mis-shape wrapped Bangla lines.
"""

from __future__ import annotations

import base64
import io
import uuid
from datetime import datetime
from pathlib import Path

from fpdf import FPDF

from .analysis import grades

FONT_DIR = Path(__file__).with_name("fonts")
PAGE_W, PAGE_H, MARGIN = 210, 297, 14
CONTENT_W = PAGE_W - 2 * MARGIN

PLUM = (42, 16, 32)
MAGENTA = (194, 24, 91)
LIME = (156, 204, 60)
BLUSH = (252, 228, 238)
INK = (42, 16, 32)
MUTED = (107, 74, 92)
BORDER = (235, 211, 222)

TEXT = {
    "en": {
        "subtitle": "Dragon Fruit Quality Report",
        "prepared": "Prepared for", "farmer": "Farmer", "report_id": "Report ID",
        "grade": "GRADE", "confidence": "AI confidence", "action": "Next step",
        "unsure": "The AI is not fully sure. Take another photo in daylight, with the whole fruit in view.",
        "photo": "Your photo", "heat": "Where the AI looked", "marked": "Likely affected area", "none": "No affected area",
        "heat_note": "Heatmap: red and yellow areas mattered most for the answer.",
        "affected_note": " The outline covers about {pct}% of the photo (AI estimate, not a measurement).",
        "about": "About this grade", "signs": "Signs to check", "todo": "What to do now",
        "scores": "How sure the AI is for each grade",
        "disclaimer": "For guidance only. This report is made by an AI model and can be wrong. "
                      "Ask a local agriculture officer before big decisions.",
        "credit": "DragonKrishok - Designed and developed by Arpon Paul Amit - "
                  "Supervisor: Nuzhat Tabassum, Assistant Professor, AIUB",
    },
    "bn": {
        "subtitle": "ড্রাগন ফলের মান যাচাই রিপোর্ট",
        "prepared": "যার জন্য", "farmer": "কৃষক", "report_id": "রিপোর্ট আইডি",
        "grade": "মান", "confidence": "এআই নিশ্চয়তা", "action": "পরের কাজ",
        "unsure": "এআই পুরোপুরি নিশ্চিত নয়। দিনের আলোয় পুরো ফলটি দেখা যায় এমন আরেকটি ছবি তুলুন।",
        "photo": "আপনার ছবি", "heat": "এআই কোথায় দেখেছে", "marked": "সম্ভাব্য ক্ষতিগ্রস্ত অংশ", "none": "কোনো ক্ষতিগ্রস্ত অংশ নেই",
        "heat_note": "হিটম্যাপ: লাল ও হলুদ অংশ উত্তরের জন্য সবচেয়ে গুরুত্বপূর্ণ ছিল।",
        "affected_note": " দাগ দেওয়া অংশ ছবির প্রায় {pct}% (এআই অনুমান, মাপা নয়)।",
        "about": "এই মান সম্পর্কে", "signs": "যে লক্ষণগুলো দেখবেন", "todo": "এখন কী করবেন",
        "scores": "প্রতিটি মানে এআই কতটা নিশ্চিত",
        "disclaimer": "শুধু পরামর্শের জন্য। এই রিপোর্ট একটি এআই মডেল তৈরি করেছে এবং ভুল হতে পারে। "
                      "বড় সিদ্ধান্তের আগে স্থানীয় কৃষি কর্মকর্তার পরামর্শ নিন।",
        "credit": "ড্রাগন কৃষক - ডিজাইন ও ডেভেলপমেন্ট: অর্পণ পল অমিত - "
                  "তত্ত্বাবধায়ক: নুজহাত তাবাসসুম, সহকারী অধ্যাপক, এআইইউবি",
    },
}
BN_DIGITS = str.maketrans("0123456789", "০১২৩৪৫৬৭৮৯")
BN_MONTHS = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট",
             "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"]


class BanglaPdfUnavailable(RuntimeError):
    """Bangla PDF needs the `uharfbuzz` package."""


def _hex(color: str) -> tuple[int, int, int]:
    return tuple(int(color[i:i + 2], 16) for i in (1, 3, 5))


class _PDF(FPDF):
    def __init__(self, lang: str):
        try:
            import uharfbuzz  # noqa: F401  (fpdf2 needs it to join Bangla letters)
        except ImportError as exc:
            raise BanglaPdfUnavailable("PDF needs the 'uharfbuzz' package: pip install uharfbuzz") from exc
        super().__init__(format="A4")
        self.lang = lang
        self.add_font("Hind", "", str(FONT_DIR / "HindSiliguri-Regular.ttf"))
        self.add_font("Hind", "B", str(FONT_DIR / "HindSiliguri-Bold.ttf"))
        self.set_text_shaping(True)
        self.set_margins(MARGIN, MARGIN, MARGIN)
        self.set_auto_page_break(False)

    def use(self, size: float, bold: bool = False, color=INK):
        self.set_font("Hind", "B" if bold else "", size)
        self.set_text_color(*color)

    def num(self, s) -> str:
        return str(s).translate(BN_DIGITS) if self.lang == "bn" else str(s)

    def text_at(self, x, y, w, h, text, align="L"):
        self.set_xy(x, y)
        self.cell(w, h, text, align=align)

    def para(self, text: str, x: float, y: float, w: float, lh: float, align: str = "L") -> float:
        line = ""
        for word in " ".join(text.split()).split(" "):
            cand = f"{line} {word}".strip()
            if line and self.get_string_width(cand) > w:
                self.text_at(x, y, w, lh, line, align)
                y, line = y + lh, word
            else:
                line = cand
        if line:
            self.text_at(x, y, w, lh, line, align)
            y += lh
        return y

    def footer(self):
        t = TEXT[self.lang]
        self.set_draw_color(*BORDER)
        self.line(MARGIN, PAGE_H - 20, PAGE_W - MARGIN, PAGE_H - 20)
        self.use(7.5, color=MUTED)
        y = self.para(t["disclaimer"], MARGIN, PAGE_H - 18, CONTENT_W, 3.8, "C")
        self.use(7.5, bold=True, color=MAGENTA)
        self.para(t["credit"], MARGIN, y, CONTENT_W, 3.8, "C")


def header(pdf: _PDF, subtitle: str, report_id: bool = True) -> None:
    """Plum band with the brand, subtitle, date and (for reports) a report id."""
    t = TEXT[pdf.lang]
    pdf.set_fill_color(*PLUM)
    pdf.rect(0, 0, PAGE_W, 28, style="F")
    pdf.set_fill_color(*MAGENTA)
    pdf.rect(0, 28, PAGE_W * 0.7, 1.4, style="F")
    pdf.set_fill_color(*LIME)
    pdf.rect(PAGE_W * 0.7, 28, PAGE_W * 0.3, 1.4, style="F")
    pdf.use(20, True, (255, 255, 255))
    pdf.text_at(MARGIN, 6, 110, 10, "DragonKrishok" if pdf.lang == "en" else "ড্রাগন কৃষক")
    pdf.use(10, color=(243, 220, 231))
    pdf.text_at(MARGIN, 16.5, 110, 6, subtitle)
    now = datetime.now()
    date = (pdf.num(f"{now.day} {BN_MONTHS[now.month - 1]} {now.year}") if pdf.lang == "bn"
            else f"{now:%d %B %Y}")
    pdf.use(8.5, color=(243, 220, 231))
    pdf.text_at(PAGE_W - MARGIN - 80, 8, 80, 5, date, "R")
    if report_id:
        pdf.text_at(PAGE_W - MARGIN - 80, 14, 80, 5, f"{t['report_id']}: {uuid.uuid4().hex[:8].upper()}", "R")


def generate_report(result: dict, name: str = "", lang: str = "en") -> bytes:
    """Build the PDF for an analyze() result. lang is 'en' or 'bn'."""
    lang = "bn" if lang == "bn" else "en"

    t, g = TEXT[lang], grades()[result["grade"]]
    info, tone = g[lang], _hex(g["color"])
    pdf = _PDF(lang)
    pdf.add_page()
    header(pdf, t["subtitle"])

    # Prepared for
    pdf.use(9, color=MUTED)
    pdf.text_at(MARGIN, 34, 26, 6, t["prepared"])
    pdf.use(10.5, True)
    pdf.text_at(MARGIN + 26, 34, 140, 6, " ".join(name.split())[:60] or t["farmer"])

    # Grade card
    y, card_h = 44, 28
    pdf.set_fill_color(*BLUSH)
    pdf.set_draw_color(*BORDER)
    pdf.rect(MARGIN, y, CONTENT_W, card_h, style="DF", round_corners=True, corner_radius=3)
    pdf.set_fill_color(*tone)
    pdf.rect(MARGIN, y, 3, card_h, style="F")
    pdf.use(7.8, True, MAGENTA)
    pdf.text_at(MARGIN + 8, y + 3.5, 80, 4.5, t["grade"])
    pdf.use(19, True, tone)
    pdf.text_at(MARGIN + 8, y + 8.5, 110, 10, info["name"])
    pdf.use(9, color=MUTED)
    pdf.text_at(MARGIN + 8, y + 19.5, 120, 5, info["summary"])
    rx = PAGE_W - MARGIN - 62
    pdf.use(20, True)
    pdf.text_at(rx, y + 3.5, 56, 9, pdf.num(f"{result['confidence'] * 100:.1f}%"), "R")
    pdf.use(8, color=MUTED)
    pdf.text_at(rx, y + 12.5, 56, 4.5, t["confidence"], "R")
    pdf.use(9, True, tone)
    pdf.text_at(rx, y + 19, 56, 5, f"{t['action']}: {info['action']}", "R")
    y += card_h + 3
    if result["confidence"] < 0.7:
        pdf.use(8.5, color=MAGENTA)
        y = pdf.para(t["unsure"], MARGIN, y, CONTENT_W, 4.4) + 1

    # Images
    y += 2
    gap = 5
    w = (CONTENT_W - 2 * gap) / 3
    marked = result.get("marked")
    panels = [(result["photo"], t["photo"]), (result["heatmap"], t["heat"]),
              (marked or result["photo"], t["marked"] if marked else t["none"])]
    for i, (b64, caption) in enumerate(panels):
        x = MARGIN + i * (w + gap)
        pdf.image(io.BytesIO(base64.b64decode(b64)), x=x, y=y, w=w, h=w)
        pdf.set_draw_color(*BORDER)
        pdf.rect(x, y, w, w)
        pdf.use(8.5, True, MUTED)
        pdf.text_at(x, y + w + 1.5, w, 5, caption, "C")
    y += w + 7.5
    note = t["heat_note"]
    if result.get("affected_percent") is not None and marked:
        note += t["affected_note"].format(pct=pdf.num(f"{result['affected_percent']:.0f}"))
    pdf.use(7.8, color=MUTED)
    y = pdf.para(note, MARGIN, y, CONTENT_W, 4) + 3

    # About
    lh = 4.6
    pdf.use(10.5, True, MAGENTA)
    pdf.text_at(MARGIN, y, CONTENT_W, 6, t["about"])
    pdf.use(8.8)
    y = pdf.para(info["description"], MARGIN, y + 7, CONTENT_W, lh) + 3

    # Signs and actions, two columns
    col = (CONTENT_W - 8) / 2
    tops = []
    for k, (title, items, numbered) in enumerate(((t["signs"], info["signs"], False), (t["todo"], info["actions"], True))):
        x, yy = MARGIN + k * (col + 8), y
        pdf.use(10.5, True, MAGENTA)
        pdf.text_at(x, yy, col, 6, title)
        yy += 7
        for n, item in enumerate(items, 1):
            pdf.use(8.8, True, (78, 125, 30) if numbered else MAGENTA)
            pdf.text_at(x, yy, 5, lh, pdf.num(f"{n}.") if numbered else "•")
            pdf.use(8.8)
            yy = pdf.para(item, x + 5, yy, col - 5, lh) + 1
        tops.append(yy)
    y = max(tops) + 3

    # Score bars
    pdf.use(10.5, True, MAGENTA)
    pdf.text_at(MARGIN, y, CONTENT_W, 6, t["scores"])
    y += 7
    names = {k: v[lang]["name"] for k, v in grades().items()}
    bar_w = CONTENT_W - 40 - 18
    for i, s in enumerate(result["scores"]):
        yy = y + i * 6
        pdf.use(8.5, i == 0)
        pdf.text_at(MARGIN, yy, 40, 4.6, names[s["grade"]])
        pdf.set_fill_color(*BLUSH)
        pdf.rect(MARGIN + 40, yy + 1, bar_w, 2.6, style="F", round_corners=True, corner_radius=1.3)
        fill = max(0.8, bar_w * s["score"])
        pdf.set_fill_color(*(_hex(grades()[s["grade"]]["color"])))
        pdf.rect(MARGIN + 40, yy + 1, fill, 2.6, style="F", round_corners=fill > 2.6, corner_radius=1.3)
        pdf.text_at(MARGIN + 40 + bar_w, yy, 18, 4.6, pdf.num(f"{s['score'] * 100:.1f}%"), "R")

    return bytes(pdf.output())

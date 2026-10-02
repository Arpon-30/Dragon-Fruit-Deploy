import { Bar, CountUp, Item, Ring, Stagger } from "@animations";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { useLang } from "../i18n/index.jsx";
import { downloadReport } from "../lib/api.js";
import { savePhoto } from "../lib/image.js";
import Icon from "./Icon.jsx";

const img = (b64) => `data:image/jpeg;base64,${b64}`;

/** Photo underneath, heatmap or marked area on top; the slider reveals one over the other. */
function Compare({ photo, overlay, label, hint }) {
  const [pos, setPos] = useState(55);
  return (
    <div className="compare">
      <img src={img(photo)} alt="" />
      <AnimatePresence mode="wait">
        <motion.img key={overlay.slice(-32)} src={img(overlay)} alt={label} className="compare__top"
          style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }} />
      </AnimatePresence>
      <div className="compare__handle" style={{ left: `${pos}%` }} aria-hidden="true"><span /></div>
      <input type="range" min="0" max="100" value={pos} onChange={(e) => setPos(+e.target.value)} aria-label={hint} />
    </div>
  );
}

export default function Result({ data, photo, grades, onReset }) {
  const { t, lang, num, fill } = useLang();
  const [view, setView] = useState("heatmap");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(false);
  const g = grades[data.grade];
  const info = g[lang];
  const marked = view === "area" && data.marked;

  const pdf = async (l) => {
    setBusy(l);
    setError(false);
    try {
      await downloadReport(photo.blob, name, l);
    } catch {
      setError(true);
    }
    setBusy(null);
  };

  return (
    <div className="result tone" style={{ "--tone": g.color }}>
      <div className="result__visual">
        {data.marked && (
          <div className="seg" role="group">
            {["heatmap", "area"].map((v) => (
              <button key={v} type="button" aria-pressed={view === v} onClick={() => setView(v)}>{t.result.views[v]}</button>
            ))}
          </div>
        )}
        <Compare photo={data.photo} overlay={marked ? data.marked : data.heatmap}
          label={t.result.views[marked ? "area" : "heatmap"]} hint={t.result.compare} />
        <p className="muted small">{t.result.compare}. {t.result.heatNote}</p>
        <p className="small">
          {data.marked ? fill(t.result.affected, { pct: num(Math.round(data.affected_percent)) }) : t.result.noArea}
        </p>
      </div>

      <Stagger className="result__info" gap={0.08}>
        <Item className="result__top">
          <Ring value={data.confidence} color="var(--tone-ui)">
            <strong className="ring__num"><CountUp value={data.confidence * 100} format={(n) => `${num(Math.round(n))}%`} /></strong>
            <span className="small muted">{t.result.confidence}</span>
          </Ring>
          <div>
            <p className="kicker">{t.result.title}</p>
            <h3 className="result__grade">{info.name}</h3>
            <p>{info.summary}</p>
            <p className="chip" style={{ background: g.color }}>{t.result.next}: {info.action}</p>
          </div>
        </Item>

        {data.confidence < 0.7 && <Item as="p" className="alert alert--soft"><Icon name="alert" /> {t.result.unsure}</Item>}

        <Item className="scores">
          <h4>{t.result.scores}</h4>
          {data.scores.map((s, i) => (
            <div key={s.grade} className="scores__row tone" style={{ "--tone": grades[s.grade].color }}>
              <span>{grades[s.grade][lang].name}</span>
              <Bar value={s.score} color="var(--tone-ui)" delay={0.2 + i * 0.1} />
              <span className="scores__pct">{num((s.score * 100).toFixed(1))}%</span>
            </div>
          ))}
        </Item>

        <Item className="advice">
          <div>
            <h4>{t.result.signs}</h4>
            <ul>{info.signs.map((x) => <li key={x}>{x}</li>)}</ul>
          </div>
          <div>
            <h4>{t.result.actions}</h4>
            <ol>{info.actions.map((x) => <li key={x}>{x}</li>)}</ol>
          </div>
        </Item>

        <Item className="report">
          <h4>{t.result.report}</h4>
          <label className="field">
            <span>{t.result.name}</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t.result.namePlaceholder}
              maxLength={60} autoComplete="name" />
          </label>
          <div className="report__buttons">
            {[["en", t.result.pdfEn], ["bn", t.result.pdfBn]].map(([l, label]) => (
              <button key={l} type="button" className="btn btn--primary" onClick={() => pdf(l)} disabled={!!busy}>
                {busy === l ? <span className="spinner" /> : <Icon name="download" />} {label}
              </button>
            ))}
          </div>
          {error && <p className="alert" role="alert"><Icon name="alert" /> {t.errors.pdf}</p>}
          <div className="report__buttons">
            <button type="button" className="btn btn--ghost" onClick={() => savePhoto(photo.blob)}>
              <Icon name="save" /> {t.preview.save}
            </button>
            <button type="button" className="btn btn--ghost" onClick={onReset}>
              <Icon name="scan" /> {t.result.again}
            </button>
          </div>
        </Item>
      </Stagger>
    </div>
  );
}

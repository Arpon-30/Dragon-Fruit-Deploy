import { Item, Reveal, Stagger } from "@animations";
import { useState } from "react";
import { useLang } from "../i18n/index.jsx";
import { DragonFruit } from "./DragonFruit.jsx";

const ORDER = ["Mature", "Immature", "Defect", "Bad"];

function Card({ grade, g }) {
  const { t, lang } = useLang();
  const [flipped, setFlipped] = useState(false);
  const info = g[lang];
  return (
    <Item className={`flip ${flipped ? "is-flipped" : ""}`} style={{ "--tone": g.color }}>
      <div className="flip__inner">
        <div className="flip__face flip__front" aria-hidden={flipped}>
          <DragonFruit grade={grade} size={120} />
          <h3>{info.name}</h3>
          <p>{info.summary}</p>
          <span className="chip" style={{ background: g.color }}>{info.action}</span>
        </div>
        <div className="flip__face flip__back" aria-hidden={!flipped}>
          <h3>{info.name}</h3>
          <ul>{info.signs.map((s) => <li key={s}>{s}</li>)}</ul>
          <p><strong>{info.actions[0]}</strong></p>
        </div>
      </div>
      <button type="button" className="flip__btn" aria-pressed={flipped} onClick={() => setFlipped((f) => !f)}>
        <span className="visually-hidden">{info.name}: </span>{t.grades.flip}
      </button>
    </Item>
  );
}

export default function Grades({ grades }) {
  const { t } = useLang();
  return (
    <section className="section section--tint" id="grades">
      <div className="container">
        <Reveal className="section__head">
          <h2>{t.grades.title}</h2>
          <p>{t.grades.sub}</p>
        </Reveal>
        <Stagger className="grid grid--4">
          {grades && ORDER.map((k) => <Card key={k} grade={k} g={grades[k]} />)}
        </Stagger>
      </div>
    </section>
  );
}

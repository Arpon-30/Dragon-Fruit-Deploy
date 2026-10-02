// Loaded lazily: the map shapes (src/data/maps.json) are the largest data on the page.
import { Reveal } from "@animations";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import MAPS from "../data/maps.json";
import { COUNTRIES, DISTRICTS } from "../data/places.js";
import { useLang } from "../i18n/index.jsx";

const draw = { hidden: { pathLength: 0, opacity: 0 }, show: { pathLength: 1, opacity: 1, transition: { duration: 1.8, ease: "easeInOut" } } };

function Note({ place }) {
  const { lang } = useLang();
  return (
    <AnimatePresence mode="wait">
      <motion.div key={place?.[lang] ?? "none"} className="map__note" aria-live="polite"
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
        {place && <><strong>{place[lang]}</strong><span>{place.note[lang]}</span></>}
      </motion.div>
    </AnimatePresence>
  );
}

function Bangladesh() {
  const { t, lang } = useLang();
  const [pick, setPick] = useState(DISTRICTS[0]);
  const { w, h, outline, points } = MAPS.bd;
  return (
    <Reveal className="card map">
      <h3>{t.map.bd}</h3>
      <div className="map__canvas" style={{ aspectRatio: `${w} / ${h}` }}>
        <motion.svg viewBox={`0 0 ${w} ${h}`} initial="hidden" whileInView="show" viewport={{ once: true }} aria-hidden="true">
          <motion.path d={outline} className="map__bd" variants={draw} />
        </motion.svg>
        {DISTRICTS.map((d, i) => {
          const [x, y] = points[d.id];
          return (
            <motion.button key={d.id} type="button" className={`map__pin map__pin--${d.role}`}
              style={{ left: `${(x / w) * 100}%`, top: `${(y / h) * 100}%` }} aria-pressed={pick.id === d.id}
              onClick={() => setPick(d)} aria-label={d[lang]} tabIndex={-1}
              initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }}
              transition={{ delay: 1 + i * 0.12, type: "spring", stiffness: 300, damping: 15 }}>
              {d.role === "hub" && <span className="anim-pulse" />}
              <i />
              {pick.id === d.id && <em>{d[lang]}</em>}
            </motion.button>
          );
        })}
      </div>
      <div className="map__chips" role="group" aria-label={t.map.tap}>
        {DISTRICTS.map((d) => (
          <button key={d.id} type="button" className="chip-btn" aria-pressed={pick.id === d.id} onClick={() => setPick(d)}>
            {d[lang]}
          </button>
        ))}
      </div>
      <ul className="map__legend">
        {Object.entries(t.map.legend).map(([k, label]) => <li key={k}><span className={`map__key map__key--${k}`} />{label}</li>)}
      </ul>
      <Note place={pick} />
    </Reveal>
  );
}

function World() {
  const { t, lang } = useLang();
  const [pick, setPick] = useState(COUNTRIES.find((c) => c.name === "Vietnam"));
  const { w, h, land, growers } = MAPS.world;
  return (
    <Reveal className="card map" delay={0.1}>
      <h3>{t.map.world}</h3>
      <div className="map__canvas" style={{ aspectRatio: `${w} / ${h}` }}>
        <motion.svg viewBox={`0 0 ${w} ${h}`} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }}
          variants={{ show: { transition: { staggerChildren: 0.08, delayChildren: 0.3 } } }} aria-hidden="true">
          <path d={land} className="map__land" />
          {COUNTRIES.map((c) => (
            <motion.path key={c.name} d={growers[c.name]}
              className={`map__grower ${pick.name === c.name ? "is-picked" : ""}`}
              variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }} />
          ))}
        </motion.svg>
      </div>
      <div className="map__chips" role="group" aria-label={t.map.tap}>
        {COUNTRIES.map((c) => (
          <button key={c.name} type="button" className="chip-btn" aria-pressed={pick.name === c.name} onClick={() => setPick(c)}>
            {c[lang]}
          </button>
        ))}
      </div>
      <Note place={pick} />
    </Reveal>
  );
}

export default function Maps() {
  const { t } = useLang();
  return (
    <div className="grid grid--maps">
      <Bangladesh />
      <World />
      <p className="muted small map__tap">{t.map.tap}</p>
    </div>
  );
}

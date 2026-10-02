import { Reveal } from "@animations";
import { motion, useScroll, useSpring } from "framer-motion";
import { useRef } from "react";
import { HISTORY } from "../data/history.js";
import { useLang } from "../i18n/index.jsx";

export default function History() {
  const { t, lang } = useLang();
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 75%", "end 60%"] });
  const grow = useSpring(scrollYProgress, { stiffness: 90, damping: 22 });

  return (
    <section className="section" id="history">
      <div className="container">
        <Reveal className="section__head">
          <h2>{t.history.title}</h2>
          <p>{t.history.sub}</p>
        </Reveal>
        <ol className="timeline" ref={ref}>
          <motion.span className="timeline__line" style={{ scaleY: grow }} aria-hidden="true" />
          {HISTORY.map((h, i) => (
            <motion.li key={h.when.en} className={`timeline__item ${i % 2 ? "is-right" : ""}`}
              initial={{ opacity: 0, x: i % 2 ? 40 : -40 }} whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.4 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
              <span className="timeline__dot" aria-hidden="true" />
              <div className="card timeline__card">
                <p className="kicker">{h.when[lang]}</p>
                <h3>{h.title[lang]}</h3>
                <p>{h.text[lang]}</p>
              </div>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}

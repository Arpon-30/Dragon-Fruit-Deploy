import { Float, Item, ScanLine, Seeds, Stagger, pop } from "@animations";
import { motion } from "framer-motion";
import { useLang } from "../i18n/index.jsx";
import { DragonFruit, DragonFruitHalf } from "./DragonFruit.jsx";
import Icon from "./Icon.jsx";

export default function Hero({ onStart }) {
  const { t } = useLang();
  return (
    <section className="hero" id="top">
      <Seeds />
      <div className="container hero__grid">
        <Stagger className="hero__copy">
          <Item as="p" className="kicker">{t.hero.kicker}</Item>
          <Item as="h1">{t.hero.title}</Item>
          <Item as="p" className="hero__text">{t.hero.text}</Item>
          <Item className="hero__actions">
            <a className="btn btn--primary" href="#scan" onClick={() => onStart("live")}>
              <Icon name="video" /> {t.hero.live}
            </a>
            <a className="btn btn--ghost" href="#scan" onClick={() => onStart("upload")}>
              <Icon name="upload" /> {t.hero.upload}
            </a>
          </Item>
          <Item as="ul" className="hero__facts">
            {t.hero.facts.map((f) => <li key={f}><Icon name="check" size={16} /> {f}</li>)}
          </Item>
        </Stagger>

        <div className="hero__art" aria-hidden="true">
          <motion.div className="hero__blob" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }} />
          <Float className="hero__fruit">
            <div className="hero__scan">
              <DragonFruit grade="Mature" size={260} />
              <ScanLine />
            </div>
          </Float>
          <Float className="hero__half" delay={-2.5}>
            <DragonFruitHalf size={150} />
          </Float>
          <motion.div className="hero__chip" variants={pop} initial="hidden" animate="show" transition={{ delay: 0.9 }}>
            <span className="dot dot--mature" /> {t.hero.chip}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

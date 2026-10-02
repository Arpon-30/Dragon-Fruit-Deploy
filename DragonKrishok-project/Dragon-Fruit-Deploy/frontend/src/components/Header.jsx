import { AnimatePresence, motion, useScroll, useSpring } from "framer-motion";
import { useState } from "react";
import { useLang } from "../i18n/index.jsx";
import { useTheme } from "../lib/theme.js";
import Icon from "./Icon.jsx";
import Logo from "./Logo.jsx";

const LINKS = ["scan", "grades", "history", "map", "farmer", "dev"];

export default function Header() {
  const { t, toggle: toggleLang } = useLang();
  const [theme, toggleTheme] = useTheme();
  const [open, setOpen] = useState(false);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 24 });

  const nav = LINKS.map((id) => (
    <a key={id} href={`#${id}`} onClick={() => setOpen(false)}>{t.nav[id]}</a>
  ));

  return (
    <header className="header">
      <motion.div className="header__progress" style={{ scaleX: progress }} aria-hidden="true" />
      <div className="header__bar container">
        <a href="#top" className="brand" aria-label={t.brand}>
          <Logo />
          <span>{t.brand}</span>
        </a>
        <nav className="header__nav" aria-label="Main">{nav}</nav>
        <div className="header__tools">
          <button type="button" className="pill pill--lang" onClick={toggleLang} aria-label={t.langLabel}>
            <Icon name="globe" size={18} />
            <span lang={t.langSwitch === "English" ? "en" : "bn"}>{t.langSwitch}</span>
          </button>
          <button type="button" className="icon-btn" onClick={toggleTheme}
            aria-label={theme === "dark" ? t.theme.light : t.theme.dark}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.span key={theme} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.25 }} style={{ display: "flex" }}>
                <Icon name={theme === "dark" ? "sun" : "moon"} />
              </motion.span>
            </AnimatePresence>
          </button>
          <button type="button" className="icon-btn header__menu" onClick={() => setOpen((o) => !o)}
            aria-expanded={open} aria-controls="mobile-nav" aria-label={t.menu}>
            <Icon name={open ? "close" : "menu"} />
          </button>
        </div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.nav id="mobile-nav" className="header__mobile" aria-label="Main"
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
            {nav}
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}

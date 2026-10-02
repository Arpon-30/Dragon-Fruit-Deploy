import { Reveal } from "@animations";
import { SOURCES } from "../data/sources.js";
import { useLang } from "../i18n/index.jsx";
import Logo from "./Logo.jsx";

export default function Footer() {
  const { t, fill, num } = useLang();
  return (
    <footer className="footer">
      <div className="container">
        <Reveal className="footer__grid">
          <div>
            <p className="brand"><Logo /> <span>{t.brand}</span></p>
            <p className="footer__about">{t.footer.about}</p>
          </div>
          <div className="footer__credits">
            <p><span>{t.footer.made}</span><strong>{t.footer.maker}</strong></p>
            <p><span>{t.footer.supervisor}</span><strong>{t.footer.supervisorName}</strong></p>
          </div>
          <details className="footer__sources">
            <summary>{t.footer.sources}</summary>
            <ul>{SOURCES.map((s) => <li key={s.url}><a href={s.url} target="_blank" rel="noreferrer">{s.label}</a></li>)}</ul>
          </details>
        </Reveal>
        <div className="footer__bottom">
          <p>{fill(t.footer.rights, { year: num(new Date().getFullYear()) })}</p>
          <p>{t.footer.disclaimer}</p>
        </div>
      </div>
    </footer>
  );
}

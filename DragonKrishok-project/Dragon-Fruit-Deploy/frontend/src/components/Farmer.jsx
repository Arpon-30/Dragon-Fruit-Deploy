import { Item, Reveal, Stagger } from "@animations";
import { useEffect, useState } from "react";
import { useLang } from "../i18n/index.jsx";
import Icon from "./Icon.jsx";

const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
const standalone = () => window.matchMedia?.("(display-mode: standalone)").matches;

/** The browser's install prompt, when it offers one. */
function useInstall() {
  const [prompt, setPrompt] = useState(null);
  const [installed, setInstalled] = useState(standalone);
  useEffect(() => {
    const ready = (e) => { e.preventDefault(); setPrompt(e); };
    const done = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", ready);
    window.addEventListener("appinstalled", done);
    return () => {
      window.removeEventListener("beforeinstallprompt", ready);
      window.removeEventListener("appinstalled", done);
    };
  }, []);
  const install = async () => {
    prompt.prompt();
    if ((await prompt.userChoice).outcome === "accepted") setInstalled(true);
    setPrompt(null);
  };
  return { canInstall: !!prompt, installed, install };
}

export default function Farmer({ guide }) {
  const { t, lang, num } = useLang();
  const { canInstall, installed, install } = useInstall();
  const g = guide?.[lang];

  return (
    <section className="section section--tint" id="farmer">
      <div className="container">
        <Reveal className="section__head">
          <h2>{t.farmer.title}</h2>
          <p>{t.farmer.sub}</p>
        </Reveal>
        {g && (
          <>
            <Reveal as="p" className="farmer__intro">{g.intro}</Reveal>
            <Stagger className="grid grid--3">
              {g.sections.map((s, i) => (
                <Item key={s.id} className="card step">
                  <span className="step__num">{num(i + 1)}</span>
                  <h3>{s.title}</h3>
                  <ul>{s.items.map((x) => <li key={x}>{x}</li>)}</ul>
                </Item>
              ))}
            </Stagger>
          </>
        )}
        <Reveal className="farmer__cta card">
          <div>
            <h3>{t.farmer.install}</h3>
            <p className="muted">{ios && !installed ? t.farmer.iosHint : t.farmer.installHint}</p>
          </div>
          <div className="report__buttons">
            <a className="btn btn--primary" href={`/api/guide.pdf?lang=${lang}`} download>
              <Icon name="download" /> {t.farmer.download}
            </a>
            {installed ? (
              <span className="btn btn--ghost is-static"><Icon name="check" /> {t.farmer.installed}</span>
            ) : canInstall && (
              <button type="button" className="btn btn--ghost" onClick={install}><Icon name="install" /> {t.farmer.install}</button>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

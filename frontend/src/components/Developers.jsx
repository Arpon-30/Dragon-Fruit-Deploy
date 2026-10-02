import { Reveal, swap } from "@animations";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { useLang } from "../i18n/index.jsx";
import Icon from "./Icon.jsx";

// On Streamlit there is no public REST API, so the samples point at a local Docker or run.py server
const host = window.DK_BRIDGE ? "http://localhost:7860" : location.origin;
const SAMPLES = {
  cURL: `curl -F "image=@fruit.jpg" ${host}/api/analyze

# PDF report in Bangla
curl -F "image=@fruit.jpg" -F "name=Rahim" -F "lang=bn" \\
     ${host}/api/report -o report.pdf`,
  Python: `import requests

with open("fruit.jpg", "rb") as f:
    r = requests.post("${host}/api/analyze", files={"image": f})
r.raise_for_status()
result = r.json()
print(result["grade"], result["confidence"])`,
  JavaScript: `const form = new FormData();
form.append("image", fileInput.files[0]);

const res = await fetch("${host}/api/analyze", { method: "POST", body: form });
const { grade, confidence, heatmap } = await res.json();
console.log(grade, confidence);`,
};

export default function Developers() {
  const { t } = useLang();
  const [lang, setLang] = useState("cURL");
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(SAMPLES[lang]);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked: the code is still selectable */
    }
  };
  return (
    <section className="section" id="dev">
      <div className="container">
        <Reveal className="section__head">
          <h2>{t.dev.title}</h2>
          <p>{window.DK_BRIDGE ? t.dev.bridge : t.dev.sub}</p>
        </Reveal>
        <Reveal className="code card">
          <div className="code__bar">
            <div className="seg" role="group">
              {Object.keys(SAMPLES).map((k) => (
                <button key={k} type="button" aria-pressed={lang === k} onClick={() => setLang(k)}>{k}</button>
              ))}
            </div>
            <button type="button" className="btn btn--ghost btn--sm" onClick={copy}>
              <Icon name={copied ? "check" : "copy"} size={16} /> {copied ? t.dev.copied : t.dev.copy}
            </button>
          </div>
          <AnimatePresence mode="wait">
            <motion.pre key={lang} {...swap} translate="no"><code>{SAMPLES[lang]}</code></motion.pre>
          </AnimatePresence>
        </Reveal>
      </div>
    </section>
  );
}

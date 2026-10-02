import { Reveal, ScanLine, swap } from "@animations";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useLang } from "../i18n/index.jsx";
import { analyze } from "../lib/api.js";
import { savePhoto, shrinkFile } from "../lib/image.js";
import Icon from "./Icon.jsx";
import LiveCamera from "./LiveCamera.jsx";
import Result from "./Result.jsx";

const TABS = [["live", "video"], ["photo", "camera"], ["upload", "image"]];

export default function Scan({ tab, setTab, grades }) {
  const { t } = useLang();
  const [photo, setPhoto] = useState(null); // { blob, url, fromCamera }
  const [stage, setStage] = useState("pick"); // pick | preview | busy | result
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const cameraInput = useRef(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => () => photo && URL.revokeObjectURL(photo.url), [photo]);

  const reset = () => {
    setPhoto(null);
    setResult(null);
    setError(null);
    setStage("pick");
  };

  const choose = async (file, fromCamera = false) => {
    if (!file) return;
    setError(null);
    if (file.size > 10 * 1024 * 1024) return setError("tooBig");
    const blob = await shrinkFile(file);
    setPhoto({ blob, url: URL.createObjectURL(blob), fromCamera });
    setStage("preview");
  };

  const run = async (blob = photo.blob) => {
    setStage("busy");
    setError(null);
    try {
      setResult(await analyze(blob));
      setStage("result");
    } catch (e) {
      setError(e.code || "network");
      setStage("preview");
    }
  };

  const captured = (blob) => {
    setPhoto({ blob, url: URL.createObjectURL(blob), fromCamera: true });
    run(blob);
  };

  return (
    <section className="section" id="scan">
      <div className="container">
        <Reveal className="section__head">
          <h2>{t.scan.title}</h2>
          <p>{t.scan.sub}</p>
        </Reveal>

        <Reveal className="scan card" delay={0.1}>
          {stage !== "result" && (
            <div className="tabs" role="tablist" aria-label={t.scan.title}>
              {TABS.map(([id, icon]) => (
                <button key={id} type="button" role="tab" aria-selected={tab === id} className="tabs__tab"
                  onClick={() => { setTab(id); reset(); }}>
                  {tab === id && <motion.span layoutId="tab-pill" className="tabs__pill" />}
                  <span className="tabs__label"><Icon name={icon} size={18} /> {t.scan.tabs[id]}</span>
                </button>
              ))}
            </div>
          )}

          <AnimatePresence mode="wait">
            {stage === "pick" && (
              <motion.div key={`pick-${tab}`} {...swap} className="scan__body" role="tabpanel">
                {tab === "live" && <LiveCamera grades={grades} onCapture={captured} />}
                {tab === "photo" && (
                  <div className="dropzone">
                    <Icon name="camera" size={44} />
                    <button type="button" className="btn btn--primary" onClick={() => cameraInput.current.click()}>
                      <Icon name="camera" /> {t.photo.take}
                    </button>
                    <p className="muted">{t.photo.hint}</p>
                    <input ref={cameraInput} type="file" accept="image/*" capture="environment" hidden
                      onChange={(e) => choose(e.target.files[0], true)} />
                  </div>
                )}
                {tab === "upload" && (
                  <label className={`dropzone dropzone--drop ${dragging ? "is-over" : ""}`}
                    onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={(e) => { e.preventDefault(); setDragging(false); choose(e.dataTransfer.files[0]); }}>
                    <Icon name="upload" size={44} />
                    <strong>{t.upload.drop}</strong>
                    <span className="muted">{t.upload.types}</span>
                    <input type="file" accept="image/*" className="visually-hidden"
                      onChange={(e) => choose(e.target.files[0])} />
                  </label>
                )}
                <p className="scan__tips muted">{t.scan.tips}</p>
              </motion.div>
            )}

            {(stage === "preview" || stage === "busy") && photo && (
              <motion.div key="preview" {...swap} className="preview">
                <div className="preview__img">
                  <img src={photo.url} alt="" />
                  <ScanLine active={stage === "busy"} />
                </div>
                <div className="preview__actions">
                  {stage === "busy" ? (
                    <p className="busy" role="status"><span className="spinner" /> {t.analysing}</p>
                  ) : (
                    <>
                      <button type="button" className="btn btn--primary" onClick={() => run()}>
                        <Icon name="scan" /> {t.preview.analyse}
                      </button>
                      {photo.fromCamera && (
                        <button type="button" className="btn btn--ghost" onClick={() => savePhoto(photo.blob)}>
                          <Icon name="save" /> {t.preview.save}
                        </button>
                      )}
                      <button type="button" className="btn btn--ghost" onClick={reset}>{t.preview.change}</button>
                    </>
                  )}
                </div>
              </motion.div>
            )}

            {stage === "result" && result && grades && (
              <motion.div key="result" {...swap}>
                <Result data={result} photo={photo} grades={grades} onReset={reset} />
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {error && (
              <motion.p className="alert" role="alert" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}>
                <Icon name="alert" /> {t.errors[error]}
              </motion.p>
            )}
          </AnimatePresence>
        </Reveal>
      </div>
    </section>
  );
}

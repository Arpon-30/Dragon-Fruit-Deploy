import { ScanLine } from "@animations";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLang } from "../i18n/index.jsx";
import { openLive } from "../lib/api.js";
import { grabFrame } from "../lib/image.js";
import Icon from "./Icon.jsx";

const FRAME_PX = 320;   // live frames are small; the full photo is taken on Capture
const GAP_MS = 120;     // pause between frames, roughly 4 to 6 answers per second

export default function LiveCamera({ grades, onCapture }) {
  const { t, lang, num } = useLang();
  const video = useRef(null);
  const stream = useRef(null);
  const live = useRef(null);
  const timer = useRef(null);
  const [status, setStatus] = useState("idle"); // idle | starting | running | denied | unsupported
  const [conn, setConn] = useState("connecting");
  const [facing, setFacing] = useState("environment");
  const [answer, setAnswer] = useState(null);

  const stop = useCallback(() => {
    clearTimeout(timer.current);
    live.current?.close();
    live.current = null;
    stream.current?.getTracks().forEach((tr) => tr.stop());
    stream.current = null;
    setAnswer(null);
    setStatus("idle");
  }, []);

  const sendFrame = useCallback(async () => {
    const v = video.current;
    if (!live.current) return; // stopped
    if (!v?.videoWidth) {
      timer.current = setTimeout(sendFrame, GAP_MS);
      return;
    }
    live.current.send(await grabFrame(v, FRAME_PX, 0.7));
  }, []);

  const start = useCallback(async (mode = facing) => {
    if (!navigator.mediaDevices?.getUserMedia) return setStatus("unsupported");
    setStatus("starting");
    try {
      stream.current?.getTracks().forEach((tr) => tr.stop());
      stream.current = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 960 } }, audio: false,
      });
      video.current.srcObject = stream.current;
      await video.current.play();
      setStatus("running");
      if (!live.current) {
        live.current = openLive((msg) => {
          if (!msg.error) setAnswer(msg);
          timer.current = setTimeout(sendFrame, GAP_MS);
        }, (state) => {
          setConn(state);
          if (state === "open") {
            clearTimeout(timer.current); // one frame loop, even after a reconnect
            sendFrame();
          }
        });
      }
    } catch (e) {
      stop();
      setStatus(e.name === "NotAllowedError" ? "denied" : "unsupported");
    }
  }, [facing, sendFrame, stop]);

  useEffect(() => stop, [stop]);

  const flip = () => {
    const next = facing === "environment" ? "user" : "environment";
    setFacing(next);
    start(next);
  };

  const capture = async () => {
    const blob = await grabFrame(video.current, 1280, 0.92);
    stop();
    onCapture(blob);
  };

  const info = answer?.is_dragon_fruit && grades?.[answer.grade];
  const running = status === "running";

  return (
    <div className="live">
      <div className={`live__view ${running ? "is-on" : ""}`}>
        <video ref={video} playsInline muted aria-label={t.scan.tabs.live} />
        {!running && (
          <div className="live__placeholder">
            <Icon name="video" size={44} />
            {status === "denied" && <p role="alert">{t.live.denied}</p>}
            {status === "unsupported" && <p role="alert">{t.live.unsupported}</p>}
          </div>
        )}
        {running && (
          <>
            <div className="live__frame" aria-hidden="true"><i /><i /><i /><i /></div>
            <ScanLine />
            <div className="live__label" aria-live="polite">
              <AnimatePresence mode="wait">
                <motion.span key={info ? answer.grade : conn === "open" ? "none" : conn}
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="chip" style={info ? { background: grades[answer.grade].color } : undefined}>
                  {info
                    ? `${info[lang].name} · ${num(Math.round(answer.confidence * 100))}%`
                    : conn === "open" ? (answer ? t.live.notFruit : t.live.hint)
                    : conn === "offline" ? t.live.offline : t.live.connecting}
                </motion.span>
              </AnimatePresence>
            </div>
          </>
        )}
      </div>
      <div className="live__controls">
        {running ? (
          <>
            <button type="button" className="btn btn--primary" onClick={capture}><Icon name="camera" /> {t.live.capture}</button>
            <button type="button" className="btn btn--ghost" onClick={flip}><Icon name="flip" /> {t.live.flip}</button>
            <button type="button" className="btn btn--ghost" onClick={stop}><Icon name="stop" /> {t.live.stop}</button>
          </>
        ) : (
          <button type="button" className="btn btn--primary" onClick={() => start()} disabled={status === "starting"}>
            <Icon name="video" /> {t.live.start}
          </button>
        )}
      </div>
    </div>
  );
}

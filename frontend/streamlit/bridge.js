/* DragonKrishok Streamlit bridge (loaded only by streamlit_app.py).
   The built website runs unchanged inside a Streamlit component. Its fetch("/api/...")
   calls are passed to Python through Streamlit, which answers them with the same
   FastAPI app in memory. WebSockets are not available, so window.DK_BRIDGE switches
   live mode to plain requests (see src/lib/api.js). */
(() => {
  "use strict";
  window.DK_BRIDGE = true;

  const post = (type, extra) => window.parent.postMessage({ isStreamlitMessage: true, type, ...extra }, "*");

  // Streamlit creates the component frame with scrolling="no"; let the page scroll.
  try {
    const frame = window.frameElement;
    if (frame) {
      const allow = () => frame.getAttribute("scrolling") === "no" && frame.removeAttribute("scrolling");
      allow();
      new MutationObserver(allow).observe(frame, { attributes: true, attributeFilter: ["scrolling"] });
    }
  } catch {
    /* frame not reachable */
  }

  // One request at a time: Streamlit keeps only the latest component value.
  const queue = [];
  let current = null;
  let ready = false;
  let seq = 0;

  function pump() {
    if (!ready || current || !queue.length) return;
    current = queue.shift();
    current.timer = setTimeout(() => finish(null, new TypeError("Streamlit did not answer")), 300000);
    post("streamlit:setComponentValue", { value: current.req, dataType: "json" });
  }

  function finish(response, error) {
    const done = current;
    current = null;
    clearTimeout(done.timer);
    error ? done.reject(error) : done.resolve(response);
    pump();
  }

  window.addEventListener("message", (event) => {
    if (event.data?.type !== "streamlit:render") return;
    ready = true;
    const response = event.data.args?.response;
    if (current && response?.id === current.req.id) finish(response);
    else pump();
  });

  const call = (req) =>
    new Promise((resolve, reject) => {
      req.id = `${Date.now().toString(36)}-${++seq}`;
      queue.push({ req, resolve, reject });
      pump();
    });

  const toBase64 = (blob) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(",", 2)[1] || "");
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });

  async function encode(body) {
    const fields = {};
    const files = {};
    if (body instanceof FormData) {
      for (const [key, value] of body.entries()) {
        if (value instanceof Blob) files[key] = { name: value.name || "photo.jpg", type: value.type, b64: await toBase64(value) };
        else fields[key] = String(value);
      }
    }
    return { fields, files };
  }

  const realFetch = window.fetch.bind(window);
  window.fetch = async (input, init = {}) => {
    if (typeof input !== "string" || !input.startsWith("/api/")) return realFetch(input, init);
    const { fields, files } = await encode(init.body);
    const r = await call({ method: (init.method || "GET").toUpperCase(), path: input, fields, files });
    const body = r.b64 != null ? Uint8Array.from(atob(r.b64), (c) => c.charCodeAt(0)) : r.text || "";
    return new Response(body, { status: r.status || 500, headers: { "Content-Type": r.content_type || "text/plain" } });
  };

  post("streamlit:componentReady", { apiVersion: 1 });
})();

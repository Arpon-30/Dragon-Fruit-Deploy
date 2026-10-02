// Talks to the FastAPI backend. Errors carry a `code` the UI turns into a translated message.

export class ApiError extends Error {
  constructor(code, message) {
    super(message || code);
    this.code = code;
  }
}

const CODES = { 400: "badFile", 413: "tooBig", 422: "notFruit" };

async function post(url, form) {
  let res;
  try {
    res = await fetch(url, { method: "POST", body: form });
  } catch {
    throw new ApiError("network");
  }
  if (!res.ok) throw new ApiError(CODES[res.status] || "network");
  return res;
}

const imageForm = (blob, extra = {}) => {
  const form = new FormData();
  form.append("image", blob, "fruit.jpg");
  Object.entries(extra).forEach(([k, v]) => form.append(k, v));
  return form;
};

export const analyze = async (blob) => (await post("/api/analyze", imageForm(blob))).json();

export async function downloadReport(blob, name, lang) {
  const res = await post("/api/report", imageForm(blob, { name, lang }));
  const file = await res.blob();
  saveBlob(file, `DragonKrishok_report_${lang}.pdf`);
}

export async function downloadGuide(lang) {
  let res;
  try {
    res = await fetch(`/api/guide.pdf?lang=${lang}`);
  } catch {
    throw new ApiError("network");
  }
  if (!res.ok) throw new ApiError("network");
  saveBlob(await res.blob(), `DragonKrishok_farmer_guide_${lang}.pdf`);
}

export const getJSON = (url) => fetch(url).then((r) => (r.ok ? r.json() : Promise.reject(new ApiError("network"))));

export function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), { href: url, download: filename });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/** Live mode over plain requests, for hosts without WebSockets (the Streamlit bridge). */
function openLiveHttp(onResult, onState) {
  let closed = false;
  setTimeout(() => !closed && onState("open"));
  return {
    send: async (blob) => {
      try {
        const res = await post("/api/quick", imageForm(blob));
        if (!closed) onResult(await res.json());
      } catch {
        if (!closed) onResult({ error: "bad frame" });
      }
    },
    close: () => { closed = true; },
  };
}

/** Opens /ws/live. onResult gets every answer; returns { send(blob), close() }. */
export function openLive(onResult, onState) {
  if (window.DK_BRIDGE) return openLiveHttp(onResult, onState);
  const url = `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/ws/live`;
  let ws;
  let closed = false;
  let retry;

  const connect = () => {
    onState("connecting");
    ws = new WebSocket(url);
    ws.binaryType = "arraybuffer";
    ws.onopen = () => onState("open");
    ws.onmessage = (e) => onResult(JSON.parse(e.data));
    ws.onclose = () => {
      if (closed) return;
      onState("offline");
      retry = setTimeout(connect, 1500);
    };
  };
  connect();

  return {
    send: (blob) => ws.readyState === WebSocket.OPEN && ws.send(blob),
    close: () => {
      closed = true;
      clearTimeout(retry);
      ws.close();
    },
  };
}

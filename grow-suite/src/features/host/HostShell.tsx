import React, { useEffect, useRef, useState } from "react";

export default function GrowSuiteHost() {
  const [lightingURL, setLightingURL] = useState(() => localStorage.getItem("lightingURL") || "");
  const [envURL, setEnvURL] = useState(() => localStorage.getItem("envURL") || "");
  const envRef = useRef<HTMLIFrameElement | null>(null);

  const [lightingReady, setLightingReady] = useState(false);
  const [envReady, setEnvReady] = useState(false);
  const [ppfd, setPpfd] = useState<number | null>(null);

  useEffect(() => {
    function onMsg(e: MessageEvent) {
      const m = e?.data as any;
      if (!m || typeof m !== "object") return;
      if (m.type === "lighting:ready") setLightingReady(true);
      if (m.type === "environment:ready") setEnvReady(true);
      if (m.type === "lighting:ppfd" && Number.isFinite(m.value)) setPpfd(Number(m.value));
    }
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  function sendPPFDToEnv() {
    if (!envRef.current || !ppfd) return;
    envRef.current.contentWindow?.postMessage({ type: "host:set-ppfd", value: Math.round(ppfd) }, "*");
  }
  const store = (k: string, v: string) => {
    try {
      localStorage.setItem(k, v);
    } catch {}
  };
  const bothSet = Boolean(lightingURL && envURL);

  return (
    <div>
      <div className="rounded-2xl bg-white p-4 shadow-sm mb-4">
        <h2 className="font-semibold text-lg">Host Shell</h2>
        <div className="grid md:grid-cols-2 gap-3 mt-3">
          <div>
            <label className="text-sm">Lighting Canvas URL</label>
            <input
              className="mt-1 w-full rounded-xl border px-3 py-2"
              value={lightingURL}
              onChange={(e) => {
                setLightingURL(e.target.value);
                store("lightingURL", e.target.value);
              }}
              placeholder="https://…"
            />
          </div>
          <div>
            <label className="text-sm">Environment Canvas URL</label>
            <input
              className="mt-1 w-full rounded-xl border px-3 py-2"
              value={envURL}
              onChange={(e) => {
                setEnvURL(e.target.value);
                store("envURL", e.target.value);
              }}
              placeholder="https://…"
            />
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm mt-3">
          <span className="px-3 py-1 rounded-full bg-gray-100 border">
            Lighting: {lightingReady ? "✅ ready" : "…"}
          </span>
          <span className="px-3 py-1 rounded-full bg-gray-100 border">
            Environment: {envReady ? "✅ ready" : "…"}
          </span>
          <span className="px-3 py-1 rounded-full bg-gray-100 border">
            PPFD: <span className="font-mono">{ppfd ?? "–"}</span>
          </span>
          <button
            className="ml-auto px-3 py-1 rounded-full border bg-gray-900 text-white disabled:opacity-50"
            disabled={!ppfd || !envReady}
            onClick={sendPPFDToEnv}
          >
            Send PPFD → Environment
          </button>
        </div>
      </div>

      {!bothSet && (
        <div className="rounded-2xl bg-yellow-50 border border-yellow-200 text-yellow-900 p-4 mb-4 text-sm">
          Paste both URLs above to load the canvases. Messaging works only when both iframes are loaded.
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl shadow-sm p-2">
          <div className="text-sm font-semibold px-2 mb-2">Lighting</div>
          {lightingURL ? (
            <iframe
              title="Lighting"
              src={lightingURL}
              className="w-full h-[70vh] rounded-xl border"
              sandbox="allow-scripts allow-same-origin"
            />
          ) : (
            <div className="h-[70vh] grid place-items-center text-sm text-gray-500">
              Paste Lighting URL above
            </div>
          )}
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-2">
          <div className="text-sm font-semibold px-2 mb-2">Environment</div>
          {envURL ? (
            <iframe
              ref={envRef}
              title="Environment"
              src={envURL}
              className="w-full h-[70vh] rounded-xl border"
              sandbox="allow-scripts allow-same-origin"
            />
          ) : (
            <div className="h-[70vh] grid place-items-center text-sm text-gray-500">
              Paste Environment URL above
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

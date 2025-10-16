import React from "https://esm.sh/react@18";

export default function HostShell(){
  const params = new URLSearchParams(globalThis.location?.search || "");
  const qsLighting = params.get("lighting") || "";
  const qsEnv = params.get("env") || "";
  const [lightingURL, setLightingURL] = React.useState(qsLighting || localStorage.getItem("lightingURL") || "");
  const [envURL, setEnvURL] = React.useState(qsEnv || localStorage.getItem("envURL") || "");
  const envRef = React.useRef(null);
  const [lightingReady, setLightingReady] = React.useState(false);
  const [envReady, setEnvReady] = React.useState(false);
  const [ppfd, setPpfd] = React.useState(null);
  const [toast, setToast] = React.useState("");
  const [lux, setLux] = React.useState("");
  const [fc, setFc] = React.useState("");
  const [ppfdConv, setPpfdConv] = React.useState("");
  const [lpu, setLpu] = React.useState(67);
  const [autoForward, setAutoForward] = React.useState(()=>{
    try{ return localStorage.getItem("autoForwardPPFD") === "1"; }catch{ return false; }
  });

  React.useEffect(() => {
    const ALLOWED = globalThis.ALLOWED_ORIGINS || null;
    function onMsg(e){
      if(ALLOWED && !ALLOWED.includes(e.origin)) return;
      const m = e?.data;
      if(!m || typeof m !== "object") return;
      try { console.debug("[Host] message", m); } catch {}
      if(m.type === "lighting:ready") setLightingReady(true);
      if(m.type === "environment:ready") setEnvReady(true);
      if(m.type === "lighting:ppfd" && Number.isFinite(m.value)) setPpfd(Number(m.value));
    }
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  function store(key, value){
    const next = value.trim();
    try { localStorage.setItem(key, next); } catch {}
    return next;
  }

  React.useEffect(()=>{
    try{
      const params = new URLSearchParams(globalThis.location?.search || "");
      const l = params.get("lighting");
      const en = params.get("env");
      if(l){ setLightingURL(store("lightingURL", l)); }
      if(en){ setEnvURL(store("envURL", en)); }
    }catch{}
  },[]);

  React.useEffect(() => {
    setLightingReady(false);
    setPpfd(null);
    try { console.debug("[Host] lightingURL=", lightingURL); } catch {}
  }, [lightingURL]);

  React.useEffect(() => {
    setEnvReady(false);
    try { console.debug("[Host] envURL=", envURL); } catch {}
  }, [envURL]);

  function syncQuery(){
    try {
      const p = new URLSearchParams(globalThis.location?.search || "");
      const lightTrim = lightingURL.trim();
      const envTrim = envURL.trim();
      if(lightTrim) p.set("lighting", lightTrim); else p.delete("lighting");
      if(envTrim) p.set("env", envTrim); else p.delete("env");
      const u = new URL(globalThis.location.href);
      u.search = p.toString();
      history.replaceState(null, "", u.toString());
    } catch {}
  }

  React.useEffect(syncQuery, [lightingURL, envURL]);

  function sendPPFDToEnv(){
    if(!envRef.current || !ppfd || !envReady) return;
    envRef.current.contentWindow?.postMessage({ type: "host:set-ppfd", value: Math.round(ppfd) }, "*");
  }

  React.useEffect(() => {
    if(autoForward && envReady && ppfd) sendPPFDToEnv();
  }, [ppfd, envReady, autoForward]);

  React.useEffect(()=>{
    try{ localStorage.setItem("autoForwardPPFD", autoForward ? "1" : "0"); }catch{}
  }, [autoForward]);

  function notify(msg){
    setToast(msg);
    setTimeout(() => setToast(""), 1500);
  }

  function exportState(){
    try {
      const data = { lightingURL, envURL, lpu, lastPPFD: ppfd };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "grow-suite-host.json";
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 0);
    } catch {}
  }

  function importState(ev){
    const file = ev.target.files?.[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if(typeof data.lightingURL === "string"){ setLightingURL(data.lightingURL); store("lightingURL", data.lightingURL); }
        if(typeof data.envURL === "string"){ setEnvURL(data.envURL); store("envURL", data.envURL); }
        if(Number.isFinite(data.lpu)) setLpu(Number(data.lpu) || 67);
      } catch {}
    };
    reader.readAsText(file);
    ev.target.value = "";
  }

  function luxToFc(v){ return v / 10.764; }
  function fcToLux(v){ return v * 10.764; }
  function luxToPpfd(v){ const factor = lpu || 67; return factor ? v / factor : 0; }
  function ppfdToLux(v){ const factor = lpu || 67; return v * factor; }

  function syncFromLux(v){
    setLux(v);
    if(v === ""){ setFc(""); setPpfdConv(""); return; }
    const n = Number(v);
    if(!Number.isFinite(n)){ setFc(""); setPpfdConv(""); return; }
    const foot = luxToFc(n);
    const mol = luxToPpfd(n);
    setFc(foot.toFixed(1));
    setPpfdConv(Math.round(mol).toString());
  }

  function syncFromFc(v){
    setFc(v);
    if(v === ""){ setLux(""); setPpfdConv(""); return; }
    const n = Number(v);
    if(!Number.isFinite(n)){ setLux(""); setPpfdConv(""); return; }
    const lx = fcToLux(n);
    setLux(lx.toFixed(1));
    const mol = luxToPpfd(lx);
    setPpfdConv(Math.round(mol).toString());
  }

  function syncFromPpfd(v){
    setPpfdConv(v);
    if(v === ""){ setLux(""); setFc(""); return; }
    const n = Number(v);
    if(!Number.isFinite(n)){ setLux(""); setFc(""); return; }
    const lx = ppfdToLux(n);
    setLux(lx.toFixed(1));
    const foot = luxToFc(lx);
    setFc(foot.toFixed(1));
  }

  React.useEffect(() => {
    if(lux){ syncFromLux(lux); return; }
    if(fc){ syncFromFc(fc); return; }
    if(ppfdConv){ syncFromPpfd(ppfdConv); }
  }, [lpu]);

  const lightingValue = lightingURL.trim();
  const envValue = envURL.trim();
  const bothSet = Boolean(lightingValue && envValue);

  return (
    /** @jsx React.createElement */
    React.createElement("div", null,
      React.createElement("div", {className:"rounded-2xl bg-white p-4 shadow-sm mb-4"},
        React.createElement("h2", {className:"font-semibold text-lg"}, "Host Shell"),
        React.createElement("div", {className:"grid md:grid-cols-2 gap-3 mt-3"},
          React.createElement("div", null,
            React.createElement("label", {className:"text-sm"}, "Lighting Canvas URL"),
            React.createElement("input", {
              className:"mt-1 w-full rounded-xl border px-3 py-2",
              value: lightingURL,
              onChange: e => {
                const next = e.target.value;
                setLightingURL(next);
                store("lightingURL", next);
              },
              placeholder:"https://…"
            })
          ),
          React.createElement("div", null,
            React.createElement("label", {className:"text-sm"}, "Environment Canvas URL"),
            React.createElement("input", {
              className:"mt-1 w-full rounded-xl border px-3 py-2",
              value: envURL,
              onChange: e => {
                const next = e.target.value;
                setEnvURL(next);
                store("envURL", next);
              },
              placeholder:"https://…"
            })
          )
        ),
        React.createElement("div", {className:"flex items-center gap-2 text-sm mt-3"},
          React.createElement("span", {className:"px-3 py-1 rounded-full bg-gray-100 border"}, "Lighting: ", lightingReady ? "✅ ready" : "…"),
          React.createElement("span", {className:"px-3 py-1 rounded-full bg-gray-100 border"}, "Environment: ", envReady ? "✅ ready" : "…"),
          React.createElement("span", {className:"px-3 py-1 rounded-full bg-gray-100 border"}, "PPFD: ",
            React.createElement("span", {className:"font-mono"}, ppfd ?? "–")
          ),
          React.createElement("button", {
            className:"ml-auto px-3 py-1 rounded-full border bg-gray-900 text-white disabled:opacity-50",
            disabled: !ppfd || !envReady || !lightingReady,
            onClick: () => { sendPPFDToEnv(); notify("PPFD sent"); }
          }, "Send PPFD → Environment"),
          React.createElement("label", {className:"flex items-center gap-2 text-xs ml-2"},
            React.createElement("input", {
              type:"checkbox",
              checked:autoForward,
              onChange:e=>setAutoForward(e.target.checked)
            }),
            "Auto-forward"
          ),
          React.createElement("button", {className:"px-3 py-1 rounded-full border ml-2", onClick: () => { setLightingURL(""); store("lightingURL", ""); syncQuery(); }}, "Clear Lighting"),
          React.createElement("button", {className:"px-3 py-1 rounded-full border", onClick: () => { setEnvURL(""); store("envURL", ""); syncQuery(); }}, "Clear Environment"),
          React.createElement("button", {className:"px-3 py-1 rounded-full border ml-2", onClick: exportState}, "Export state"),
          React.createElement("label", {className:"px-3 py-1 rounded-full border ml-2 cursor-pointer"}, "Import",
            React.createElement("input", {type:"file", accept:"application/json", className:"hidden", onChange: importState})
          )
        )
      ),
      !bothSet && React.createElement("div", {className:"rounded-2xl bg-yellow-50 border border-yellow-200 text-yellow-900 p-4 mb-4 text-sm"},
        "Paste both URLs above to load the canvases. Messaging works only when both iframes are loaded."
      ),
      React.createElement("div", {className:"grid md:grid-cols-2 gap-4"},
        React.createElement("div", {className:"bg-white rounded-2xl shadow-sm p-2"},
          React.createElement("div", {className:"text-sm font-semibold px-2 mb-2"}, "Lighting"),
          lightingValue
            ? React.createElement("iframe", {
                title: "Lighting",
                src: lightingValue,
                className:"w-full h-[70vh] rounded-xl border",
                sandbox:"allow-scripts allow-same-origin"
              })
            : React.createElement("div", {className:"h-[70vh] grid place-items-center text-sm text-gray-500"}, "Paste Lighting URL above")
        ),
        React.createElement("div", {className:"bg-white rounded-2xl shadow-sm p-2"},
          React.createElement("div", {className:"text-sm font-semibold px-2 mb-2"}, "Environment"),
          envValue
            ? React.createElement("iframe", {
                ref: envRef,
                title: "Environment",
                src: envValue,
                className:"w-full h-[70vh] rounded-xl border",
                sandbox:"allow-scripts allow-same-origin"
              })
            : React.createElement("div", {className:"h-[70vh] grid place-items-center text-sm text-gray-500"}, "Paste Environment URL above")
        )
      ),
      React.createElement("div", {className:"rounded-2xl bg-white p-4 shadow-sm mt-4"},
        React.createElement("div", {className:"flex items-center gap-2 mb-2"},
          React.createElement("h3", {className:"font-semibold"}, "Quick Converters"),
          React.createElement("span", {className:"text-xs text-gray-500"}, "(Lux↔FC↔PPFD; spectrum factor)"),
          React.createElement("div", {className:"ml-auto text-xs"}, "Lux/µmol: ",
            React.createElement("input", {
              className:"w-20 rounded border px-2 py-1",
              type:"number",
              value: lpu,
              onChange: e => setLpu(Number(e.target.value) || 67)
            })
          )
        ),
        React.createElement("div", {className:"grid md:grid-cols-3 gap-3 text-sm"},
          React.createElement("div", null,
            React.createElement("label", null, "Lux"),
            React.createElement("input", {
              className:"mt-1 w-full rounded-xl border px-3 py-2",
              value: lux,
              onChange: e => syncFromLux(e.target.value)
            })
          ),
          React.createElement("div", null,
            React.createElement("label", null, "Foot-candles"),
            React.createElement("input", {
              className:"mt-1 w-full rounded-xl border px-3 py-2",
              value: fc,
              onChange: e => syncFromFc(e.target.value)
            })
          ),
          React.createElement("div", null,
            React.createElement("label", null, "PPFD (µmol·m⁻²·s⁻¹)"),
            React.createElement("input", {
              className:"mt-1 w-full rounded-xl border px-3 py-2",
              value: ppfdConv,
              onChange: e => syncFromPpfd(e.target.value)
            })
          )
        )
      ),
      React.createElement("div", {className:"rounded-2xl bg-white p-4 shadow-sm mt-4 text-xs text-gray-600"},
        React.createElement("div", {className:"font-semibold mb-1"}, "Bridge help"),
        React.createElement("div", null, "Lighting Canvas posts ", React.createElement("code", null, "lighting:ready"), " and ", React.createElement("code", null, "lighting:ppfd"), "."),
        React.createElement("div", null, "Environment Canvas posts ", React.createElement("code", null, "environment:ready"), " and listens for ", React.createElement("code", null, "host:set-ppfd"), ".")
      ),
      toast && React.createElement("div", {className:"fixed bottom-4 right-4 bg-black text-white text-xs px-3 py-2 rounded-xl opacity-80"}, toast)
    )
  );
}

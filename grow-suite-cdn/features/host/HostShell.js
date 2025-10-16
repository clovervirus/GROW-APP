import React from "https://esm.sh/react@18";
export default function HostShell(){
  const [lightingURL, setLightingURL] = React.useState(localStorage.getItem("lightingURL")||"");
  const [envURL, setEnvURL] = React.useState(localStorage.getItem("envURL")||"");
  const envRef = React.useRef(null);
  const [lightingReady, setLightingReady] = React.useState(false);
  const [envReady, setEnvReady] = React.useState(false);
  const [ppfd, setPpfd] = React.useState(null);

  React.useEffect(()=>{
    function onMsg(e){
      const m = e?.data;
      if(!m || typeof m !== "object") return;
      if(m.type==="lighting:ready") setLightingReady(true);
      if(m.type==="environment:ready") setEnvReady(true);
      if(m.type==="lighting:ppfd" && Number.isFinite(m.value)) setPpfd(Number(m.value));
    }
    window.addEventListener("message", onMsg);
    return ()=>window.removeEventListener("message", onMsg);
  },[]);

  React.useEffect(()=>{
    setLightingReady(false);
    setPpfd(null);
  },[lightingURL]);

  React.useEffect(()=>{
    setEnvReady(false);
  },[envURL]);

  function store(k,v){
    const next = v.trim();
    try{ localStorage.setItem(k,next); }catch{}
    return next;
  }
  function sendPPFDToEnv(){
    if(!envRef.current || !ppfd || !envReady) return;
    envRef.current.contentWindow?.postMessage({type:"host:set-ppfd", value: Math.round(ppfd)}, "*");
  }
  const lightingValue = lightingURL.trim();
  const envValue = envURL.trim();
  const bothSet = Boolean(lightingValue && envValue);

  return (
    /** @jsx React.createElement */
    React.createElement("div", null,
      React.createElement("div", {className:"rounded-2xl bg-white p-4 shadow-sm mb-4"},
        React.createElement("h2", {className:"font-semibold text-lg"},"Host Shell"),
        React.createElement("div", {className:"grid md:grid-cols-2 gap-3 mt-3"},
          React.createElement("div", null,
            React.createElement("label", {className:"text-sm"},"Lighting Canvas URL"),
            React.createElement("input", {className:"mt-1 w-full rounded-xl border px-3 py-2",
              value:lightingURL,
              onChange:e=>{
                const next = e.target.value;
                setLightingURL(next);
                store("lightingURL", next);
              },
              placeholder:"https://…"})
          ),
          React.createElement("div", null,
            React.createElement("label", {className:"text-sm"},"Environment Canvas URL"),
            React.createElement("input", {className:"mt-1 w-full rounded-xl border px-3 py-2",
              value:envURL,
              onChange:e=>{
                const next = e.target.value;
                setEnvURL(next);
                store("envURL", next);
              },
              placeholder:"https://…"})
          )
        ),
        React.createElement("div", {className:"flex items-center gap-2 text-sm mt-3"},
          React.createElement("span", {className:"px-3 py-1 rounded-full bg-gray-100 border"},"Lighting: ", lightingReady ? "✅ ready":"…"),
          React.createElement("span", {className:"px-3 py-1 rounded-full bg-gray-100 border"},"Environment: ", envReady ? "✅ ready":"…"),
          React.createElement("span", {className:"px-3 py-1 rounded-full bg-gray-100 border"},"PPFD: ",
            React.createElement("span", {className:"font-mono"}, ppfd ?? "–")
          ),
          React.createElement("button", {className:"ml-auto px-3 py-1 rounded-full border bg-gray-900 text-white disabled:opacity-50",
            disabled: !ppfd || !envReady || !lightingReady, onClick: sendPPFDToEnv}, "Send PPFD → Environment")
        )
      ),
      !bothSet && React.createElement("div", {className:"rounded-2xl bg-yellow-50 border border-yellow-200 text-yellow-900 p-4 mb-4 text-sm"},
        "Paste both URLs above to load the canvases. Messaging works only when both iframes are loaded."
      ),
      React.createElement("div", {className:"grid md:grid-cols-2 gap-4"},
        React.createElement("div", {className:"bg-white rounded-2xl shadow-sm p-2"},
          React.createElement("div", {className:"text-sm font-semibold px-2 mb-2"},"Lighting"),
          lightingValue
            ? React.createElement("iframe", {title:"Lighting", src:lightingValue, className:"w-full h-[70vh] rounded-xl border",
                sandbox:"allow-scripts allow-same-origin"})
            : React.createElement("div", {className:"h-[70vh] grid place-items-center text-sm text-gray-500"},"Paste Lighting URL above")
        ),
        React.createElement("div", {className:"bg-white rounded-2xl shadow-sm p-2"},
          React.createElement("div", {className:"text-sm font-semibold px-2 mb-2"},"Environment"),
          envValue
            ? React.createElement("iframe", {ref:envRef, title:"Environment", src:envValue, className:"w-full h-[70vh] rounded-xl border",
                sandbox:"allow-scripts allow-same-origin"})
            : React.createElement("div", {className:"h-[70vh] grid place-items-center text-sm text-gray-500"},"Paste Environment URL above")
        )
      )
    )
  );
}

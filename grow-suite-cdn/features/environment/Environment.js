import React from "https://esm.sh/react@18";
import MixHelper from "./MixHelper.js";

function kPaToVPD(Tc, RH){
  // Magnus formula in kPa
  const es = 0.6108 * Math.exp((17.27 * Tc)/(Tc + 237.3));
  const ea = es * (RH/100);
  return Math.max(0, es - ea);
}

const STAGES = [
  {id:"clones", label:"Clones/Seedlings", vpd:[0.4,0.8], co2:[400,600], tempF:[72,78], rh:[65,80]},
  {id:"veg", label:"Vegetative",          vpd:[0.8,1.2], co2:[400,900], tempF:[75,82], rh:[55,70]},
  {id:"flower", label:"Flower (12h)",      vpd:[1.2,1.6], co2:[800,1200], tempF:[74,80], rh:[45,60]},
];

export default function Environment(){
  const [stage, setStage] = React.useState("veg");
  const [tAirF, setTAirF] = React.useState(78);
  const [leafOffsetF, setLeafOffsetF] = React.useState(2); // leaf warmer than air; can be negative
  const [rh, setRH] = React.useState(60);
  const [co2On, setCo2On] = React.useState(false);
  const [ppfd, setPPFD] = React.useState(null);

  React.useEffect(()=>{
    try{ window.parent?.postMessage({type:"environment:ready"}, "*"); }catch{}
    function onMsg(e){
      const m = e?.data || {}; if(!m || typeof m!=="object") return;
      if(m.type === "host:set-ppfd" && Number.isFinite(m.value)) setPPFD(Number(m.value));
    }
    window.addEventListener("message", onMsg);
    return ()=> window.removeEventListener("message", onMsg);
  },[]);

  const s = STAGES.find(x=>x.id===stage)||STAGES[1];
  const tLeafF = tAirF + leafOffsetF;
  const tAirC = (tAirF-32)*5/9, tLeafC=(tLeafF-32)*5/9;
  const vpdAir = kPaToVPD(tAirC, rh);
  const vpdLeaf = kPaToVPD(tLeafC, rh);

  // Suggest leaf offset from PPFD (rule of thumb)
  const suggestedLeafOffset = ppfd ? Math.min(5, Math.max(0, Math.round(ppfd/300))) : 0;

  const [vLo, vHi] = s.vpd; const [cLo,cHi] = s.co2; const [tfLo, tfHi] = s.tempF; const [rhLo, rhHi] = s.rh;

  return (
    /** @jsx React.createElement */
    React.createElement("div", {className:"rounded-2xl bg-white p-4 shadow-sm"},
      React.createElement("h2", {className:"font-semibold text-lg"}, "Environment — VPD & Targets"),
      React.createElement("div", {className:"mb-2 text-sm"}, "PPFD from Host: ", React.createElement("span", {className:"font-mono"}, ppfd ?? "–")),
      React.createElement("div", {className:"grid md:grid-cols-2 gap-3"},
        React.createElement("div", null,
          React.createElement("label", {className:"text-sm"}, "Stage"),
          React.createElement("select", {className:"mt-1 w-full rounded-xl border px-3 py-2", value:stage, onChange:e=>setStage(e.target.value)},
            STAGES.map(x=> React.createElement("option", {key:x.id, value:x.id}, x.label))
          ),
          React.createElement("div", {className:"mt-3 grid grid-cols-2 gap-3"},
            React.createElement("div", null,
              React.createElement("label", {className:"text-sm"}, "Air Temp (°F)"),
              React.createElement("input", {type:"number", className:"mt-1 w-full rounded-xl border px-3 py-2", value:tAirF, onChange:e=>setTAirF(Number(e.target.value))})
            ),
            React.createElement("div", null,
              React.createElement("label", {className:"text-sm"}, "Leaf Offset (°F)"),
              React.createElement("input", {type:"number", className:"mt-1 w-full rounded-xl border px-3 py-2", value:leafOffsetF, onChange:e=>setLeafOffsetF(Number(e.target.value))})
            ),
            React.createElement("div", null,
              React.createElement("label", {className:"text-sm"}, "RH (%)"),
              React.createElement("input", {type:"number", className:"mt-1 w-full rounded-xl border px-3 py-2", value:rh, onChange:e=>setRH(Number(e.target.value))})
            ),
            React.createElement("div", {className:"flex items-center gap-2 mt-6"},
              React.createElement("input", {type:"checkbox", className:"h-5 w-5", checked:co2On, onChange:e=>setCo2On(e.target.checked)}),
              React.createElement("span", {className:"text-sm"}, "CO₂ enriched")
            )
          )
        ),
        React.createElement("div", null,
          React.createElement("div", {className:"rounded-xl bg-gray-50 p-3 mb-3"},
            React.createElement("div", {className:"text-xs text-gray-500"}, "PPFD (from Host)"),
            React.createElement("div", {className:"text-xl font-bold"}, ppfd ?? "–"),
            React.createElement("div", {className:"text-xs text-gray-500"}, suggestedLeafOffset?`Tip: increase leaf offset ≈ +${suggestedLeafOffset}°F at this PPFD`:"")
          ),
          React.createElement("div", {className:"grid grid-cols-2 gap-3"},
            React.createElement("div", {className:"rounded-xl bg-gray-50 p-3"},
              React.createElement("div", {className:"text-xs text-gray-500"}, "VPD (air)"),
              React.createElement("div", {className:"text-2xl font-bold"}, vpdAir.toFixed(2), " kPa")
            ),
            React.createElement("div", {className:"rounded-xl bg-gray-50 p-3"},
              React.createElement("div", {className:"text-xs text-gray-500"}, "VPD (leaf)"),
              React.createElement("div", {className:"text-2xl font-bold"}, vpdLeaf.toFixed(2), " kPa")
            )
          ),
          React.createElement("div", {className:"mt-3 text-sm text-gray-700"},
            `Targets • VPD ${vLo}–${vHi} kPa • Temp ${tfLo}–${tfHi}°F • RH ${rhLo}–${rhHi}% • CO₂ ${co2On?cLo+"–"+cHi+" ppm (on)":"ambient"}`
          ),
          React.createElement("div", {className:"text-xs text-gray-500 mt-1"}, "Leaf temp = Air + Offset. Use 24 h staging for clones/veg only; flower remains 12 h.")
        )
      ),
      React.createElement("div", {className:"mt-4"}, React.createElement(MixHelper))
    )
  );
}

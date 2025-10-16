import React from "https://esm.sh/react@18";
import { STAGES, ppfdRange, dliRange, labelFor } from "./curves.js";
import { FIXTURES, estimatePPFD } from "./efficacy.js";

const PRESETS = {
  led_white: 67,
  sunlight: 54,
  hps: 90,
  mh: 68,
};

export default function Lighting(){
  const [unit, setUnit] = React.useState("fc");
  const [reading, setReading] = React.useState(400);
  const [hours, setHours] = React.useState(18);
  const [stage, setStage] = React.useState("veg");
  const [co2, setCO2] = React.useState("ambient");
  const [preset, setPreset] = React.useState("led_white");
  const [customLpu, setCustomLpu] = React.useState(67);

  const lpu = preset === "custom" ? customLpu : PRESETS[preset] || 67;
  const toLux = (val)=> unit === "lux" ? val : unit === "fc" ? val*10.764 : val*lpu;
  const fromLuxToPPFD = (lux)=> lpu>0 ? lux/lpu : 0;

  const livePPFD = React.useMemo(()=>{
    if(!reading) return 0;
    if(unit === "ppfd") return reading;
    return fromLuxToPPFD(toLux(reading));
  }, [reading, unit, lpu]);

  const [pLo, pHi] = ppfdRange(stage, hours, co2);
  const [dLo, dHi] = dliRange(stage, hours, co2);
  const liveDLI = livePPFD * hours * 0.0036;

  React.useEffect(()=>{ try{ window.parent?.postMessage({type:"lighting:ready"}, "*"); }catch{} }, []);
  React.useEffect(()=>{
    const v = Math.round(livePPFD || 0);
    if(Number.isFinite(v) && v>0){
      try{ window.parent?.postMessage({type:"lighting:ppfd", value:v}, "*"); }catch{}
    }
  }, [livePPFD]);

  const status = (val, lo, hi) => !Number.isFinite(val) ? "text-gray-500" : val < lo ? "text-yellow-600" : val > hi ? "text-red-600" : "text-green-700";

  return (
    /** @jsx React.createElement */
    React.createElement("div", {className:"space-y-4"},
      React.createElement("div", {className:"rounded-2xl bg-white p-4 shadow-sm"},
        React.createElement("h2", {className:"font-semibold text-lg mb-2"}, "Lighting — PPFD & DLI (CO₂ curves)"),
        React.createElement("div", {className:"grid md:grid-cols-2 gap-3"},
          React.createElement("div", {className:"space-y-2"},
            React.createElement("div", {className:"flex gap-2 items-center"},
              React.createElement("input", {
                type:"number",
                className:"w-28 border rounded-xl px-3 py-2",
                value:reading,
                min:0,
                onChange:e=>setReading(Number(e.target.value))
              }),
              React.createElement("select", {
                className:"border rounded-xl px-3 py-2",
                value:unit,
                onChange:e=>setUnit(e.target.value)
              },
                React.createElement("option", {value:"lux"}, "lux"),
                React.createElement("option", {value:"fc"}, "foot-candles"),
                React.createElement("option", {value:"ppfd"}, "PPFD (µmol)"),
              )
            ),
            React.createElement("div", {className:"flex gap-2 items-center flex-wrap"},
              React.createElement("label", {className:"text-sm"}, "Hours"),
              React.createElement("input", {
                type:"number",
                className:"w-20 border rounded-xl px-3 py-2",
                min:1,
                max:24,
                value:hours,
                onChange:e=>setHours(Number(e.target.value))
              }),
              React.createElement("label", {className:"text-sm"}, "Stage"),
              React.createElement("select", {
                className:"border rounded-xl px-3 py-2",
                value:stage,
                onChange:e=>setStage(e.target.value)
              },
                STAGES.map(s=> React.createElement("option", {key:s.id, value:s.id}, s.label))
              ),
              React.createElement("label", {className:"text-sm"}, "CO₂"),
              React.createElement("select", {
                className:"border rounded-xl px-3 py-2",
                value:co2,
                onChange:e=>setCO2(e.target.value)
              },
                React.createElement("option", {value:"ambient"}, "Ambient (~400)"),
                React.createElement("option", {value:"enriched"}, "Enriched (~800)"),
                React.createElement("option", {value:"high"}, "High (~1200)"),
              )
            ),
            React.createElement("div", {className:"flex gap-2 items-center"},
              React.createElement("label", {className:"text-sm"}, "Spectrum"),
              React.createElement("select", {
                className:"border rounded-xl px-3 py-2",
                value:preset,
                onChange:e=>setPreset(e.target.value)
              },
                React.createElement("option", {value:"led_white"}, "White LED (est)"),
                React.createElement("option", {value:"sunlight"}, "Sunlight (est)"),
                React.createElement("option", {value:"hps"}, "HPS (est)"),
                React.createElement("option", {value:"mh"}, "MH (est)"),
                React.createElement("option", {value:"custom"}, "Custom…"),
              ),
              preset === "custom" && React.createElement("input", {
                type:"number",
                className:"w-24 border rounded-xl px-3 py-2",
                min:1,
                value:customLpu,
                onChange:e=>setCustomLpu(Number(e.target.value))
              })
            )
          ),
          React.createElement("div", {className:"grid gap-2"},
            React.createElement("div", {className:"rounded-xl bg-gray-50 p-3"},
              React.createElement("div", {className:"text-xs text-gray-500"}, "Estimated PPFD"),
              React.createElement("div", {className:`text-2xl font-bold ${status(livePPFD, pLo, pHi)}`}, `${Math.round(livePPFD)} µmol·m⁻²·s⁻¹`),
              React.createElement("div", {className:"text-xs text-gray-500"}, `Target: ${pLo}–${pHi} for ${labelFor(stage)} @ ${hours}h (${co2})`)
            ),
            React.createElement("div", {className:"rounded-xl bg-gray-50 p-3"},
              React.createElement("div", {className:"text-xs text-gray-500"}, "Estimated DLI"),
              React.createElement("div", {className:`text-2xl font-bold ${status(liveDLI, dLo, dHi)}`}, `${liveDLI.toFixed(1)} mol·m⁻²·day⁻¹`),
              React.createElement("div", {className:"text-xs text-gray-500"}, `Target: ${dLo}–${dHi} (${co2})`)
            )
          )
        ),
        React.createElement("p", {className:"text-xs text-gray-500"}, "Tip: average canopy points; presets are approximations — calibrate when possible."),
      ),

      React.createElement("div", {className:"rounded-2xl bg-white p-4 shadow-sm"},
        React.createElement("h3", {className:"font-semibold mb-2"}, "Fixture estimator (quick)"),
        React.createElement("div", {className:"flex flex-wrap gap-2 items-center"},
          React.createElement("select", {
            className:"border rounded-xl px-3 py-2",
            defaultValue:"acib430",
            onChange:e=>{
              const f = FIXTURES.find(x=>x.id===e.target.value) || FIXTURES[0];
              if(!f) return;
              const est = estimatePPFD({watts:f.watts});
              alert(`${f.name} ≈ ${est} µmol·m⁻²·s⁻¹ over ~1.2 m²`);
            }
          },
            FIXTURES.map(f=> React.createElement("option", {key:f.id, value:f.id}, `${f.name} • ${f.watts}W @ ${f.effic} µmol/J`))
          ),
          React.createElement("span", {className:"text-xs text-gray-500"}, "Use calibration data when available; this is a ballpark."),
        )
      ),

      React.createElement(UniformityGrid, null)
    )
  );
}

function UniformityGrid(){
  const [cells, setCells] = React.useState(Array(9).fill(""));
  const values = cells.map(v=>Number(v)).filter(v=>Number.isFinite(v) && v>0);
  const avg = values.length ? Math.round(values.reduce((a,b)=>a+b,0)/values.length) : 0;
  const min = values.length ? Math.min(...values) : 0;
  const uniformity = avg ? Math.round((min/avg)*100) : 0;

  return (
    /** @jsx React.createElement */
    React.createElement("div", {className:"rounded-2xl bg-white p-4 shadow-sm"},
      React.createElement("h3", {className:"font-semibold mb-2"}, "Uniformity (enter PPFD samples)"),
      React.createElement("div", {className:"grid grid-cols-3 gap-2 mb-2"},
        cells.map((v,i)=> React.createElement("input", {
          key:i,
          type:"number",
          placeholder:"µmol",
          className:"w-20 border rounded-xl px-2 py-1",
          value:v,
          onChange:e=>{
            const next = [...cells];
            next[i] = e.target.value;
            setCells(next);
          }
        }))
      ),
      React.createElement("div", {className:"text-sm"}, `Avg: ${avg} µmol • Min/Avg: ${uniformity}%`)
    )
  );
}

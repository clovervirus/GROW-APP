import React from "https://esm.sh/react@18";

export default function Print(){
  const [tankL, setTankL] = React.useState(100);
  const [stock_mL_per_L, setStock] = React.useState(2.5); // mL/L from feed chart
  const total_mL = Math.round(tankL * stock_mL_per_L * 10)/10;

  return (
    /** @jsx React.createElement */
    React.createElement("div", {className:"p-4"},
      React.createElement("style", null, `@media print { .no-print{display:none} body{background:white} } .sheet{page-break-after:always}`),
      React.createElement("div", {className:"no-print mb-3"},
        React.createElement("button", {className:"px-3 py-1 rounded-full border", onClick:()=>window.print()}, "Print")
      ),
      React.createElement("div", {className:"sheet border rounded-xl p-4 bg-white"},
        React.createElement("h2", {className:"font-semibold text-lg"}, "Batch Sheet"),
        React.createElement("div", {className:"grid md:grid-cols-3 gap-3 mt-2"},
          React.createElement("div", {className:"rounded-xl border p-3"},
            React.createElement("div", {className:"text-sm font-semibold"}, "Reservoir Mixing Helper"),
            React.createElement("label", {className:"text-xs text-gray-500"}, "Tank Volume (L)"),
            React.createElement("input", {type:"number", className:"w-full rounded-xl border px-3 py-2 mb-2", value:tankL, onChange:e=>setTankL(Number(e.target.value))}),
            React.createElement("label", {className:"text-xs text-gray-500"}, "Feed Rate (mL/L)"),
            React.createElement("input", {type:"number", className:"w-full rounded-xl border px-3 py-2 mb-2", step:"0.1", value:stock_mL_per_L, onChange:e=>setStock(Number(e.target.value))}),
            React.createElement("div", {className:"text-sm"}, `Total: ${total_mL} mL to tank`)
          ),
          React.createElement("div", {className:"rounded-xl border p-3"},
            React.createElement("div", {className:"text-sm font-semibold"}, "Stage Targets (quick ref)"),
            React.createElement("ul", {className:"text-xs mt-1"},
              React.createElement("li", null, "Clones: DLI 6–10 • VPD 0.4–0.8 kPa"),
              React.createElement("li", null, "Veg: DLI 18–25 • VPD 0.8–1.2 kPa"),
              React.createElement("li", null, "Flower: DLI 30–40 (12h) • VPD 1.2–1.6 kPa")
            )
          ),
          React.createElement("div", {className:"rounded-xl border p-3"},
            React.createElement("div", {className:"text-sm font-semibold"}, "Notes"),
            React.createElement("div", {style:{minHeight:"120px"}, className:"text-xs text-gray-500 border rounded-lg p-2"}, " ")
          )
        )
      )
    )
  );
}

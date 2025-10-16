import React from "https://esm.sh/react@18";

export default function Environment(){
  const [ppfd, setPPFD] = React.useState(0);
  const [source, setSource] = React.useState("none");
  const [inboundPPFD, setInboundPPFD] = React.useState(null);
  const [units, setUnits] = React.useState("L");
  const [tank, setTank] = React.useState(100);
  const [recipe, setRecipe] = React.useState([
    { name: "Part A", rate: 2.5 },
    { name: "Part B", rate: 2.5 },
    { name: "CalMag", rate: 1.0 },
  ]);

  React.useEffect(() => {
    try { window.parent?.postMessage({ type: "environment:ready" }, "*"); } catch {}
  }, []);

  React.useEffect(() => {
    function onMsg(e){
      const m = e?.data;
      if(m && m.type === "host:set-ppfd" && Number.isFinite(m.value)){
        const value = Number(m.value);
        setPPFD(value);
        setSource("host");
        setInboundPPFD(value);
      }
    }
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  function onManualChange(e){
    const val = Number(e.target.value || 0);
    setPPFD(val);
    setSource("manual");
  }

  function setRate(index, value){
    const next = [...recipe];
    next[index] = { ...next[index], rate: Number(value) || 0 };
    setRecipe(next);
  }

  function setName(index, value){
    const next = [...recipe];
    next[index] = { ...next[index], name: value };
    setRecipe(next);
  }

  function addLine(){
    setRecipe([...recipe, { name: "Additive", rate: 0 }]);
  }

  function removeLine(index){
    setRecipe(recipe.filter((_, i) => i !== index));
  }

  function totalFor(rate){
    const base = units === "L" ? tank : tank * 3.78541;
    return rate * base;
  }

  return (
    /** @jsx React.createElement */
    React.createElement("div", { className: "space-y-4" },
      React.createElement("div", { className: "rounded-2xl bg-white p-4 shadow-sm space-y-2" },
        React.createElement("h2", { className: "font-semibold text-lg" }, "Environment"),
        React.createElement("label", { className: "text-sm text-gray-700" }, "PPFD (µmol·m⁻²·s⁻¹)"),
        React.createElement("input", {
          type: "number",
          className: "w-40 rounded-xl border px-3 py-2",
          value: Number.isFinite(ppfd) ? ppfd : 0,
          onChange: onManualChange,
          placeholder: "e.g., 500"
        }),
        React.createElement("div", { className: "text-xs text-gray-500" },
          "Source: ", source === "host" ? "Host Shell" : source === "manual" ? "Manual" : "—"
        ),
        inboundPPFD != null && React.createElement("div", { className: "text-xs text-gray-500" },
          "Last host PPFD: ", React.createElement("span", { className: "font-mono" }, inboundPPFD)
        ),
        React.createElement("p", { className: "text-sm text-gray-600 mt-2" },
          "Use Host Shell to receive PPFD automatically, or type a value manually."
        )
      ),
      React.createElement("div", { className: "rounded-2xl bg-white p-4 shadow-sm" },
        React.createElement("h3", { className: "font-semibold text-lg mb-2" }, "Reservoir Mixing Helper"),
        React.createElement("div", { className: "grid md:grid-cols-3 gap-3" },
          React.createElement("div", null,
            React.createElement("label", { className: "text-sm text-gray-700" }, "Tank size"),
            React.createElement("input", {
              type: "number",
              className: "mt-1 w-full rounded-xl border px-3 py-2",
              value: tank,
              onChange: (e) => setTank(Number(e.target.value) || 0)
            })
          ),
          React.createElement("div", null,
            React.createElement("label", { className: "text-sm text-gray-700" }, "Units"),
            React.createElement("select", {
              className: "mt-1 w-full rounded-xl border px-3 py-2",
              value: units,
              onChange: (e) => setUnits(e.target.value)
            },
              React.createElement("option", { value: "L" }, "Liters (mL/L)"),
              React.createElement("option", { value: "gal" }, "Gallons (mL/gal)")
            )
          ),
          React.createElement("div", { className: "flex items-end" },
            React.createElement("button", { className: "px-3 py-2 rounded-xl border", onClick: addLine }, "+ Add line")
          )
        ),
        React.createElement("div", { className: "mt-3 space-y-2" },
          recipe.map((row, i) => (
            React.createElement("div", { key: i, className: "grid md:grid-cols-3 gap-2" },
              React.createElement("input", {
                className: "rounded-xl border px-3 py-2",
                value: row.name,
                onChange: (e) => setName(i, e.target.value)
              }),
              React.createElement("div", null,
                React.createElement("div", { className: "text-xs text-gray-500" }, units === "L" ? "Rate (mL/L)" : "Rate (mL/gal)"),
                React.createElement("input", {
                  type: "number",
                  className: "w-full rounded-xl border px-3 py-2",
                  value: row.rate,
                  onChange: (e) => setRate(i, e.target.value)
                })
              ),
              React.createElement("div", { className: "flex items-center text-sm" },
                React.createElement("span", { className: "mr-2 text-gray-500" }, "Total:"),
                React.createElement("span", { className: "font-mono" }, totalFor(row.rate).toFixed(1), " mL"),
                React.createElement("button", { className: "ml-auto px-2 py-1 text-xs text-red-500", onClick: () => removeLine(i) }, "Remove")
              )
            )
          ))
        )
      )
    )
  );
}

import React from "https://esm.sh/react@18";

export default function MixHelper(){
  const [mlPerL, setMlPerL] = React.useState(2.5);
  const [tankL, setTankL] = React.useState(100);
  const [parts, setParts] = React.useState([
    { id:"A", mlPerL:2.5 },
    { id:"B", mlPerL:2.5 },
    { id:"CalMag", mlPerL:1.0 },
  ]);

  const totals = parts.map((p)=> ({
    ...p,
    totalMl: +(p.mlPerL * tankL).toFixed(1),
  }));

  function updatePart(index, value){
    setParts(prev => {
      const next = [...prev];
      next[index] = {...next[index], mlPerL: Number(value) || 0};
      return next;
    });
  }

  return (
    /** @jsx React.createElement */
    React.createElement("div", {className:"rounded-2xl bg-white p-4 shadow-sm"},
      React.createElement("h3", {className:"font-semibold mb-2"}, "Reservoir mixing helper"),
      React.createElement("div", {className:"flex flex-wrap gap-3 mb-3 items-center"},
        React.createElement("label", {className:"text-sm"}, "Tank (L)"),
        React.createElement("input", {
          type:"number",
          className:"w-24 border rounded-xl px-3 py-2",
          min:1,
          value:tankL,
          onChange:e=>setTankL(Number(e.target.value))
        }),
        React.createElement("label", {className:"text-sm"}, "Recipe mL/L"),
        React.createElement("input", {
          type:"number",
          className:"w-24 border rounded-xl px-3 py-2",
          min:0,
          value:mlPerL,
          onChange:e=>setMlPerL(Number(e.target.value))
        })
      ),
      React.createElement("table", {className:"text-sm w-full"},
        React.createElement("thead", null,
          React.createElement("tr", null,
            React.createElement("th", {className:"text-left"}, "Part"),
            React.createElement("th", {className:"text-left"}, "mL/L"),
            React.createElement("th", {className:"text-left"}, "Total (mL)"),
          )
        ),
        React.createElement("tbody", null,
          totals.map((part, index)=> React.createElement("tr", {key:part.id},
            React.createElement("td", null, part.id),
            React.createElement("td", null,
              React.createElement("input", {
                type:"number",
                className:"w-24 border rounded-xl px-2 py-1",
                value:part.mlPerL,
                onChange:e=>updatePart(index, e.target.value)
              })
            ),
            React.createElement("td", null, part.totalMl)
          ))
        )
      ),
      React.createElement("div", {className:"mt-3 flex gap-2"},
        React.createElement("button", {
          className:"px-3 py-1 rounded-full border",
          onClick: ()=> window.print()
        }, "Print batch sheet")
      )
    )
  );
}

import React from "https://esm.sh/react@18";

export default function Propagation(){
  const [perWave, setPerWave] = React.useState(75);
  const [waveWeeks, setWaveWeeks] = React.useState(8);
  const [cutsPerMom, setCutsPerMom] = React.useState(12);
  const [rootDays, setRootDays] = React.useState(14);
  const [vegDays, setVegDays] = React.useState(21);
  const momsNeeded = Math.ceil(perWave / Math.max(cutsPerMom || 1, 1));

  function etaFrom(start){
    const totalDays = rootDays + vegDays;
    const target = new Date(start.getTime() + totalDays * 24 * 3600 * 1000);
    return target.toISOString().slice(0, 10);
  }

  return (
    /** @jsx React.createElement */
    React.createElement("div", {className:"rounded-2xl bg-white p-4 shadow-sm space-y-4"},
      React.createElement("h2", {className:"font-semibold text-lg"}, "Propagation Planner"),
      React.createElement("div", {className:"grid md:grid-cols-3 gap-3"},
        React.createElement("div", null,
          React.createElement("label", {className:"text-sm"}, "Clones/teens per wave"),
          React.createElement("input", {
            type:"number",
            className:"mt-1 w-full rounded-xl border px-3 py-2",
            value: perWave,
            onChange: (e) => setPerWave(Number(e.target.value) || 0)
          })
        ),
        React.createElement("div", null,
          React.createElement("label", {className:"text-sm"}, "Wave cadence (weeks)"),
          React.createElement("input", {
            type:"number",
            className:"mt-1 w-full rounded-xl border px-3 py-2",
            value: waveWeeks,
            onChange: (e) => setWaveWeeks(Number(e.target.value) || 0)
          })
        ),
        React.createElement("div", null,
          React.createElement("label", {className:"text-sm"}, "Cuts per mom per cycle"),
          React.createElement("input", {
            type:"number",
            className:"mt-1 w-full rounded-xl border px-3 py-2",
            value: cutsPerMom,
            onChange: (e) => setCutsPerMom(Number(e.target.value) || 0)
          })
        )
      ),
      React.createElement("div", {className:"text-sm"},
        "Mothers needed now: ",
        React.createElement("span", {className:"font-mono"}, momsNeeded)
      ),
      React.createElement("div", {className:"grid md:grid-cols-3 gap-3"},
        React.createElement("div", null,
          React.createElement("label", {className:"text-sm"}, "Days to root"),
          React.createElement("input", {
            type:"number",
            className:"mt-1 w-full rounded-xl border px-3 py-2",
            value: rootDays,
            onChange: (e) => setRootDays(Number(e.target.value) || 0)
          })
        ),
        React.createElement("div", null,
          React.createElement("label", {className:"text-sm"}, "Days to teen after root"),
          React.createElement("input", {
            type:"number",
            className:"mt-1 w-full rounded-xl border px-3 py-2",
            value: vegDays,
            onChange: (e) => setVegDays(Number(e.target.value) || 0)
          })
        ),
        React.createElement("div", {className:"flex items-end"},
          React.createElement("div", {className:"text-xs text-gray-500"}, "Assumes healthy moms and steady cadence." )
        )
      ),
      React.createElement("div", {className:"text-sm"},
        ((start) => {
          const eta = etaFrom(start);
          return React.createElement("div", null,
            "If you cut today, teens by: ",
            React.createElement("span", {className:"font-mono"}, eta)
          );
        })(new Date())
      )
    )
  );
}

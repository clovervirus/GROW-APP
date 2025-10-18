import React from "https://esm.sh/react@18";

export default function Propagation(){
  const [target, setTarget] = React.useState(75);
  const [deadline, setDeadline] = React.useState(()=> new Date(Date.now() + 56 * 864e5).toISOString().slice(0,10));
  const [strikeDays, setStrikeDays] = React.useState(14);
  const [vegDays, setVegDays] = React.useState(28);
  const [rate, setRate] = React.useState(10);

  const delivery = React.useMemo(() => {
    const parsed = new Date(deadline);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }, [deadline]);
  const lead = strikeDays + vegDays;
  const cutDate = React.useMemo(() => {
    if (!delivery) return null;
    return new Date(delivery.getTime() - lead * 864e5);
  }, [delivery, lead]);
  const mothersNeeded = React.useMemo(()=> Math.ceil(target / (rate * Math.max(1, Math.ceil(lead/7)))), [target, rate, lead]);

  return (
    /** @jsx React.createElement */
    React.createElement("div", {className:"rounded-2xl bg-white p-4 shadow-sm space-y-3"},
      React.createElement("h2", {className:"font-semibold text-lg"}, "Propagation Planner"),
      React.createElement("div", {className:"flex flex-wrap gap-2 items-center"},
        React.createElement("label", {className:"text-sm"}, "Clones target"),
        React.createElement("input", {type:"number", className:"w-24 border rounded-xl px-2 py-1", value:target, onChange:e=>setTarget(Number(e.target.value))}),
        React.createElement("label", {className:"text-sm"}, "Delivery date"),
        React.createElement("input", {type:"date", className:"border rounded-xl px-2 py-1", value:deadline, onChange:e=>setDeadline(e.target.value)}),
        React.createElement("label", {className:"text-sm"}, "Strike days"),
        React.createElement("input", {type:"number", className:"w-20 border rounded-xl px-2 py-1", value:strikeDays, onChange:e=>setStrikeDays(Number(e.target.value))}),
        React.createElement("label", {className:"text-sm"}, "Veg days"),
        React.createElement("input", {type:"number", className:"w-20 border rounded-xl px-2 py-1", value:vegDays, onChange:e=>setVegDays(Number(e.target.value))}),
        React.createElement("label", {className:"text-sm"}, "Cuts/mother/week"),
        React.createElement("input", {type:"number", className:"w-24 border rounded-xl px-2 py-1", value:rate, onChange:e=>setRate(Number(e.target.value))})
      ),
      React.createElement("div", {className:"rounded-xl bg-gray-50 p-3 space-y-1"},
        React.createElement("div", null, cutDate ? `Cut date ≈ ${cutDate.toISOString().slice(0,10)}` : "Enter a valid delivery date to calculate cut timing."),
        React.createElement("div", null, `Lead time: ${lead} days`),
        React.createElement("div", null, `Mothers needed ≈ ${mothersNeeded}`)
      )
    )
  );
}

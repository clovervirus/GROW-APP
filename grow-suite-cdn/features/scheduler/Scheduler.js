import React from "https://esm.sh/react@18";

export default function Scheduler(){
  const [items, setItems] = React.useState(()=>{
    try{ return JSON.parse(localStorage.getItem("sched") || "[]"); }catch{ return []; }
  });
  const [draft, setDraft] = React.useState({ label:"", freq:"daily" });

  React.useEffect(()=>{
    try{ localStorage.setItem("sched", JSON.stringify(items)); }catch{}
  }, [items]);

  function add(){
    if(!draft.label) return;
    const id = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
    setItems(prev=> [...prev, { ...draft, id }]);
    setDraft({ label:"", freq:"daily" });
  }

  function remove(id){
    setItems(prev=> prev.filter(item=> item.id !== id));
  }

  return (
    /** @jsx React.createElement */
    React.createElement("div", {className:"rounded-2xl bg-white p-4 shadow-sm space-y-3"},
      React.createElement("h2", {className:"font-semibold text-lg"}, "Scheduler (lite)"),
      React.createElement("div", {className:"flex gap-2 items-center"},
        React.createElement("input", {
          className:"border rounded-xl px-3 py-2",
          placeholder:"Task",
          value:draft.label,
          onChange:e=>setDraft(prev=> ({...prev, label:e.target.value}))
        }),
        React.createElement("select", {
          className:"border rounded-xl px-3 py-2",
          value:draft.freq,
          onChange:e=>setDraft(prev=> ({...prev, freq:e.target.value}))
        },
          React.createElement("option", {value:"daily"}, "Daily"),
          React.createElement("option", {value:"weekly"}, "Weekly"),
          React.createElement("option", {value:"monthly"}, "Monthly"),
        ),
        React.createElement("button", {className:"px-3 py-1 rounded-full border", onClick:add}, "Add")
      ),
      React.createElement("ul", {className:"text-sm space-y-1"},
        items.map(item=> React.createElement("li", {key:item.id, className:"flex gap-2 items-center"},
          React.createElement("span", {className:"px-2 py-0.5 rounded-full bg-gray-100 border"}, item.freq),
          React.createElement("span", null, item.label),
          React.createElement("button", {className:"ml-auto text-red-600", onClick:()=>remove(item.id)}, "Delete")
        ))
      )
    )
  );
}

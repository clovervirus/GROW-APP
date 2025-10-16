import React from "https://esm.sh/react@18";
import { downloadCSV, parseCSV } from "./csv.js";

export default function Inventory(){
  const [rows, setRows] = React.useState(()=>{
    try{ return JSON.parse(localStorage.getItem("inv_rows") || "[]"); }catch{ return []; }
  });
  const [draft, setDraft] = React.useState({ id:"", type:"mother", strain:"", qty:1 });

  React.useEffect(()=>{
    try{ localStorage.setItem("inv_rows", JSON.stringify(rows)); }catch{}
  }, [rows]);

  function addRow(){
    if(!draft.id) return;
    setRows(prev=> [...prev, { ...draft, qty: Number(draft.qty) || 1 }]);
    setDraft({ id:"", type:"mother", strain:"", qty:1 });
  }

  function deleteRow(index){
    setRows(prev=> prev.filter((_,i)=> i!==index));
  }

  return (
    /** @jsx React.createElement */
    React.createElement("div", {className:"rounded-2xl bg-white p-4 shadow-sm space-y-3"},
      React.createElement("h2", {className:"font-semibold text-lg"}, "Inventory / Lifecycle"),
      React.createElement("div", {className:"flex flex-wrap gap-2 items-center"},
        React.createElement("input", {
          className:"border rounded-xl px-3 py-2",
          placeholder:"ID",
          value:draft.id,
          onChange:e=>setDraft(prev=> ({...prev, id:e.target.value}))
        }),
        React.createElement("select", {
          className:"border rounded-xl px-3 py-2",
          value:draft.type,
          onChange:e=>setDraft(prev=> ({...prev, type:e.target.value}))
        },
          React.createElement("option", {value:"mother"}, "Mother"),
          React.createElement("option", {value:"clone"}, "Clone"),
          React.createElement("option", {value:"teen"}, "Teen"),
          React.createElement("option", {value:"flower"}, "Flower"),
        ),
        React.createElement("input", {
          className:"border rounded-xl px-3 py-2",
          placeholder:"Strain",
          value:draft.strain,
          onChange:e=>setDraft(prev=> ({...prev, strain:e.target.value}))
        }),
        React.createElement("input", {
          type:"number",
          className:"w-24 border rounded-xl px-3 py-2",
          placeholder:"Qty",
          value:draft.qty,
          onChange:e=>setDraft(prev=> ({...prev, qty:e.target.value}))
        }),
        React.createElement("button", {className:"px-3 py-1 rounded-full border", onClick:addRow}, "Add")
      ),
      React.createElement("table", {className:"text-sm w-full"},
        React.createElement("thead", null,
          React.createElement("tr", null, ["ID","Type","Strain","Qty",""].map(header=> React.createElement("th", {key:header, className:"text-left"}, header)))
        ),
        React.createElement("tbody", null,
          rows.map((row,index)=> React.createElement("tr", {key:`row-${index}`},
            React.createElement("td", null, row.id),
            React.createElement("td", null, row.type),
            React.createElement("td", null, row.strain),
            React.createElement("td", null, row.qty),
            React.createElement("td", null, React.createElement("button", {className:"text-red-600", onClick:()=>deleteRow(index)}, "Delete"))
          ))
        )
      ),
      React.createElement("div", {className:"flex gap-2"},
        React.createElement("button", {className:"px-3 py-1 rounded-full border", onClick:()=>downloadCSV(rows)}, "Export CSV"),
        React.createElement("label", {className:"px-3 py-1 rounded-full border cursor-pointer"}, "Import CSV",
          React.createElement("input", {
            type:"file",
            accept:".csv,text/csv",
            className:"hidden",
            onChange: async (event)=>{
              const file = event.target.files?.[0];
              if(!file) return;
              const text = await file.text();
              const parsed = parseCSV(text);
              setRows(parsed);
              event.target.value = "";
            }
          })
        )
      ),
      React.createElement(CapacityWidget, null)
    )
  );
}

function CapacityWidget(){
  const [target, setTarget] = React.useState(75);
  const [weeks, setWeeks] = React.useState(8);
  const [rate, setRate] = React.useState(10);
  const mothers = React.useMemo(()=> Math.ceil(target / (rate * weeks || 1)), [target, weeks, rate]);

  return (
    /** @jsx React.createElement */
    React.createElement("div", {className:"rounded-xl bg-gray-50 p-3 space-y-2"},
      React.createElement("div", {className:"font-semibold"}, "Capacity planning"),
      React.createElement("div", {className:"flex flex-wrap gap-2 items-center"},
        React.createElement("label", {className:"text-sm"}, "Clones target"),
        React.createElement("input", {type:"number", className:"w-24 border rounded-xl px-2 py-1", value:target, onChange:e=>setTarget(Number(e.target.value))}),
        React.createElement("label", {className:"text-sm"}, "Weeks"),
        React.createElement("input", {type:"number", className:"w-20 border rounded-xl px-2 py-1", value:weeks, onChange:e=>setWeeks(Number(e.target.value))}),
        React.createElement("label", {className:"text-sm"}, "Cuts/mother/week"),
        React.createElement("input", {type:"number", className:"w-24 border rounded-xl px-2 py-1", value:rate, onChange:e=>setRate(Number(e.target.value))})
      ),
      React.createElement("div", null, `Mothers needed ≈ ${mothers}`)
    )
  );
}

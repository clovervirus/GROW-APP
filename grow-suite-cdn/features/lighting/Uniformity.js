import React from "https://esm.sh/react@18";
import { exportCSV } from "./csv.js";

function calcStats(values){
  const nums = values.filter(v=>Number.isFinite(v));
  const avg = nums.length? nums.reduce((a,b)=>a+b,0)/nums.length : 0;
  const min = nums.length? Math.min(...nums): 0;
  const minAvgPct = avg? Math.round((min/avg)*100): 0;
  return {avg:Math.round(avg), minAvgPct};
}

export default function Uniformity(){
  const [size,setSize] = React.useState(3);
  const [vals,setVals] = React.useState(Array(9).fill(0));
  React.useEffect(()=> setVals(Array(size*size).fill(0)), [size]);
  const S = calcStats(vals.map(Number));

  function save(){
    try{
      const list = JSON.parse(localStorage.getItem("lighting:grids")||"[]") || [];
      const rec = {type:"grid", name:`${size}x${size}`, size:`${size}x${size}`, values:vals, avg:S.avg, minAvgPct:S.minAvgPct, ts:new Date().toISOString()};
      localStorage.setItem("lighting:grids", JSON.stringify([rec, ...list].slice(0,100)));
      alert("Saved.");
    }catch{ alert("Save failed"); }
  }

  function exportOne(){
    exportCSV("lighting-uniformity-single.csv", [["type","name","size","values","avg","minAvgPct","ts"],["grid", `${size}x${size}`, `${size}x${size}`, JSON.stringify(vals), S.avg, S.minAvgPct, new Date().toISOString()]]);
  }

  return (
    /** @jsx React.createElement */
    React.createElement("div", {className:"rounded-2xl bg-white p-4 shadow-sm"},
      React.createElement("h2", {className:"font-semibold text-lg"}, "Uniformity Grid"),
      React.createElement("div", {className:"flex gap-2"},
        React.createElement("button", {className:`px-3 py-1 rounded-full border ${size===3?"bg-gray-900 text-white":""}`, onClick:()=>setSize(3)}, "3×3"),
        React.createElement("button", {className:`px-3 py-1 rounded-full border ${size===5?"bg-gray-900 text-white":""}`, onClick:()=>setSize(5)}, "5×5")
      ),
      React.createElement("div", {className:"grid gap-2 mt-3", style:{gridTemplateColumns:`repeat(${size}, minmax(4rem, 1fr))`}},
        vals.map((v,i)=> React.createElement("input", {key:i, type:"number", className:"rounded-xl border px-3 py-2", value:v,
          onChange:e=>{ const a=[...vals]; a[i]=Number(e.target.value); setVals(a);} }))
      ),
      React.createElement("div", {className:"mt-3 text-sm"}, `Avg: ${S.avg} µmol • Uniformity (min/avg): ${S.minAvgPct}%`),
      React.createElement("div", {className:"flex gap-2 mt-2"},
        React.createElement("button", {className:"px-3 py-1 rounded-full border", onClick:save}, "Save"),
        React.createElement("button", {className:"px-3 py-1 rounded-full border", onClick:exportOne}, "Export CSV")
      )
    )
  );
}

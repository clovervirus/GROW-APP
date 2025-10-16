import React from "https://esm.sh/react@18";
let QR;
try {
  QR = await import("https://esm.sh/qrcode");
} catch {
  QR = null;
}

export default function Scouting(){
  const [id, setId] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const canvasRef = React.useRef(null);

  async function makeQR(){
    if(!canvasRef.current) return;
    if(!QR){
      alert("QR CDN blocked; using text fallback");
      const ctx = canvasRef.current.getContext?.("2d");
      if(ctx){
        ctx.clearRect(0,0,canvasRef.current.width, canvasRef.current.height);
        ctx.font = "16px monospace";
        ctx.fillText(id || "NO-ID", 10, 50);
      }
      return;
    }
    await QR.toCanvas(canvasRef.current, id || "NO-ID", { width:128 });
  }

  return (
    /** @jsx React.createElement */
    React.createElement("div", {className:"rounded-2xl bg-white p-4 shadow-sm space-y-3"},
      React.createElement("h2", {className:"font-semibold text-lg"}, "Scouting & QR"),
      React.createElement("div", {className:"flex flex-wrap gap-3 items-center"},
        React.createElement("input", {
          className:"border rounded-xl px-3 py-2",
          placeholder:"Plant ID",
          value:id,
          onChange:e=>setId(e.target.value)
        }),
        React.createElement("button", {className:"px-3 py-1 rounded-full border", onClick:makeQR}, "Generate QR")
      ),
      React.createElement("textarea", {
        className:"border rounded-xl px-3 py-2 w-full",
        rows:4,
        placeholder:"Notes / issues",
        value:notes,
        onChange:e=>setNotes(e.target.value)
      }),
      React.createElement("div", {className:"flex gap-4 items-center"},
        React.createElement("canvas", {ref:canvasRef, width:140, height:140, className:"border rounded"}),
        React.createElement("div", null,
          React.createElement("div", {className:"font-mono"}, id || "NO-ID"),
          React.createElement("div", {className:"text-xs text-gray-500"}, notes ? `${notes.length} chars` : "Add notes above")
        )
      ),
      React.createElement("button", {className:"px-3 py-1 rounded-full border", onClick:()=>window.print()}, "Print")
    )
  );
}

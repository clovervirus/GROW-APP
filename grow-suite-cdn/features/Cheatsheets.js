import React from "https://esm.sh/react@18";

export default function Cheatsheets(){
  const [open, setOpen] = React.useState(false);
  const targets = [
    { stage:"Clones/Seedlings", dli:"6–10", ppfd12:"140–230", ppfd18:"90–140", ppfd24:"60–100" },
    { stage:"Veg", dli:"18–25", ppfd12:"420–580", ppfd18:"280–390", ppfd24:"210–290" },
    { stage:"Flower (12h)", dli:"30–40", ppfd12:"700–930", ppfd18:"—", ppfd24:"—" },
  ];
  return (
    /** @jsx React.createElement */
    React.createElement(React.Fragment, null,
      React.createElement("button", {className:"ml-auto px-3 py-1 rounded-full border", onClick:()=>setOpen(true)}, "Cheatsheets"),
      open && React.createElement("div", {className:"fixed inset-0 bg-black/40 grid place-items-center"},
        React.createElement("div", {className:"bg-white rounded-2xl shadow-xl p-4 w-[min(680px,95vw)]"},
          React.createElement("div", {className:"flex items-center mb-2"},
            React.createElement("h3", {className:"font-semibold text-lg"}, "Lighting & Environmental Cheatsheet"),
            React.createElement("button", {className:"ml-auto px-3 py-1 rounded-full border", onClick:()=>setOpen(false)}, "Close")
          ),
          React.createElement("div", {className:"text-sm"},
            React.createElement("div", {className:"font-semibold mb-1"}, "Stage Targets"),
            React.createElement("table", {className:"w-full text-left text-xs border"},
              React.createElement("thead", null,
                React.createElement("tr", {className:"bg-gray-50"},
                  ["Stage","DLI (mol)","PPFD@12h","PPFD@18h","PPFD@24h"].map((h) =>
                    React.createElement("th", {key:h, className:"p-2 border-b"}, h)
                  )
                )
              ),
              React.createElement("tbody", null,
                targets.map((t,i) => React.createElement("tr", {key:i},
                  React.createElement("td", {className:"p-2 border-b"}, t.stage),
                  React.createElement("td", {className:"p-2 border-b font-mono"}, t.dli),
                  React.createElement("td", {className:"p-2 border-b font-mono"}, t.ppfd12),
                  React.createElement("td", {className:"p-2 border-b font-mono"}, t.ppfd18),
                  React.createElement("td", {className:"p-2 border-b font-mono"}, t.ppfd24)
                ))
              )
            ),
            React.createElement("div", {className:"mt-3"},
              React.createElement("a", {
                href:"https://www.dimluxlighting.com/knowledge/vpd-chart/",
                target:"_blank",
                rel:"noreferrer",
                className:"underline"
              }, "Open a VPD chart (reference)")
            )
          )
        )
      )
    )
  );
}

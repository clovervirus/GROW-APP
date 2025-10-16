import React from "https://esm.sh/react@18";

export default function Environment(){
  return (
    /** @jsx React.createElement */
    React.createElement("div", {className:"rounded-2xl bg-white p-4 shadow-sm"},
      React.createElement("h2", {className:"font-semibold text-lg"}, "Environment (placeholder)"),
      React.createElement("p", {className:"text-sm text-gray-600"},
        "Use Host Shell to embed your Canvas Environment calculator, or replace this with your code later.")
    )
  );
}

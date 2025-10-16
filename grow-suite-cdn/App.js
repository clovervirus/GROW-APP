import React from "https://esm.sh/react@18";
import { BrowserRouter, Routes, Route, NavLink } from "https://esm.sh/react-router-dom@6";
import Lighting from "./features/lighting/Lighting.js";
import Environment from "./features/environment/Environment.js";
import HostShell from "./features/host/HostShell.js";
import Propagation from "./features/propagation/Propagation.js";
import Cheatsheets from "./features/Cheatsheets.js";

const Pill = ({to,label}) =>
  React.createElement(NavLink, {
    to,
    className: ({isActive}) => `px-3 py-1 rounded-full border ${isActive ? "bg-gray-900 text-white":"bg-white"}`
  }, label);

export default function App(){
  return React.createElement(BrowserRouter, null,
    React.createElement("div", {className:"min-h-screen p-4"},
      React.createElement("div", {className:"max-w-7xl mx-auto"},
        React.createElement("header", {className:"mb-4"},
          React.createElement("h1", {className:"text-2xl md:text-3xl font-bold"}, "Grow Suite (CDN)"),
          React.createElement("p", {className:"text-sm text-gray-600"}, "Lighting • Environment • Host • Propagation")
        ),
        React.createElement("div", {className:"mb-4 flex gap-2"},
          React.createElement(Pill, {to:"/", label:"Lighting"}),
          React.createElement(Pill, {to:"/environment", label:"Environment"}),
          React.createElement(Pill, {to:"/host", label:"Host Shell"}),
          React.createElement(Pill, {to:"/propagation", label:"Propagation"}),
          React.createElement(Cheatsheets)
        ),
        React.createElement(Routes, null,
          React.createElement(Route, {path:"/", element: React.createElement(Lighting)}),
          React.createElement(Route, {path:"/environment", element: React.createElement(Environment)}),
          React.createElement(Route, {path:"/host", element: React.createElement(HostShell)}),
          React.createElement(Route, {path:"/propagation", element: React.createElement(Propagation)})
        ),
        React.createElement("footer", {className:"text-xs text-gray-500 mt-6"},
          "Zero-install mode • Tailwind CDN + esm.sh"
        )
      )
    )
  );
}

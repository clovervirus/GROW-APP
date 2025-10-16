import { BrowserRouter, NavLink, Route, Routes } from "react-router-dom";
import Lighting from "./features/lighting/Lighting";
import Environment from "./features/environment/Environment";
import HostShell from "./features/host/HostShell";
import PropagationPlanner from "./features/propagation/PropagationPlanner";

export default function App() {
  const Pill = ({ to, label }: { to: string; label: string }) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `px-3 py-1 rounded-full border ${isActive ? "bg-gray-900 text-white" : "bg-white"}`
      }
    >
      {label}
    </NavLink>
  );

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 text-gray-900 p-4">
        <div className="max-w-7xl mx-auto">
          <header className="mb-4">
            <h1 className="text-2xl md:text-3xl font-bold">Grow Suite</h1>
            <p className="text-sm text-gray-600">
              Lighting • Environment • Host • Propagation
            </p>
          </header>
          <div className="mb-4 flex gap-2">
            <Pill to="/" label="Lighting" />
            <Pill to="/environment" label="Environment" />
            <Pill to="/host" label="Host Shell" />
            <Pill to="/propagation" label="Propagation Planner" />
          </div>
          <Routes>
            <Route path="/" element={<Lighting />} />
            <Route path="/environment" element={<Environment />} />
            <Route path="/host" element={<HostShell />} />
            <Route path="/propagation" element={<PropagationPlanner />} />
          </Routes>
          <footer className="text-xs text-gray-500 mt-6">
            Grow Suite • Vite + React + TS + Tailwind
          </footer>
        </div>
      </div>
    </BrowserRouter>
  );
}

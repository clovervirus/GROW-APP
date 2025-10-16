// CO₂/Stage → DLI & PPFD helpers for CDN app (no build)
// hours: 1–24, co2: "ambient"|"enriched"|"high"
export const STAGES = [
  { id: "clones",  label: "Clones / Seedlings" },
  { id: "veg",     label: "Vegetative" },
  { id: "flower",  label: "Flower (12h)" },
];

// Baseline DLI ranges (no CO₂ bump)
const BASE_DLI = {
  clones: [6, 10],
  veg:    [18, 25],
  flower: [30, 40],
};

function bumpForCO2(stage, [lo, hi], co2){
  if (co2 === "ambient") return [lo, hi];
  if (stage === "clones") return [lo, hi];
  if (stage === "flower") return co2 === "enriched" ? [40, 55] : [45, 60];
  // veg
  const f = co2 === "enriched" ? 1.2 : 1.35;
  return [Math.round(lo*f), Math.round(hi*f)];
}

export function dliRange(stage, hours, co2){
  if (stage === "flower" && hours === 24) return [0,0];
  return bumpForCO2(stage, BASE_DLI[stage], co2);
}

export function ppfdRange(stage, hours, co2){
  const [dLo, dHi] = dliRange(stage, hours, co2);
  if (!hours) return [0,0];
  const toPPFD = (d) => Math.round(d / (hours * 0.0036));
  return [toPPFD(dLo), toPPFD(dHi)];
}

export function labelFor(stage){
  const s = STAGES.find(x=>x.id===stage); return s? s.label: stage;
}

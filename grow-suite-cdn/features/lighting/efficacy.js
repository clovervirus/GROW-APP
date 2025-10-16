// Simple fixture efficacy table
export const FIXTURES = [
  { id:"acib430", name:"AC Infinity IB-430", watts:430, effic:2.6 },
  { id:"acib260", name:"AC Infinity IB-260", watts:260, effic:2.6 },
];

export function estimatePPFD({watts, effic=2.6, area_m2=1.11}){
  // PPF ≈ watts * effic (µmol/s). PPFD ≈ PPF/area.
  const ppf = watts*effic;
  return Math.round(ppf/area_m2);
}

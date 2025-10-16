import React from "https://esm.sh/react@18";

// ──────────────────────────────────────────────────────────────────────────────
// Presets and stage targets
const PRESETS = [
  { id: "led_white", name: "White LED 3000–4000K (est)", lpu: 67 },
  { id: "sunlight", name: "Sunlight (est)", lpu: 54 },
  { id: "hps", name: "HPS (est)", lpu: 90 },
  { id: "mh", name: "Metal Halide (est)", lpu: 68 },
  { id: "custom", name: "Custom…", lpu: 67 },
];

const BASE_DLI = {
  clones: [6, 10],
  veg: [18, 25],
  flower: [30, 40], // 12h, no CO₂ bump in base
};

function adjustForCO2(stageId, dli, co2) {
  if (!co2) return dli;
  if (stageId === "flower") return [40, 55];
  if (stageId === "veg") return [Math.round(dli[0] * 1.2), Math.round(dli[1] * 1.2)];
  return dli; // clones/seedlings typically unchanged
}

const STAGES = [
  { id: "clones", label: "Clones / Seedlings" },
  { id: "veg", label: "Vegetative" },
  { id: "flower", label: "Flower (12h)" },
];

const FIXTURES = [
  { id: "acib430", name: "AC Infinity IB-430 (S44 class)", watts: 430 },
  { id: "acib260", name: "AC Infinity IB-260 (S33 class)", watts: 260 },
  { id: "customfx", name: "Custom Fixture…", watts: undefined },
];

const STEPS = Array.from({ length: 11 }, (_, i) => i * 10);

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
const cls = (base, extra) => base + (extra ? " " + extra : "");
const fmt = (n, d = 1) => (Number.isFinite(n) ? n.toFixed(d) : "–");
const statusColor = (val, lo, hi) => {
  if (!Number.isFinite(val)) return "text-gray-500";
  if (val < lo) return "text-yellow-600"; // low
  if (val > hi) return "text-red-600"; // high
  return "text-green-700"; // in range
};

// inverse-square distance suggestion from reference
function suggestDistances(ppfdRef, dRefIn, lo, hi) {
  if (!ppfdRef || !dRefIn) return { lo: 0, mid: 0, hi: 0 };
  const mid = (lo + hi) / 2;
  const calc = (target) => dRefIn * Math.sqrt(ppfdRef / target);
  return { lo: calc(hi), mid: calc(mid), hi: calc(lo) }; // higher target => closer distance
}

// ──────────────────────────────────────────────────────────────────────────────
export default function Lighting() {
  const { useMemo, useState, useEffect } = React;

  // Mode
  const [mode, setMode] = useState("reading"); // "reading" | "profile"

  // Units + live reading
  const [unit, setUnit] = useState("fc"); // "lux" | "fc" | "ppfd"
  const [reading, setReading] = useState(410);
  const [currentDistanceIn, setCurrentDistanceIn] = useState(0);

  // Spectrum
  const [presetId, setPresetId] = useState("led_white");
  const [customLpu, setCustomLpu] = useState(67);
  const spectrum = useMemo(() => PRESETS.find((p) => p.id === presetId) || PRESETS[0], [presetId]);
  const lpu = presetId === "custom" ? customLpu : spectrum.lpu;

  // Schedule / stage / CO2
  const [hours, setHours] = useState(18);
  const [stageId, setStageId] = useState("veg");
  const [co2, setCo2] = useState(false);
  const [gridText, setGridText] = useState("");
  const [uniformStats, setUniformStats] = useState(null);

  // Profiles
  const [fixtureId, setFixtureId] = useState("acib430");
  const [dimPercent, setDimPercent] = useState(100);
  const [calibPercent, setCalibPercent] = useState(100);
  const [calibReading, setCalibReading] = useState(0);
  const [calibDistanceIn, setCalibDistanceIn] = useState(0);

  // Conversions
  const toLux = (val) => (unit === "lux" ? val : unit === "fc" ? val * 10.764 : val * lpu);
  const fromLuxToPPFD = (luxVal) => (lpu > 0 ? luxVal / lpu : 0);

  // Profile-mode PPFD at calibration distance
  const ppfdProfileAtCalib = useMemo(() => {
    if (mode !== "profile" || !calibReading || !calibPercent) return 0;
    let ppfd100 = 0;
    if (unit === "ppfd") {
      ppfd100 = calibReading / (calibPercent / 100);
    } else {
      const lux100 = toLux(calibReading) / (calibPercent / 100);
      ppfd100 = fromLuxToPPFD(lux100);
    }
    return ppfd100 * (dimPercent / 100);
  }, [mode, calibReading, calibPercent, dimPercent, unit, lpu]);

  // Reading-mode PPFD
  const ppfdReading = useMemo(() => {
    if (mode !== "reading") return 0;
    if (!reading) return 0;
    if (unit === "ppfd") return reading;
    return fromLuxToPPFD(toLux(reading));
  }, [mode, reading, unit, lpu]);

  // Unified ref values
  const ppfdAtRefDist = mode === "profile" ? ppfdProfileAtCalib : ppfdReading;
  const refDistIn = mode === "profile" ? calibDistanceIn : currentDistanceIn;

  // Targets per hours (+CO2)
  const dliBase = BASE_DLI[stageId];
  const dliRange = adjustForCO2(stageId, dliBase, co2);
  const [dliLo, dliHi] = dliRange;
  const toPPFDfromDLI = (dli) => dli / (hours * 0.0036);
  const ppfdLo = Math.round(toPPFDfromDLI(dliLo));
  const ppfdHi = Math.round(toPPFDfromDLI(dliHi));

  // Live PPFD/DLI
  const livePPFD = useMemo(() => {
    if (stageId === "flower" && hours === 24) return 0; // N/A
    return mode === "profile" ? ppfdProfileAtCalib : ppfdReading;
  }, [mode, ppfdProfileAtCalib, ppfdReading, stageId, hours]);
  const liveDLI = livePPFD * hours * 0.0036;

  // Distance suggestion
  const dist = suggestDistances(ppfdAtRefDist, refDistIn, ppfdLo, ppfdHi);

  // Handshake: ready + stream PPFD to Host
  useEffect(() => {
    try { window.parent?.postMessage({ type: "lighting:ready" }, "*"); } catch {}
  }, []);
  useEffect(() => {
    const v = Math.round(livePPFD || 0);
    if (Number.isFinite(v) && v > 0) {
      try { window.parent?.postMessage({ type: "lighting:ppfd", value: v }, "*"); } catch {}
    }
  }, [livePPFD]);

  function calculateUniformity(){
    const vals = (gridText || "")
      .split(/[^0-9.]+/)
      .filter(Boolean)
      .map(Number)
      .filter((v) => Number.isFinite(v) && v > 0);
    if(!vals.length){
      setUniformStats(null);
      return;
    }
    const sum = vals.reduce((a, b) => a + b, 0);
    const avg = sum / vals.length;
    const min = Math.min(...vals);
    const uniform = avg ? (min / avg) * 100 : 0;
    setUniformStats({ count: vals.length, avg, min, uniform });
  }

  function clearUniformity(){
    setGridText("");
    setUniformStats(null);
  }


  // Small render helpers
  function renderTargets(hrs) {
    return React.createElement(
      "ul",
      { className: "text-sm list-disc pl-4 space-y-1 text-gray-700" },
      STAGES.map((s) => {
        const na = s.id === "flower" && hrs === 24;
        const dli = adjustForCO2(s.id, BASE_DLI[s.id], co2);
        const pLo = Math.round(dli[0] / (hrs * 0.0036));
        const pHi = Math.round(dli[1] / (hrs * 0.0036));
        return React.createElement(
          "li",
          { key: s.id },
          React.createElement("span", { className: "font-medium" }, s.label),
          ": ",
          na
            ? React.createElement("span", { className: "text-gray-500" }, `N/A at ${hrs}h`)
            : React.createElement(
                React.Fragment,
                null,
                "DLI ",
                React.createElement("span", { className: "font-mono" }, `${dli[0]}–${dli[1]}`),
                ", PPFD target ",
                React.createElement("span", { className: "font-mono" }, `${pLo}–${pHi} µmol`),
                ` @ ${hrs}h ${co2 ? "(CO₂)" : ""}`
              )
        );
      })
    );
  }

  // UI bits
  const pill = (active, label, onClick) =>
    React.createElement(
      "button",
      { className: cls("px-3 py-1 rounded-full border", active ? "bg-gray-900 text-white" : "bg-white"), onClick },
      label
    );

  return React.createElement(
    "div",
    { className: "min-h-screen w-full bg-gray-50 text-gray-900 p-6" },
    React.createElement(
      "div",
      { className: "max-w-6xl mx-auto" },

      // Header
      React.createElement(
        "header",
        { className: "mb-6" },
        React.createElement("h1", { className: "text-2xl md:text-3xl font-bold" }, "Grow Light PPFD & DLI Calculator"),
        React.createElement(
          "p",
          { className: "text-sm text-gray-600 mt-1" },
          "Convert lux, foot-candles, or PPFD to DLI. Calibrate AC Infinity lights, choose 10% dim steps, compare with/without CO₂, and get distance suggestions."
        )
      ),

      // Mode selector
      React.createElement(
        "div",
        { className: "mb-4 flex flex-wrap gap-2" },
        pill(mode === "reading", "Meter Reading Mode", () => setMode("reading")),
        pill(mode === "profile", "Fixture Profile Mode (10% dims)", () => setMode("profile"))
      ),

      // Top grid: inputs
      React.createElement(
        "div",
        { className: "grid md:grid-cols-2 gap-4 mb-6" },

        // Left card: reading/profile
        React.createElement(
          "div",
          { className: "rounded-2xl shadow-sm bg-white p-4" },
          mode === "reading"
            ? React.createElement(
                React.Fragment,
                null,
                React.createElement("h2", { className: "font-semibold mb-3" }, "Reading"),
                React.createElement(
                  "div",
                  { className: "flex flex-wrap items-center gap-3" },
                  React.createElement("input", {
                    type: "number",
                    className: "w-40 rounded-xl border px-3 py-2",
                    value: reading,
                    min: 0,
                    onChange: (e) => setReading(Number(e.target.value)),
                  }),
                  React.createElement(
                    "select",
                    {
                      className: "rounded-xl border px-3 py-2",
                      value: unit,
                      onChange: (e) => setUnit(e.target.value),
                    },
                    React.createElement("option", { value: "lux" }, "lux"),
                    React.createElement("option", { value: "fc" }, "foot-candles"),
                    React.createElement("option", { value: "ppfd" }, "PPFD (µmol·m⁻²·s⁻¹)")
                  ),
                  React.createElement(
                    "div",
                    { className: "flex items-center gap-2" },
                    React.createElement("label", { className: "text-sm" }, "Current distance"),
                    React.createElement("input", {
                      type: "number",
                      className: "w-24 rounded-xl border px-3 py-2",
                      value: currentDistanceIn,
                      min: 0,
                      onChange: (e) => setCurrentDistanceIn(Number(e.target.value)),
                      placeholder: "inches",
                    })
                  )
                ),
                React.createElement(
                  "p",
                  { className: "text-xs text-gray-500 mt-2" },
                  "1 fc = 10.764 lux • PPFD is direct PAR reading"
                )
              )
            : React.createElement(
                React.Fragment,
                null,
                React.createElement("h2", { className: "font-semibold mb-3" }, "Fixture Profile & Calibration"),
                React.createElement(
                  "div",
                  { className: "space-y-3" },
                  React.createElement(
                    "div",
                    { className: "flex items-center gap-3" },
                    React.createElement("label", { className: "text-sm" }, "Fixture"),
                    React.createElement(
                      "select",
                      {
                        className: "rounded-xl border px-3 py-2",
                        value: fixtureId,
                        onChange: (e) => setFixtureId(e.target.value),
                      },
                      FIXTURES.map((f) =>
                        React.createElement(
                          "option",
                          { key: f.id, value: f.id },
                          f.name,
                          f.watts ? ` • ${f.watts}W` : ""
                        )
                      )
                    )
                  ),
                  React.createElement(
                    "div",
                    { className: "flex flex-wrap items-center gap-3" },
                    React.createElement("label", { className: "text-sm" }, "Calibration reading"),
                    React.createElement("input", {
                      type: "number",
                      className: "w-28 rounded-xl border px-3 py-2",
                      value: calibReading,
                      min: 0,
                      onChange: (e) => setCalibReading(Number(e.target.value)),
                      placeholder: "e.g., 650",
                    }),
                    React.createElement(
                      "select",
                      {
                        className: "rounded-xl border px-3 py-2",
                        value: unit,
                        onChange: (e) => setUnit(e.target.value),
                      },
                      React.createElement("option", { value: "lux" }, "lux"),
                      React.createElement("option", { value: "fc" }, "foot-candles"),
                      React.createElement("option", { value: "ppfd" }, "PPFD (µmol·m⁻²·s⁻¹)")
                    ),
                    React.createElement("span", { className: "text-sm text-gray-700" }, "at"),
                    React.createElement(
                      "select",
                      {
                        className: "rounded-xl border px-3 py-2",
                        value: calibPercent,
                        onChange: (e) => setCalibPercent(Number(e.target.value)),
                      },
                      STEPS.map((s) => React.createElement("option", { key: s, value: s }, `${s}%`))
                    ),
                    React.createElement(
                      "div",
                      { className: "flex items-center gap-2" },
                      React.createElement("label", { className: "text-sm" }, "Calibration distance"),
                      React.createElement("input", {
                        type: "number",
                        className: "w-24 rounded-xl border px-3 py-2",
                        value: calibDistanceIn,
                        min: 0,
                        onChange: (e) => setCalibDistanceIn(Number(e.target.value)),
                        placeholder: "inches",
                      })
                    )
                  ),
                  React.createElement(
                    "div",
                    { className: "flex items-center gap-3" },
                    React.createElement("label", { className: "text-sm" }, "Working dimmer"),
                    React.createElement("input", {
                      type: "range",
                      min: 0,
                      max: 100,
                      step: 10,
                      value: dimPercent,
                      onChange: (e) => setDimPercent(Number(e.target.value)),
                      className: "w-full",
                    }),
                    React.createElement("div", { className: "w-16 text-right font-mono" }, `${dimPercent}%`)
                  ),
                  React.createElement(
                    "p",
                    { className: "text-xs text-gray-500" },
                    "Predicted PPFD at ",
                    dimPercent,
                    "% (at calibration distance): ",
                    React.createElement("span", { className: "font-mono" }, fmt(ppfdProfileAtCalib, 0)),
                    " µmol·m⁻²·s⁻¹."
                  )
                )
              )
        ),

        // Right card: Schedule
        React.createElement(
          "div",
          { className: "rounded-2xl shadow-sm bg-white p-4" },
          React.createElement("h2", { className: "font-semibold mb-3" }, "Schedule"),
          React.createElement(
            "div",
            { className: "flex items-center gap-3 mb-3" },
            React.createElement("label", { className: "text-sm text-gray-700" }, "Photoperiod (hours/day)"),
            React.createElement("input", {
              type: "number",
              className: "w-28 rounded-xl border px-3 py-2",
              value: hours,
              min: 1,
              max: 24,
              onChange: (e) => setHours(Number(e.target.value)),
            })
          ),
          React.createElement(
            "div",
            { className: "flex items-center gap-3 mb-3" },
            React.createElement("label", { className: "text-sm text-gray-700" }, "Stage"),
            React.createElement(
              "select",
              {
                className: "rounded-xl border px-3 py-2",
                value: stageId,
                onChange: (e) => setStageId(e.target.value),
              },
              STAGES.map((s) => React.createElement("option", { key: s.id, value: s.id }, s.label))
            )
          ),
          React.createElement(
            "div",
            { className: "flex items-center gap-3" },
            React.createElement("label", { className: "text-sm text-gray-700" }, "CO₂ enriched"),
            React.createElement("input", {
              type: "checkbox",
              className: "h-5 w-5",
              checked: co2,
              onChange: (e) => setCo2(e.target.checked),
            })
          )
        )
      ),

      // Spectrum + Results + Distance
      React.createElement(
        "div",
        { className: "grid md:grid-cols-3 gap-4 mb-6" },

        // Spectrum
        React.createElement(
          "div",
          { className: "rounded-2xl shadow-sm bg-white p-4 md:col-span-1" },
          React.createElement("h2", { className: "font-semibold mb-3" }, "Spectrum Preset"),
          React.createElement(
            "select",
            {
              className: "w-full rounded-xl border px-3 py-2 mb-3",
              value: presetId,
              onChange: (e) => setPresetId(e.target.value),
            },
            PRESETS.map((p) => React.createElement("option", { key: p.id, value: p.id }, p.name))
          ),
          presetId === "custom" &&
            React.createElement(
              "div",
              { className: "flex items-center gap-3" },
              React.createElement("label", { className: "text-sm text-gray-700" }, "Lux per µmol"),
              React.createElement("input", {
                type: "number",
                className: "w-32 rounded-xl border px-3 py-2",
                value: customLpu,
                min: 1,
                onChange: (e) => setCustomLpu(Number(e.target.value)),
              })
            ),
          React.createElement(
            "p",
            { className: "text-xs text-gray-500 mt-2" },
            "Using ",
            React.createElement("span", { className: "font-mono" }, lpu),
            " lux per µmol·m⁻²·s⁻¹."
          )
        ),

        // Live Results
        React.createElement(
          "div",
          { className: "rounded-2xl shadow-sm bg-white p-4 md:col-span-1" },
          React.createElement("h2", { className: "font-semibold mb-3" }, "Live Results"),
          React.createElement(
            "div",
            { className: "grid grid-cols-1 gap-3" },
            React.createElement(
              "div",
              { className: "rounded-xl bg-gray-50 p-3" },
              React.createElement("div", { className: "text-xs text-gray-500" }, "Estimated PPFD"),
              React.createElement(
                "div",
                { className: cls("text-2xl font-bold", statusColor(livePPFD, ppfdLo, ppfdHi)) },
                fmt(livePPFD, 0),
                " ",
                React.createElement("span", { className: "text-base font-semibold" }, "µmol·m⁻²·s⁻¹")
              ),
              React.createElement(
                "div",
                { className: "text-xs text-gray-500" },
                `Target: ${ppfdLo}–${ppfdHi} for ${STAGES.find((s) => s.id === stageId).label} at ${hours}h ${co2 ? "(CO₂)" : ""}`
              )
            ),
            React.createElement(
              "div",
              { className: "rounded-xl bg-gray-50 p-3" },
              React.createElement("div", { className: "text-xs text-gray-500" }, "Estimated DLI"),
              React.createElement(
                "div",
                { className: cls("text-2xl font-bold", statusColor(liveDLI, dliLo, dliHi)) },
                fmt(liveDLI, 1),
                " ",
                React.createElement("span", { className: "text-base font-semibold" }, "mol·m⁻²·day⁻¹")
              ),
              React.createElement(
                "div",
                { className: "text-xs text-gray-500" },
                `Target: ${dliLo}–${dliHi} ${co2 ? "(CO₂)" : ""}`
              )
            )
          )
        ),

        // Distance suggestion
        React.createElement(
          "div",
          { className: "rounded-2xl shadow-sm bg-white p-4 md:col-span-1" },
          React.createElement("h2", { className: "font-semibold mb-3" }, "Distance Suggestion"),
          refDistIn && ppfdAtRefDist
            ? React.createElement(
                "div",
                { className: "space-y-1" },
                React.createElement(
                  "div",
                  { className: "text-sm text-gray-700" },
                  "Reference: ",
                  React.createElement("span", { className: "font-mono" }, fmt(ppfdAtRefDist, 0)),
                  " µmol at ",
                  React.createElement("span", { className: "font-mono" }, `${refDistIn}"`)
                ),
                React.createElement(
                  "div",
                  { className: "text-sm text-gray-700" },
                  "To hit mid target: ",
                  React.createElement("span", { className: "font-mono" }, `${fmt(dist.mid, 1)}"`)
                ),
                React.createElement(
                  "div",
                  { className: "text-xs text-gray-500" },
                  "Range: ",
                  React.createElement("span", { className: "font-mono" }, `${fmt(dist.lo, 1)}"`),
                  " (high target) → ",
                  React.createElement("span", { className: "font-mono" }, `${fmt(dist.hi, 1)}"`),
                  " (low target)"
                ),
                React.createElement(
                  "div",
                  { className: "text-xs text-gray-500" },
                  "Tip: adjust in 1–2\" steps; verify with meter and plant response."
                )
              )
            : React.createElement(
                "p",
                { className: "text-sm text-gray-500" },
                "Enter a distance and reading above to get a recommendation."
              )
        )
      ),

      // Helper cards
      React.createElement(
        "div",
        { className: "grid md:grid-cols-2 xl:grid-cols-4 gap-4" },
        React.createElement(
          "div",
          { className: "rounded-2xl shadow-sm bg-white p-4" },
          React.createElement("h3", { className: "font-semibold mb-2" }, "Quick Tips"),
          React.createElement(
            "ul",
            { className: "text-sm list-disc pl-4 space-y-1 text-gray-700" },
            React.createElement("li", null, "Average several points across the canopy for accuracy."),
            React.createElement("li", null, "Presets are approximations; diode spectrum & optics change the factor."),
            React.createElement("li", null, "Distance math uses an inverse-square model—expect small deviations on large panels."),
          )
        ),
        React.createElement(
          "div",
          { className: "rounded-2xl shadow-sm bg-white p-4" },
          React.createElement("h3", { className: "font-semibold mb-2" }, `Stage Targets (for current hours: ${hours}h)`),
          renderTargets(hours)
        ),
        React.createElement(
          "div",
          { className: "rounded-2xl shadow-sm bg-white p-4" },
          React.createElement("h3", { className: "font-semibold mb-2" }, "Uniformity Grid"),
          React.createElement("p", { className: "text-xs text-gray-500 mb-2" }, "Paste 9–25 readings separated by space/comma/newline."),
          React.createElement("textarea", {
            className: "w-full h-32 rounded-xl border px-3 py-2",
            value: gridText,
            onChange: (e) => setGridText(e.target.value),
            placeholder: "e.g. 680 710 695 702 690 675 660 700 705"
          }),
          React.createElement("div", { className: "mt-2 flex gap-2" },
            React.createElement("button", { className: "px-3 py-1 rounded-full border bg-gray-900 text-white", onClick: calculateUniformity }, "Calculate"),
            React.createElement("button", { className: "px-3 py-1 rounded-full border", onClick: clearUniformity }, "Clear")
          ),
          uniformStats && React.createElement("div", { className: "mt-3 text-sm space-y-1" },
            React.createElement("div", null, "Samples: ", React.createElement("span", { className: "font-mono" }, uniformStats.count)),
            React.createElement("div", null, "Avg: ", React.createElement("span", { className: "font-mono" }, uniformStats.avg.toFixed(1))),
            React.createElement("div", null, "Min: ", React.createElement("span", { className: "font-mono" }, uniformStats.min.toFixed(1))),
            React.createElement("div", null, "Min/Avg: ", React.createElement("span", { className: "font-mono" }, uniformStats.uniform.toFixed(1)), "%")
          )
        ),
        React.createElement(
          "div",
          { className: "rounded-2xl shadow-sm bg-white p-4" },
          React.createElement("h3", { className: "font-semibold mb-2" }, "24-Hour Targets (any non-flower stage)"),
          renderTargets(24)
        )
      ),

      React.createElement(
        "footer",
        { className: "text-xs text-gray-500 mt-6" },
        "Built for Red Clover Project • Calculator (CDN)"
      )
    )
  );
}

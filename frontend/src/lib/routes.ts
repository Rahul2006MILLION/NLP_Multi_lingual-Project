/** One entry per original Streamlit page, in the same order. */
export const ROUTES = [
  { path: "/", nav: "Overview", streamlit: "1. Research Overview" },
  { path: "/demo", nav: "Demo", streamlit: "2. Live Multilingual Demo" },
  { path: "/comparison", nav: "Results", streamlit: "3. Baseline vs. Mitigation" },
  { path: "/calibration", nav: "Calibration", streamlit: "4. Calibration Analysis (ECE & Curves)" },
  { path: "/consistency", nav: "Consistency", streamlit: "5. Cross-Lingual Consistency" },
  { path: "/experiments", nav: "Strategies", streamlit: "6. Strategy Experiments & Validation" },
  { path: "/report", nav: "Report", streamlit: "7. Research Report & Paper" },
] as const;

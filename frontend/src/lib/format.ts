/** Number formatting identical to the original Streamlit display strings. */
export const pct = (v: number, digits = 1) => `${(v * 100).toFixed(digits)}%`;
export const pctRaw = (v: number, digits = 1) => `${v.toFixed(digits)}%`;
export const signed = (v: number, digits = 1) => `${v >= 0 ? "+" : ""}${v.toFixed(digits)}`;
export const fixed = (v: number, digits = 3) => v.toFixed(digits);

export const cn = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(" ");

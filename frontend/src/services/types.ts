export type LangCode = "en" | "hi" | "bn" | "te" | "ta";
export type StrategyKey = "baseline" | "A" | "B" | "C" | "D" | "E";
export type Tone = "danger" | "success";

export interface Figure {
  url: string;
  caption: string;
  filename: string;
}
export type FigureMap = Record<string, Figure | null>;

export interface MetricCard {
  label: string;
  value: string;
  note: string;
  tone: Tone;
}

export interface Language {
  name: string;
  native: string;
  script: string;
}

export interface Meta {
  title: string;
  caption: string;
  page_title: string;
  hardware: string[];
  partitions: string[];
  footer: string;
  languages: Record<LangCode, Language>;
}

export interface Overview {
  title: string;
  subtitle: string;
  metrics: MetricCard[];
  abstract_md: string;
  research_questions: { code: string; title: string; body: string }[];
  figures: FigureMap;
}

export interface DemoOptions {
  languages: ({ code: LangCode } & Language)[];
  examples: { index: number; id: string; domain: string; question_en: string }[];
  strategies: { key: StrategyKey; label: string }[];
  default_strategy: StrategyKey;
  tau: { min: number; max: number; default: number; step: number };
}

export interface DemoRequest {
  language: LangCode;
  example_index: number;
  strategy: StrategyKey;
  tau: number;
}

export interface DemoResult {
  question_id: string;
  question_en: string;
  domain: string;
  language: LangCode;
  language_name: string;
  strategy: StrategyKey;
  tau: number;
  status: "delivered" | "abstained";
  final_answer: string | null;
  confidence: {
    raw_verbalized: number;
    statistical: number;
    calibrated: number;
    delta_vs_raw: number;
    is_abstained: boolean;
  };
  evidence: string;
  claims: string[];
  trace: { label: string; text: string }[];
  trace_note: string | null;
}

export interface ComparisonRow {
  code: LangCode;
  language: string;
  baseline_acc: number;
  mitigated_acc: number;
  accuracy_gain_pp: number;
  rel_error_reduction: number | null;
  baseline_ece: number;
  mitigated_ece: number;
  ece_reduction: number;
}
export interface Comparison {
  title: string;
  subtitle: string;
  rows: ComparisonRow[];
  figures: FigureMap;
}

export interface Calibration {
  title: string;
  subtitle: string;
  formula_latex: string;
  explanation_md: string;
  parameters_md: string;
  parameters: { name: string; value: number; reference?: boolean }[];
  figures: FigureMap;
}

export interface Consistency {
  title: string;
  subtitle: string;
  metrics: MetricCard[];
  audit_intro: string;
  audit_items: { title: string; body_md: string }[];
  figures: FigureMap;
}

export interface Experiments {
  title: string;
  subtitle: string;
  validation_table: {
    strategy: string;
    validation_acc: string;
    validation_brier: string;
    avg_latency: string;
    selected: string;
  }[];
  figures: FigureMap;
}

export interface DocSummary {
  slug: string;
  label: string;
}
export interface Doc extends DocSummary {
  available: boolean;
  markdown: string | null;
  missing_note: string | null;
}
export interface DownloadItem {
  key: string;
  label: string;
  filename: string;
  available: boolean;
  url: string;
}

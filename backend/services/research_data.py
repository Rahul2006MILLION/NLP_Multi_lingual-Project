"""
Research reference data displayed by the UI.

Moved unchanged out of the original Streamlit ``app.py`` so the web frontend shows exactly
the same numbers, labels and copy. Nothing here is computed at runtime.
"""

from typing import Any, Dict, List

LANGUAGES: Dict[str, Dict[str, str]] = {
    "en": {"name": "English", "native": "English", "script": "Latin"},
    "hi": {"name": "Hindi", "native": "हिन्दी", "script": "Devanagari"},
    "bn": {"name": "Bengali", "native": "বাংলা", "script": "Bengali"},
    "te": {"name": "Telugu", "native": "తెలుగు", "script": "Telugu"},
    "ta": {"name": "Tamil", "native": "தமிழ்", "script": "Tamil"},
}

# Pre-computed empirical reference data (held-out P_test).
BASELINE_DATA: Dict[str, Dict[str, float]] = {
    "en": {"acc": 0.9556, "c_v": 0.984, "c_s": 0.887, "ece": 0.0440, "bs": 0.0440, "mit_acc": 0.8222, "mit_ece": 0.1115, "mit_bs": 0.1519},
    "hi": {"acc": 0.2381, "c_v": 0.918, "c_s": 0.542, "ece": 0.6798, "bs": 0.6623, "mit_acc": 0.8444, "mit_ece": 0.4902, "mit_bs": 0.3810},
    "bn": {"acc": 0.3556, "c_v": 0.914, "c_s": 0.618, "ece": 0.6049, "bs": 0.6463, "mit_acc": 0.8889, "mit_ece": 0.4295, "mit_bs": 0.3012},
    "te": {"acc": 0.2500, "c_v": 0.953, "c_s": 0.489, "ece": 0.7025, "bs": 0.6692, "mit_acc": 0.8667, "mit_ece": 0.4812, "mit_bs": 0.3704},
    "ta": {"acc": 0.4000, "c_v": 0.939, "c_s": 0.582, "ece": 0.5516, "bs": 0.5791, "mit_acc": 0.8444, "mit_ece": 0.4654, "mit_bs": 0.3497},
}

CURATED_EXAMPLES: List[Dict[str, Any]] = [
    {
        "id": "Q_GEO_DIR_01",
        "question_en": "What is the capital city of Karnataka?",
        "domain": "Geography",
        "evidence": "Bengaluru, officially known as Bangalore, is the capital of Karnataka.",
        "claims": ["Bengaluru is the capital city of Karnataka."],
        "answers": {
            "en": "Bengaluru is the capital city of Karnataka.",
            "hi": "कर्नाटक की राजधानी बेंगलुरु (बैंगलोर) है।",
            "bn": "কর্ণাটকের রাজধানী হল বেঙ্গালুরু।",
            "te": "కర్ణాటక రాజధాని నగరం బెంగళూరు.",
            "ta": "கர்நாடகாவின் தலைநகரம் பெங்களூரு ஆகும்.",
        },
    },
    {
        "id": "Q_GEO_DIR_02",
        "question_en": "Which river flows through Varanasi?",
        "domain": "Geography",
        "evidence": "Varanasi is situated along the banks of the Ganges river in Uttar Pradesh, India.",
        "claims": ["The Ganges river flows through Varanasi."],
        "answers": {
            "en": "The Ganges river flows through Varanasi.",
            "hi": "वाराणसी से होकर गंगा नदी बहती है।",
            "bn": "বারাণসীর মধ্য দিয়ে গঙ্গা নদী প্রবাহিত হয়েছে।",
            "te": "వారణాసి గుండా గంగా నది ప్రవహిస్తుంది.",
            "ta": "வாரணாசி வழியாக கங்கை நதி பாய்கிறது.",
        },
    },
    {
        "id": "Q_GEO_DIR_03",
        "question_en": "What is the highest mountain peak in India?",
        "domain": "Geography",
        "evidence": "Kangchenjunga is the highest mountain peak in India and third highest in the world.",
        "claims": ["Kangchenjunga is the highest mountain peak in India."],
        "answers": {
            "en": "Kangchenjunga is the highest mountain peak in India.",
            "hi": "भारत की सबसे ऊँची पर्वत चोटी कंचनजंघा है।",
            "bn": "ভারতের সর্বোচ্চ পর্বতশৃঙ্গ হল কাঞ্চনজঙ্ঘা।",
            "te": "భారతదేశంలో అత్యంత ఎత్తైన పర్వత శిఖరం కాంచన్‌జంగా.",
            "ta": "இந்தியாவின் மிக உயரமான மலை சிகரம் கஞ்சன்சுங்கா ஆகும்.",
        },
    },
]

# Strategy keys -> the exact option labels used by the Streamlit select box.
STRATEGIES: List[Dict[str, str]] = [
    {"key": "baseline", "label": "Baseline (Direct Native Prompting)"},
    {"key": "A", "label": "Strategy A: Native Prompt Optimization"},
    {"key": "B", "label": "Strategy B: Cross-Lingual Pivot Answering (Selected Winner)"},
    {"key": "C", "label": "Strategy C: Bilingual Verification & Arbitration"},
    {"key": "D", "label": "Strategy D: Evidence-Grounded Refinement"},
    {"key": "E", "label": "Strategy E: Confidence Selective Answering"},
]
DEFAULT_STRATEGY = "B"

TAU = {"min": 0.10, "max": 0.90, "default": 0.50, "step": 0.05}

# Model 2 (Language-Shift Platt) fitted parameters on P_cal.
PLATT_SLOPE_W = 0.892
PLATT_INTERCEPT_B0 = 1.412
PLATT_DELTA: Dict[str, float] = {"en": 0.0, "hi": -2.148, "bn": -1.684, "te": -2.095, "ta": -1.512}

META = {
    "title": "Cross-Lingual Calibration",
    "caption": "Google Gemma 3 4B Instruct | Frozen Spec v4.5",
    "page_title": "Cross-Lingual Calibration & Mitigation | Gemma 3 4B",
    "hardware": ["NVIDIA RTX 4050 (6GB VRAM)", "CUDA 12.x | BitsAndBytes NF4"],
    "partitions": ["P_cal: 75 | P_val: 30 | P_test: 45", "Total Inferences: 4,050 real calls"],
    "footer": "Antigravity Autonomous Research Engine | © 2026",
}

OVERVIEW = {
    "title": "Cross-Lingual Calibration Collapse Under Instruction-Tuning",
    "subtitle": "Investigating Verbalized vs. Statistical Confidence, Answer Consistency, and Real Accuracy Mitigations",
    "metrics": [
        {"label": "Indic Accuracy Collapse", "value": "95.6% → 23.8%", "note": "Drop from English to Hindi on identical facts", "tone": "danger"},
        {"label": "Verbalized Overconfidence ECE", "value": "0.028 → 0.703", "note": "Indic confidence remains >91% despite errors", "tone": "danger"},
        {"label": "Mitigated Indic Accuracy", "value": "31.1% → 77.2%", "note": "+46.1 pp gain via Pivot Answering (Strat B)", "tone": "success"},
        {"label": "Calibration Recovery (M2)", "value": "85.4% ECE Reduction", "note": "M2 Platt scales average ECE to 0.090", "tone": "success"},
    ],
    "abstract_md": (
        "Large Language Models aligned through instruction fine-tuning and RLHF have developed assertive conversational personas. "
        "While highly accurate in English, their cross-lingual performance degrades sharply in lower-resource languages. \n"
        "Crucially, **verbalized confidence does not scale down with accuracy**, creating catastrophic overconfidence where false "
        "propositions are asserted with $>90\\%$ stated certainty.\n\n"
        "This research platform presents empirical findings from **4,050 genuine GPU model inferences** on Google Gemma 3 4B Instruct, "
        "rigorously comparing verbalized confidence against token geometric probabilities, diagnosing grounded consistency failures "
        "across 750 pairwise language evaluations, and demonstrating multi-strategy mitigation pipelines."
    ),
    "research_questions": [
        {"code": "RQ1", "title": "Cross-Lingual Calibration Collapse", "body": "Does instruction fine-tuning induce cross-lingual calibration collapse where non-English prompts produce severe overconfidence?"},
        {"code": "RQ2", "title": "Verbalized vs. Statistical Divergence", "body": "Does internal token-level statistical confidence preserve uncertainty signals that conversational verbalized confidence suppresses?"},
        {"code": "RQ3", "title": "Cross-Lingual Grounded Consistency", "body": "Do high surface-level agreement scores between English and Indic answers conceal factual evidence hallucinations?"},
        {"code": "RQ4", "title": "Multi-Strategy Mitigations", "body": "Can prompt optimization, cross-lingual pivoting, and language-shift Platt scaling restore calibration and accuracy?"},
    ],
}

CALIBRATION = {
    "title": "Calibration Analysis: Reliability Curves & Recalibration",
    "subtitle": "Examining verbalized vs. statistical confidence, quantile binning, and Model 2 Platt Scaling",
    "formula_latex": r"p_2(l) = \sigma(w \cdot \tilde{z} + b_0 + \delta_l), \quad \text{where } \delta_{\text{en}} = 0",
    "explanation_md": (
        "Unlike standard global Platt scaling ($p = \\sigma(w \\cdot z + b_0)$) which fails to account for language competence shifts, "
        "**Model 2** fits a shared slope $w$ with language-specific intercept offsets $\\delta_l$ optimized on the calibration partition "
        "($P_{\\text{cal}}$, $N=75$)."
    ),
    "parameters_md": "**Fitted Parameter Estimates on $P_{\\text{cal}}$:**",
}

CONSISTENCY = {
    "title": "Cross-Lingual Answer Consistency & Grounding Audit",
    "subtitle": "Evaluating 750 pairwise comparisons: LLM Judge surface agreement vs. strict evidence verification",
    "metrics": [
        {"label": "LLM Judge Surface Agreement", "value": "88.4%", "note": "Judge marked answers as semantically agreeing", "tone": "danger"},
        {"label": "True Grounded Evidence Consistency", "value": "28.7% – 37.3%", "note": "Evidence-verified consistency across Indic languages", "tone": "success"},
    ],
    "audit_intro": "Across 750 symmetrical pairwise comparisons, we identified three major categories of cross-lingual inconsistency:",
    "audit_items": [
        {
            "title": "Evidence Hallucination in Indic Scripts (46.1% of pairs)",
            "body_md": "The model produces an assertive, grammatically fluent statement in Hindi/Bengali/Telugu/Tamil that asserts an incorrect entity (e.g. naming an unassociated city or date), which casual LLM judges overlook because the sentence structure matches English.",
        },
        {
            "title": "Script Transliteration Mismatch",
            "body_md": "Entity names transliterated into non-Latin scripts (Devanagari, Bengali) fail exact English string matches despite conveying factual truth. Strategy B solves this by anchoring entities in English first.",
        },
        {
            "title": "Contradictory Cross-Lingual Claims",
            "body_md": "In 24.3% of pairs, the model correctly answers a proposition in English (e.g. *Kangchenjunga*) while asserting a different mountain (e.g. *Nanda Devi*) when queried in Hindi.",
        },
    ],
}

EXPERIMENTS = {
    "title": "Mitigation Strategy Experiments & Selective Answering",
    "subtitle": "Validation selection on P_val (30 questions) and Strategy E Accuracy-Coverage Trade-offs",
    "validation_table": [
        {"strategy": "Strategy A: Native Prompt Optimization", "validation_acc": "30.0%", "validation_brier": "0.6141", "avg_latency": "4.2s", "selected": "No"},
        {"strategy": "Strategy B: Cross-Lingual Pivot Answering", "validation_acc": "76.7%", "validation_brier": "0.1902", "avg_latency": "8.8s", "selected": "No"},
        {"strategy": "Strategy C: Bilingual Verification & Arbitration", "validation_acc": "80.0%", "validation_brier": "0.1797", "avg_latency": "14.5s", "selected": "YES (Winner)"},
        {"strategy": "Strategy D: Evidence-Grounded Refinement", "validation_acc": "50.0%", "validation_brier": "0.4328", "avg_latency": "9.2s", "selected": "No"},
    ],
}

COMPARISON = {
    "title": "Baseline Collapse vs. Mitigation Effectiveness",
    "subtitle": "Comparative evaluation on held-out test partition across English and 4 Indic languages",
}

# Figure slots: (primary filename, fallback filename or None, caption). Same chains as app.py.
FIGURES = {
    "architecture": ("fig14_pipeline_architecture.png", None, "End-to-End Mitigation Architecture"),
    "fig1": ("fig1_baseline_vs_mitigated_accuracy.png", "2_calibration_mitigation_effectiveness_m1_vs_m2.png", "Figure 1: Baseline vs. Mitigated Accuracy by Language (Held-out P_test)"),
    "fig2": ("fig2_overall_accuracy_improvement.png", "fig3_relative_error_reduction.png", "Figure 2: Absolute Accuracy Improvement Across Languages (Percentage Points)"),
    "fig4": ("fig4_baseline_vs_mitigated_ece.png", None, "Figure 4: Baseline vs. Mitigated Expected Calibration Error (ECE)"),
    "fig5": ("fig5_baseline_vs_mitigated_brier_score.png", None, "Figure 5: Baseline vs. Mitigated Brier Score (Lower is Better)"),
    "fig7": ("fig7_reliability_diagrams_pre_post.png", "1_verbalized_vs_statistical_calibration_pre_post.png", "Figure 7: Reliability Diagrams Before and After Language-Shift Platt Recalibration"),
    "fig6": ("fig6_verbalized_vs_statistical_distribution.png", None, "Figure 6: Verbalized vs. Statistical Confidence Distributions"),
    "fig9": ("fig9_confidence_accuracy_gap.png", "4_confidence_accuracy_gap_by_condition.png", "Figure 9: Absolute Confidence-Accuracy Misalignment Gap Across Conditions"),
    "fig8": ("fig8_cross_lingual_consistency.png", "3_cross_lingual_answer_consistency.png", "Figure 8: Cross-Lingual Semantic Agreement Before & After Mitigation"),
    "fig10": ("fig10_accuracy_vs_coverage_curve.png", None, "Figure 10: Accuracy vs. Coverage Curve (Strategy E Selective Answering)"),
    "fig11": ("fig11_selective_risk_vs_coverage.png", None, "Figure 11: Selective Risk vs. Coverage Curve"),
    "fig12": ("fig12_strategy_comparison_heatmap.png", None, "Figure 12: Strategy Comparison Heatmap on Validation Partition"),
    "fig13": ("fig13_inference_latency_comparison.png", None, "Figure 13: Inference Latency Across Mitigation Strategies"),
}

DOCS = {
    "paper": {"label": "Final Research Paper", "path": "docs/final_research_report.md", "missing_note": "Generating final research paper..."},
    "methodology": {"label": "Formal Methodology", "path": "docs/methodology.md", "missing_note": None},
    "results": {"label": "Detailed Results", "path": "docs/results.md", "missing_note": None},
    "limitations": {"label": "Limitations & Scope", "path": "docs/limitations.md", "missing_note": None},
}

DOWNLOADS = {
    "metrics_csv": {"label": "Download Research Metrics (CSV)", "path": "outputs/research_results/research_metrics.csv", "filename": "research_metrics.csv", "mime": "text/csv"},
    "metrics_json": {"label": "Download Empirical Metrics (JSON)", "path": "outputs/urgent_results/metrics_summary.json", "filename": "metrics_summary.json", "mime": "application/json"},
    "paper_md": {"label": "Download Research Paper (Markdown)", "path": "docs/final_research_report.md", "filename": "final_research_report.md", "mime": "text/markdown"},
}

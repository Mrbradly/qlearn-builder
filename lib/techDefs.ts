// lib/techDefs.ts
// Source of truth:
// - Corella QLearn tables (with gold detail) live in lib/corellaTables.ts
// - This file wires them into your Tech tab cleanly

import { CORELLA_TABLES, type CorellaTableId } from "@/lib/corellaTables";

/* ---------------- tools ---------------- */

export type TechTool = "canva" | "adobe" | "notebooklm" | "corella";

export const TECH_TOOLS: { key: TechTool; label: string }[] = [
    { key: "canva", label: "Canva" },
    { key: "adobe", label: "Adobe Express" },
    { key: "notebooklm", label: "NotebookLM" },
    { key: "corella", label: "Corella" },
];

/* ---------------- modes ---------------- */

export type CanvaMode = "presentation" | "interactive";
export type AdobeMode = "poster" | "video" | "interactive" | "podcast";
export type NotebookMode = "sourceText" | "slides" | "video" | "audio" | "infographic";
export type CorellaMode = "strategy";

export const CANVA_MODES: { id: CanvaMode; label: string }[] = [
    { id: "presentation", label: "Presentation" },
    { id: "interactive", label: "Interactive" },
];

export const ADOBE_MODES: { id: AdobeMode; label: string }[] = [
    { id: "poster", label: "Poster" },
    { id: "video", label: "Video" },
    { id: "interactive", label: "Interactive" },
    { id: "podcast", label: "Podcast" },
];

export const NOTEBOOK_MODES: { id: NotebookMode; label: string }[] = [
    { id: "sourceText", label: "Source text" },
    { id: "slides", label: "Slides" },
    { id: "video", label: "Video" },
    { id: "audio", label: "Audio" },
    { id: "infographic", label: "Infographic" },
];

export const CORELLA_MODES: { id: CorellaMode; label: string }[] = [{ id: "strategy", label: "Strategy" }];

/* ---------------- corella strategies ----------------
   IMPORTANT:
   - We allow a "meta" strategy that can output multiple tables.
   - Under the hood, it still pulls the exact HTML from CORELLA_TABLES.
------------------------------------------------------ */

function corellaHtml(id: CorellaTableId): string {
    return CORELLA_TABLES.find((t) => t.id === id)?.html ?? "";
}

function joinTables(...tables: string[]): string {
    // Ensures tables stay separated cleanly when pasted into QLearn
    return tables
        .map((t) => (t || "").trim())
        .filter(Boolean)
        .join("\n\n<!-- =========================================================\n     (AUTO) TABLE BREAK\n========================================================= -->\n\n");
}

/**
 * CorellaStrategyId = what the UI dropdown uses.
 * - It can be a real table id, OR a meta id like "confidence_suite"
 */
export type CorellaStrategyId = CorellaTableId | "confidence_suite";

export type CorellaStrategy = {
    id: CorellaStrategyId; // dropdown id
    title: string;
    description: string;
    nasotIds: string[];
    html: string; // can be one table or multiple tables joined
};

/* ---------------- strategies ---------------- */

export const CORELLA_STRATEGIES: CorellaStrategy[] = [
    // ✅ META STRATEGY: both tables together
    {
        id: "confidence_suite",
        title: "Confidence (Tracker + Checker)",
        description: "First identify what matters (Tracker), then check readiness on one concept (Checker).",
        nasotIds: ["F1", "F2", "F3"],
        html: joinTables(corellaHtml("confidence_tracker"), corellaHtml("confidence_checker")),
    },

    // Everything else stays as single-table strategies
    {
        id: "whats_the_gap",
        title: "What’s the gap?",
        description: "Gap analysis against Success Criteria (vocab/step/reason/example).",
        nasotIds: ["F2", "F3"],
        html: corellaHtml("whats_the_gap"),
    },
    {
        id: "memory_dump",
        title: "Memory dump",
        description: "Brain dump -> criteria check -> targeted questions -> reflection.",
        nasotIds: ["F2", "F3"],
        html: corellaHtml("memory_dump"),
    },
    {
        id: "what_i_think",
        title: "What I Think",
        description: "Initial thinking snapshot (no notes). STOP -> Excel-ready table.",
        nasotIds: ["F2", "F3"],
        html: corellaHtml("what_i_think"),
    },
    {
        id: "question_ladder",
        title: "Question ladder",
        description: "One question at a time, increasing demand (STOP -> table).",
        nasotIds: ["C2", "F1"],
        html: corellaHtml("question_ladder"),
    },
    {
        id: "why_chain",
        title: "Why chain",
        description: "Deepen understanding using only ‘why?’ questions (STOP -> record).",
        nasotIds: ["C3", "F2"],
        html: corellaHtml("why_chain"),
    },
    {
        id: "teach_ai",
        title: "Teach AI",
        description: "Student teaches, Corella acts like a curious learner (STOP -> table).",
        nasotIds: ["C3", "F3"],
        html: corellaHtml("teach_ai"),
    },
    {
        id: "missed_it_fix_it",
        title: "Missed it? Fix it!",
        description: "Analyse one mistake and fix the thinking slip (STOP -> table).",
        nasotIds: ["F2", "F3"],
        html: corellaHtml("missed_it_fix_it"),
    },
    {
        id: "study_planner",
        title: "Study planner",
        description: "Plan focus -> small action -> check -> STOP -> reflection table.",
        nasotIds: ["C2", "F2"],
        html: corellaHtml("study_planner"),
    },
    {
        id: "retrieval_practice",
        title: "Retrieval practice",
        description: "10 questions, one at a time (MC then short response).",
        nasotIds: ["F2", "F3"],
        html: corellaHtml("retrieval_practice"),
    },
];

/* ---------------- helpers ---------------- */

// For fast lookup in UI (including meta ids)
export const CORELLA_STRATEGY_BY_ID: Record<string, CorellaStrategy> = CORELLA_STRATEGIES.reduce((acc, s) => {
    acc[s.id] = s;
    return acc;
}, {} as Record<string, CorellaStrategy>);

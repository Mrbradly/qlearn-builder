// app/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { autoCognitiveVerbs, autoVocabulary } from "@/lib/vocab";
import { buildQLearnHtmlFromDraft } from "@/lib/qlearnBuild";
import { NASOT_DEFS, type NasotElementDef, type NasotFocusTab } from "@/lib/nasotDefs";
import { CORELLA_STRATEGIES } from "@/lib/techDefs";

/* ---------------- types ---------------- */

type Tab = "goals" | "criteria" | "vocab" | "warmup" | "nasot" | "tech" | "activities" | "output";

type ActivityLabel = "Activity 1" | "Activity 2" | "Activity 3" | "Activity 4" | "Exit Activity";

type ActivityToggles = {
    powerfulQuestions: boolean;

    // Differentiation supports
    helpfulHints: boolean; // now shown as "Read aloud (teacher)" block
    tooHardTryThis: boolean;
    extension: boolean;
    stepThisOut: boolean;

    // existing tool toggles
    canvaPrompt: boolean;
    notebookPrompt: boolean;
    adobeExpressActivity: boolean;
    aiActivityIdeas: boolean;
};

type ActivityKind =
    | "worksheet"
    | "comprehension"
    | "fourCorners"
    | "quiz"
    | "matching"
    | "table"
    | "timeline"
    | "discussion"
    | "other";

type ActivityAudienceMode = "student" | "teacher";

type ActivityBuilderState = {
    isOpen: boolean;
    audience: ActivityAudienceMode;
    prompt: string;
    quickPrompt: string;
    kind: ActivityKind;
    itemCount: number;
    topic: string;
    extraInstructions: string;
    showAnswers: boolean;
};

type PowerfulQuestion = { question: string; scIndex: number };
type AiOutputBlock = {
  title: string;
  content: string;
} | null;

type ActivityOutputs = {
  instructions: AiOutputBlock;
  closeActivity: AiOutputBlock;
  teacherScript: AiOutputBlock;
  resource: AiOutputBlock;
};

type ActivityAI = {
  powerfulQuestions: PowerfulQuestion[];
  canvaPrompt: string;
  notebookLmPrompt: string;
  adobeExpressActivity: string;
  aiActivityIdeas: string;

  suggestedTitle: string;
  suggestedOverview: string;

  outputs: ActivityOutputs;

  diff: DifferentiationPack;
};

type DifferentiationPack = {
    helpfulHints: string[]; // used as read-aloud script prompts
    tooHardTryThis: string[];
    extension: string[];
    stepThisOut: string[];
};

type StrategyBlock =
    | {
        kind: "corella";
        strategyId: string;
        learnHtml: string;
    }
    | null;

type ActivityState = {
    label: ActivityLabel;

    // teacher-owned fields
    title: string;
    teacherAsk: string;
    studentTask: string; // FINAL student instructions (may contain HTML)
    resourceLink: string;
    techHeavy: boolean;
    builderMeta?: {
    kind: ActivityKind;
    itemCount: number;
    topic: string;
    extraInstructions: string;
    showAnswers: boolean;
    audience: ActivityAudienceMode;
};
    // optional strategy block (only stored when applied)
    strategyBlock: StrategyBlock;

    toggles: ActivityToggles;

    // Auto-assigned NASOT element NAMES for this activity
    nasotStrategies: string[];

    ai: ActivityAI;
    aiBusy: boolean;
    aiError: string;
};

type VocabBand = "Year 7–8" | "Year 9–10" | "Senior";

/* ---------------- constants ---------------- */
const ACTIVITY_KIND_OPTIONS: { key: ActivityKind; label: string; emoji: string }[] = [
    { key: "worksheet", label: "Worksheet", emoji: "📝" },
    { key: "comprehension", label: "Comprehension", emoji: "📖" },
    { key: "fourCorners", label: "Four Corners", emoji: "🟦" },
    { key: "quiz", label: "Quiz", emoji: "❓" },
    { key: "matching", label: "Matching", emoji: "🧩" },
    { key: "table", label: "Table", emoji: "📊" },
    { key: "timeline", label: "Timeline", emoji: "🕒" },
    { key: "discussion", label: "Discussion", emoji: "💬" },
    { key: "other", label: "Other", emoji: "⋯" },
];

const QUICK_ACTIVITY_PROMPTS: { label: string; kind: ActivityKind; prompt: string }[] = [
    {
        label: "Four corners",
        kind: "fourCorners",
        prompt: "Create a four corners activity with statements, corner labels, and student instructions.",
    },
    {
        label: "Comprehension",
        kind: "comprehension",
        prompt: "Create a comprehension activity with a short passage, questions, and student instructions.",
    },
    {
        label: "Maths worksheet",
        kind: "worksheet",
        prompt: "Create a maths worksheet with worked examples, practice questions, and student instructions.",
    },
    {
        label: "Quiz",
        kind: "quiz",
        prompt: "Create a short quiz with questions, answer options, and student instructions.",
    },
    {
        label: "Table task",
        kind: "table",
        prompt: "Create a table-based activity with headings, rows, and student instructions.",
    },
    {
        label: "Cloze",
        kind: "worksheet",
        prompt: "Create a cloze activity with a word bank and student instructions.",
    },
];

const ACTIVITY_LENSES: Record<ActivityLabel, { label: string; preferredFocus: NasotFocusTab[] }> = {
    "Activity 1": { label: "Engagement and pace (Context)", preferredFocus: ["Context", "Feedback", "Content"] },
    "Activity 2": { label: "Processing and chunking (Content)", preferredFocus: ["Content", "Context", "Feedback"] },
    "Activity 3": { label: "Quick check for understanding (Feedback)", preferredFocus: ["Feedback", "Content", "Context"] },
    "Activity 4": { label: "Deeper thinking and justification (Content)", preferredFocus: ["Content", "Feedback", "Context"] },
    "Exit Activity": { label: "Celebrate, reflect, quick check (Feedback)", preferredFocus: ["Feedback", "Content", "Context"] },
};

const ACTIVITY_ORDER: ActivityLabel[] = ["Activity 1", "Activity 2", "Activity 3", "Activity 4", "Exit Activity"];

/* ---------------- helpers ---------------- */
function kindLabel(kind: ActivityKind) {
    return ACTIVITY_KIND_OPTIONS.find((x) => x.key === kind)?.label || "Activity";
}

    function buildPromptFromBuilder(builder: ActivityBuilderState) {
        const lines: string[] = [];

        lines.push(`Create a ${kindLabel(builder.kind).toLowerCase()} activity.`);
        lines.push(builder.audience === "student" ? `This must be student-facing.` : `This must include teacher notes.`);

        if (builder.topic.trim()) {
            lines.push(`Topic or focus: ${builder.topic.trim()}.`);
        }

        if (builder.itemCount > 0) {
            lines.push(`Include ${builder.itemCount} items where relevant.`);
        }

        if (builder.prompt.trim()) {
            lines.push(builder.prompt.trim());
        }

        if (builder.extraInstructions.trim()) {
            lines.push(`Extra instructions: ${builder.extraInstructions.trim()}.`);
        }

        if (builder.showAnswers) {
            lines.push("Also include teacher answers or solutions.");
        }

    return lines.join("\n");
}
 function previewCardsForKind(kind: ActivityKind, itemCount: number) {
    switch (kind) {
        case "fourCorners":
            return [
                {
                    title: "Instructions",
                    body: "Students move to a corner based on the answer they think is correct.",
                },
                {
                    title: "Corner labels",
                    body: "A, B, C, D or Agree, Disagree style labels.",
                },
                {
                    title: `${itemCount} statements`,
                    body: "Ready to display as a table or cards.",
                },
            ];

        case "comprehension":
            return [
                {
                    title: "Reading text",
                    body: "Short student-friendly source text or passage.",
                },
                {
                    title: "Questions",
                    body: `${itemCount} comprehension questions.`,
                },
                {
                    title: "Instructions",
                    body: "Clear task steps for students.",
                },
            ];

        case "worksheet":
            return [
                {
                    title: "Instructions",
                    body: "What students do and how to complete the task.",
                },
                {
                    title: "Practice items",
                    body: `${itemCount} worksheet questions or prompts.`,
                },
                {
                    title: "Support structure",
                    body: "Space for worked examples, hints, or scaffolds.",
                },
            ];

        case "quiz":
            return [
                {
                    title: "Instructions",
                    body: "How students complete the quiz.",
                },
                {
                    title: "Questions",
                    body: `${itemCount} quiz questions.`,
                },
                {
                    title: "Answer format",
                    body: "Multiple choice, short answer, or mixed.",
                },
            ];

        case "matching":
            return [
                {
                    title: "Instructions",
                    body: "Students match the linked ideas correctly.",
                },
                {
                    title: "Matching pairs",
                    body: `${itemCount} matching items.`,
                },
                {
                    title: "Display",
                    body: "Ready to show as a table or paired list.",
                },
            ];

        case "table":
            return [
                {
                    title: "Instructions",
                    body: "Students complete or analyse a table.",
                },
                {
                    title: "Table structure",
                    body: "Headings and rows are provided clearly.",
                },
                {
                    title: "Items",
                    body: `${itemCount} rows or prompts where relevant.`,
                },
            ];

        case "timeline":
            return [
                {
                    title: "Instructions",
                    body: "Students sequence events in order.",
                },
                {
                    title: "Timeline items",
                    body: `${itemCount} events or stages.`,
                },
                {
                    title: "Display",
                    body: "Ready to show in a timeline format.",
                },
            ];

        case "discussion":
            return [
                {
                    title: "Instructions",
                    body: "Students discuss, justify, and respond.",
                },
                {
                    title: "Prompts",
                    body: `${itemCount} discussion prompts.`,
                },
                {
                    title: "Output",
                    body: "Can include verbal, written, or group response.",
                },
            ];

        default:
            return [
                {
                    title: "Instructions",
                    body: "Student-facing directions.",
                },
                {
                    title: "Task content",
                    body: `${itemCount} items or prompts where relevant.`,
                },
                {
                    title: "Output",
                    body: "Ready for QLearn display.",
                },
            ];
    }
}
function safeLines(text: string): string[] {
    return (text || "")
        .split("\n")
        .map((x) => x.trim())
        .filter(Boolean);
}

function escapeHtml(s: string) {
    return (s || "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function diffPackToHtml(title: string, lines: string[]) {
    const clean = (lines || [])
        .map((x) => String(x || "").trim())
        .filter(Boolean);
    if (!clean.length) return "";
    return `<div style="margin-top:12px; padding:10px; border:1px solid #888B8A; background:#FFFFFF;">
    <div style="font-weight:700; margin-bottom:6px;">${escapeHtml(title)}</div>
    <div style="white-space:pre-wrap; line-height:1.35;">${clean.map((x) => `• ${escapeHtml(x)}`).join("\n")}</div>
  </div>`;
}

// NEW: read-aloud block shown ABOVE the AI generation box (student-facing instructions teacher reads aloud)
function readAloudBlockHtml(lines: string[]) {
    const clean = (lines || [])
        .map((x) => String(x || "").trim())
        .filter(Boolean);
    if (!clean.length) return "";

    return `<div style="margin:0 0 12px 0; padding:12px; border:1px solid #888B8A; background:#FFFFFF; border-radius:12px;">
  <div style="font-weight:800; margin-bottom:6px;">Student-facing instructions (teacher reads aloud)</div>
  <div style="font-size:13px; opacity:0.85; margin-bottom:8px;">Say this before students start the task.</div>
  <div style="white-space:pre-wrap; line-height:1.35;">${clean.map((x) => `• ${escapeHtml(x)}`).join("\n")}</div>
</div>`;
}

function resetActivityState(label: ActivityLabel) {
    return makeActivity(label);
}

function looksLikeHtml(s: string) {
    const t = (s || "").trim();
    if (!t) return false;

    const tagRx = /<\s*(table|div|p|img|span|strong|em|ul|ol|li|br|tr|td|th|tbody|thead)\b/i;
    const genericTagRx = /<\s*[a-z][^>]*>/i;

    return tagRx.test(t) || genericTagRx.test(t);
}

function textToHtmlBlock(plain: string, title?: string) {
    const t = (plain || "").trim();
    if (!t) return "";

    const normalised = t
        .split("\n")
        .map((line) => line.replace(/^\s*-\s+/, "• ").trimEnd())
        .join("\n");

    const inner = escapeHtml(normalised);

    return `
<div style="margin:0 0 10px 0;">
  ${title ? `<div style="font-weight:700; margin-bottom:6px;">${escapeHtml(title)}</div>` : ""}
  <div style="white-space:pre-wrap; line-height:1.35;">${inner}</div>
</div>
`.trim();
}

function buildCorellaStudentBlockHtml(instructions: string, learnTableHtml: string) {
    const instr = (instructions || "").trim();
    const table = (learnTableHtml || "").trim();

    const corellaLinkHtml = `
<div style="margin:8px 0 12px 0; font-size:13px;">
  <strong>Link:</strong>
  <a href="https://corella.ai.qld.gov.au/" target="_blank" rel="noopener noreferrer">
    https://corella.ai.qld.gov.au/
  </a>
</div>`.trim();

    const instructionsHtml = instr
        ? `<div style="white-space:pre-wrap; margin:0 0 10px 0; line-height:1.35;">${escapeHtml(instr)}</div>`
        : "";

    return `${instructionsHtml}${corellaLinkHtml}${table}`.trim();
}

function updateLine(setter: (fn: any) => void, idx: number, value: string) {
    setter((prev: string[]) => prev.map((x, i) => (i === idx ? value : x)));
}

function addLine(setter: (fn: any) => void) {
    setter((prev: string[]) => [...prev, ""]);
}

function removeLine(setter: (fn: any) => void, idx: number) {
    setter((prev: string[]) => prev.filter((_, i) => i !== idx));
}

function makeActivity(label: ActivityLabel): ActivityState {
    return {
        label,
        title: "",
        teacherAsk: "",
        studentTask: "",
        resourceLink: "",
        builderMeta: {
            kind: "worksheet",
            itemCount: 10,
            topic: "",
            extraInstructions: "",
            showAnswers: false,
            audience: "student",
        },
        techHeavy: false,
        strategyBlock: null,
        toggles: {
            powerfulQuestions: true,

            helpfulHints: true,
            tooHardTryThis: true,
            extension: true,
            stepThisOut: true,

            canvaPrompt: false,
            notebookPrompt: false,
            adobeExpressActivity: false,
            aiActivityIdeas: false,
        },
        ai: {
            powerfulQuestions: [],
            canvaPrompt: "",
            notebookLmPrompt: "",
            adobeExpressActivity: "",
            aiActivityIdeas: "",
            suggestedTitle: "",
            suggestedOverview: "",
            outputs: {
                instructions: null,
                closeActivity: null,
                teacherScript: null,
                resource: null,
            },
            diff: {
                helpfulHints: [],
                tooHardTryThis: [],
                extension: [],
                stepThisOut: [],
            },
        },   // ← THIS COMMA MUST BE HERE
        nasotStrategies: [],
        aiBusy: false,
        aiError: "",
    };
}

function defsById() {
    const m = new Map<string, NasotElementDef>();
    for (const d of NASOT_DEFS) m.set(d.id, d);
    return m;
}

function pickSlotForFocus(focus: NasotFocusTab): ActivityLabel[] {
    if (focus === "Context") return ["Activity 1", "Activity 2", "Activity 4", "Activity 3", "Exit Activity"];
    if (focus === "Content") return ["Activity 2", "Activity 4", "Activity 1", "Activity 3", "Exit Activity"];
    return ["Activity 3", "Exit Activity", "Activity 1", "Activity 2", "Activity 4"];
}

function computeNasotAssignments(selectedIds: string[]) {
    const byId = defsById();

    const assigned: Record<ActivityLabel, string[]> = {
        "Activity 1": [],
        "Activity 2": [],
        "Activity 3": [],
        "Activity 4": [],
        "Exit Activity": [],
    };

    function placeOnce(elementId: string) {
        const def = byId.get(elementId);
        if (!def) return;

        const candidates = pickSlotForFocus(def.focus);
        for (const slot of candidates) {
            if (assigned[slot].length < 2) {
                if (!assigned[slot].includes(elementId)) assigned[slot].push(elementId);
                return;
            }
        }
    }

    for (const id of selectedIds) {
        const def = byId.get(id);
        if (!def) continue;
        if (def.budget === 0) continue;

        placeOnce(id);

        if (def.budget === 2) {
            const preferredSecond: ActivityLabel[] = ["Exit Activity", "Activity 3", ...pickSlotForFocus(def.focus)];
            for (const slot of preferredSecond) {
                if (assigned[slot].length < 2 && !assigned[slot].includes(id)) {
                    assigned[slot].push(id);
                    break;
                }
            }
        }
    }

    return assigned;
}

function goalsBlockHtml(lines: string[]) {
    const clean = (lines || []).filter(Boolean);
    if (!clean.length) return `<div style="color:#6B7280; font-style:italic;">(Add at least one learning goal.)</div>`;
    return `<ul style="margin:6px 0 0 18px; padding:0;">${clean.map((x) => `<li>${escapeHtml(x)}</li>`).join("")}</ul>`;
}

function criteriaBlockHtml(lines: string[]) {
    const clean = (lines || []).filter(Boolean);
    if (!clean.length) return `<div style="color:#6B7280; font-style:italic;">(Add at least one success criterion.)</div>`;
    return `<ul style="margin:6px 0 0 18px; padding:0;">${clean.map((x) => `<li>${escapeHtml(x)}</li>`).join("")}</ul>`;
}

function goalsInlineHtml(lines: string[]) {
    const clean = (lines || []).filter(Boolean);
    if (!clean.length) return "";
    return clean.map((x) => escapeHtml(x)).join("<br/>");
}

function criteriaInlineHtml(lines: string[]) {
    const clean = (lines || []).filter(Boolean);
    if (!clean.length) return "";
    return clean.map((x) => escapeHtml(x)).join("<br/>");
}

function fillCorellaPlaceholders(templateHtml: string, learningGoals: string[], successCriteria: string[]) {
    const lgBlock = goalsBlockHtml(learningGoals);
    const scBlock = criteriaBlockHtml(successCriteria);

    const lgInline = goalsInlineHtml(learningGoals);
    const scInline = criteriaInlineHtml(successCriteria);

    const html = templateHtml || "";

    const rep = (src: string, names: string[], value: string) => {
        let out = src;
        for (const n of names) {
            const token = n.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
            const rx = new RegExp(`\\{\\{\\s*${token}\\s*\\}\\}`, "gi");
            out = out.replace(rx, value);
        }
        return out;
    };

    let out = html;

    out = rep(out, ["LEARNING_GOALS_BLOCK", "LEARNING GOALS BLOCK"], lgBlock);
    out = rep(out, ["SUCCESS_CRITERIA_BLOCK", "SUCCESS CRITERIA BLOCK"], scBlock);

    out = rep(
        out,
        ["LEARNING_GOAL", "LEARNING GOAL", "LEARNING_GOALS", "LEARNING GOALS", "LEARNING_GOALS_LIST", "LEARNING GOALS LIST"],
        lgInline
    );
    out = rep(out, ["SUCCESS_CRITERIA", "SUCCESS CRITERIA", "SUCCESS_CRITERIA_LIST", "SUCCESS CRITERIA LIST"], scInline);

    return out;
}

function buildLearnTableHtml(s: any) {
    const direct =
        (typeof s?.html === "string" && s.html.trim() ? s.html.trim() : "") ||
        (typeof s?.learnHtml === "string" && s.learnHtml.trim() ? s.learnHtml.trim() : "");

    if (direct) return direct;

    const cells = s?.learnCells;
    if (!cells) {
        return `
<div style="border:1px solid #888B8A; padding:10px; background:#FFFFFF; border-radius:10px;">
  <div style="font-weight:700; margin-bottom:6px;">Corella strategy missing HTML</div>
  <div style="white-space:pre-wrap;">This strategy definition has no 'html' and no 'learnCells'. Check techDefs.</div>
</div>
`.trim();
    }

    return `
<table style="border-collapse:collapse; width:98.6%; background-color:#364152;" border="1">
  <tbody><tr><td style="padding:6px 10px; color:#ffffff;">
    <strong>Corella strategy: ${escapeHtml(String(s?.title || "Corella strategy"))}</strong>
  </td></tr></tbody>
</table>

<table style="border-collapse:collapse; width:98.6%; background-color:#ffffff;" border="1">
  <tbody>
    <tr>
      <td style="width:20%; padding:10px; vertical-align:top; border:1px solid #888B8A;">
        <div style="font-weight:700; margin-bottom:6px;">L</div>
        ${cells.L ?? ""}
        <div style="margin-top:10px; padding:8px; border:1px solid #888B8A; background:#c7cfdb;">
          <div style="font-weight:700; margin-bottom:6px;">Learning goals</div>
          {{LEARNING_GOALS_BLOCK}}
        </div>
        <div style="margin-top:10px; padding:8px; border:1px solid #888B8A; background:#c7cfdb;">
          <div style="font-weight:700; margin-bottom:6px;">Success criteria</div>
          {{SUCCESS_CRITERIA_BLOCK}}
        </div>
      </td>

      <td style="width:20%; padding:10px; vertical-align:top; border:1px solid #888B8A;">
        <div style="font-weight:700; margin-bottom:6px;">E</div>
        ${cells.E ?? ""}
      </td>

      <td style="width:20%; padding:10px; vertical-align:top; border:1px solid #888B8A;">
        <div style="font-weight:700; margin-bottom:6px;">A</div>
        ${cells.A ?? ""}
      </td>

      <td style="width:20%; padding:10px; vertical-align:top; border:1px solid #888B8A;">
        <div style="font-weight:700; margin-bottom:6px;">R</div>
        ${cells.R ?? ""}
      </td>

      <td style="width:20%; padding:10px; vertical-align:top; border:1px solid #888B8A;">
        <div style="font-weight:700; margin-bottom:6px;">N</div>
        ${cells.N ?? ""}
      </td>
    </tr>
  </tbody>
</table>
`.trim();
}

function generateWarmupTeachingNotes(opts: {
    warmupStory: string;
    learningGoals: string[];
    successCriteria: string[];
    vocabulary: string[];
    cognitiveVerbs: string[];
}) {
    const story = (opts.warmupStory || "").trim();
    const lg = (opts.learningGoals || []).filter(Boolean);
    const sc = (opts.successCriteria || []).filter(Boolean);

    const vocab = (opts.vocabulary || []).filter(Boolean).slice(0, 4);
    const verbs = (opts.cognitiveVerbs || []).filter(Boolean).slice(0, 3);

    const keyTerm = vocab.find((v) => story.toLowerCase().includes(v.toLowerCase())) || vocab[0] || "key term";

    const goalLine = lg[0] ? `Learning goal link: ${lg[0]}` : "Learning goal link: (add at least one learning goal).";
    const scLine = sc.length ? `Success criteria link: ${sc[0]}` : "Success criteria link: (add at least one success criterion).";

    return [
        "Teacher guide (planning only)",
        "",
        "Purpose (NASOT: Previewing + Highlighting critical information)",
        `• Prime the lesson by previewing what students are about to learn and focusing attention on '${keyTerm}'.`,
        `• ${goalLine}`,
        `• ${scLine}`,
        "",
        "60–90 seconds (students)",
        "• Read/listen once.",
        "• Underline two words that signal the thinking needed (e.g. measure, compare, calculate).",
        "• Quick jot: What is the problem asking us to work out?",
        "",
        "Teacher prompts",
        `• “Don’t solve it yet. Find the ${keyTerm} moment. Where does the story tell you what matters?”`,
        "• “Is this a guessing problem or a calculating problem? What words prove it?”",
        "",
        "Fast check (NASOT: Increase response rates + Informal assessment)",
        "• Fingers check: 1 = guessing, 2 = measuring, 3 = calculating, 4 = not sure yet.",
        "• Cold-call one student to justify their number using one word from the story.",
        "",
        "Bridge to lesson",
        `• “Today we ${verbs.length ? verbs.join(", ") : "work"} this using the lesson strategy. Let’s translate the story into a diagram/steps.”`,
    ].join("\n");
}

async function copyText(txt: string) {
    try {
        await navigator.clipboard.writeText(txt);
        return true;
    } catch {
        return false;
    }
}

/* ---------------- Technology context ---------------- */

type TechToolKey = "canva" | "adobe" | "notebooklm" | "corella";
type TechModeKey = "presentation" | "interactive" | "poster" | "video" | "podcast" | "sourceText" | "slides" | "audio" | "infographic" | "strategy";

const TECH_TOOLS: { key: TechToolKey; label: string }[] = [
    { key: "canva", label: "Canva" },
    { key: "adobe", label: "Adobe Express" },
    { key: "notebooklm", label: "NotebookLM" },
    { key: "corella", label: "Corella" },
];

const TECH_MODES: Record<TechToolKey, { key: TechModeKey; label: string }[]> = {
    canva: [
        { key: "presentation", label: "Presentation" },
        { key: "interactive", label: "Interactive" },
    ],
    adobe: [
        { key: "poster", label: "Poster" },
        { key: "video", label: "Video" },
        { key: "interactive", label: "Interactive" },
        { key: "podcast", label: "Podcast" },
    ],
    notebooklm: [
        { key: "sourceText", label: "Source text" },
        { key: "slides", label: "Slides" },
        { key: "video", label: "Video" },
        { key: "audio", label: "Audio" },
        { key: "infographic", label: "Infographic" },
    ],
    corella: [{ key: "strategy", label: "Strategy" }],
};

type TechOutput = {
    suggestedTitle: string;
    activitySummary: string;
    studentInstructions: string;
    toolPrompt: string;
    sourceText: string;
    nasotUsed: string[];
    corellaBlock: string;
};

function isTeacherPromptTool(tool: TechToolKey, mode: TechModeKey) {
    if (tool === "canva" && mode === "interactive") return true;
    if (tool === "notebooklm") return true;
    return false;
}

function shouldIncludeSourceTextInStudentPage(tool: TechToolKey) {
    return tool === "notebooklm";
}

function isCorella(tool: TechToolKey) {
    return tool === "corella";
}

/* ---------------- NASOT audit helpers ---------------- */

type NasotStatus = "green" | "amber" | "red";

function statusColor(s: NasotStatus) {
    if (s === "green") return { bg: "#DCFCE7", border: "#16A34A", text: "#166534" };
    if (s === "amber") return { bg: "#FEF3C7", border: "#F59E0B", text: "#92400E" };
    return { bg: "#FEE2E2", border: "#DC2626", text: "#991B1B" };
}

function normaliseText(t: string) {
    return (t || "").toLowerCase().replace(/\s+/g, " ").trim();
}

function hasAnyKeyword(haystack: string, keys: string[]) {
    const h = normaliseText(haystack);
    return keys.some((k) => h.includes(k));
}

function focusKeywords(focus: NasotFocusTab): string[] {
    if (focus === "Context")
        return ["stations", "gallery walk", "four corners", "role play", "movement task", "paired movement", "rotating groups", "physical modelling"];
    if (focus === "Content") return ["model", "worked example", "example", "chunk", "steps", "highlight", "diagram", "label", "annotate", "practice"];
    return ["success criteria", "check", "feedback", "self-check", "hinge", "quiz", "cold call", "show me", "rate yourself"];
}

function buildNasotBoostBlock(def: NasotElementDef) {
    const focus = def.focus;
    const title = `${def.name} (quick boost)`;
    const lines =
        focus === "Context"
            ? [
                "Move to a spot that matches your choice (A/B/C/D).",
                "Explain your choice to a partner using one key term.",
                "Swap partners and explain again using a different example.",
                "Whole-class check: show fingers 1–4 for confidence.",
            ]
            : focus === "Content"
                ? [
                    "Highlight the critical information in the question (circle/underline).",
                    "Draw a quick diagram or table before calculating.",
                    "Do one worked example together, then try the next one on your own.",
                    "Check the answer makes sense using one success criterion.",
                ]
                : [
                    "Stop and do an On track check against the success criteria.",
                    "Fix one error using teacher feedback or an example.",
                    "Write one sentence: what did I change and why?",
                    "Confidence check: Got it / Shaky / Not yet.",
                ];

    return `<div style="margin-top:12px; padding:10px; border:1px solid #888B8A; background:#FFFFFF;">
  <div style="font-weight:700; margin-bottom:6px;">${escapeHtml(title)}</div>
  <div style="white-space:pre-wrap; line-height:1.35;">${lines.map((x) => `• ${escapeHtml(x)}`).join("\n")}</div>
</div>`;
}

/* ---------------- component ---------------- */

export default function Page() {
    const [stage, setStage] = useState<"landing" | "builder">("landing");
    const [tab, setTab] = useState<Tab>("goals");

    const [lessonTitle, setLessonTitle] = useState("");
    const [teacherContext, setTeacherContext] = useState("");

    const [learningGoals, setLearningGoals] = useState<string[]>([""]);
    const [successCriteria, setSuccessCriteria] = useState<string[]>(["", "", ""]);

    const [activities, setActivities] = useState<ActivityState[]>([
        makeActivity("Activity 1"),
        makeActivity("Activity 2"),
        makeActivity("Activity 3"),
        makeActivity("Activity 4"),
        makeActivity("Exit Activity"),
    ]);
    const [activeActivityIndex, setActiveActivityIndex] = useState(0);
    const [activityBuilder, setActivityBuilder] = useState<ActivityBuilderState>({
        isOpen: false,
        audience: "student",
        prompt: "",
        quickPrompt: "",
        kind: "worksheet",
        itemCount: 10,
        topic: "",
        extraInstructions: "",
        showAnswers: false,
    });


    const [selectedPQ, setSelectedPQ] = useState<Record<number, number>>({});

    const [vocabBand, setVocabBand] = useState<VocabBand>("Year 9–10");
    const [verbsText, setVerbsText] = useState("");
    const [vocabText, setVocabText] = useState("");
    const [vvLocked, setVvLocked] = useState(false);
    const [vvBusy, setVvBusy] = useState(false);
    const [vvError, setVvError] = useState("");

    const [warmupContext, setWarmupContext] = useState("");
    const [warmupStory, setWarmupStory] = useState("");
    const [warmupLocked, setWarmupLocked] = useState(false);
    const [warmupBusy, setWarmupBusy] = useState(false);
    const [warmupError, setWarmupError] = useState("");

    const [warmupTeachNotes, setWarmupTeachNotes] = useState("");

    const [nasotSelectedIds, setNasotSelectedIds] = useState<string[]>([]);
    const [nasotFocusTab, setNasotFocusTab] = useState<NasotFocusTab>("Feedback");

    const [htmlOut, setHtmlOut] = useState("");

    const [techTool, setTechTool] = useState<TechToolKey>("canva");
    const [techMode, setTechMode] = useState<TechModeKey>("presentation");
    const [techAsk, setTechAsk] = useState("");
    const [techBusy, setTechBusy] = useState(false);
    const [techError, setTechError] = useState("");
    const [techOut, setTechOut] = useState<TechOutput>({
        suggestedTitle: "",
        activitySummary: "",
        studentInstructions: "",
        toolPrompt: "",
        sourceText: "",
        nasotUsed: [],
        corellaBlock: "",
    });

    const [techTarget, setTechTarget] = useState<ActivityLabel>("Activity 1");
    const [techApplyFormat, setTechApplyFormat] = useState<"replace" | "append">("replace");

    const [corellaStrategyId, setCorellaStrategyId] = useState<string>((CORELLA_STRATEGIES as any)?.[0]?.id || "retrieval-practice");

    const [showHtmlEditor, setShowHtmlEditor] = useState<Record<number, boolean>>({});
    const [aiSuggestionView, setAiSuggestionView] = useState<Record<number, "preview" | "text">>({});

    const [toastMsg, setToastMsg] = useState("");
    function showToast(msg: string) {
        setToastMsg(msg);
        window.clearTimeout((showToast as any)._t);
        (showToast as any)._t = window.setTimeout(() => setToastMsg(""), 1600);
    }
    const [nasotInspectorId, setNasotInspectorId] = useState<string | null>(null);
    const [teacherRunSheet, setTeacherRunSheet] = useState("");

    const counts = useMemo(() => {
        const lgCount = safeLines(learningGoals.join("\n")).length;
        const scCount = safeLines(successCriteria.join("\n")).length;
        return { lgCount, scCount };
    }, [learningGoals, successCriteria]);

    const nasotAssignments = useMemo(() => computeNasotAssignments(nasotSelectedIds), [nasotSelectedIds]);
    const nasotById = useMemo(() => defsById(), []);
    const filteredNasot = useMemo(() => NASOT_DEFS.filter((d) => d.focus === nasotFocusTab), [nasotFocusTab]);

    useEffect(() => {
        setActivities((prev) =>
            prev.map((a) => {
                const ids = nasotAssignments[a.label] || [];
                const names = ids.map((id) => nasotById.get(id)?.name).filter(Boolean) as string[];
                return { ...a, nasotStrategies: names };
            })
        );
    }, [nasotAssignments, nasotById]);

    useEffect(() => {
        const modes = TECH_MODES[techTool] || [];
        const stillValid = modes.some((m) => m.key === techMode);
        if (!stillValid && modes[0]) setTechMode(modes[0].key);

        setTechOut({
            suggestedTitle: "",
            activitySummary: "",
            studentInstructions: "",
            toolPrompt: "",
            sourceText: "",
            nasotUsed: [],
            corellaBlock: "",
        });
        setTechError("");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [techTool]);

    useEffect(() => {
        const list = CORELLA_STRATEGIES as any[];
        const s = list.find((x) => x.id === corellaStrategyId) || list[0];
        if (s) loadCorellaStrategy(s);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function canStart() {
        return lessonTitle.trim().length > 0;
    }

    function goLanding() {
        setStage("landing");
        setTab("goals");
        setHtmlOut("");
    }

    function goBuilder() {
        setStage("builder");
        setTab("goals");
        setHtmlOut("");
    }

    function getFallbackVerbsVocab() {
        const lg = safeLines(learningGoals.join("\n"));
        const sc = safeLines(successCriteria.join("\n"));

        const fallbackVerbs = (autoCognitiveVerbs(lg, sc) ?? []) as string[];
        const fallbackVocab =
            (autoVocabulary(
                lg,
                sc,
                activities.map((a) => ({
                    label: a.label,
                    studentTask: a.studentTask,
                    resourceLink: a.resourceLink,
                    techHeavy: a.techHeavy,
                }))
            ) ?? []) as string[];

        const cognitiveVerbs = safeLines(verbsText).length ? safeLines(verbsText) : fallbackVerbs;
        const vocabulary = safeLines(vocabText).length ? safeLines(vocabText) : fallbackVocab;

        return { lg, sc, cognitiveVerbs, vocabulary };
    }

    async function generateVocabAndVerbs() {
        if (vvLocked) return;

        setVvBusy(true);
        setVvError("");

        try {
            const res = await fetch("/api/ai/vocab-verbs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    lessonTitle,
                    teacherContext,
                    vocabBand,
                    learningGoals: safeLines(learningGoals.join("\n")),
                    successCriteria: safeLines(successCriteria.join("\n")),
                }),
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok || data?.ok === false) throw new Error(data?.error || `Route failed (${res.status})`);

            const verbsArr: string[] = Array.isArray(data?.cognitiveVerbs) ? data.cognitiveVerbs.map(String) : [];
            const vocabArr: string[] = Array.isArray(data?.vocabulary) ? data.vocabulary.map(String) : [];

            setVerbsText(verbsArr.join("\n"));
            setVocabText(vocabArr.join("\n"));
        } catch (e: any) {
            setVvError(e?.message || "Generate failed.");
        } finally {
            setVvBusy(false);
        }
    }

    async function generateWarmupStory() {
        if (warmupLocked) return;

        const { lg, sc, cognitiveVerbs, vocabulary } = getFallbackVerbsVocab();

        setWarmupBusy(true);
        setWarmupError("");

        try {
            const res = await fetch("/api/ai/warmup-story", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    lessonTitle,
                    teacherContext,
                    warmupContext,
                    learningGoals: lg,
                    successCriteria: sc,
                    cognitiveVerbs,
                    vocabulary,
                }),
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok || data?.ok === false) throw new Error(data?.error || `Route failed (${res.status})`);

            const title = String(data?.warmUpStoryTitle || "Warm up").trim();
            const story = String(data?.warmUpStory || "").trim();
            const question = String(data?.endQuestion || "").trim();

            const combined = `${title}\n\n${story}\n\nQuestion for discussion:\n${question}`.trim();
            setWarmupStory(combined);

            setWarmupTeachNotes((prev) => {
                if (prev.trim()) return prev;
                return generateWarmupTeachingNotes({
                    warmupStory: combined,
                    learningGoals: lg,
                    successCriteria: sc,
                    vocabulary,
                    cognitiveVerbs,
                });
            });
        } catch (e: any) {
            setWarmupError(e?.message || "Warm-up generation failed.");
        } finally {
            setWarmupBusy(false);
        }
    }

    async function generateActivity(
        activityIndex: number,
        overrideTeacherAsk?: string,
        overrideBuilderMeta?: ActivityState["builderMeta"]
    )  {
        const { lg, sc, cognitiveVerbs, vocabulary } = getFallbackVerbsVocab();

        const current = activities[activityIndex];
        if (!current) return;

        const teacherAskToUse = (overrideTeacherAsk ?? current.teacherAsk ?? "").trim();
        const builderMetaToUse = overrideBuilderMeta ?? current.builderMeta;

        if (!teacherAskToUse)  {
            setActivities((prev) =>
                prev.map((p, i) => (i === activityIndex ? { ...p, aiError: "Type what you want AI to generate." } : p))
            );
            return;
        }
        setActivities((prev) => prev.map((p, i) => (i === activityIndex ? { ...p, aiBusy: true, aiError: "" } : p)));

        try {
            const res = await fetch("/api/ai/enhance", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    requestMode: "activity",
                    internalMode: "enhance",
                    lessonTitle,
                    teacherContext,
                    learningGoals: lg,
                    successCriteria: sc,
                    cognitiveVerbs,
                    vocabulary,
                    activity: {
                        label: current.label,
                        title: current.title,
                        studentTask: current.studentTask,
                        resourceLink: current.resourceLink,
                        techHeavy: current.techHeavy,
                        toggles: current.toggles,
                        nasotStrategies: current.nasotStrategies,
                        teacherAsk: teacherAskToUse,
                        builderMeta: builderMetaToUse,
                    },
                }),
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok || data?.ok === false) throw new Error(data?.error || `AI route returned ${res.status}`);

            const newTitle = String(data?.activityTitle ?? data?.suggestedActivityTitle ?? "").trim();
            const newOverview = String(data?.activityOverview ?? data?.suggestedActivityOverview ?? "").trim();
            const outputs = data?.outputs ?? {};

            const pqRaw = data?.powerfulQuestions ?? [];
            const canva = String(data?.canvaPrompt ?? "").trim();
            const notebook = String(data?.notebookLmPrompt ?? "").trim();
            const adobe = String(data?.adobeExpressActivity ?? "").trim();
            const ideas = String(data?.aiActivityIdeas ?? "").trim();

            const diffRaw = data?.diff ?? {};
            const asLines = (v: any): string[] => {
                if (Array.isArray(v)) return v.map(String).map((s) => s.trim()).filter(Boolean);
                if (typeof v === "string") return safeLines(v);
                return [];
            };

            const diff: DifferentiationPack = {
                helpfulHints: asLines(diffRaw?.helpfulHints ?? diffRaw?.helpful_hints),
                tooHardTryThis: asLines(diffRaw?.tooHardTryThis ?? diffRaw?.too_hard_try_this ?? diffRaw?.tooHard),
                extension: asLines(diffRaw?.extension ?? diffRaw?.makeItHarder ?? diffRaw?.make_it_harder),
                stepThisOut: asLines(diffRaw?.stepThisOut ?? diffRaw?.step_this_out ?? diffRaw?.workedSteps),
            };

            const pq: PowerfulQuestion[] = Array.isArray(pqRaw)
                ? pqRaw
                    .map((x: any) => ({
                        question: String(x?.question || "").trim(),
                        scIndex: Number(x?.scIndex || 0),
                    }))
                    .filter((x: PowerfulQuestion) => x.question.length > 0)
                : [];

            setActivities((prev) =>
                prev.map((p, i) => {
                    if (i !== activityIndex) return p;
                    return {
                        ...p,
                        aiBusy: false,
                        aiError: "",
                        ai: {
                            ...p.ai,
                            powerfulQuestions: pq.slice(0, 4),
                            canvaPrompt: canva,
                            notebookLmPrompt: notebook,
                            adobeExpressActivity: adobe,
                            aiActivityIdeas: ideas,
                            suggestedTitle: newTitle,
                            suggestedOverview: newOverview,
                            diff,
                            outputs: {
    instructions: outputs?.instructions
        ? {
            title: String(outputs.instructions.title || "Instructions").trim(),
            content: String(outputs.instructions.content || "").trim(),
        }
        : null,
    closeActivity: outputs?.closeActivity
        ? {
            title: String(outputs.closeActivity.title || "Close activity").trim(),
            content: String(outputs.closeActivity.content || "").trim(),
        }
        : null,
    teacherScript: outputs?.teacherScript
        ? {
            title: String(outputs.teacherScript.title || "Teacher script").trim(),
            content: String(outputs.teacherScript.content || "").trim(),
        }
        : null,
    resource: outputs?.resource
        ? {
            title: String(outputs.resource.title || "Resource").trim(),
            content: String(outputs.resource.content || "").trim(),
        }
        : null,
},
                        },
                    };
                })
            );

            setSelectedPQ((prev) => (typeof prev[activityIndex] === "number" ? prev : { ...prev, [activityIndex]: 0 }));
        } catch (e: any) {
            setActivities((prev) =>
                prev.map((p, i) => (i === activityIndex ? { ...p, aiBusy: false, aiError: e?.message || "AI request failed." } : p))
            );
        }
    }

    function loadCorellaStrategy(s: any) {
        const studentRunSheet = [
            `You will use the "${String(s?.title || "Corella strategy")}" strategy.`,
            "Read the instructions first, then complete the LEARN table steps in order.",
            "Do not ask the tool for answers. Use it to structure your thinking.",
        ].join("\n");

        const corellaTemplateHtml = (typeof s?.html === "string" && s.html.trim() ? s.html.trim() : "") || buildLearnTableHtml(s);

        setTechOut({
            suggestedTitle: `Corella: ${String(s?.title || "Strategy")}`,
            activitySummary: "",
            studentInstructions: studentRunSheet,
            toolPrompt: "",
            sourceText: "",
            nasotUsed: [],
            corellaBlock: corellaTemplateHtml,
        });

        setTechError("");
        setTechMode("strategy");
        setTechTool("corella");
    }

    async function generateTech() {
        if (techTool === "corella") return;

        const { lg, sc, cognitiveVerbs, vocabulary } = getFallbackVerbsVocab();

        const targetIdx = ACTIVITY_ORDER.indexOf(techTarget);
        const nasotStrategiesForTarget = activities?.[targetIdx]?.nasotStrategies ?? [];

        setTechBusy(true);
        setTechError("");

        try {
            const res = await fetch("/api/ai/tech", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    tool: techTool,
                    mode: techMode,
                    teacherAsk: techAsk,
                    lessonTitle,
                    teacherContext,
                    learningGoals: lg,
                    successCriteria: sc,
                    vocabulary,
                    cognitiveVerbs,
                    nasotStrategies: nasotStrategiesForTarget,
                }),
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok || data?.ok === false) throw new Error(data?.error || `Route failed (${res.status})`);

            const out: TechOutput = {
                suggestedTitle: String(data?.suggestedTitle || "").trim(),
                activitySummary: String(data?.activitySummary || "").trim(),
                studentInstructions: String(data?.studentInstructions || "").trim(),
                toolPrompt: String(data?.toolPrompt || "").trim(),
                sourceText: String(data?.sourceText || "").trim(),
                nasotUsed: Array.isArray(data?.nasotUsed) ? data.nasotUsed.map(String).filter(Boolean) : [],
                corellaBlock: "",
            };

            setTechOut(out);
        } catch (e: any) {
            setTechError(e?.message || "Tech generation failed.");
        } finally {
            setTechBusy(false);
        }
    }

    const renderedCorellaBlock = useMemo(() => {
        const lg = safeLines(learningGoals.join("\n"));
        const sc = safeLines(successCriteria.join("\n"));
        if (!techOut.corellaBlock?.trim()) return "";
        return fillCorellaPlaceholders(techOut.corellaBlock, lg, sc);
    }, [techOut.corellaBlock, learningGoals, successCriteria]);

    const renderedCorellaStudentBlock = useMemo(() => {
        const instructions = (techOut.studentInstructions || "").trim();
        const table = (renderedCorellaBlock || "").trim();
        if (!instructions && !table) return "";
        return buildCorellaStudentBlockHtml(instructions, table);
    }, [techOut.studentInstructions, renderedCorellaBlock]);

    function applyTechToActivity(target: ActivityLabel, mode: "replace" | "append" = "replace") {
        const title = (techOut.suggestedTitle || "").trim();

        setActivities((prev) =>
            prev.map((a) => {
                if (a.label !== target) return a;

                const nextTitle = title ? title : a.title;

                if (techTool === "corella") {
                    const combinedHtml = (renderedCorellaStudentBlock || "").trim();
                    const nextStudentTask =
                        mode === "append" ? [a.studentTask?.trim(), combinedHtml].filter(Boolean).join("\n\n") : combinedHtml;

                    return {
                        ...a,
                        title: nextTitle,
                        studentTask: nextStudentTask,
                        strategyBlock: null,
                        techHeavy: true,
                    };
                }

                const blocks: string[] = [];

                if (techOut.studentInstructions?.trim()) {
                    blocks.push(textToHtmlBlock(techOut.studentInstructions.trim()));
                }

                if (shouldIncludeSourceTextInStudentPage(techTool) && techOut.sourceText?.trim()) {
                    blocks.push(textToHtmlBlock(techOut.sourceText.trim(), "Resource"));
                }

                if (techOut.nasotUsed?.length) {
                    blocks.push(
                        `<div style="margin-top:10px; padding:10px; border:1px solid #888B8A; background:#FFFFFF;">
  <div style="font-weight:700; margin-bottom:6px;">What this helps you practise</div>
  <div style="white-space:pre-wrap;">${escapeHtml(techOut.nasotUsed.join(", "))}</div>
</div>`
                    );
                }

                const payload = blocks.filter(Boolean).join("\n\n").trim();
                const nextStudentTask =
                    mode === "append" ? [a.studentTask?.trim(), payload].filter(Boolean).join("\n\n") : payload || a.studentTask;

                return { ...a, title: nextTitle, studentTask: nextStudentTask, techHeavy: true };
            })
        );

        setTab("activities");
        setActiveActivityIndex(ACTIVITY_ORDER.indexOf(target));
    }
    function buildDraftForOutput() {
        const { lg, sc, cognitiveVerbs, vocabulary } = getFallbackVerbsVocab();

        return {
            lessonTitle,
            teacherContext,
            learningGoals: lg,
            successCriteria: sc,
            cognitiveVerbs,
            vocabulary,
            warmupStory,
            activities: activities.map((a) => ({
                label: a.label,
                title: a.title || a.label,
                studentTask: a.studentTask,
                resourceLink: a.resourceLink,
                techHeavy: a.techHeavy,
                toggles: a.toggles,
                nasotStrategies: a.nasotStrategies,
                ai: a.ai,
                strategyBlock: a.strategyBlock ?? null,
            })),
        };
    }

    function handleGenerateHtml() {
        const draft = buildDraftForOutput();
        const html = buildQLearnHtmlFromDraft(draft as any);
        setHtmlOut(html || "");
        setTab("output");
    }

    const active = activities[activeActivityIndex];

    const safetyNotice = (
        <div className="notice">
            <div className="noticeIcon">A</div>
            <div>
                <div className="noticeText">Do not paste student names or identifying information.</div>
                <div className="small">This tool is for teachers and produces copy-and-paste QLearn code.</div>
            </div>
        </div>
    );

    const hasStudentPayload =
        !!techOut.suggestedTitle ||
        !!techOut.studentInstructions ||
        (!!techOut.sourceText && shouldIncludeSourceTextInStudentPage(techTool)) ||
        (techOut.nasotUsed?.length ?? 0) > 0 ||
        !!renderedCorellaStudentBlock;

    const showTeacherPromptBox = isTeacherPromptTool(techTool, techMode) && !isCorella(techTool);

    function applySuggestedTitle(idx: number) {
        setActivities((prev) =>
            prev.map((a, i) => {
                if (i !== idx) return a;
                const s = (a.ai.suggestedTitle || "").trim();
                if (!s) return a;
                return { ...a, title: s };
            })
        );
    }
    function openActivityBuilder(prefillKind?: ActivityKind) {
        setActivityBuilder((prev) => ({
            ...prev,
            isOpen: true,
            audience: "student",
            kind: prefillKind || prev.kind || "worksheet",
        }));
    }

    function closeActivityBuilder() {
        setActivityBuilder((prev) => ({
            ...prev,
            isOpen: false,
        }));
    }
    function renderActivityBuilderModal() {
        if (!activityBuilder.isOpen) return null;

        return (
            <div
                style={{
                    position: "fixed",
                    inset: 0,
                    background: "rgba(17,24,39,0.45)",
                    zIndex: 9998,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 20,
                }}
                onClick={closeActivityBuilder}
            >
                <div
                    style={{
                        width: "min(920px, 100%)",
                        maxHeight: "90vh",
                        overflowY: "auto",
                        background: "#FFFFFF",
                        borderRadius: 18,
                        boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
                        padding: 20,
                        border: "1px solid #D1D5DB",
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                        <div>
                            <div className="sectionTitle" style={{ marginBottom: 4 }}>Generate student activity</div>
                            <div className="small">Build the task first, then let AI draft something cleaner and better structured.</div>
                        </div>

                        <button className="btnGhost" onClick={closeActivityBuilder}>
                            Close
                        </button>
                    </div>

                    <div className="field">
                        <div className="label">Activity type</div>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                            {ACTIVITY_KIND_OPTIONS.map((opt) => (
                                <button
                                    key={opt.key}
                                    type="button"
                                    className={activityBuilder.kind === opt.key ? "btnPrimary" : "btnGhost"}
                                    onClick={() =>
                                        setActivityBuilder((prev) => ({
                                            ...prev,
                                            kind: opt.key,
                                        }))
                                    }
                                    style={{ borderRadius: 999, padding: "9px 12px" }}
                                >
                                    {opt.emoji} {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="field" style={{ marginTop: 14 }}>
                        <div className="label">Quick prompts</div>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                            {QUICK_ACTIVITY_PROMPTS.map((item) => (
                                <button
                                    key={item.label}
                                    type="button"
                                    className="btnGhost"
                                    onClick={() => applyQuickActivityPrompt(item)}
                                    style={{ borderRadius: 999, padding: "8px 12px" }}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="row" style={{ gridTemplateColumns: "1fr 180px", marginTop: 14 }}>
                        <div className="field">
                            <div className="label">Topic</div>
                            <input
                                className="input"
                                value={activityBuilder.topic}
                                onChange={(e) =>
                                    setActivityBuilder((prev) => ({
                                        ...prev,
                                        topic: e.target.value,
                                    }))
                                }
                                placeholder="e.g. SMART goals, cyber safety, fractions, persuasive devices"
                            />
                        </div>

                        <div className="field">
                            <div className="label">Item count</div>
                            <input
                                className="input"
                                type="number"
                                min={1}
                                max={30}
                                value={activityBuilder.itemCount}
                                onChange={(e) =>
                                    setActivityBuilder((prev) => ({
                                        ...prev,
                                        itemCount: Number(e.target.value || 0),
                                    }))
                                }
                            />
                        </div>
                    </div>

                    <div className="field" style={{ marginTop: 14 }}>
                        <div className="label">What should students do?</div>
                        <textarea
                            className="textarea"
                            value={activityBuilder.prompt}
                            onChange={(e) =>
                                setActivityBuilder((prev) => ({
                                    ...prev,
                                    prompt: e.target.value,
                                }))
                            }
                            placeholder="Describe the activity you want made."
                        />
                    </div>

                    <div className="field" style={{ marginTop: 14 }}>
                        <div className="label">Extra instructions</div>
                        <textarea
                            className="textarea"
                            value={activityBuilder.extraInstructions}
                            onChange={(e) =>
                                setActivityBuilder((prev) => ({
                                    ...prev,
                                    extraInstructions: e.target.value,
                                }))
                            }
                            placeholder="Optional scaffolds, tone, formatting, or lesson-specific notes."
                        />
                    </div>

                    <div className="row" style={{ gridTemplateColumns: "1fr 1fr", marginTop: 14 }}>
                        <label className="field" style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <input
                                type="checkbox"
                                checked={activityBuilder.showAnswers}
                                onChange={(e) =>
                                    setActivityBuilder((prev) => ({
                                        ...prev,
                                        showAnswers: e.target.checked,
                                    }))
                                }
                            />
                            <span>Include teacher answers</span>
                        </label>

                        <div className="field">
                            <div className="label">Audience</div>
                            <select
                                className="input"
                                value={activityBuilder.audience}
                                onChange={(e) =>
                                    setActivityBuilder((prev) => ({
                                        ...prev,
                                        audience: e.target.value as ActivityAudienceMode,
                                    }))
                                }
                            >
                                <option value="student">Student</option>
                                <option value="teacher">Teacher</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ marginTop: 16 }}>
                        <div className="label">Preview</div>
                        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", marginTop: 10 }}>
                            {previewCardsForKind(activityBuilder.kind, activityBuilder.itemCount).map((card, i) => (
                                <div
                                    key={i}
                                    style={{
                                        border: "1px solid #D1D5DB",
                                        borderRadius: 14,
                                        padding: 12,
                                        background: "#F9FAFB",
                                    }}
                                >
                                    <div style={{ fontWeight: 700, marginBottom: 6 }}>{card.title}</div>
                                    <div className="small">{card.body}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="actions" style={{ marginTop: 18 }}>
                        <button className="btnGhost" onClick={closeActivityBuilder}>
                            Cancel
                        </button>

                        <button className="btnPrimary" onClick={generateFromActivityBuilder}>
                            Generate this activity
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    function applyQuickActivityPrompt(item: { label: string; kind: ActivityKind; prompt: string }) {
        setActivityBuilder((prev) => ({
            ...prev,
            kind: item.kind,
            quickPrompt: item.label,
            prompt: item.prompt,
        }));
    }

    async function generateFromActivityBuilder() {
        const finalPrompt = buildPromptFromBuilder(activityBuilder).trim();

        if (!finalPrompt) {
            setActivities((prev) =>
                prev.map((p, i) =>
                    i === activeActivityIndex ? { ...p, aiError: "Add what you want students to do first." } : p
                )
            );
            return;
        }

        setActivities((prev) =>
            prev.map((p, i) =>
                i === activeActivityIndex
                    ? {
                        ...p,
                        teacherAsk: finalPrompt,
                        aiBusy: true,
                        aiError: "",
                        builderMeta: {
                            kind: activityBuilder.kind,
                            itemCount: activityBuilder.itemCount,
                            topic: activityBuilder.topic.trim(),
                            extraInstructions: activityBuilder.extraInstructions.trim(),
                            showAnswers: activityBuilder.showAnswers,
                            audience: activityBuilder.audience,
                        },
                    }
                    : p
            )
        );

        closeActivityBuilder();
        await generateActivity(
            activeActivityIndex,
            finalPrompt,
            {
                kind: activityBuilder.kind,
                itemCount: activityBuilder.itemCount,
                topic: activityBuilder.topic.trim(),
                extraInstructions: activityBuilder.extraInstructions.trim(),
                showAnswers: activityBuilder.showAnswers,
                audience: activityBuilder.audience,
            }
        );
    }

    function applySuggestedOverview(idx: number, mode: "replace" | "append") {
        setActivities((prev) =>
            prev.map((a, i) => {
                if (i !== idx) return a;
                const s = (a.ai.suggestedOverview || "").trim();
                if (!s) return a;

                const payload = escapeHtml(s).replaceAll("\n", "<br/>");
                const block = `<div style="margin:0 0 10px 0; white-space:normal; line-height:1.35;">${payload}</div>`;

                const next = mode === "append" ? [a.studentTask?.trim(), block].filter(Boolean).join("\n\n") : block;

                return { ...a, studentTask: next };
            })
        );
    }

    function insertSelectedPQ(idx: number, mode: "append" | "replace") {
        const a = activities[idx];
        const pqIdx = selectedPQ[idx] ?? 0;
        const q = a?.ai?.powerfulQuestions?.[pqIdx]?.question?.trim();
        if (!q) return;

        const block = `<div style="margin-top:12px; padding:10px; border:1px solid #888B8A; background:#FFFFFF;">
  <div style="font-weight:700; margin-bottom:6px;">Powerful question</div>
  <div style="white-space:pre-wrap; line-height:1.35;">${escapeHtml(q)}</div>
</div>`;

        setActivities((prev) =>
            prev.map((x, i) => {
                if (i !== idx) return x;
                const next = mode === "append" ? [x.studentTask?.trim(), block].filter(Boolean).join("\n\n") : block;
                return { ...x, studentTask: next };
            })
        );
    }
    function activityHasStructuredOutputs(a: ActivityState) {
        return Boolean(
            a.ai.outputs.instructions ||
            a.ai.outputs.closeActivity ||
            a.ai.outputs.teacherScript ||
            a.ai.outputs.resource
        );
    }

    function applyAiOutputToActivity(
        idx: number,
        key: keyof ActivityOutputs,
        mode: "replace" | "append"
    ) {
        setActivities((prev) =>
            prev.map((a, i) => {
                if (i !== idx) return a;

                const block = a.ai.outputs[key]?.content?.trim();
                if (!block) return a;

                const next =
                    mode === "append"
                        ? [a.studentTask?.trim(), block].filter(Boolean).join("\n\n")
                        : block;

                return { ...a, studentTask: next };
            })
        );
    }

    function activityHasDiff(a: ActivityState) {
        return (
            (a.ai.diff?.helpfulHints?.length ?? 0) > 0 ||
            (a.ai.diff?.tooHardTryThis?.length ?? 0) > 0 ||
            (a.ai.diff?.extension?.length ?? 0) > 0 ||
            (a.ai.diff?.stepThisOut?.length ?? 0) > 0
        );
    }

    function appendHtmlToActivity(label: ActivityLabel, htmlBlock: string) {
        setActivities((prev) =>
            prev.map((a) => {
                if (a.label !== label) return a;
                const next = [a.studentTask?.trim(), htmlBlock].filter(Boolean).join("\n\n");
                return { ...a, studentTask: next };
            })
        );
    }

    const nasotAudit = useMemo(() => {
        const byId = nasotById;
        const selected = nasotSelectedIds.map((id) => byId.get(id)).filter(Boolean) as NasotElementDef[];

        const activityTextByLabel: Record<ActivityLabel, string> = {
            "Activity 1": activities.find((a) => a.label === "Activity 1")?.studentTask || "",
            "Activity 2": activities.find((a) => a.label === "Activity 2")?.studentTask || "",
            "Activity 3": activities.find((a) => a.label === "Activity 3")?.studentTask || "",
            "Activity 4": activities.find((a) => a.label === "Activity 4")?.studentTask || "",
            "Exit Activity": activities.find((a) => a.label === "Exit Activity")?.studentTask || "",
        };

        type NasotStatusLocal = "green" | "amber" | "red";

        return selected.map((def) => {
            const assignedSlots = (Object.keys(nasotAssignments) as ActivityLabel[]).filter((slot) => (nasotAssignments[slot] || []).includes(def.id));

            const evidenceSlots = assignedSlots.filter((slot) => {
                const text = activityTextByLabel[slot] || "";
                return (
                    normaliseText(text).includes(normaliseText(def.name)) ||
                    hasAnyKeyword(text, focusKeywords(def.focus)) ||
                    (text || "").trim().length > 0
                );
            });

            let status: NasotStatusLocal = "red";
            if (assignedSlots.length === 0) status = "red";
            else if (evidenceSlots.length === 0) status = "amber";
            else status = "green";

            return {
                id: def.id,
                name: def.name,
                focus: def.focus,
                status,
                assignedSlots,
                evidenceSlots,
                aim: def.aim,
                example: def.example,
            };
        });
    }, [nasotSelectedIds, nasotAssignments, nasotById, activities]);

    function buildTeacherRunSheet() {
        const { lg, sc } = getFallbackVerbsVocab();

        const lines: string[] = [];
        lines.push(`Teacher rundown sheet: ${lessonTitle || "Untitled lesson"}`);
        lines.push("");

        if (lg.length) {
            lines.push("Learning goals:");
            lg.forEach((x) => lines.push(`- ${x}`));
            lines.push("");
        }

        if (sc.length) {
            lines.push("Success criteria:");
            sc.forEach((x, i) => lines.push(`${i + 1}. ${x}`));
            lines.push("");
        }

        if (warmupStory.trim()) {
            lines.push("Warm-up (3–5 min):");
            lines.push("- Read the warm-up once.");
            lines.push("- Ask: What is the problem asking us to work out?");
            lines.push("- Quick check: fingers 1–4 confidence.");
            lines.push("");
        }

        lines.push("Lesson flow (suggested timings):");
        lines.push("");

        const timing: Record<ActivityLabel, string> = {
            "Activity 1": "8–10 min",
            "Activity 2": "12–15 min",
            "Activity 3": "8–10 min",
            "Activity 4": "12–15 min",
            "Exit Activity": "5–7 min",
        };

        for (const a of activities) {
            lines.push(`${a.label} (${timing[a.label] || "10 min"}): ${a.title || a.label}`);

            if (a.nasotStrategies?.length) {
                lines.push(`- NASOT focus: ${a.nasotStrategies.join(", ")}`);
            }

            const pq = a.ai?.powerfulQuestions?.[0]?.question?.trim();
            if (pq) lines.push(`- Check question: ${pq}`);

            lines.push("- Circulate: check working and ask students to justify one step.");
            lines.push("- On-track prompt: Point to the success criterion you are meeting right now.");
            lines.push("");
        }

        lines.push("End check:");
        lines.push("- Cold call 1–2 students: What was the most important step and why?");
        lines.push("- Students self-rate: Got it / Shaky / Not yet.");
        lines.push("- Note who needs reteach/support next lesson.");
        lines.push("");

        return lines.join("\n");
    }

    return stage === "landing" ? (
        <div className="landingWrap">
            <div className="landing">
                <img className="landingLogo" src="/COLOUR-SSSS.png" alt="Maroochydore State High" />
                <div className="landingTitle">QLearn Builder</div>
                <div className="landingTag">Turn what you already plan into QLearn lessons.</div>

                <div style={{ marginTop: 14 }}>{safetyNotice}</div>

                <div className="landingCard">
                    <div className="field">
                        <div className="label">Lesson title</div>
                        <input className="input" value={lessonTitle} onChange={(e) => setLessonTitle(e.target.value)} placeholder="e.g. Lesson 2" />
                        <div className="small" style={{ marginTop: 6 }}>
                            Tip: keep it short. You can refine details in the next steps.
                        </div>
                    </div>

                    <div className="field" style={{ marginTop: 12 }}>
                        <div className="label">Teacher context (optional)</div>
                        <textarea
                            className="textarea"
                            value={teacherContext}
                            onChange={(e) => setTeacherContext(e.currentTarget.value)}
                            placeholder="Class context, misconceptions, adjustments, behaviour notes, curriculum links, etc."
                        />
                        <div className="small" style={{ marginTop: 6 }}>
                            Tip: keep it short. You can refine details in the next steps.
                        </div>
                    </div>

                    <button className="startBtn" disabled={!canStart()} onClick={goBuilder}>
                        Start
                    </button>
                </div>
            </div>
        </div>
    ) : (
        <div className="appShell">
            {renderActivityBuilderModal()}

            {toastMsg ? (
                <div
                    style={{
                        position: "fixed",
                        right: 18,
                        bottom: 18,
                        zIndex: 9999,
                        background: "#111827",
                        color: "#FFFFFF",
                        padding: "10px 14px",
                        borderRadius: 12,
                        boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
                        fontSize: 13,
                    }}
                >
                    {toastMsg}
                </div>
            ) : null}

            <div className="topBar">
                <div className="brandMini">
                    <img className="brandMiniLogo" src="/COLOUR-SSSS.png" alt="MSHS" />
                    <div>
                        <div className="brandMiniTitle">QLearn Builder</div>
                        <div className="brandMiniSub">{lessonTitle || "Untitled lesson"}</div>
                    </div>
                </div>

                <button className="btnLink" onClick={goLanding}>
                    Back to start
                </button>
            </div>

            <div style={{ marginBottom: 10 }}>{safetyNotice}</div>

            <div className="tabs">
                <button className={`tab ${tab === "goals" ? "tabOn" : ""}`} onClick={() => setTab("goals")}>
                    Learning goals <span className="pill">{counts.lgCount}</span>
                </button>

                <button className={`tab ${tab === "criteria" ? "tabOn" : ""}`} onClick={() => setTab("criteria")}>
                    Success criteria <span className="pill">{counts.scCount}</span>
                </button>

                <button className={`tab ${tab === "vocab" ? "tabOn" : ""}`} onClick={() => setTab("vocab")}>
                    Vocab + verbs
                </button>

                <button className={`tab ${tab === "warmup" ? "tabOn" : ""}`} onClick={() => setTab("warmup")}>
                    Warm-up story
                </button>

                <button className={`tab ${tab === "nasot" ? "tabOn" : ""}`} onClick={() => setTab("nasot")}>
                    NASOT focus
                </button>

                <button className={`tab ${tab === "tech" ? "tabOn" : ""}`} onClick={() => setTab("tech")}>
                    Technology tools
                </button>

                <button className={`tab ${tab === "activities" ? "tabOn" : ""}`} onClick={() => setTab("activities")}>
                    Activities
                </button>

                <button className={`tab ${tab === "output" ? "tabOn" : ""}`} onClick={() => setTab("output")}>
                    Copy into QLearn
                    </button>

            </div>

            {tab === "goals" && (
                <div className="card">
                    <div className="sectionTitle">Learning goals</div>
                    <div className="small">One goal per line.</div>

                    {learningGoals.map((g, idx) => (
                        <div className="row" key={idx}>
                            <input className="input" value={g} onChange={(e) => updateLine(setLearningGoals, idx, e.target.value)} placeholder={`Learning goal ${idx + 1}`} />
                            <button className="btnGhost" onClick={() => removeLine(setLearningGoals, idx)} disabled={learningGoals.length <= 1}>
                                Remove
                            </button>
                        </div>
                    ))}

                    <div className="actions">
                        <button className="btnGhost" onClick={() => addLine(setLearningGoals)}>
                            Add line
                        </button>
                        <button className="btnPrimary" onClick={() => setTab("criteria")}>
                            Next
                        </button>
                    </div>
                </div>
            )}

            {tab === "criteria" && (
                <div className="card">
                    <div className="sectionTitle">Success criteria</div>
                    <div className="small">One criterion per line.</div>

                    {successCriteria.map((c, idx) => (
                        <div className="row" key={idx}>
                            <input className="input" value={c} onChange={(e) => updateLine(setSuccessCriteria, idx, e.target.value)} placeholder={`Success criterion ${idx + 1}`} />
                            <button className="btnGhost" onClick={() => removeLine(setSuccessCriteria, idx)} disabled={successCriteria.length <= 1}>
                                Remove
                            </button>
                        </div>
                    ))}

                    <div className="actions">
                        <button className="btnGhost" onClick={() => addLine(setSuccessCriteria)}>
                            Add line
                        </button>
                        <button className="btnPrimary" onClick={() => setTab("vocab")}>
                            Next
                        </button>
                    </div>
                </div>
            )}

            {tab === "vocab" && (
                <div className="card">
                    <div className="sectionTitle">Vocab + cognitive verbs</div>
                    <div className="small">Type your own, or let AI suggest aligned options. Lock stops accidental changes.</div>

                    {vvError ? <div className="errorBox">{vvError}</div> : null}

                    <div className="field" style={{ marginTop: 10 }}>
                        <div className="label">Vocab level</div>
                        <select className="input" value={vocabBand} onChange={(e) => setVocabBand(e.target.value as VocabBand)} disabled={vvLocked}>
                            <option value="Year 7–8">Year 7–8</option>
                            <option value="Year 9–10">Year 9–10</option>
                            <option value="Senior">Senior</option>
                        </select>
                        <div className="small" style={{ marginTop: 6 }}>
                            This changes the complexity of vocabulary and how assessment-like the language is.
                        </div>
                    </div>

                    <div className="row" style={{ gridTemplateColumns: "1fr 1fr" }}>
                        <div className="field">
                            <div className="label">Cognitive verbs</div>
                            <textarea className="textarea" value={verbsText} onChange={(e) => setVerbsText(e.currentTarget.value)} placeholder="One per line." />
                        </div>

                        <div className="field">
                            <div className="label">Tier 2/3 vocabulary</div>
                            <textarea className="textarea" value={vocabText} onChange={(e) => setVocabText(e.target.value)} placeholder="One per line." />
                        </div>
                    </div>

                    <div className="actions">
                        <button className="btnGhost" onClick={generateVocabAndVerbs} disabled={vvBusy || vvLocked}>
                            {vvBusy ? "Making..." : "Make with AI"}
                        </button>

                        <button className="btnPrimary" onClick={() => setVvLocked((v) => !v)}>
                            {vvLocked ? "Unlock" : "Lock"}
                        </button>

                        <button className="btnPrimary" onClick={() => setTab("warmup")}>
                            Next
                        </button>
                    </div>
                </div>
            )}

            {tab === "warmup" && (
                <div className="card">
                    <div className="sectionTitle">Warm-up story</div>
                    <div className="small">Student-facing warm-up (this exports into QLearn). Lock stops accidental changes.</div>

                    {warmupError ? <div className="errorBox">{warmupError}</div> : null}

                    <div className="field">
                        <div className="label">Context (optional)</div>
                        <input className="input" value={warmupContext} onChange={(e) => setWarmupContext(e.target.value)} placeholder="e.g. netball, fishing, local event" disabled={warmupLocked} />
                    </div>

                    <div className="field">
                        <div className="label">Warm-up story preview (student-facing)</div>
                        <textarea
                            className="textarea"
                            value={warmupStory}
                            onChange={(e) => setWarmupStory(e.target.value)}
                            placeholder="Make a 60-second warm-up story aligned to your learning goals and success criteria."
                            disabled={warmupLocked}
                        />
                    </div>

                    <div className="field">
                        <div className="label">Teacher guide (planning only)</div>
                        <div className="small">Editable notes for you. Not exported into QLearn.</div>
                        <textarea className="textarea" value={warmupTeachNotes} onChange={(e) => setWarmupTeachNotes(e.target.value)} placeholder="Optional notes. (No lock.)" />
                    </div>

                    <div className="actions">
                        <button className="btnGhost" onClick={generateWarmupStory} disabled={warmupBusy || warmupLocked}>
                            {warmupBusy ? "Making..." : "Make"}
                        </button>

                        <button className="btnPrimary" onClick={() => setWarmupLocked((v) => !v)}>
                            {warmupLocked ? "Unlock" : "Lock"}
                        </button>

                        <button className="btnPrimary" onClick={() => setTab("nasot")}>
                            Next
                        </button>
                    </div>
                </div>
            )}

            {tab === "nasot" && (
                <div className="card">
                    <div className="sectionTitle">NASOT focus</div>
                    <div className="small">Pick up to 5. Budgets stop overuse. Selected elements auto-spread across Activities 1–4 and Exit.</div>

                    <div className="nasotTopRow">
                        <div className="nasotTabs">
                            <button className={`nasotTabBtn ${nasotFocusTab === "Feedback" ? "nasotTabOn" : ""}`} onClick={() => setNasotFocusTab("Feedback")}>
                                Feedback
                            </button>
                            <button className={`nasotTabBtn ${nasotFocusTab === "Content" ? "nasotTabOn" : ""}`} onClick={() => setNasotFocusTab("Content")}>
                                Content
                            </button>
                            <button className={`nasotTabBtn ${nasotFocusTab === "Context" ? "nasotTabOn" : ""}`} onClick={() => setNasotFocusTab("Context")}>
                                Context
                            </button>
                        </div>

                        <div className="small">
                            Selected: {nasotSelectedIds.length} / 5 • Showing: {nasotFocusTab}
                        </div>
                    </div>

                    <div className="nasotGrid" style={{ marginTop: 12 }}>
                        {filteredNasot.map((d) => {
                            const checked = nasotSelectedIds.includes(d.id);
                            const disabled = !checked && nasotSelectedIds.length >= 5;

                            return (
                                <label key={d.id} className={`nasotTile ${checked ? "nasotTileOn" : ""}`} aria-disabled={disabled}>
                                    <input
                                        type="checkbox"
                                        checked={checked}
                                        disabled={disabled}
                                        onChange={(e) => {
                                            const on = e.target.checked;
                                            setNasotSelectedIds((prev) => {
                                                if (on) {
                                                    if (prev.length >= 5) return prev;
                                                    return [...prev, d.id];
                                                }
                                                return prev.filter((x) => x !== d.id);
                                            });
                                        }}
                                    />

                                    <div>
                                        <div className="nasotTileTitle">
                                            Element {d.number}: {d.name}
                                        </div>

                                        <div className="nasotTileMeta">
                                            <span className={`badge ${d.focus === "Feedback" ? "badgeSoft" : ""}`}>{d.focus}</span>
                                            <span className={`badge ${d.budget === 2 ? "badgeWarn" : ""}`}>Budget {d.budget}</span>
                                        </div>

                                        <div className="nasotTileBody">
                                            <div className="nasotLine">
                                                <strong>Aim:</strong> {d.aim}
                                            </div>
                                            <div className="nasotLine">
                                                <strong>What it looks like:</strong> {d.example}
                                            </div>
                                        </div>
                                    </div>
                                </label>
                            );
                        })}
                    </div>

                    <div className="infoBox" style={{ marginTop: 14 }}>
                        <div className="infoTitle">What does “Budget” mean?</div>
                        <div className="small">
                            Budget is a guardrail so the tool does not spam the same strategy across every activity.
                            <br />
                            <strong>Budget 0</strong> = never auto-spread. <strong>Budget 1</strong> = used once across the lesson. <strong>Budget 2</strong> = can appear twice (usually Exit + one activity).
                        </div>
                    </div>

                    <div className="actions">
                        <button className="btnGhost" onClick={() => setNasotSelectedIds([])}>
                            Clear selection
                        </button>
                        <button className="btnPrimary" onClick={() => setTab("tech")}>
                            Next
                        </button>
                    </div>
                </div>
            )}

            {/* ---------------- TECH ---------------- */}
            {tab === "tech" && (
                <div className="card">
                    <div className="sectionTitle">Technology tools</div>
                    <div className="small">Choose a tool, choose a mode, then make a run sheet. You choose what goes into Activities.</div>

                    {techError ? <div className="errorBox">{techError}</div> : null}

                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
                        {TECH_TOOLS.map((t) => {
                            const on = techTool === t.key;
                            return (
                                <button key={t.key} className={on ? "btnPrimary" : "btnGhost"} onClick={() => setTechTool(t.key)} style={{ padding: "10px 14px", borderRadius: 999 }}>
                                    {t.label}
                                </button>
                            );
                        })}
                    </div>

                    {techTool !== "corella" ? (
                        <div className="field" style={{ marginTop: 14 }}>
                            <div className="label">Make something for</div>
                            <div className="small" style={{ marginBottom: 6 }}>
                                This sets the NASOT options passed into the brainstorm.
                            </div>
                            <select className="input" value={techTarget} onChange={(e) => setTechTarget(e.target.value as ActivityLabel)}>
                                {ACTIVITY_ORDER.map((a) => (
                                    <option key={a} value={a}>
                                        {a} • {ACTIVITY_LENSES[a].label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    ) : null}

                    {techTool === "corella" ? (
                        <div style={{ marginTop: 14 }}>
                            <div className="label">Corella strategy</div>
                            <div className="small" style={{ marginBottom: 8 }}>
                                Pick a fixed strategy template. This does not call the API.
                            </div>

                            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                                {(CORELLA_STRATEGIES as any[]).map((s) => {
                                    const on = corellaStrategyId === s.id;
                                    return (
                                        <button
                                            key={s.id}
                                            className={on ? "btnPrimary" : "btnGhost"}
                                            onClick={() => {
                                                setCorellaStrategyId(s.id);
                                                loadCorellaStrategy(s);
                                            }}
                                            style={{ borderRadius: 999, padding: "9px 12px" }}
                                        >
                                            {s.title}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <>
                            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
                                {TECH_MODES[techTool].map((m) => {
                                    const on = techMode === m.key;
                                    return (
                                        <button key={m.key} className={on ? "btnPrimary" : "btnGhost"} onClick={() => setTechMode(m.key)} style={{ padding: "9px 12px", borderRadius: 999 }}>
                                            {m.label}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="field" style={{ marginTop: 14 }}>
                                <div className="label">Teacher request (optional)</div>

                                <div className="small" style={{ marginBottom: 6 }}>
                                    {showTeacherPromptBox
                                        ? techTool === "canva"
                                            ? "Used to make a Canva AI teacher prompt. Students never paste prompts."
                                            : "Used to make a NotebookLM teacher prompt. Students use the output only."
                                        : "Optional. Helps shape the student activity even in student task modes."}
                                </div>

                                <textarea
                                    className="textarea"
                                    value={techAsk}
                                    onChange={(e) => setTechAsk(e.target.value)}
                                    placeholder={
                                        techTool === "canva"
                                            ? "e.g. Create a Canva logo design activity with peer feedback."
                                            : techTool === "adobe"
                                                ? "e.g. Cyber safety poster task using Adobe Express."
                                                : "Describe what you want the activity to do..."
                                    }
                                />
                            </div>

                            <div className="actions">
                                <button className="btnPrimary" onClick={generateTech} disabled={techBusy}>
                                    {techBusy ? "Making..." : `Make for ${TECH_TOOLS.find((t) => t.key === techTool)?.label || "Tool"}`}
                                </button>

                                <button
                                    className="btnGhost"
                                    onClick={() => {
                                        setTechOut({
                                            suggestedTitle: "",
                                            activitySummary: "",
                                            studentInstructions: "",
                                            toolPrompt: "",
                                            sourceText: "",
                                            nasotUsed: [],
                                            corellaBlock: "",
                                        });
                                        setTechError("");
                                    }}
                                >
                                    Clear this box
                                </button>

                                <button className="btnPrimary" onClick={() => setTab("activities")}>
                                    Next
                                </button>
                            </div>
                        </>
                    )}

                    {(techOut.suggestedTitle ||
                        techOut.activitySummary ||
                        techOut.studentInstructions ||
                        (shouldIncludeSourceTextInStudentPage(techTool) && techOut.sourceText) ||
                        techOut.nasotUsed?.length ||
                        renderedCorellaStudentBlock) && (
                            <div className="previewBox" style={{ marginTop: 14 }}>
                                <div className="previewTitle">
                                    {TECH_TOOLS.find((t) => t.key === techTool)?.label}:{" "}
                                    {(TECH_MODES[techTool].find((m) => m.key === techMode)?.label || "Output") + " (copy and paste)"}
                                </div>

                                {techOut.suggestedTitle ? (
                                    <div className="field" style={{ marginTop: 12 }}>
                                        <div className="label">Suggested activity title</div>
                                        <input className="input" value={techOut.suggestedTitle} onChange={(e) => setTechOut((p) => ({ ...p, suggestedTitle: e.target.value }))} />
                                    </div>
                                ) : null}

                                {techTool !== "corella" && (techOut.activitySummary || techOut.nasotUsed?.length) ? (
                                    <div className="infoBox" style={{ marginTop: 12 }}>
                                        {techOut.activitySummary ? (
                                            <>
                                                <div className="infoTitle">Brainstorm summary (teacher)</div>
                                                <div className="small" style={{ whiteSpace: "pre-wrap", lineHeight: 1.35 }}>
                                                    {techOut.activitySummary}
                                                </div>
                                            </>
                                        ) : null}

                                        {techOut.nasotUsed?.length ? (
                                            <div style={{ marginTop: 10 }}>
                                                <div className="small" style={{ fontWeight: 700 }}>NASOT used in this draft</div>
                                                <div className="small" style={{ marginTop: 4 }}>{techOut.nasotUsed.join(", ")}</div>
                                            </div>
                                        ) : (
                                            <div className="small" style={{ marginTop: 10, opacity: 0.85 }}>NASOT used: (none detected yet)</div>
                                        )}
                                    </div>
                                ) : null}

                                {techTool === "corella" && renderedCorellaStudentBlock ? (
                                    <div className="field" style={{ marginTop: 12 }}>
                                        <div className="label">Student block (final)</div>
                                        <div className="small">This exports as one block: instructions first, then the LEARN table.</div>

                                        <div style={{ border: "1px solid #888B8A", background: "#FFFFFF", padding: 10, overflowX: "auto", borderRadius: 10 }} dangerouslySetInnerHTML={{ __html: renderedCorellaStudentBlock }} />

                                        <div className="actions" style={{ marginTop: 10 }}>
                                            <button
                                                className="btnGhost"
                                                onClick={async () => {
                                                    const ok = await copyText(renderedCorellaStudentBlock);
                                                    showToast(ok ? "Copied to your clipboard" : "Copy failed");
                                                }}
                                            >
                                                Copy this block for QLearn
                                            </button>
                                        </div>
                                    </div>
                                ) : null}

                                {techTool !== "corella" && techOut.studentInstructions ? (
                                    <div className="field" style={{ marginTop: 12 }}>
                                        <div className="label">Student instructions (this goes into QLearn)</div>
                                        <textarea className="textarea" value={techOut.studentInstructions} onChange={(e) => setTechOut((p) => ({ ...p, studentInstructions: e.target.value }))} />

                                        <div className="actions" style={{ marginTop: 8 }}>
                                            <button type="button" className="btnPrimary" onClick={() => applyTechToActivity(techTarget, "replace")}>
                                                Replace the activity text
                                            </button>

                                            <button type="button" className="btnGhost" onClick={() => applyTechToActivity(techTarget, "append")}>
                                                Add underneath (keep existing text)
                                            </button>

                                            <button
                                                type="button"
                                                className="btnGhost"
                                                onClick={async () => {
                                                    const ok = await copyText(techOut.studentInstructions);
                                                    showToast(ok ? "Copied to your clipboard" : "Copy failed");
                                                }}
                                                disabled={!techOut.studentInstructions.trim()}
                                            >
                                                Copy student instructions
                                            </button>
                                        </div>
                                    </div>
                                ) : null}

                                {showTeacherPromptBox && techOut.toolPrompt ? (
                                    <div className="field" style={{ marginTop: 12 }}>
                                        <div className="label">Teacher prompt (copy and paste)</div>
                                        <div className="small">{techTool === "canva" ? "Paste this into Canva AI." : "Use this to make the NotebookLM resource. Students do not paste prompts."}</div>
                                        <textarea className="textarea" value={techOut.toolPrompt} onChange={(e) => setTechOut((p) => ({ ...p, toolPrompt: e.target.value }))} />
                                        <div className="actions" style={{ marginTop: 8 }}>
                                            <button
                                                type="button"
                                                className="btnGhost"
                                                onClick={async () => {
                                                    const ok = await copyText(techOut.toolPrompt);
                                                    showToast(ok ? "Copied to your clipboard" : "Copy failed");
                                                }}
                                                disabled={!techOut.toolPrompt.trim()}
                                            >
                                                Copy teacher prompt
                                            </button>
                                        </div>
                                    </div>
                                ) : null}

                                {techTool === "notebooklm" && techOut.sourceText ? (
                                    <div className="field" style={{ marginTop: 12 }}>
                                        <div className="label">Resource (students use this)</div>
                                        <div className="small">You can add this into the student activity when you put it into an Activity.</div>
                                        <textarea className="textarea" value={techOut.sourceText} onChange={(e) => setTechOut((p) => ({ ...p, sourceText: e.target.value }))} />

                                        <div className="actions" style={{ marginTop: 8 }}>
                                            <button type="button" className="btnPrimary" onClick={() => applyTechToActivity(techTarget, "replace")} disabled={!techOut.sourceText.trim()}>
                                                Replace the activity text
                                            </button>

                                            <button type="button" className="btnGhost" onClick={() => applyTechToActivity(techTarget, "append")} disabled={!techOut.sourceText.trim()}>
                                                Add underneath (keep existing text)
                                            </button>

                                            <button
                                                type="button"
                                                className="btnGhost"
                                                onClick={async () => {
                                                    const ok = await copyText(techOut.sourceText);
                                                    showToast(ok ? "Copied to your clipboard" : "Copy failed");
                                                }}
                                                disabled={!techOut.sourceText.trim()}
                                            >
                                                Copy resource text
                                            </button>
                                        </div>
                                    </div>
                                ) : null}

                                {hasStudentPayload ? (
                                    <div className="infoBox" style={{ marginTop: 12 }}>
                                        <div className="small" style={{ fontWeight: 700 }}>Put student-facing content into an Activity</div>

                                        <div className="row" style={{ gridTemplateColumns: "1fr 180px", marginTop: 10 }}>
                                            <div className="field">
                                                <div className="label">Target activity</div>
                                                <select className="input" value={techTarget} onChange={(e) => setTechTarget(e.target.value as ActivityLabel)}>
                                                    {ACTIVITY_ORDER.map((a) => (
                                                        <option key={a} value={a}>
                                                            {a}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="field">
                                                <div className="label">How should it go in?</div>
                                                <select className="input" value={techApplyFormat} onChange={(e) => setTechApplyFormat(e.target.value as any)}>
                                                    <option value="replace">Replace what’s there</option>
                                                    <option value="append">Add underneath</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="actions" style={{ marginTop: 10 }}>
                                            <button className="btnPrimary" onClick={() => applyTechToActivity(techTarget, techApplyFormat)}>
                                                Put this into {techTarget}
                                            </button>

                                            <button
                                                className="btnGhost"
                                                onClick={() => {
                                                    setTechOut({
                                                        suggestedTitle: "",
                                                        activitySummary: "",
                                                        studentInstructions: "",
                                                        toolPrompt: "",
                                                        sourceText: "",
                                                        nasotUsed: [],
                                                        corellaBlock: "",
                                                    });
                                                    setTechError("");
                                                }}
                                            >
                                                Clear this box
                                            </button>

                                            <button className="btnPrimary" onClick={() => setTab("activities")}>
                                                Next
                                            </button>
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        )}
                </div>
            )}

            {/* ---------------- ACTIVITIES ---------------- */}
            {tab === "activities" && (
                <div className="card">
                    <div className="sectionTitle">Activities</div>
                    <div className="small">Student instructions are final. If it contains Corella code, it shows as a table.</div>

                    <div className="tabs" style={{ borderBottom: "none", marginBottom: 8, paddingBottom: 0 }}>
                        {activities.map((a, idx) => (
                            <button key={a.label} className={`tab ${idx === activeActivityIndex ? "tabOn" : ""}`} onClick={() => setActiveActivityIndex(idx)}>
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                                    <div>{a.label}</div>
                                    <div className="small" style={{ marginTop: 2 }}>
                                        {ACTIVITY_LENSES[a.label].label}
                                    </div>
                                </div>
                            </button>
                        ))}
                        </div>
                        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12, marginBottom: 12 }}>
                            <button
                                type="button"
                                className="btnPrimary"
                                onClick={() => openActivityBuilder(active.builderMeta?.kind || "worksheet")}
                            >
                                ✨ Generate student activity
                            </button>
                        </div>

                        {(active.aiBusy ||
                            active.aiError ||
                            active.ai.suggestedTitle ||
                            active.ai.suggestedOverview ||
                            activityHasStructuredOutputs(active) ||
                            (active.ai.powerfulQuestions?.length ?? 0) > 0 ||
                            activityHasDiff(active)) && (
                            <div className="previewBox" style={{ marginTop: 14 }}>
                                <div className="previewTitle">AI suggestions (it won’t change your work unless you click a button)</div>

                                {/* NEW: Student-facing read-aloud block, placed ABOVE the generation box */}
                                {(active.ai.diff?.helpfulHints?.length ?? 0) > 0 && active.toggles.helpfulHints ? (
                                    <div
                                        style={{ marginTop: 10 }}
                                        dangerouslySetInnerHTML={{
                                            __html: readAloudBlockHtml(active.ai.diff.helpfulHints),
                                        }}
                                    />
                                ) : null}

                                {(active.ai.diff?.helpfulHints?.length ?? 0) > 0 && active.toggles.helpfulHints ? (
                                    <div className="actions" style={{ marginTop: 6 }}>
                                        <button
                                            className="btnGhost"
                                            onClick={async () => {
                                                const txt = active.ai.diff.helpfulHints.map((x) => `- ${x}`).join("\n");
                                                const ok = await copyText(txt);
                                                showToast(ok ? "Copied to your clipboard" : "Copy failed");
                                            }}
                                        >
                                            Copy read-aloud lines
                                        </button>
                                    </div>
                                ) : null}

                                <div className="field">
                                    <div className="label">Type what you want AI to generate.</div>

                                    <textarea
                                        className="textarea"
                                        placeholder={`Example:
Create a 50 word cloze activity about SMART goals.
Include instructions.
Put it into a QLearn table.`}
                                        value={active.teacherAsk || ""}
                                        onChange={(e) =>
                                            setActivities((prev) =>
                                                prev.map((p, i) =>
                                                    i === activeActivityIndex ? { ...p, teacherAsk: e.target.value, aiError: "" } : p
                                                )
                                            )
                                        }
                                    />
                                </div>

                                {active.aiBusy ? <div className="small" style={{ marginTop: 8 }}>Making…</div> : null}
                                {active.aiError ? <div className="errorBox" style={{ marginTop: 10 }}>{active.aiError}</div> : null}

                                {activityHasStructuredOutputs(active) ? (
    <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
        {([
            ["instructions", active.ai.outputs.instructions],
            ["closeActivity", active.ai.outputs.closeActivity],
            ["teacherScript", active.ai.outputs.teacherScript],
            ["resource", active.ai.outputs.resource],
        ] as const).map(([key, block]) => {
            if (!block?.content?.trim()) return null;

            return (
                <div
                    key={key}
                    className="field"
                    style={{
                        border: "1px solid #D1D5DB",
                        borderRadius: 12,
                        padding: 12,
                        background: "#fff",
                    }}
                >
                    <div className="label">{block.title}</div>
                    <div className="small" style={{ marginTop: 4 }}>
                        This is a separate AI output. You can use it on its own.
                    </div>

                    {looksLikeHtml(block.content) ? (
                        <div
                            style={{
                                marginTop: 10,
                                border: "1px solid #888B8A",
                                background: "#FFFFFF",
                                padding: 10,
                                overflowX: "auto",
                                borderRadius: 10,
                            }}
                            dangerouslySetInnerHTML={{ __html: block.content }}
                        />
                    ) : (
                        <div
                            style={{
                                marginTop: 10,
                                border: "1px solid #888B8A",
                                background: "#FFFFFF",
                                padding: 10,
                                borderRadius: 10,
                                whiteSpace: "pre-wrap",
                                lineHeight: 1.35,
                            }}
                        >
                            {block.content}
                        </div>
                    )}

                    <div className="actions" style={{ marginTop: 8 }}>
                        <button
                            type="button"
                            className="btnPrimary"
                            onClick={() => applyAiOutputToActivity(activeActivityIndex, key, "replace")}
                        >
                            Replace what’s there
                        </button>

                        <button
                            type="button"
                            className="btnGhost"
                            onClick={() => applyAiOutputToActivity(activeActivityIndex, key, "append")}
                        >
                            Add underneath
                        </button>

                        <button
                            type="button"
                            className="btnGhost"
                            onClick={async () => {
                                const ok = await copyText(block.content);
                                showToast(ok ? "Copied to your clipboard" : "Copy failed");
                            }}
                        >
                            Copy this output
                        </button>
                    </div>
                </div>
            );
        })}
    </div>
) : active.ai.suggestedOverview ? (
    <div className="field" style={{ marginTop: 12 }}>
        <div className="label">Suggested student run sheet</div>

        <div className="small" style={{ marginTop: 4 }}>
            Preview shows what it looks like. Text shows the raw output so you can copy it.
        </div>

        <div className="actions" style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
                type="button"
                className={aiSuggestionView[activeActivityIndex] === "text" ? "btnGhost" : "btnPrimary"}
                onClick={() => setAiSuggestionView((p) => ({ ...p, [activeActivityIndex]: "preview" }))}
            >
                Preview
            </button>

            <button
                type="button"
                className={aiSuggestionView[activeActivityIndex] === "text" ? "btnPrimary" : "btnGhost"}
                onClick={() => setAiSuggestionView((p) => ({ ...p, [activeActivityIndex]: "text" }))}
            >
                Text
            </button>
        </div>

        {aiSuggestionView[activeActivityIndex] === "text" ? (
            <textarea className="textarea" value={active.ai.suggestedOverview} readOnly />
        ) : looksLikeHtml(active.ai.suggestedOverview) ? (
            <div
                style={{
                    marginTop: 10,
                    border: "1px solid #888B8A",
                    background: "#FFFFFF",
                    padding: 10,
                    overflowX: "auto",
                    borderRadius: 10,
                }}
                dangerouslySetInnerHTML={{ __html: active.ai.suggestedOverview }}
            />
        ) : (
            <div
                style={{
                    marginTop: 10,
                    border: "1px solid #888B8A",
                    background: "#FFFFFF",
                    padding: 10,
                    borderRadius: 10,
                    whiteSpace: "pre-wrap",
                    lineHeight: 1.35,
                }}
            >
                {active.ai.suggestedOverview}
            </div>
        )}

        <div className="actions" style={{ marginTop: 8 }}>
            <button type="button" className="btnPrimary" onClick={() => applySuggestedOverview(activeActivityIndex, "replace")}>
                Replace what’s there
            </button>

            <button type="button" className="btnGhost" onClick={() => applySuggestedOverview(activeActivityIndex, "append")}>
                Add underneath
            </button>

            <button
                type="button"
                className="btnGhost"
                onClick={async () => {
                    const ok = await copyText(active.ai.suggestedOverview);
                    showToast(ok ? "Copied to your clipboard" : "Copy failed");
                }}
                disabled={!active.ai.suggestedOverview.trim()}
            >
                Copy suggestion
            </button>
        </div>
    </div>
) : null}


                                {activityHasDiff(active) ? (
                                    <div className="field" style={{ marginTop: 12 }}>
                                        <div className="label">Differentiation</div>
                                        <div className="small">Add one support box into the student instructions.</div>

                                        <div className="actions" style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                                            {(active.ai.diff?.helpfulHints?.length ?? 0) > 0 && active.toggles.helpfulHints ? (
                                                <button
                                                    className="btnGhost"
                                                    onClick={() => {
                                                        const block = diffPackToHtml("Read aloud (teacher)", active.ai.diff.helpfulHints);
                                                        setActivities((prev) =>
                                                            prev.map((x, i) =>
                                                                i === activeActivityIndex ? { ...x, studentTask: [x.studentTask?.trim(), block].filter(Boolean).join("\n\n") } : x
                                                            )
                                                        );
                                                    }}
                                                >
                                                    Add Read aloud box
                                                </button>
                                            ) : null}

                                            {(active.ai.diff?.tooHardTryThis?.length ?? 0) > 0 && active.toggles.tooHardTryThis ? (
                                                <button
                                                    className="btnGhost"
                                                    onClick={() => {
                                                        const block = diffPackToHtml("Too hard, try this", active.ai.diff.tooHardTryThis);
                                                        setActivities((prev) =>
                                                            prev.map((x, i) =>
                                                                i === activeActivityIndex ? { ...x, studentTask: [x.studentTask?.trim(), block].filter(Boolean).join("\n\n") } : x
                                                            )
                                                        );
                                                    }}
                                                >
                                                    Add Too hard? Try this box
                                                </button>
                                            ) : null}

                                            {(active.ai.diff?.extension?.length ?? 0) > 0 && active.toggles.extension ? (
                                                <button
                                                    className="btnGhost"
                                                    onClick={() => {
                                                        const block = diffPackToHtml("Extension", active.ai.diff.extension);
                                                        setActivities((prev) =>
                                                            prev.map((x, i) =>
                                                                i === activeActivityIndex ? { ...x, studentTask: [x.studentTask?.trim(), block].filter(Boolean).join("\n\n") } : x
                                                            )
                                                        );
                                                    }}
                                                >
                                                    Add Extension box
                                                </button>
                                            ) : null}

                                            {(active.ai.diff?.stepThisOut?.length ?? 0) > 0 && active.toggles.stepThisOut ? (
                                                <button
                                                    className="btnGhost"
                                                    onClick={() => {
                                                        const block = diffPackToHtml("Step this out", active.ai.diff.stepThisOut);
                                                        setActivities((prev) =>
                                                            prev.map((x, i) =>
                                                                i === activeActivityIndex ? { ...x, studentTask: [x.studentTask?.trim(), block].filter(Boolean).join("\n\n") } : x
                                                            )
                                                        );
                                                    }}
                                                >
                                                    Add Step this out box
                                                </button>
                                            ) : null}
                                        </div>
                                    </div>
                                ) : null}

                                {(active.ai.powerfulQuestions?.length ?? 0) > 0 ? (
                                    <div className="field" style={{ marginTop: 12 }}>
                                        <div className="label">Powerful question</div>
                                        <select className="input" value={selectedPQ[activeActivityIndex] ?? 0} onChange={(e) => setSelectedPQ((prev) => ({ ...prev, [activeActivityIndex]: Number(e.target.value) }))}>
                                            {active.ai.powerfulQuestions.map((pq, i) => (
                                                <option key={i} value={i}>
                                                    {`Q${i + 1}: ${pq.question.slice(0, 80)}${pq.question.length > 80 ? "…" : ""}`}
                                                </option>
                                            ))}
                                        </select>

                                        <div className="actions" style={{ marginTop: 8 }}>
                                            <button className="btnPrimary" onClick={() => insertSelectedPQ(activeActivityIndex, "append")}>
                                                Add underneath
                                            </button>
                                            <button className="btnGhost" onClick={() => insertSelectedPQ(activeActivityIndex, "replace")}>
                                                Replace with this question
                                            </button>
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        )}

                    <div className="field">
                        <div className="label">Activity title (teacher)</div>
                        <input
                            className="input"
                            value={active.title}
                            onChange={(e) => setActivities((prev) => prev.map((p, i) => (i === activeActivityIndex ? { ...p, title: e.target.value } : p)))}
                            placeholder={active.label}
                        />
                    </div>

                    <div className="field">
                        <div className="label">Student instructions (final QLearn code)</div>
                        <div className="small">If this contains QLearn code, you see the preview. Switch to edit the code if needed.</div>

                        {!showHtmlEditor[activeActivityIndex] && looksLikeHtml(active.studentTask) ? (
                            <div style={{ border: "1px solid #888B8A", background: "#FFFFFF", padding: 10, overflowX: "auto", borderRadius: 10 }} dangerouslySetInnerHTML={{ __html: active.studentTask }} />
                        ) : (
                            <textarea
                                className="textarea"
                                value={active.studentTask}
                                onChange={(e) => setActivities((prev) => prev.map((p, i) => (i === activeActivityIndex ? { ...p, studentTask: e.target.value } : p)))}
                                placeholder="Type student-facing instructions. If you paste Corella code, turn off ‘Edit code’ to see the preview."
                            />
                        )}

                        <div className="actions" style={{ marginTop: 8 }}>
                            {looksLikeHtml(active.studentTask) ? (
                                <button className="btnGhost" onClick={() => setShowHtmlEditor((prev) => ({ ...prev, [activeActivityIndex]: !prev[activeActivityIndex] }))}>
                                    {showHtmlEditor[activeActivityIndex] ? "Show the preview" : "Edit code"}
                                </button>
                            ) : null}

                            <button
                                className="btnGhost"
                                onClick={async () => {
                                    const ok = await copyText(active.studentTask);
                                    showToast(ok ? "Copied to your clipboard" : "Copy failed");
                                }}
                                disabled={!active.studentTask.trim()}
                            >
                                Copy
                            </button>
                        </div>
                    </div>

                    <div className="field">
                        <div className="label">Resource link (optional)</div>
                        <input
                            className="input"
                            value={active.resourceLink}
                            onChange={(e) => setActivities((prev) => prev.map((p, i) => (i === activeActivityIndex ? { ...p, resourceLink: e.target.value } : p)))}
                            placeholder="https://..."
                        />
                    </div>

                        {active.aiError ? <div className="errorBox">{active.aiError}</div> : null}

                    </div>
                )}  

            {/* ---------------- OUTPUT ---------------- */}
            {tab === "output" && (
                <div className="card">
                    <div className="sectionTitle">Copy into QLearn</div>
                    <div className="small">Make one copy-and-paste block for QLearn.</div>

                    {nasotAudit.length ? (
                        <div className="infoBox" style={{ marginTop: 12, marginBottom: 12 }}>
                            <div className="infoTitle">NASOT end check</div>
                            <div className="small" style={{ marginTop: 6 }}>
                                Click a strategy to see where it appears or add a quick boost.
                            </div>

                            <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                                {nasotAudit.map((n) => {
                                    const c = statusColor(n.status as any);
                                    return (
                                        <button
                                            key={n.id}
                                            type="button"
                                            onClick={() => setNasotInspectorId(n.id)}
                                            style={{
                                                textAlign: "left",
                                                border: `1px solid ${c.border}`,
                                                background: c.bg,
                                                borderRadius: 12,
                                                padding: "10px 12px",
                                                cursor: "pointer",
                                            }}
                                        >
                                            <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                                                <div style={{ fontWeight: 700, color: c.text }}>
                                                    {n.name} <span style={{ fontWeight: 400, opacity: 0.85 }}>({n.focus})</span>
                                                </div>
                                                <div style={{ fontSize: 12, color: c.text }}>
                                                    {n.status === "green" ? "Met" : n.status === "amber" ? "Could be stronger" : "Missing"}
                                                </div>
                                            </div>

                                            <div style={{ marginTop: 6, fontSize: 12, opacity: 0.9 }}>
                                                Assigned: {n.assignedSlots.length ? n.assignedSlots.join(", ") : "none"}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            {nasotInspectorId
                                ? (() => {
                                    const item = nasotAudit.find((x) => x.id === nasotInspectorId);
                                    if (!item) return null;

                                    const def = nasotById.get(item.id);
                                    if (!def) return null;

                                    const suggestedTarget = pickSlotForFocus(def.focus)[0] || "Exit Activity";

                                    return (
                                        <div style={{ marginTop: 12, border: "1px solid #888B8A", background: "#FFFFFF", borderRadius: 12, padding: 12 }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <div style={{ fontWeight: 800 }}>{item.name}</div>
                                                <button className="btnGhost" type="button" onClick={() => setNasotInspectorId(null)}>
                                                    Close
                                                </button>
                                            </div>

                                            <div className="small" style={{ marginTop: 8 }}>
                                                <strong>Aim:</strong> {item.aim}
                                            </div>
                                            <div className="small" style={{ marginTop: 6 }}>
                                                <strong>What it looks like:</strong> {item.example}
                                            </div>

                                            <div style={{ marginTop: 10 }}>
                                                <div className="small" style={{ fontWeight: 700 }}>Where it shows up</div>
                                                <div className="small" style={{ marginTop: 4 }}>
                                                    {item.evidenceSlots.length ? item.evidenceSlots.join(", ") : "Not clearly visible in student instructions yet."}
                                                </div>
                                            </div>

                                            {item.status === "amber" || item.status === "red" ? (
                                                <div style={{ marginTop: 10 }}>
                                                    <div className="small" style={{ fontWeight: 700 }}>Quick fix</div>
                                                    <div className="small" style={{ marginTop: 4 }}>
                                                        Add a short block into <strong>{suggestedTarget}</strong> so students can see it.
                                                    </div>

                                                    <div className="actions" style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                                                        <button
                                                            className="btnPrimary"
                                                            type="button"
                                                            onClick={() => {
                                                                appendHtmlToActivity(suggestedTarget as ActivityLabel, buildNasotBoostBlock(def));
                                                                showToast(`Added NASOT boost to ${suggestedTarget}`);
                                                            }}
                                                        >
                                                            Add boost to {suggestedTarget}
                                                        </button>

                                                        <button
                                                            className="btnGhost"
                                                            type="button"
                                                            onClick={() => {
                                                                appendHtmlToActivity("Exit Activity", buildNasotBoostBlock(def));
                                                                showToast("Added NASOT boost to Exit Activity");
                                                            }}
                                                        >
                                                            Add to Exit Activity
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : null}
                                        </div>
                                    );
                                })()
                                : null}
                        </div>
                    ) : null}

                    <div className="actions">
                        <button className="btnPrimary" onClick={handleGenerateHtml}>
                            Make QLearn code
                        </button>

                        <button
                            className="btnGhost"
                            onClick={async () => {
                                const ok = await copyText(htmlOut);
                                showToast(ok ? "Copied to your clipboard" : "Copy failed");
                            }}
                            disabled={!htmlOut}
                        >
                            Copy
                        </button>

                        <button
                            className="btnPrimary"
                            type="button"
                            onClick={() => {
                                const rs = buildTeacherRunSheet();
                                setTeacherRunSheet(rs);
                                showToast("Teacher rundown sheet made");
                            }}
                        >
                            Make teacher rundown sheet
                        </button>

                        <button
                            className="btnGhost"
                            type="button"
                            onClick={async () => {
                                const ok = await copyText(teacherRunSheet);
                                showToast(ok ? "Copied to your clipboard" : "Copy failed");
                            }}
                            disabled={!teacherRunSheet.trim()}
                        >
                            Copy rundown sheet
                        </button>
                    </div>

                    <div className="output">
                        <pre className="pre">{htmlOut || "No output yet. Click Make QLearn code."}</pre>
                    </div>

                    {teacherRunSheet.trim() ? (
                        <div style={{ marginTop: 14 }}>
                            <div className="small" style={{ fontWeight: 700, marginBottom: 6 }}>
                                Teacher rundown sheet (preview)
                            </div>
                            <pre className="pre">{teacherRunSheet}</pre>
                        </div>
                    ) : null}
                </div>
            )}
        </div>
    );
}
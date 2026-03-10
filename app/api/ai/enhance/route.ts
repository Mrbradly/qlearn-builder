// app/api/ai/enhance/route.ts
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { ICONS, type VisualKey } from "@/lib/icons";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ---------------- utils ---------------- */

function asString(x: unknown): string {
    return String(x ?? "").trim();
}

function asArray(x: unknown): string[] {
    return Array.isArray(x)
        ? x.map((v) => String(v ?? "").trim()).filter(Boolean)
        : [];
}

function asBool(x: unknown): boolean {
    return Boolean(x);
}

function safeJsonParse(raw: string) {
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

function extractText(resp: any): string {
    if (typeof resp?.output_text === "string" && resp.output_text.trim()) {
        return resp.output_text;
    }

    const out = resp?.output;
    if (!Array.isArray(out)) return "";

    for (const item of out) {
        const content = item?.content;
        if (!Array.isArray(content)) continue;

        for (const c of content) {
            if (typeof c?.text === "string" && c.text.trim()) return c.text;
            if (typeof c?.output_text === "string" && c.output_text.trim()) return c.output_text;
            if (typeof c?.text?.value === "string" && c.text.value.trim()) return c.text.value;
        }
    }

    return "";
}

function escapeHtml(s: string) {
    return String(s ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");
}

function looksLikeHtml(s: string) {
    const t = (s || "").trim().toLowerCase();
    return t.startsWith("<") && (t.includes("</") || t.includes("/>"));
}

function looksLikeHtmlTable(s: string) {
    const t = (s || "").toLowerCase();
    return t.includes("<table") && t.includes("</table>");
}

function stripHtmlTags(html: string): string {
    return String(html || "")
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function wordCount(text: string): number {
    const t = String(text || "").trim();
    return t ? t.split(/\s+/).filter(Boolean).length : 0;
}

function uniqBullets(items: string[], limit: number) {
    const seen = new Set<string>();
    const out: string[] = [];

    for (const raw of items || []) {
        const t = String(raw || "").trim().replace(/\s+/g, " ");
        if (!t) continue;

        const key = t.toLowerCase();
        if (seen.has(key)) continue;

        seen.add(key);
        out.push(t);

        if (out.length >= limit) break;
    }

    return out;
}

function tidyOutput(s: string): string {
    let t = String(s ?? "");
    t = t.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    t = t.replace(/[ \t]+\n/g, "\n");
    t = t.replace(/\n{3,}/g, "\n\n").trim();
    return t;
}

function coerceUnknownToText(value: unknown): string {
    if (typeof value === "string") return tidyOutput(value);
    if (value == null) return "";
    if (typeof value === "number" || typeof value === "boolean") return String(value);
    try {
        return JSON.stringify(value, null, 2);
    } catch {
        return String(value);
    }
}

/* ---------------- output wrapping ---------------- */

function wrapTextAsSimpleQlearnTable(title: string, bodyText: string) {
    const safeTitle = escapeHtml(title || "Activity");
    const safeBody = escapeHtml(bodyText || "").replace(/\n/g, "<br/>");

    return `
<table style="border-collapse:collapse; width:98.6%; background-color:#364152;" border="1">
  <tbody>
    <tr>
      <td style="padding:8px 10px; color:#ffffff;">
        <strong>${safeTitle}</strong>
      </td>
    </tr>
  </tbody>
</table>

<table style="border-collapse:collapse; width:98.6%; background-color:#ffffff;" border="1">
  <tbody>
    <tr>
      <td style="padding:12px; vertical-align:top; border:1px solid #888B8A;">
        <div style="white-space:normal; line-height:1.5;">${safeBody}</div>
      </td>
    </tr>
  </tbody>
</table>
`.trim();
}

type JsonTableShape = {
    headers: string[];
    rows: string[][];
};

function isJsonTableShape(value: unknown): value is JsonTableShape {
    if (!value || typeof value !== "object" || Array.isArray(value)) return false;

    const v = value as Record<string, unknown>;
    if (!Array.isArray(v.headers) || !Array.isArray(v.rows)) return false;

    const headersOk = v.headers.every((h) => typeof h === "string");
    const rowsOk = v.rows.every(
        (row) => Array.isArray(row) && row.every((cell) => typeof cell === "string")
    );

    return headersOk && rowsOk;
}

function buildHtmlTableFromJsonTable(title: string, table: JsonTableShape) {
    const safeTitle = escapeHtml(title || "Table");
    const headers = table.headers ?? [];
    const rows = table.rows ?? [];

    const thead = headers.length
        ? `<tr>${headers
            .map(
                (h) =>
                    `<th style="padding:10px; border:1px solid #888B8A; background:#C7CFDB; text-align:left;">${escapeHtml(
                        h
                    )}</th>`
            )
            .join("")}</tr>`
        : "";

    const tbody = rows.length
        ? rows
            .map(
                (row) =>
                    `<tr>${row
                        .map(
                            (cell) =>
                                `<td style="padding:10px; border:1px solid #888B8A; vertical-align:top;">${escapeHtml(
                                    cell
                                )}</td>`
                        )
                        .join("")}</tr>`
            )
            .join("")
        : `<tr><td style="padding:10px; border:1px solid #888B8A;">No rows provided.</td></tr>`;

    return `
<table style="border-collapse:collapse; width:98.6%; background-color:#364152;" border="1">
  <tbody>
    <tr>
      <td style="padding:8px 10px; color:#ffffff;">
        <strong>${safeTitle}</strong>
      </td>
    </tr>
  </tbody>
</table>

<table style="border-collapse:collapse; width:98.6%; background-color:#ffffff;" border="1">
  <thead>
    ${thead}
  </thead>
  <tbody>
    ${tbody}
  </tbody>
</table>
`.trim();
}

function forceVisualHtml(title: string, overview: unknown): string {
    if (isJsonTableShape(overview)) {
        return buildHtmlTableFromJsonTable(title, overview);
    }

    const raw = coerceUnknownToText(overview);
    if (!raw) return wrapTextAsSimpleQlearnTable(title, "");

    if (looksLikeHtmlTable(raw)) return raw;

    if (looksLikeHtml(raw)) {
        const safeTitle = escapeHtml(title || "Activity");
        return `
<table style="border-collapse:collapse; width:98.6%; background-color:#364152;" border="1">
  <tbody>
    <tr>
      <td style="padding:8px 10px; color:#ffffff;">
        <strong>${safeTitle}</strong>
      </td>
    </tr>
  </tbody>
</table>

<table style="border-collapse:collapse; width:98.6%; background-color:#ffffff;" border="1">
  <tbody>
    <tr>
      <td style="padding:12px; vertical-align:top; border:1px solid #888B8A;">
        ${raw}
      </td>
    </tr>
  </tbody>
</table>
`.trim();
    }

    return wrapTextAsSimpleQlearnTable(title, raw);
}

function injectIconIntoFirstHeaderStrong(html: string, icon: string): string {
    const h = String(html || "");
    if (!h.toLowerCase().includes("<strong>")) return h;

    const iconSpan = `<span style="display:inline-block; vertical-align:middle; margin-right:8px;">${icon}</span>`;
    return h.replace(/<strong>([\s\S]*?)<\/strong>/i, `<strong>${iconSpan}$1</strong>`);
}

/* ---------------- visuals ---------------- */

function visualKeyForActivityLabel(label: string): VisualKey {
    const t = (label || "").toLowerCase();
    if (t.includes("activity 1")) return "think";
    if (t.includes("activity 2")) return "read";
    if (t.includes("activity 3")) return "discuss";
    if (t.includes("activity 4")) return "online";
    if (t.includes("exit")) return "target";
    return "think";
}

function visualKeyFromText(text: string, fallback: VisualKey): VisualKey {
    const t = (text || "").toLowerCase();

    if (
        t.includes("write") ||
        t.includes("draft") ||
        t.includes("worksheet") ||
        t.includes("cloze") ||
        t.includes("word bank")
    )
        return "write";

    if (t.includes("read") || t.includes("book") || t.includes("notes") || t.includes("passage")) {
        return "read";
    }

    if (t.includes("discuss") || t.includes("pair") || t.includes("share") || t.includes("group")) {
        return "discuss";
    }

    if (
        t.includes("online") ||
        t.includes("device") ||
        t.includes("website") ||
        t.includes("canva") ||
        t.includes("corella")
    )
        return "online";

    if (
        t.includes("goal") ||
        t.includes("smart") ||
        t.includes("success criteria") ||
        t.includes("target")
    )
        return "target";

    if (
        t.includes("reflect") ||
        t.includes("think") ||
        t.includes("self check") ||
        t.includes("metacogn")
    )
        return "think";

    return fallback;
}

/* ---------------- intent + parts detection ---------------- */

type RequestedPart = "instructions" | "close_activity" | "teacher_script" | "resource";

function normalisePrompt(t: string) {
    return (t || "").toLowerCase().replace(/\s+/g, " ").trim();
}

function wantsInstructions(prompt: string) {
    const t = normalisePrompt(prompt);
    return (
        t.includes("instruction") ||
        t.includes("student instructions") ||
        t.includes("steps") ||
        t.includes("what students do") ||
        t.includes("run sheet") ||
        t.includes("story") ||
        t.includes("paragraph") ||
        t.includes("text underneath") ||
        t.includes("underneath include")
    );
}

function wantsCloseActivity(prompt: string) {
    const t = normalisePrompt(prompt);
    return (
        t.includes("close activity") ||
        t.includes("closing activity") ||
        t.includes("exit activity") ||
        t.includes("plenary") ||
        t.includes("wrap up activity") ||
        t.includes("closing task") ||
        t.includes("exit ticket")
    );
}

function wantsTeacherScript(prompt: string) {
    const t = normalisePrompt(prompt);
    return (
        t.includes("teacher script") ||
        t.includes("script to read") ||
        t.includes("teacher instructions") ||
        t.includes("read to students") ||
        t.includes("say to students") ||
        t.includes("talk track") ||
        t.includes("what do i say") ||
        t.includes("what should i say")
    );
}

function wantsResource(prompt: string) {
    const t = normalisePrompt(prompt);
    return (
        t.includes("cloze") ||
        t.includes("worksheet") ||
        t.includes("word bank") ||
        t.includes("fill in the blank") ||
        t.includes("fill-in-the-blank") ||
        t.includes("quiz") ||
        t.includes("multiple choice") ||
        t.includes("mcq") ||
        t.includes("table") ||
        t.includes("make a table") ||
        t.includes("in a table") ||
        t.includes("comprehension") ||
        t.includes("matching")
    );
}

function detectRequestedParts(prompt: string): RequestedPart[] {
    const parts: RequestedPart[] = [];

    if (wantsInstructions(prompt)) parts.push("instructions");
    if (wantsCloseActivity(prompt)) parts.push("close_activity");
    if (wantsTeacherScript(prompt)) parts.push("teacher_script");
    if (wantsResource(prompt)) parts.push("resource");

    if (!parts.length) {
        parts.push("instructions");
    }

    return Array.from(new Set(parts));
}

function looksLikeStudentInstructions(text: string): boolean {
    const t = (text || "").toLowerCase();
    const signals = [
        "time:",
        "steps:",
        "submit:",
        "on track check:",
        "step 1",
        "step 2",
        "you will",
        "you need to",
        "due date",
    ];
    const hits = signals.reduce((a, s) => a + (t.includes(s) ? 1 : 0), 0);
    return hits >= 3 && text.trim().length >= 80;
}

function shouldRefine(opts: {
    teacherPrompt: string;
    currentStudentInstructions: string;
    teacherDraftIdea: string;
}) {
    const t = normalisePrompt(opts.teacherPrompt);
    const hasExisting = Boolean(opts.currentStudentInstructions.trim());
    const explicitRefine =
        t.includes("refine") ||
        t.includes("improve") ||
        t.includes("rewrite") ||
        t.includes("tidy") ||
        t.includes("clean up") ||
        t.includes("fix this");

    if (explicitRefine && hasExisting) return true;
    if (hasExisting && looksLikeStudentInstructions(opts.currentStudentInstructions) && !opts.teacherDraftIdea.trim()) {
        return true;
    }

    return false;
}

/* ---------------- constraints ---------------- */

function extractWordCountConstraint(prompt: string): string {
    const raw = String(prompt || "");
    const m =
        raw.match(/\b(\d{2,4})\s*-\s*(\d{2,4})\s*word(s)?\b/i) ||
        raw.match(/\b(\d{2,4})\s*word(s)?\b/i);
    return m?.[0] ? m[0] : "";
}

function parseWordCountConstraint(
    constraint: string
): { min: number; max: number; target: number } | null {
    const c = String(constraint || "").trim();
    if (!c) return null;

    const range = c.match(/\b(\d{2,4})\s*-\s*(\d{2,4})\s*word(s)?\b/i);
    if (range) {
        const a = Number(range[1]);
        const b = Number(range[2]);
        if (!Number.isFinite(a) || !Number.isFinite(b) || a <= 0 || b <= 0) return null;
        const min = Math.min(a, b);
        const max = Math.max(a, b);
        const target = Math.round((min + max) / 2);
        return { min, max, target };
    }

    const single = c.match(/\b(\d{2,4})\s*word(s)?\b/i);
    if (single) {
        const n = Number(single[1]);
        if (!Number.isFinite(n) || n <= 0) return null;
        return { min: n, max: n, target: n };
    }

    return null;
}

/* ---------------- anchors ---------------- */

function extractTeacherAnchors(text: string): string[] {
    const plain = stripHtmlTags(String(text || ""));
    const t = plain.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

    const patterns: RegExp[] = [
        /\bbooklet\b[^\n]{0,40}\bpage(?:s)?\b[^\n]{0,30}\b\d+\s*(?:[-–]\s*\d+)?/gi,
        /\bpage(?:s)?\b[^\n]{0,20}\b\d+\s*(?:[-–]\s*\d+)?/gi,
        /\bp\.\s*\d+\b/gi,
        /\bp\s*\d+\b/gi,
        /\bquestion(?:s)?\b[^\n]{0,30}\b\d+[a-z]?\s*(?:[-–]\s*\d+[a-z]?)?/gi,
        /\bq(?:uestion)?\s*\d+[a-z]?\s*(?:[-–]\s*\d+[a-z]?)?/gi,
    ];

    const hits = new Set<string>();
    for (const rx of patterns) {
        const m = t.match(rx);
        if (m) {
            m.map((x) => x.trim()).filter(Boolean).forEach((x) => hits.add(x));
        }
    }
    return Array.from(hits).slice(0, 4);
}

function ensureAnchorsInOutput(out: string, anchors: string[]): string {
    const t = String(out || "").trim();
    const a = (anchors || []).map((x) => x.trim()).filter(Boolean);
    if (!t || !a.length) return t;

    const missing = a.filter((x) => !t.toLowerCase().includes(x.toLowerCase()));
    if (!missing.length) return t;

    if (t.toLowerCase().includes("<table")) {
        const note = `<div style="margin-top:10px; font-size:13px;"><strong>Use this reference:</strong> ${missing
            .map(escapeHtml)
            .join(", ")}</div>`;
        return `${t}\n${note}`.trim();
    }

    return `${t}\n\n${missing.map((x) => `• Use this reference exactly: ${x}`).join("\n")}`.trim();
}

/* ---------------- diff helpers ---------------- */

function coerceDiff(diffRaw: any, teacherPrompt = "", title = "") {
    const asLines = (v: any): string[] => {
        if (Array.isArray(v)) return v.map(String).map((s) => s.trim()).filter(Boolean);
        if (typeof v === "string") return v.split("\n").map((x) => x.trim()).filter(Boolean);
        return [];
    };

    const helpfulHints = asLines(diffRaw?.helpfulHints ?? diffRaw?.helpful_hints);
    const tooHardTryThis = asLines(
        diffRaw?.tooHardTryThis ?? diffRaw?.too_hard_try_this ?? diffRaw?.tooHard
    );
    const extension = asLines(
        diffRaw?.extension ?? diffRaw?.makeItHarder ?? diffRaw?.make_it_harder
    );
    const stepThisOut = asLines(
        diffRaw?.stepThisOut ?? diffRaw?.step_this_out ?? diffRaw?.workedSteps
    );

    const contextText = `${teacherPrompt} ${title}`.toLowerCase();

    const genericPhrases = [
        "work carefully",
        "check your work",
        "do your best",
        "use a calculator",
        "read carefully",
        "take your time",
    ];

    const cleanSpecific = (items: string[], limit: number) =>
        uniqBullets(
            items.filter((line) => {
                const l = line.toLowerCase();
                const isGeneric = genericPhrases.some((g) => l.includes(g));
                if (!isGeneric) return true;

                if (contextText.includes("pythag")) {
                    return (
                        l.includes("hypotenuse") ||
                        l.includes("triangle") ||
                        l.includes("square root") ||
                        l.includes("a²") ||
                        l.includes("b²") ||
                        l.includes("c²") ||
                        l.includes("a^2") ||
                        l.includes("b^2") ||
                        l.includes("c^2")
                    );
                }

                if (
                    contextText.includes("comprehension") ||
                    contextText.includes("passage") ||
                    contextText.includes("reading")
                ) {
                    return (
                        l.includes("evidence") ||
                        l.includes("passage") ||
                        l.includes("paragraph") ||
                        l.includes("text")
                    );
                }

                return !isGeneric;
            }),
            limit
        );

    return {
        helpfulHints: cleanSpecific(helpfulHints, 8),
        tooHardTryThis: cleanSpecific(tooHardTryThis, 6),
        extension: cleanSpecific(extension, 6),
        stepThisOut: cleanSpecific(stepThisOut, 6),
    };
}

/* ---------------- mixed json repair ---------------- */

function splitJsonObjectAndTrailingText(raw: string): {
    jsonObject: Record<string, unknown> | null;
    trailingText: string;
} {
    const text = String(raw || "").trim();
    if (!text.startsWith("{")) {
        return { jsonObject: null, trailingText: text };
    }

    let depth = 0;
    let inString = false;
    let escape = false;

    for (let i = 0; i < text.length; i++) {
        const ch = text[i];

        if (escape) {
            escape = false;
            continue;
        }

        if (ch === "\\") {
            escape = true;
            continue;
        }

        if (ch === `"`) {
            inString = !inString;
            continue;
        }

        if (!inString) {
            if (ch === "{") depth++;
            if (ch === "}") depth--;

            if (depth === 0) {
                const jsonPart = text.slice(0, i + 1).trim();
                const trailingText = text.slice(i + 1).trim();

                try {
                    const parsed = JSON.parse(jsonPart);
                    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
                        return {
                            jsonObject: parsed as Record<string, unknown>,
                            trailingText,
                        };
                    }
                } catch {
                    return { jsonObject: null, trailingText: text };
                }
            }
        }
    }

    return { jsonObject: null, trailingText: text };
}

/* ---------------- answer stripping ---------------- */

function removeSolutionColumnsFromTable(table: JsonTableShape): JsonTableShape {
    const banned = [
        "solution",
        "answer",
        "answers",
        "worked solution",
        "worked solutions",
        "model answer",
        "model answers",
    ];

    const keepIndexes = table.headers
        .map((h, i) => ({ h: h.toLowerCase().trim(), i }))
        .filter((x) => !banned.includes(x.h))
        .map((x) => x.i);

    return {
        headers: keepIndexes.map((i) => table.headers[i]),
        rows: table.rows.map((row) => keepIndexes.map((i) => row[i] ?? "")),
    };
}

function stripAnswerLines(text: string): string {
    return String(text || "")
        .split("\n")
        .filter((line) => {
            const l = line.toLowerCase().trim();
            return !(
                l.startsWith("answer:") ||
                l.startsWith("answers:") ||
                l.startsWith("solution:") ||
                l.startsWith("solutions:") ||
                l.startsWith("worked solution:") ||
                l.startsWith("worked solutions:") ||
                l.startsWith("model answer:") ||
                l.startsWith("model answers:")
            );
        })
        .join("\n")
        .trim();
}

/* ---------------- word enforcement ---------------- */

async function expandToTargetWords(opts: {
    client: OpenAI;
    model: string;
    teacherPrompt: string;
    baseText: string;
    targetWords: number;
}): Promise<string> {
    const instructions = `
You output valid json only.

Task:
Expand the text to EXACTLY ${opts.targetWords} words.

Rules:
- Keep the same meaning, topic, and tone.
- Present tense.
- Australian spelling.
- No student names.
- Avoid em dashes.
- Return plain text only.
- No HTML.
- No markdown.

Return json only with:
{ "text": string }
`.trim();

    const input = `
Teacher prompt:
${opts.teacherPrompt}

Current text:
${opts.baseText}

Return json only.
`.trim();

    const resp = await opts.client.responses.create({
        model: opts.model,
        instructions,
        input,
        max_output_tokens: 900,
        store: false,
        text: { format: { type: "json_object" } },
    });

    const raw = extractText(resp) || "{}";
    const parsed = safeJsonParse(raw);
    return parsed ? asString(parsed?.text) : "";
}

/* ---------------- schema types ---------------- */

type PowerfulQuestion = { question: string; scIndex: number };

type ResponseSection = {
    title: string;
    content: unknown;
};

type EnhanceOut = {
    requestedParts?: RequestedPart[];
    title?: string;
    instructions?: ResponseSection | null;
    closeActivity?: ResponseSection | null;
    teacherScript?: ResponseSection | null;
    resource?: ResponseSection | null;
    powerfulQuestions?: PowerfulQuestion[];
    diff?: {
        helpfulHints?: string[] | string;
        tooHardTryThis?: string[] | string;
        extension?: string[] | string;
        stepThisOut?: string[] | string;
    };
    canvaPrompt?: string;
    notebookLmPrompt?: string;
    adobeExpressActivity?: string;
    aiActivityIdeas?: string;
    nasotUsed?: string[] | string;
};

function asPowerfulQuestions(x: any): PowerfulQuestion[] {
    if (!Array.isArray(x)) return [];
    return x
        .map((q) => ({
            question: String(q?.question ?? "").trim(),
            scIndex: Number(q?.scIndex ?? 0),
        }))
        .filter((q) => q.question.length > 0);
}

function buildCombinedOverview(parts: {
    instructions?: unknown;
    closeActivity?: unknown;
    teacherScript?: unknown;
    resource?: unknown;
}) {
    const blocks: string[] = [];

    if (parts.instructions != null && coerceUnknownToText(parts.instructions).trim()) {
        blocks.push(forceVisualHtml("Instructions", parts.instructions));
    }
    if (parts.closeActivity != null && coerceUnknownToText(parts.closeActivity).trim()) {
        blocks.push(forceVisualHtml("Close activity", parts.closeActivity));
    }
    if (parts.teacherScript != null && coerceUnknownToText(parts.teacherScript).trim()) {
        blocks.push(forceVisualHtml("Teacher script", parts.teacherScript));
    }
    if (
        parts.resource != null &&
        (isJsonTableShape(parts.resource) || coerceUnknownToText(parts.resource).trim())
    ) {
        blocks.push(forceVisualHtml("Resource", parts.resource));
    }

    return blocks.join("\n\n").trim();
}

/* ---------------- handler ---------------- */

export async function POST(req: Request) {
    try {
        const body = await req.json().catch(() => null);
        if (!body) {
            return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
        }

        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json({ ok: false, error: "Missing OPENAI_API_KEY." }, { status: 500 });
        }

        const mode = asString(body?.internalMode || body?.mode || "enhance");
        const activity = body?.activity ?? body?.payload?.activity ?? body?.data?.activity ?? null;

        if (!activity && mode !== "suggest" && mode !== "teacher_rundown") {
            return NextResponse.json(
                {
                    ok: false,
                    error: "Missing activity payload (no activity object received).",
                    debug: { receivedTopLevelKeys: Object.keys(body || {}) },
                },
                { status: 400 }
            );
        }

        const lessonTitle = asString(body?.lessonTitle);
        const teacherContext = asString(body?.teacherContext);
        const learningGoals = asArray(body?.learningGoals);
        const successCriteria = asArray(body?.successCriteria);
        const cognitiveVerbs = asArray(body?.cognitiveVerbs);
        const vocabulary = asArray(body?.vocabulary);

        const teacherDraftIdea = asString(activity?.task ?? activity?.teacherDraft ?? "");
        const currentStudentInstructions = asString(activity?.studentTask ?? "");
        const teacherAsk = asString(activity?.teacherAsk ?? "");
        const nasotStrategies = asArray(activity?.nasotStrategies);
        const suggestionChat = asString(activity?.suggestionChat ?? body?.suggestionChat ?? "");

        const teacherPrompt = (teacherAsk || currentStudentInstructions || teacherDraftIdea || "").trim();

        if (!teacherPrompt && mode !== "teacher_rundown" && mode !== "suggest") {
            return NextResponse.json(
                { ok: false, error: "Type what you want in the activity prompt." },
                { status: 400 }
            );
        }

        const toggles = activity?.toggles ?? {};
        const builderMeta = activity?.builderMeta ?? {};
        const showAnswers = asBool(builderMeta?.showAnswers);

        const includePowerfulQuestions = asBool(toggles?.powerfulQuestions);
        const includeHelpfulHints = asBool(toggles?.helpfulHints);
        const includeTooHard = asBool(toggles?.tooHardTryThis);
        const includeExtension = asBool(toggles?.extension);
        const includeStepThisOut = asBool(toggles?.stepThisOut);
        const includeCanva = asBool(toggles?.canvaPrompt);
        const includeNotebookLM = asBool(toggles?.notebookPrompt);
        const includeAdobe = asBool(toggles?.adobeExpressActivity);
        const includeAiActivityIdeas = asBool(toggles?.aiActivityIdeas);

        const requestedParts = detectRequestedParts(teacherPrompt);
        const refineMode = shouldRefine({
            teacherPrompt,
            currentStudentInstructions,
            teacherDraftIdea,
        });

        const anchors = extractTeacherAnchors(
            `${teacherDraftIdea}\n${currentStudentInstructions}\n${teacherAsk}`
        );

        const wcConstraint = extractWordCountConstraint(teacherPrompt);
        const wcSpec = parseWordCountConstraint(wcConstraint);

        const labelText = asString(activity?.label || activity?.activityLabel || "");
        const defaultKey = visualKeyForActivityLabel(labelText);
        const inferredKey = visualKeyFromText(
            `${labelText}\n${asString(activity?.title)}\n${teacherPrompt}\n${lessonTitle}`,
            defaultKey
        );
        const iconHtml = ICONS[inferredKey];

        const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const modelName = process.env.OPENAI_MODEL || "gpt-4.1-nano";

        /* ---------- suggest ---------- */

        if (mode === "suggest") {
            const prompt = (suggestionChat || teacherPrompt || "").trim();
            if (!prompt) {
                return NextResponse.json(
                    { ok: false, error: "Type what you want in the suggestions box." },
                    { status: 400 }
                );
            }

            const instructions = `
You output valid json only.

You are the "Make suggestions" mini-chat. You do not generate the final QLearn artefact.
You give 3 to 6 sharp suggestions the teacher can choose from.

Rules:
- Australian spelling
- Present tense
- Teacher-facing language
- No student names
- Avoid em dashes

Return json only:
{ "suggestions": string[] }
`.trim();

            const input = `
Lesson title: ${lessonTitle || "Untitled"}
Teacher context: ${teacherContext || "none"}

Learning goals:
${learningGoals.map((l) => `- ${l}`).join("\n") || "- (none)"}

Success criteria:
${successCriteria.map((s, i) => `${i + 1}. ${s}`).join("\n") || "1. (none)"}

Teacher text:
${prompt}

Return json only.
`.trim();

            const response = await client.responses.create({
                model: modelName,
                instructions,
                input,
                max_output_tokens: 450,
                store: false,
                text: { format: { type: "json_object" } },
            });

            const raw = extractText(response) || "{}";
            const parsed = safeJsonParse(raw);
            if (!parsed) {
                return NextResponse.json(
                    {
                        ok: false,
                        error: "Model returned non-json text.",
                        raw: String(raw).slice(0, 400),
                    },
                    { status: 502 }
                );
            }

            return NextResponse.json({
                ok: true,
                suggestions: uniqBullets(asArray(parsed?.suggestions), 6),
            });
        }

        /* ---------- teacher rundown ---------- */

        if (mode === "teacher_rundown") {
            const base = [
                `Teacher rundown: ${lessonTitle || "Untitled"}`,
                "",
                learningGoals.length ? "Learning goals:" : "",
                ...learningGoals.map((g) => `• ${g}`),
                learningGoals.length ? "" : "",
                successCriteria.length ? "Success criteria:" : "",
                ...successCriteria.map((c, i) => `${i + 1}. ${c}`),
                successCriteria.length ? "" : "",
                "Flow:",
                "• Warm-up: read the story, then quick check.",
                "• Activity: circulate, point to success criteria, check for understanding.",
                "• Exit: students self-check, note who needs support next lesson.",
            ]
                .filter(Boolean)
                .join("\n");

            return NextResponse.json({ ok: true, rundown: base });
        }

        /* ---------- main enhance ---------- */

        const instructions = `
You output valid JSON only.

Role:
You generate QLearn-ready activity content for Australian secondary students.

Important:
A teacher may ask for one thing or multiple things in the same prompt.
Do not collapse the request into one output if the teacher asked for multiple deliverables.

You must detect and return only the requested parts from this set:
- instructions
- closeActivity
- teacherScript
- resource

Definitions:
- instructions = what students do
- closeActivity = the end-of-lesson or exit activity
- teacherScript = what the teacher says aloud
- resource = worksheet, cloze, table, quiz, matching task, comprehension questions, or similar task resource

Critical structure rules:
- If the teacher asks for both a table and a paragraph or story underneath, do not combine them into one field.
- Put the table into resource.
- Put the paragraph, passage, or story into instructions unless the teacher clearly asked for it as a close activity or teacher script.
- If resource is a table, resource.content must be a real JSON object, not a string.
- Never wrap table JSON in quotation marks.
- Never place narrative text underneath table JSON inside the same content field.
- If the teacher asks for a worksheet, quiz, cloze, comprehension, matching task, or table task, resource.content must be structured as a JSON table object whenever possible.
- For comprehension tasks, put the reading passage in instructions.content and put the questions in resource.content as a table object.
- For worksheets, put the questions in resource.content as a table object.

Answer rules:
- showAnswers = ${showAnswers ? "true" : "false"}.
- If showAnswers is false, DO NOT include answers, worked solutions, model responses, worked examples with completed calculations, or solution columns anywhere.
- If showAnswers is false and you generate a table, use headings like:
  ["Item", "Question"]
  or
  ["Question", "Response"]
  or
  ["Prompt", "Your answer"]
- If showAnswers is true, you may include answers or worked solutions.
- Never include a "Solution" column unless showAnswers is true.

Formatting rules:
- For instructions, closeActivity, and teacherScript, plain text is preferred unless a simple HTML table is genuinely needed.
- For resource, use a JSON table object whenever it makes sense.
- Keep outputs clean and classroom-ready.

Differentiation rules:
- helpfulHints, tooHardTryThis, extension, and stepThisOut must be specific to the exact activity topic and task.
- Do not give generic advice like "work carefully" or "use a calculator" unless the task explicitly needs it.
- If the activity is about Pythagoras, the support must mention the triangle sides, formula choice, identifying the hypotenuse, substitution steps, or checking square roots.
- If the activity is comprehension, the support must mention reading strategies, locating evidence, and question-type support.
- Make every support line clearly tied to the activity content.

Rules:
- Australian spelling
- Present tense
- No student names
- Avoid em dashes
- Keep it classroom-ready
- If HTML is used, use QLearn-friendly table blocks or simple HTML
- If plain text is easier, return plain text. The server will wrap it.

If refineMode is true:
- improve the existing student text
- do not invent unrelated new sections
- only return parts that match the teacher request

If you return resource.content as a table object, use:
{
  "headers": ["Column 1", "Column 2"],
  "rows": [
    ["cell 1", "cell 2"],
    ["cell 3", "cell 4"]
  ]
}

Return JSON only in this exact shape:
{
  "requestedParts": ["instructions" | "close_activity" | "teacher_script" | "resource"],
  "title": string,
  "instructions": { "title": string, "content": string } | null,
  "closeActivity": { "title": string, "content": string } | null,
  "teacherScript": { "title": string, "content": string } | null,
  "resource": { "title": string, "content": string | { "headers": string[], "rows": string[][] } } | null,
  "powerfulQuestions": [{ "question": string, "scIndex": number }],
  "diff": {
    "helpfulHints": string[],
    "tooHardTryThis": string[],
    "extension": string[],
    "stepThisOut": string[]
  },
  "canvaPrompt": string,
  "notebookLmPrompt": string,
  "adobeExpressActivity": string,
  "aiActivityIdeas": string,
  "nasotUsed": string[]
}
`.trim();

        const input = `
Lesson title: ${lessonTitle || "Untitled"}
Teacher context: ${teacherContext || "none"}

Learning goals:
${learningGoals.map((g) => `- ${g}`).join("\n") || "- (none)"}

Success criteria:
${successCriteria.map((c, i) => `${i + 1}. ${c}`).join("\n") || "1. (none)"}

Cognitive verbs:
${cognitiveVerbs.map((v) => `- ${v}`).join("\n") || "- (none)"}

Vocabulary:
${vocabulary.map((v) => `- ${v}`).join("\n") || "- (none)"}

NASOT strategies selected for this activity:
${nasotStrategies.map((n) => `- ${n}`).join("\n") || "- (none)"}

Activity label: ${labelText || "(none)"}
Current activity title: ${asString(activity?.title) || "(none)"}

Requested parts detected:
${requestedParts.map((p) => `- ${p}`).join("\n")}

Refine mode:
${refineMode ? "yes" : "no"}

Builder settings:
- showAnswers: ${showAnswers ? "true" : "false"}

Current student instructions:
${currentStudentInstructions || "(none)"}

Teacher ask:
${teacherPrompt}

Return JSON only.
`.trim();

        const response = await client.responses.create({
            model: modelName,
            instructions,
            input,
            max_output_tokens: 1800,
            store: false,
            text: { format: { type: "json_object" } },
        });

        const raw = extractText(response) || "{}";
        const parsed = safeJsonParse(raw) as EnhanceOut | null;

        if (!parsed) {
            return NextResponse.json(
                {
                    ok: false,
                    error: "Model returned non-json text.",
                    raw: String(raw).slice(0, 500),
                },
                { status: 502 }
            );
        }

        const outTitle =
            asString(parsed.title) ||
            asString(activity?.title) ||
            asString(activity?.label) ||
            "Activity";

        let instructionsContent: unknown = parsed.instructions?.content ?? "";
        let closeActivityContent: unknown = parsed.closeActivity?.content ?? "";
        let teacherScriptContent: unknown = parsed.teacherScript?.content ?? "";
        let resourceContent: unknown = parsed.resource?.content ?? "";

        if (typeof resourceContent === "string") {
            const repaired = splitJsonObjectAndTrailingText(resourceContent);

            if (repaired.jsonObject && isJsonTableShape(repaired.jsonObject)) {
                resourceContent = repaired.jsonObject;

                if (repaired.trailingText) {
                    const existingInstructions = coerceUnknownToText(instructionsContent);
                    instructionsContent = existingInstructions
                        ? `${existingInstructions}\n\n${repaired.trailingText}`.trim()
                        : repaired.trailingText;
                }
            }
        }

        if (!showAnswers) {
            if (isJsonTableShape(resourceContent)) {
                resourceContent = removeSolutionColumnsFromTable(resourceContent);
            } else {
                resourceContent = stripAnswerLines(coerceUnknownToText(resourceContent));
            }

            instructionsContent = stripAnswerLines(coerceUnknownToText(instructionsContent));
            closeActivityContent = stripAnswerLines(coerceUnknownToText(closeActivityContent));
            teacherScriptContent = stripAnswerLines(coerceUnknownToText(teacherScriptContent));
        }

        const enforceTextCount = async (value: unknown) => {
            const text = coerceUnknownToText(value);
            if (!wcSpec?.target || !text || looksLikeHtml(text) || isJsonTableShape(value)) return value;

            const plain = stripHtmlTags(text);
            const wc = wordCount(plain);
            if (wc === wcSpec.target) return text;

            const expanded = await expandToTargetWords({
                client,
                model: modelName,
                teacherPrompt,
                baseText: plain,
                targetWords: wcSpec.target,
            });

            return expanded || text;
        };

        instructionsContent = await enforceTextCount(instructionsContent);
        closeActivityContent = await enforceTextCount(closeActivityContent);
        teacherScriptContent = await enforceTextCount(teacherScriptContent);
        resourceContent = await enforceTextCount(resourceContent);

        if (!isJsonTableShape(resourceContent)) {
            resourceContent = ensureAnchorsInOutput(coerceUnknownToText(resourceContent), anchors);
        }
        instructionsContent = ensureAnchorsInOutput(coerceUnknownToText(instructionsContent), anchors);
        closeActivityContent = ensureAnchorsInOutput(coerceUnknownToText(closeActivityContent), anchors);
        teacherScriptContent = ensureAnchorsInOutput(coerceUnknownToText(teacherScriptContent), anchors);

        let combinedOverview = buildCombinedOverview({
            instructions: instructionsContent,
            closeActivity: closeActivityContent,
            teacherScript: teacherScriptContent,
            resource: resourceContent,
        });

        combinedOverview = injectIconIntoFirstHeaderStrong(combinedOverview, iconHtml);

        const diffAll = coerceDiff(parsed.diff ?? {}, teacherPrompt, outTitle);
        const diff = {
            helpfulHints: includeHelpfulHints ? diffAll.helpfulHints : [],
            tooHardTryThis: includeTooHard ? diffAll.tooHardTryThis : [],
            extension: includeExtension ? diffAll.extension : [],
            stepThisOut: includeStepThisOut ? diffAll.stepThisOut : [],
        };

        const pq = includePowerfulQuestions
            ? asPowerfulQuestions(parsed.powerfulQuestions).slice(0, 4)
            : [];

        const canvaPrompt = includeCanva ? asString(parsed.canvaPrompt) : "";
        const notebookLmPrompt = includeNotebookLM ? asString(parsed.notebookLmPrompt) : "";
        const adobeExpressActivity = includeAdobe ? asString(parsed.adobeExpressActivity) : "";
        const aiActivityIdeas = includeAiActivityIdeas ? asString(parsed.aiActivityIdeas) : "";

        const nasotUsed = Array.isArray(parsed.nasotUsed)
            ? parsed.nasotUsed.map(String).filter(Boolean)
            : typeof parsed.nasotUsed === "string"
                ? parsed.nasotUsed
                    .split(",")
                    .map((x) => x.trim())
                    .filter(Boolean)
                : [];

        return NextResponse.json({
            ok: true,

            requestedParts,

            activityTitle: outTitle,
            activityOverview: combinedOverview,
            suggestedActivityTitle: outTitle,
            suggestedActivityOverview: combinedOverview,

            outputs: {
                instructions: coerceUnknownToText(instructionsContent)
                    ? {
                        title: asString(parsed.instructions?.title) || "Instructions",
                        content: forceVisualHtml(
                            asString(parsed.instructions?.title) || "Instructions",
                            tidyOutput(coerceUnknownToText(instructionsContent))
                        ),
                    }
                    : null,

                closeActivity: coerceUnknownToText(closeActivityContent)
                    ? {
                        title: asString(parsed.closeActivity?.title) || "Close activity",
                        content: forceVisualHtml(
                            asString(parsed.closeActivity?.title) || "Close activity",
                            tidyOutput(coerceUnknownToText(closeActivityContent))
                        ),
                    }
                    : null,

                teacherScript: coerceUnknownToText(teacherScriptContent)
                    ? {
                        title: asString(parsed.teacherScript?.title) || "Teacher script",
                        content: forceVisualHtml(
                            asString(parsed.teacherScript?.title) || "Teacher script",
                            tidyOutput(coerceUnknownToText(teacherScriptContent))
                        ),
                    }
                    : null,

                resource:
                    isJsonTableShape(resourceContent) || coerceUnknownToText(resourceContent)
                        ? {
                            title: asString(parsed.resource?.title) || "Resource",
                            content: forceVisualHtml(
                                asString(parsed.resource?.title) || "Resource",
                                isJsonTableShape(resourceContent)
                                    ? resourceContent
                                    : tidyOutput(coerceUnknownToText(resourceContent))
                            ),
                        }
                        : null,
            },

            nasotUsed,
            powerfulQuestions: pq,
            diff,

            canvaPrompt,
            notebookLmPrompt,
            adobeExpressActivity,
            aiActivityIdeas,
        });
    } catch (e: any) {
        return NextResponse.json(
            { ok: false, error: e?.message || "Route error." },
            { status: 500 }
        );
    }
}
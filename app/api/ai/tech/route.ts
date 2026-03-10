// app/api/ai/tech/route.ts
import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* -----------------------------
   small utils
--------------------------------*/

function safeJsonParse(raw: string) {
    const txt = (raw || "").trim();
    try {
        return JSON.parse(txt);
    } catch {
        return null;
    }
}

function extractText(resp: any): string {
    if (typeof resp?.output_text === "string" && resp.output_text.trim()) return resp.output_text;

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

function asArray(x: any): string[] {
    return Array.isArray(x) ? x.map((v) => String(v ?? "").trim()).filter(Boolean) : [];
}

function asString(x: any) {
    return String(x ?? "").trim();
}

function clampText(s: string, max = 6000) {
    const t = (s || "").trim();
    if (t.length <= max) return t;
    return t.slice(0, max).trim();
}

function oneLine(s: string) {
    return (s || "").replace(/\s+/g, " ").trim();
}

/** light formatting cleanup so outputs don’t come back as one big blob */
function tidyBlocks(s: string): string {
    let t = String(s ?? "");
    t = t.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    t = t.replace(/\n{3,}/g, "\n\n");
    return t.trim();
}

/* -----------------------------
   types + guards
--------------------------------*/

type ToolKey = "canva" | "adobe" | "notebooklm";
type ModeKey =
    | "presentation"
    | "interactive"
    | "poster"
    | "video"
    | "podcast"
    | "sourceText"
    | "slides"
    | "audio"
    | "infographic";

function isTool(x: any): x is ToolKey {
    return x === "canva" || x === "adobe" || x === "notebooklm";
}

function isMode(x: any): x is ModeKey {
    return (
        x === "presentation" ||
        x === "interactive" ||
        x === "poster" ||
        x === "video" ||
        x === "podcast" ||
        x === "sourceText" ||
        x === "slides" ||
        x === "audio" ||
        x === "infographic"
    );
}

function isStudentOnly(tool: ToolKey, mode: ModeKey) {
    // Your rules:
    // - Canva presentation: student-only
    // - Adobe all: student-only
    if (tool === "adobe") return true;
    if (tool === "canva" && mode === "presentation") return true;
    return false;
}

function isTeacherPromptMode(tool: ToolKey, mode: ModeKey) {
    // Your rules:
    // - Canva interactive: teacher prompt (Canva AI)
    // - NotebookLM all: teacher prompt
    if (tool === "canva" && mode === "interactive") return true;
    if (tool === "notebooklm") return true;
    return false;
}

/* -----------------------------
   placeholder teacher asks
--------------------------------*/

function placeholderAskFor(tool: ToolKey, mode: ModeKey) {
    if (tool === "canva" && mode === "presentation") {
        return [
            "Create a Canva presentation about: {TOPIC}",
            "Audience: {YEAR_LEVEL} • Purpose: {PURPOSE}",
            "Slides: {SLIDE_COUNT} • Style words: {STYLE_WORDS}",
            "Must include: {MUST_INCLUDE}",
        ].join("\n");
    }

    if (tool === "canva" && mode === "interactive") {
        return [
            "Create a Canva interactive about: {TOPIC}",
            "Interactive type: {INTERACTIVE_TYPE} (e.g. click-to-reveal, match-up, sort, quiz, 4 corners)",
            "Focus skill: {FOCUS_SKILL} • Time: {TIME_LIMIT}",
            "Must include: {MUST_INCLUDE}",
        ].join("\n");
    }

    if (tool === "adobe" && mode === "poster") {
        return [
            "Create an Adobe Express poster for: {TOPIC}",
            "Poster purpose: {PURPOSE} • Audience: {YEAR_LEVEL}",
            "Must include: {MUST_INCLUDE}",
            "Tone/style words: {STYLE_WORDS}",
        ].join("\n");
    }

    if (tool === "adobe" && mode === "video") {
        return [
            "Create an Adobe Express video for: {TOPIC}",
            "Length: {SECONDS} seconds • Structure: Hook → Explain → Check",
            "Must include: {MUST_INCLUDE}",
            "Tone/style words: {STYLE_WORDS}",
        ].join("\n");
    }

    if (tool === "adobe" && mode === "interactive") {
        return ["Create an Adobe Express interactive for: {TOPIC}", "Interactive type: {INTERACTIVE_TYPE}", "Must include: {MUST_INCLUDE}"].join(
            "\n"
        );
    }

    if (tool === "adobe" && mode === "podcast") {
        return [
            "Create an Adobe Express podcast task for: {TOPIC}",
            "Roles: {ROLE_1} + {ROLE_2}",
            "Must include: 4-question structure + one follow-up challenge question",
        ].join("\n");
    }

    if (tool === "notebooklm" && mode === "sourceText") {
        return [
            "Create a NotebookLM source pack for: {TOPIC}",
            "Reading level: {YEAR_LEVEL} • Length: {MINUTES_TO_READ} minutes",
            "Must include: headings + short sections + one self-check question per section",
        ].join("\n");
    }

    if (tool === "notebooklm" && mode === "slides") {
        return [
            "Create a NotebookLM slide outline for: {TOPIC}",
            "Slides: {SLIDE_COUNT} • Must include: examples + misconceptions + self-check",
        ].join("\n");
    }

    if (tool === "notebooklm" && mode === "video") {
        return [
            "Create a NotebookLM video script for: {TOPIC}",
            "Length: {SECONDS} seconds • Must include: key steps + worked example structure (no final answers)",
        ].join("\n");
    }

    if (tool === "notebooklm" && mode === "audio") {
        return [
            "Create a NotebookLM audio script for: {TOPIC}",
            "Length: {SECONDS} seconds • Must include: key steps + quick self-check",
        ].join("\n");
    }

    // infographic
    return ["Create a NotebookLM infographic outline for: {TOPIC}", "Must include: key terms + process steps + one self-check question"].join("\n");
}

function shouldUsePlaceholders(teacherAsk: string) {
    return !String(teacherAsk || "").trim();
}

/* -----------------------------
   prompt building
--------------------------------*/

function buildInstructions(tool: ToolKey, mode: ModeKey) {
    const studentOnly = isStudentOnly(tool, mode);
    const teacherPromptMode = isTeacherPromptMode(tool, mode);

    const base = `
You output valid JSON only. (json)

Global rules:
- Australian spelling
- Present tense
- No student names or identifying details
- Time-conscious: 5–12 minutes unless teacherAsk overrides
- Do not give content answers (scaffold process, not solutions)
- If vocabulary is provided, weave 2–4 words naturally (where appropriate)
- If teacherAsk is blank, DO NOT invent a topic. Output placeholder-based instructions using {BRACES} so the teacher can fill it in.
- If nasotStrategies are provided, use 0–2 that genuinely fit (do NOT force it)

Field rules (NON-NEGOTIABLE):
- suggestedTitle: always set
- activitySummary: 1–3 teacher-facing sentences (what students do + submit + why it links to success)
- studentInstructions: always set (students can follow without teacher translating)

Tool rules:

1) STUDENT-ONLY MODES (NO teacher prompt):
- If tool is Adobe Express (any mode), OR Canva Presentation mode:
  • toolPrompt MUST be an empty string
  • sourceText MUST be an empty string
  • studentInstructions MUST be student-facing and task-complete

2) TEACHER-PROMPT MODES:
- Canva Interactive:
  • toolPrompt MUST be a teacher copy/paste prompt for Canva AI
  • studentInstructions MUST tell students what to do in Canva with the teacher-provided interactive
  • sourceText MUST be empty string

- NotebookLM (all modes):
  • toolPrompt MUST be a teacher copy/paste prompt for NotebookLM
  • sourceText MUST be included (headings + short sections + at least one self-check question)
  • studentInstructions MUST be student-facing but assumes teacher provides the output
    Students do NOT paste prompts into NotebookLM.

Return JSON ONLY with EXACT keys:
{
  "suggestedTitle": string,
  "activitySummary": string,
  "studentInstructions": string,
  "toolPrompt": string,
  "sourceText": string,
  "nasotUsed": string[]
}

Formatting rules:
- studentInstructions: short headings + dot points + time box + “what to submit” + “on track” check
- nasotUsed: array of NASOT strategy names actually used (can be empty)
`.trim();

    const specHeader = `\n\nTOOL: ${tool}\nMODE: ${mode}\nSTUDENT_ONLY: ${studentOnly}\nTEACHER_PROMPT_MODE: ${teacherPromptMode}\n`;

    const toolSpecs: string[] = [];

    if (tool === "canva") {
        toolSpecs.push(
            `
CANVA NOTES:
- Presentation mode is a STUDENT task
- Interactive mode is TEACHER prompt for Canva AI + student instructions for completing the interactive
- Student instructions must name the Canva path (e.g. Canva → Presentation → Create / Canva → Whiteboard)
`.trim()
        );
    }

    if (tool === "adobe") {
        toolSpecs.push(
            `
ADOBE EXPRESS NOTES:
- All modes are STUDENT tasks (poster, video, interactive, podcast)
- toolPrompt MUST be empty
- Keep tasks minimal, time-boxed, and submission-clear
`.trim()
        );
    }

    if (tool === "notebooklm") {
        toolSpecs.push(
            `
NOTEBOOKLM NOTES:
- Teacher builds the source + generates output
- Students consume teacher-provided output: watch/read/listen + notes + self-check
- toolPrompt + sourceText are REQUIRED
`.trim()
        );
    }

    const modeAddOns: Record<ModeKey, string> = {
        presentation: `
MODE (Presentation):
- Students produce ONE clear artefact
- Keep it tight (1–5 slides unless teacherAsk says otherwise)
`.trim(),
        interactive: `
MODE (Interactive):
- Must include a mechanic: choose, sort, match, vote, click-to-reveal, 4 corners + quick check
`.trim(),
        poster: `
MODE (Poster):
- One image + limited text
- Include an “impact/meaning” line (not just facts)
`.trim(),
        video: `
MODE (Video):
- 3-beat storyboard (Hook → Explain → Check)
- Keep under 60–90 seconds unless teacherAsk says otherwise
`.trim(),
        podcast: `
MODE (Podcast):
- Roles + 4-question structure
- Include a swap roles or add-on question step
`.trim(),
        sourceText: `
MODE (Source text):
- sourceText is the main artefact (headings + short sections)
- studentInstructions explain how to use it (teacher-provided)
`.trim(),
        slides: `
MODE (Slides):
- toolPrompt generates a slide outline
- students use teacher-provided slides for notes + self-check
`.trim(),
        audio: `
MODE (Audio):
- toolPrompt generates a short audio script
- students listen + note-take + self-check
`.trim(),
        infographic: `
MODE (Infographic):
- toolPrompt generates an infographic outline
- students read + extract key points + self-check
`.trim(),
    };

    return [base, specHeader, toolSpecs.join("\n\n"), "", modeAddOns[mode] || ""].join("\n");
}

function buildInput(payload: {
    tool: ToolKey;
    mode: ModeKey;
    teacherAsk: string;
    lessonTitle: string;
    teacherContext: string;
    learningGoals: string[];
    successCriteria: string[];
    vocabulary: string[];
    cognitiveVerbs: string[];
    nasotStrategies: string[];
}) {
    const { tool, mode, teacherAsk, lessonTitle, teacherContext, learningGoals, successCriteria, vocabulary, cognitiveVerbs, nasotStrategies } =
        payload;

    return `
Please return json only. (json)

Lesson title: ${lessonTitle || "Untitled"}
Teacher context: ${teacherContext || "none"}
Teacher ask (plain language): ${teacherAsk || "(none provided)"}

Learning goals (alignment only):
${learningGoals.length ? learningGoals.map((l) => `- ${l}`).join("\n") : "- (none)"}

Success criteria (numbered, alignment only):
${successCriteria.length ? successCriteria.map((s, i) => `${i + 1}. ${s}`).join("\n") : "1. (none)"}

Tier 2/3 vocabulary (weave 2–4 naturally where appropriate):
${vocabulary.length ? vocabulary.join(", ") : "(none)"}

Cognitive verbs (sprinkle into tasks):
${cognitiveVerbs.length ? cognitiveVerbs.join(", ") : "(none)"}

NASOT strategy options for this activity (use 0–2 if they genuinely fit):
${nasotStrategies.length ? nasotStrategies.map((n) => `- ${n}`).join("\n") : "- (none provided)"}

Tool: ${tool}
Mode: ${mode}

Return JSON only with the exact keys.
`.trim();
}

/* -----------------------------
   defaults + normalisation
--------------------------------*/

function defaultTitleFor(tool: ToolKey, mode: ModeKey, lessonTitle: string) {
    const t = oneLine(lessonTitle || "Lesson");
    if (tool === "canva" && mode === "presentation") return `${t} — Canva create`;
    if (tool === "canva" && mode === "interactive") return `${t} — Canva interactive`;
    if (tool === "adobe" && mode === "poster") return `${t} — Adobe Express poster sprint`;
    if (tool === "adobe" && mode === "video") return `${t} — Adobe Express video sprint`;
    if (tool === "adobe" && mode === "interactive") return `${t} — Adobe Express interactive task`;
    if (tool === "adobe" && mode === "podcast") return `${t} — Adobe Express podcast sprint`;
    if (tool === "notebooklm" && mode === "sourceText") return `${t} — NotebookLM source pack`;
    if (tool === "notebooklm" && mode === "slides") return `${t} — NotebookLM slides pack`;
    if (tool === "notebooklm" && mode === "video") return `${t} — NotebookLM video script`;
    if (tool === "notebooklm" && mode === "audio") return `${t} — NotebookLM audio script`;
    if (tool === "notebooklm" && mode === "infographic") return `${t} — NotebookLM infographic outline`;
    return `${t} — Tech task`;
}

function normaliseOutput(parsed: any, tool: ToolKey) {
    const suggestedTitle = asString(parsed?.suggestedTitle);
    const activitySummary = asString(parsed?.activitySummary);
    const studentInstructions = asString(parsed?.studentInstructions);
    const toolPrompt = asString(parsed?.toolPrompt);

    const nasotUsed = asArray(parsed?.nasotUsed).slice(0, 3);

    const sourceTextRaw = asString(parsed?.sourceText);
    const sourceText = tool === "notebooklm" ? sourceTextRaw : "";

    return {
        suggestedTitle: clampText(tidyBlocks(suggestedTitle), 200),
        activitySummary: clampText(tidyBlocks(activitySummary), 800),
        studentInstructions: clampText(tidyBlocks(studentInstructions), 5000),
        toolPrompt: clampText(tidyBlocks(toolPrompt), 5000),
        sourceText: clampText(tidyBlocks(sourceText), 7000),
        nasotUsed,
    };
}

function enforceToolRules(norm: ReturnType<typeof normaliseOutput>, tool: ToolKey, mode: ModeKey) {
    const studentOnly = isStudentOnly(tool, mode);
    const teacherPromptMode = isTeacherPromptMode(tool, mode);

    // Student-only => wipe prompts
    if (studentOnly) {
        return { ...norm, toolPrompt: "", sourceText: "" };
    }

    // Canva interactive => prompt ok, but no sourceText
    if (tool === "canva" && mode === "interactive") {
        return { ...norm, sourceText: "" };
    }

    // NotebookLM => must have prompt + sourceText (leave as-is, but ensure not blank later)
    if (tool === "notebooklm") return norm;

    // If not a teacher-prompt mode, wipe
    if (!teacherPromptMode) {
        return { ...norm, toolPrompt: "", sourceText: "" };
    }

    return norm;
}

function studentInstructionsDefaultFor(tool: ToolKey, mode: ModeKey) {
    // Keep this generic and safe. Your model usually fills it anyway.
    if (tool === "notebooklm") {
        return [
            "Time: 8–10 minutes",
            "",
            "You do:",
            "• Read/watch/listen to the resource your teacher gives you.",
            "• Write dot-point notes that link to the success criteria.",
            "• Complete the self-check question(s).",
            "",
            "Submit:",
            "• Notes + your self-check responses (as directed).",
            "",
            "On track:",
            "• You can explain how one note links to one success criterion.",
        ].join("\n");
    }

    if (tool === "canva" && mode === "interactive") {
        return [
            "Time: 8–10 minutes",
            "",
            "You do:",
            "• Open the interactive your teacher provides in Canva.",
            "• Complete each step carefully.",
            "• Fix any mistakes using feedback from the task.",
            "",
            "Submit:",
            "• Screenshot / share link (as directed).",
            "",
            "On track:",
            "• You can point to one part of the task and explain how it shows the learning goal.",
        ].join("\n");
    }

    // Student-only (Canva presentation / all Adobe)
    return [
        "Time: 8–10 minutes",
        "",
        "You do:",
        "• Create the required artefact in the tool.",
        "• Keep it clear, minimal, and aligned to the success criteria.",
        "• Use key vocabulary accurately (2–4 words).",
        "",
        "Submit:",
        "• Share link or screenshot (as directed).",
        "",
        "On track:",
        "• You can point to one success criterion and show where your work meets it.",
    ].join("\n");
}

/* -----------------------------
   handler
--------------------------------*/

export async function POST(req: Request) {
    try {
        const body = await req.json().catch(() => null);
        if (!body) return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });

        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json({ ok: false, error: "Missing OPENAI_API_KEY." }, { status: 500 });
        }

        const tool = body?.tool;
        const mode = body?.mode;

        if (!isTool(tool)) {
            return NextResponse.json({ ok: false, error: "Invalid tool. Expected: canva | adobe | notebooklm." }, { status: 400 });
        }

        if (!isMode(mode)) {
            return NextResponse.json(
                {
                    ok: false,
                    error: "Invalid mode. Expected one of: presentation | interactive | poster | video | podcast | sourceText | slides | audio | infographic.",
                },
                { status: 400 }
            );
        }

        const invalidCombo =
            (tool === "canva" && !(mode === "presentation" || mode === "interactive")) ||
            (tool === "adobe" && !(mode === "poster" || mode === "video" || mode === "interactive" || mode === "podcast")) ||
            (tool === "notebooklm" && !(mode === "sourceText" || mode === "slides" || mode === "video" || mode === "audio" || mode === "infographic"));

        if (invalidCombo) {
            return NextResponse.json({ ok: false, error: `Mode "${mode}" is not valid for tool "${tool}".` }, { status: 400 });
        }

        const lessonTitle = asString(body?.lessonTitle);
        const teacherContext = asString(body?.teacherContext);

        const teacherAskRaw = asString(body?.teacherAsk);
        const teacherAsk = shouldUsePlaceholders(teacherAskRaw) ? placeholderAskFor(tool, mode) : teacherAskRaw;

        const learningGoals = asArray(body?.learningGoals);
        const successCriteria = asArray(body?.successCriteria);
        const vocabulary = asArray(body?.vocabulary);
        const cognitiveVerbs = asArray(body?.cognitiveVerbs);
        const nasotStrategies = asArray(body?.nasotStrategies);

        const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        const instructions = buildInstructions(tool, mode);
        const input = buildInput({
            tool,
            mode,
            teacherAsk,
            lessonTitle,
            teacherContext,
            learningGoals,
            successCriteria,
            vocabulary,
            cognitiveVerbs,
            nasotStrategies,
        });

        const response = await client.responses.create({
            model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
            instructions,
            input,
            max_output_tokens: 1700,
            store: false,
            text: { format: { type: "json_object" } },
        });

        const raw = extractText(response) || "{}";
        const parsed = safeJsonParse(raw);

        if (!parsed) {
            return NextResponse.json(
                { ok: false, error: "Model returned non-JSON text.", raw: String(raw).slice(0, 500) },
                { status: 502 }
            );
        }

        let norm = normaliseOutput(parsed, tool);
        norm = enforceToolRules(norm, tool, mode);

        const suggestedTitle = norm.suggestedTitle || defaultTitleFor(tool, mode, lessonTitle);

        const activitySummary =
            norm.activitySummary ||
            `Students complete a short ${tool} task linked to the learning goal and success criteria, then submit a share link or snapshot.`;

        const studentOnly = isStudentOnly(tool, mode);
        const studentInstructionsDefault = studentInstructionsDefaultFor(tool, mode);

        const studentInstructions =
            norm.studentInstructions ||
            (shouldUsePlaceholders(teacherAskRaw)
                ? [
                    "Time: 8–10 minutes",
                    "",
                    "Teacher fills in:",
                    teacherAsk,
                    "",
                    "You do:",
                    "• Follow the steps and create the artefact.",
                    "• Use key words accurately.",
                    "",
                    "Submit:",
                    "• Share link or screenshot (as directed).",
                    "",
                    "On track:",
                    "• You can point to one success criterion and show where your work meets it.",
                ].join("\n")
                : studentInstructionsDefault);

        const toolPrompt = studentOnly
            ? ""
            : norm.toolPrompt ||
            (shouldUsePlaceholders(teacherAskRaw)
                ? ["Use the teacher request below (with placeholders) to generate the resource.", "", teacherAsk].join("\n")
                : tool === "canva" && mode === "interactive"
                    ? [
                        "Create a Canva AI prompt that generates a student interactive (not answers).",
                        "Constraints: 10-minute sprint, student-facing instructions, includes submit + on-track check.",
                        "Weave 2–4 vocabulary words naturally.",
                        "",
                        "Teacher ask:",
                        teacherAsk,
                    ].join("\n")
                    : tool === "notebooklm"
                        ? [
                            "Teacher prompt for NotebookLM:",
                            teacherAsk,
                            "",
                            "Guardrails:",
                            "- Do not provide final answers",
                            "- Explain the process",
                            "- Include at least one self-check aligned to success criteria",
                        ].join("\n")
                        : "");

        const sourceText =
            tool === "notebooklm"
                ? norm.sourceText ||
                (shouldUsePlaceholders(teacherAskRaw)
                    ? [
                        `Source pack for: {TOPIC}`,
                        "",
                        "Section 1: {HEADING}",
                        "- Key idea:",
                        "- Worked process (no final answers):",
                        "- Self-check question:",
                        "",
                        "Section 2: {HEADING}",
                        "- Key idea:",
                        "- Worked process (no final answers):",
                        "- Self-check question:",
                    ].join("\n")
                    : [
                        `Source text: ${lessonTitle || "Topic"}`,
                        "",
                        "Write in short sections with headings.",
                        "Include at least one self-check question aligned to success criteria.",
                    ].join("\n"))
                : "";

        // Final enforcement: NotebookLM must include prompt + sourceText (never blank)
        const finalToolPrompt = tool === "notebooklm" ? (toolPrompt.trim() ? toolPrompt : "Teacher prompt: " + (teacherAsk || "{TOPIC}")) : toolPrompt;
        const finalSourceText =
            tool === "notebooklm" ? (sourceText.trim() ? sourceText : `Source text: ${lessonTitle || "{TOPIC}"}\n\n- Key idea:\n- Process:\n- Self-check:`) : sourceText;

        return NextResponse.json({
            ok: true,
            suggestedTitle,
            activitySummary,
            studentInstructions,
            toolPrompt: finalToolPrompt,
            sourceText: finalSourceText,
            nasotUsed: norm.nasotUsed || [],
        });
    } catch (err: any) {
        return NextResponse.json({ ok: false, error: err?.message || "Tech AI failed" }, { status: 500 });
    }
}

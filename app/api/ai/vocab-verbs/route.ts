// app/api/ai/vocab-verbs/route.ts
import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* -----------------------------
   SMALL UTILS
--------------------------------*/

function asArray(x: any): string[] {
    return Array.isArray(x) ? x.map((v) => String(v ?? "").trim()).filter(Boolean) : [];
}

function normLine(s: string) {
    return (s || "")
        .replace(/[\u2013\u2014\u2212]/g, "-")
        .replace(/\uFFFD/g, "")
        .replace(/\s*-\s*/g, " - ")
        .replace(/\s+/g, " ")
        .trim();
}

function extractText(resp: any) {
    if (typeof resp?.output_text === "string" && resp.output_text.trim()) return resp.output_text;

    const out = resp?.output;
    if (!Array.isArray(out)) return "";

    for (const item of out) {
        const content = item?.content;
        if (!Array.isArray(content)) continue;
        for (const c of content) {
            if (typeof c?.text === "string") return c.text;
            if (typeof c?.output_text === "string") return c.output_text;
            if (typeof c?.text?.value === "string") return c.text.value;
        }
    }
    return "";
}

function coerceJson(raw: string) {
    let s = (raw || "")
        .trim()
        .replace(/^\s*```(?:json)?\s*/i, "")
        .replace(/\s*```\s*$/i, "")
        .trim();

    if (s.startsWith("{") && s.endsWith("}")) return s;

    const a = s.indexOf("{");
    const b = s.lastIndexOf("}");
    if (a >= 0 && b > a) return s.slice(a, b + 1).trim();
    return "";
}

const STOPWORDS = new Set([
    "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "how", "if", "in", "into", "is", "it", "its",
    "of", "on", "or", "that", "the", "their", "this", "to", "was", "were", "what", "when", "where", "which", "why", "with",
    "students", "student", "learning", "goal", "success", "criteria",
]);

function extractPriorityTerms(inputs: string[], max = 10) {
    const text = inputs.join(" ").toLowerCase();
    const tokens = text.replace(/[^a-z0-9\- ]+/g, " ").split(/\s+/).filter(Boolean);

    const freq = new Map<string, number>();
    for (const t of tokens) {
        if (t.length < 5) continue;
        if (STOPWORDS.has(t)) continue;
        freq.set(t, (freq.get(t) || 0) + 1);
    }

    return [...freq.entries()]
        .sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)
        .map(([t]) => t)
        .slice(0, max);
}

/* -----------------------------
   BAND RULES
--------------------------------*/

type VocabBand = "Year 7–8" | "Year 9–10" | "Senior";

const BAND_RULES: Record<VocabBand, string> = {
    "Year 7–8": `
- Keep verbs and vocab accessible and classroom-friendly.
- Vocabulary: mostly Tier 2 with 1–2 gentle Tier 3.
- Morphology: simple (1–2 meaningful parts); avoid heavy Greek/Latin unless obvious.
- Meaning: short and concrete, linked to what students do today.
`.trim(),

    "Year 9–10": `
- Vocabulary: mix Tier 2 and Tier 3 disciplinary terms.
- Morphology: 2–3 parts where possible (prefix/root/suffix).
- Meaning: clearer academic phrasing but still student-friendly.
`.trim(),

    Senior: `
- Vocabulary: predominantly Tier 3 + assessment-like Tier 2 (rubric/glossary style).
- Morphology: 3+ parts where possible; accurate Greek/Latin roots.
- Meaning: precise and assessment-oriented.
`.trim(),
};

/* -----------------------------
   PROMPT
--------------------------------*/

function buildPrompt(args: {
    learningGoals: string[];
    successCriteria: string[];
    priorityTerms: string[];
    vocabBand: VocabBand;
    repairNotes?: string;
}) {
    const bandRules = BAND_RULES[args.vocabBand] ?? BAND_RULES["Year 9–10"];

    return `
You are a teacher writing explicit-teaching language supports aligned to the lesson.

Return JSON ONLY:
{
  "cognitiveVerbs": string[],
  "vocabulary": string[]
}

Vocab band: ${args.vocabBand}

BAND RULES:
${bandRules}

COGNITIVE VERBS (exactly 4)
Format EXACTLY:
"Verb - In this lesson, students [observable action tied to the task] so they can [assessment-relevant purpose]."

Rules:
- Must connect directly to the learning goals and success criteria.
- Must be measurable (what students produce/do).
- Avoid vague verbs (understand/know/learn).

VOCABULARY (exactly 4)
Choose Tier 2/3 terms appropriate to the band.
Each term MUST be a noun or noun phrase (NOT a verb).
Each term MUST include morphemes and a lesson-specific meaning.

Format EXACTLY:
"Term - Morphemes: prefix=meaning; root=meaning; suffix=meaning; Meaning: lesson-specific definition tied to the task."

Rules:
- Do NOT use cognitive verbs as vocabulary.
- Avoid basic classroom words.
- If a term has no clear prefix, use a meaningful combining form for teaching purposes.

Use these lesson terms when relevant:
${args.priorityTerms.map((t) => `- ${t}`).join("\n")}

Learning goals:
${args.learningGoals.map((l) => `- ${l}`).join("\n")}

Success criteria:
${args.successCriteria.map((s) => `- ${s}`).join("\n")}

FINAL CHECK (silent):
- Exactly 4 cognitive verbs and 4 vocabulary items.
- Vocabulary items are nouns/noun phrases and include Morphemes + Meaning in the required format.
- Output JSON only. No markdown. No extra text.

${args.repairNotes ? `REPAIR NOTES:\n${args.repairNotes}\nFix ALL issues above.` : ""}
`.trim();
}

/* -----------------------------
   LIGHT VALIDATION
--------------------------------*/

const FORBIDDEN_VOCAB_HEADS = new Set([
    "explain", "analyse", "analyze", "interpret", "develop", "describe", "identify", "compare", "contrast",
    "evaluate", "justify", "summarise", "summarize", "outline", "discuss", "apply", "solve", "calculate", "determine",
]);

function termHead(line: string) {
    return (line || "").split(" - ")[0].trim().toLowerCase();
}

function validate(result: { cognitiveVerbs: string[]; vocabulary: string[] }) {
    const issues: string[] = [];

    if (result.cognitiveVerbs.length !== 4) issues.push("cognitiveVerbs must be exactly 4");
    if (result.vocabulary.length !== 4) issues.push("vocabulary must be exactly 4");

    const verbHeads = new Set(result.cognitiveVerbs.map(termHead));

    result.vocabulary.forEach((v, i) => {
        const head = termHead(v);

        if (!/ - Morphemes:/i.test(v) || !/Meaning:/i.test(v)) {
            issues.push(`vocabulary[${i}] must include: " - Morphemes: ... Meaning: ..."`);
        }
        if (verbHeads.has(head) || FORBIDDEN_VOCAB_HEADS.has(head)) {
            issues.push(`vocabulary[${i}] is a cognitive verb (${head})`);
        }
    });

    return issues;
}

/* -----------------------------
   OPENAI CALL (Responses API)
--------------------------------*/

async function generateOnce(client: OpenAI, prompt: string) {
    const schemaFormat = {
        type: "json_schema",
        json_schema: {
            name: "lesson_language_supports",
            schema: {
                type: "object",
                additionalProperties: false,
                properties: {
                    cognitiveVerbs: { type: "array", minItems: 4, maxItems: 4, items: { type: "string" } },
                    vocabulary: { type: "array", minItems: 4, maxItems: 4, items: { type: "string" } },
                },
                required: ["cognitiveVerbs", "vocabulary"],
            },
        },
    } as const;

    const jsonObjectFormat = { type: "json_object" } as const;

    async function callWithFormat(format: any) {
        return client.responses.create({
            model: "gpt-4.1-mini",
            input: prompt,
            max_output_tokens: 520,
            text: { format },
        } as any);
    }

    let resp: any;
    try {
        resp = await callWithFormat(schemaFormat);
    } catch {
        resp = await callWithFormat(jsonObjectFormat);
    }

    const raw = extractText(resp).trim();
    if (!raw) return { ok: false as const, error: "No text returned" };

    const json = coerceJson(raw);
    if (!json) return { ok: false as const, error: "Non JSON output" };

    let parsed: any;
    try {
        parsed = JSON.parse(json);
    } catch {
        return { ok: false as const, error: "Non JSON output" };
    }

    const cognitiveVerbs = asArray(parsed.cognitiveVerbs).slice(0, 4).map(normLine);
    const vocabulary = asArray(parsed.vocabulary).slice(0, 4).map(normLine);

    return { ok: true as const, cognitiveVerbs, vocabulary };
}

/* -----------------------------
   ROUTE
--------------------------------*/

export async function POST(req: Request) {
    try {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ ok: false, error: "Missing OPENAI_API_KEY" }, { status: 500 });
        }

        const body = await req.json().catch(() => null);
        if (!body) {
            return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
        }

        const learningGoals = asArray(body.learningGoals);
        const successCriteria = asArray(body.successCriteria);

        const vocabBandRaw = String(body.vocabBand || "Year 9–10").trim();
        const vocabBand: VocabBand =
            vocabBandRaw === "Year 7–8" || vocabBandRaw === "Year 9–10" || vocabBandRaw === "Senior"
                ? (vocabBandRaw as VocabBand)
                : "Year 9–10";

        const allInputs = [...learningGoals, ...successCriteria];
        const priorityTerms = extractPriorityTerms(allInputs);

        const client = new OpenAI({ apiKey });

        const prompt1 = buildPrompt({ learningGoals, successCriteria, priorityTerms, vocabBand });
        const attempt1 = await generateOnce(client, prompt1);

        if (!attempt1.ok) {
            return NextResponse.json({ ok: false, error: attempt1.error }, { status: 502 });
        }

        const issues1 = validate(attempt1);
        if (!issues1.length) {
            return NextResponse.json({
                ok: true,
                vocabBand,
                cognitiveVerbs: attempt1.cognitiveVerbs,
                vocabulary: attempt1.vocabulary,
                cognitiveVerbsText: attempt1.cognitiveVerbs.join("\n\n"),
                vocabularyText: attempt1.vocabulary.join("\n\n"),
            });
        }

        const prompt2 = buildPrompt({
            learningGoals,
            successCriteria,
            priorityTerms,
            vocabBand,
            repairNotes: issues1.join("\n"),
        });

        const attempt2 = await generateOnce(client, prompt2);

        if (attempt2.ok && !validate(attempt2).length) {
            return NextResponse.json({
                ok: true,
                vocabBand,
                cognitiveVerbs: attempt2.cognitiveVerbs,
                vocabulary: attempt2.vocabulary,
                cognitiveVerbsText: attempt2.cognitiveVerbs.join("\n\n"),
                vocabularyText: attempt2.vocabulary.join("\n\n"),
            });
        }

        return NextResponse.json({
            ok: true,
            vocabBand,
            cognitiveVerbs: attempt1.cognitiveVerbs,
            vocabulary: attempt1.vocabulary,
            cognitiveVerbsText: attempt1.cognitiveVerbs.join("\n\n"),
            vocabularyText: attempt1.vocabulary.join("\n\n"),
            warnings: issues1,
        });
    } catch (err: any) {
        return NextResponse.json({ ok: false, error: err?.message || String(err) }, { status: 500 });
    }
}

// app/api/ai/warmup-story/route.ts
import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function asArray(x: any): string[] {
    return Array.isArray(x) ? x.map((v) => String(v ?? "").trim()).filter(Boolean) : [];
}

function safeJsonParse(raw: string) {
    try {
        return JSON.parse((raw || "").trim());
    } catch {
        return null;
    }
}

// Pull JSON text out of Responses API shapes
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

function normaliseLine(s: string) {
    return (s || "").replace(/\uFFFD/g, "").replace(/\s+/g, " ").trim();
}

function wordCount(s: string) {
    return (s || "").trim().split(/\s+/).filter(Boolean).length;
}

function includesAny(s: string, needles: string[]) {
    const t = (s || "").toLowerCase();
    return needles.some((n) => n && t.includes(n.toLowerCase()));
}

function escapeRegex(s: string) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Extract which vocab terms actually appear in the story.
 * Prefer exact match; fallback to case-insensitive.
 */
function extractUsedVocabularyFromStory(story: string, vocabTerms: string[]) {
    const usedExact: string[] = [];
    const usedInsensitive: string[] = [];
    const text = story || "";

    for (const term of vocabTerms) {
        if (!term) continue;

        const exactRe = new RegExp(`\\b${escapeRegex(term)}\\b`, "g");
        if (exactRe.test(text)) {
            usedExact.push(term);
            continue;
        }

        const insRe = new RegExp(`\\b${escapeRegex(term)}\\b`, "gi");
        if (insRe.test(text)) usedInsensitive.push(term);
    }

    const used = usedExact.length ? usedExact : usedInsensitive;
    return used.slice(0, 2);
}

export async function POST(req: Request) {
    try {
        const body = await req.json().catch(() => null);
        if (!body) return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });

        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json({ ok: false, error: "Missing OPENAI_API_KEY." }, { status: 500 });
        }

        const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        const lessonTitle = String(body?.lessonTitle || "Untitled").trim();
        const teacherContext = String(body?.teacherContext || "").trim();
        const warmupContext = String(body?.warmupContext || "").trim();

        const lg = asArray(body?.learningGoals);
        const sc = asArray(body?.successCriteria);

        const vocabLines = asArray(body?.vocabulary).map(normaliseLine);
        const vocabTerms = vocabLines
            .map((line) => (line.split(" - ")[0] || "").trim())
            .filter(Boolean)
            .slice(0, 12);

        if (!lg.length && !sc.length) {
            return NextResponse.json({ ok: false, error: "Add at least one learning goal or success criterion first." }, { status: 400 });
        }

        // Ban teacher voice / lesson scripting, but DO allow student-facing “You …”
        const bannedTeacherVoice = [
            "today we",
            "in this lesson",
            "we will learn",
            "learning intention",
            "success criteria",
            "teacher says",
            "as a class",
            "i want you to",
        ];

        // Ban drifting into content/metalanguage
        const bannedLessonMetalanguage = [
            "shakespeare",
            "act 2",
            "imagery",
            "metaphor",
            "foreshadow",
            "dramatic technique",
            "symbolism",
            "theme",
            "analyse",
        ];

        // IMPORTANT: include the literal word JSON
        const instructions = `
Return JSON only. Output must be valid JSON. (JSON)

You are writing a STUDENT-FACING warm-up that will be pasted into a QLearn page.

Goal:
- It reads like the student is being introduced into a situation (story-sharing).
- It includes a tiny run-sheet so students can do it without teacher translation.

Length:
- warmUpStory must be 70–110 words total (including the mini run-sheet lines).

Style:
- Australian spelling
- Present tense
- Student voice (natural, believable)
- No “Today we learn…” language
- No definitions, no explanations, no answers, no academic tone
- Do NOT name texts/authors/lesson content explicitly
- End with ONE discussion question that targets interpretation (tone, intent, consequence, choice)

Structure INSIDE warmUpStory:
- 1 short paragraph story (real-life situation)
- Then 2–3 short lines that are clearly student-facing, like:
  "Warm-up (1 min): ..."
  "Do: ..."
  "Share: ..."

VOCAB (STRICT):
- If vocabulary is provided, embed EXACTLY 1 or 2 of the provided terms inside the story paragraph.
- Copy/paste the term exactly as provided (same spelling and spacing).
- Do NOT invent new Tier 3 terms.

Return JSON ONLY:

{
  "warmUpStoryTitle": string,
  "warmUpStory": string,
  "endQuestion": string,
  "usedVocabulary": string[]
}
`.trim();

        const input = `
Lesson title (alignment only): ${lessonTitle}

Teacher context (optional): ${teacherContext || "none"}
Student context (optional): ${warmupContext || "none"}

Learning goals (alignment only; do not mention explicitly):
${lg.map((l) => `- ${l}`).join("\n")}

Success criteria (alignment only; do not mention explicitly):
${sc.map((s) => `- ${s}`).join("\n")}

Vocabulary terms (copy/paste EXACTLY 1 or 2 into the story paragraph if provided):
${vocabTerms.map((t) => `- ${t}`).join("\n") || "- none"}

Return JSON only.
`.trim();

        for (let attempt = 1; attempt <= 2; attempt++) {
            const response = await client.responses.create({
                model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
                instructions,
                input: attempt === 1 ? input : input + "\n\nSecond attempt: obey ALL rules exactly. Return JSON only.",
                max_output_tokens: 520,
                store: false,
                text: { format: { type: "json_object" } },
            });

            const raw = extractText(response) || "{}";
            const parsed = safeJsonParse(raw);

            if (!parsed || typeof parsed?.warmUpStory !== "string" || typeof parsed?.endQuestion !== "string") {
                if (attempt === 2) {
                    return NextResponse.json({ ok: false, error: "Bad JSON shape from model.", raw: raw.slice(0, 500) }, { status: 502 });
                }
                continue;
            }

            const warmUpStoryTitle = String(parsed.warmUpStoryTitle || "Warm up").trim();
            const warmUpStory = String(parsed.warmUpStory || "").trim();
            const endQuestion = String(parsed.endQuestion || "").trim();

            const wc = wordCount(warmUpStory);
            if (wc < 70 || wc > 110) {
                if (attempt === 2) {
                    return NextResponse.json({ ok: false, error: `Warm-up story must be 70–110 words. Got ${wc}.`, raw: warmUpStory }, { status: 502 });
                }
                continue;
            }

            if (includesAny(warmUpStory, bannedTeacherVoice)) {
                if (attempt === 2) {
                    return NextResponse.json({ ok: false, error: "Warm-up uses teacher voice / lesson scripting language.", raw: warmUpStory }, { status: 502 });
                }
                continue;
            }

            if (includesAny(warmUpStory, bannedLessonMetalanguage) || includesAny(endQuestion, bannedLessonMetalanguage)) {
                if (attempt === 2) {
                    return NextResponse.json({ ok: false, error: "Warm-up drifts into lesson content/metalanguage.", raw: { warmUpStory, endQuestion } }, { status: 502 });
                }
                continue;
            }

            // Source of truth: detect used vocab from story
            const usedVocabulary = extractUsedVocabularyFromStory(warmUpStory, vocabTerms);

            if (vocabTerms.length > 0) {
                if (usedVocabulary.length < 1 || usedVocabulary.length > 2) {
                    if (attempt === 2) {
                        return NextResponse.json(
                            { ok: false, error: "Story must embed EXACTLY 1 or 2 provided vocabulary terms.", raw: { warmUpStory, vocabTerms } },
                            { status: 502 }
                        );
                    }
                    continue;
                }
            }

            return NextResponse.json({ ok: true, warmUpStoryTitle, warmUpStory, endQuestion, usedVocabulary });
        }

        return NextResponse.json({ ok: false, error: "Warm-up generation failed constraints." }, { status: 502 });
    } catch (err: any) {
        return NextResponse.json({ ok: false, error: err?.message || "Warm-up generation failed." }, { status: 500 });
    }
}

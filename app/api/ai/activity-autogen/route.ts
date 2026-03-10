import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ ok: false, error: "Missing OPENAI_API_KEY." }, { status: 500 });
    }

    const lessonTitle = String(body?.lessonTitle ?? "Untitled").trim();
    const teacherContext = String(body?.teacherContext ?? "").trim();

    const learningGoals = asArray(body?.learningGoals);
    const successCriteria = asArray(body?.successCriteria);
    const cognitiveVerbs = asArray(body?.cognitiveVerbs);
    const vocabulary = asArray(body?.vocabulary);

    const activity = body?.activity ?? {};
    const label = String(activity?.label ?? "Activity").trim();
    const resourceLink = String(activity?.resourceLink ?? "").trim();
    const techHeavy = Boolean(activity?.techHeavy);

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const instructions = `
You output JSON only.

You help a teacher by drafting ONE classroom activity (teacher-facing draft) that matches the lesson.

This is NOT the final student instructions.
It is a teacher draft that the system later expands.

Rules:
- Australian spelling
- Present tense
- No student names or identifying details
- Must link explicitly to success criteria by referencing 1-2 SC numbers (e.g. "SC2")
- Keep it short and practical (4�8 lines)
- The draft describes what students DO (not teacher lecturing)
- If a resource link exists, refer to it as "the linked resource"
- Return JSON only

Return JSON with EXACT keys:
{
  "activityTitle": string,
  "teacherDraft": string
}
`.trim();

    const input = `
Lesson title: ${lessonTitle}
Teacher context: ${teacherContext || "none"}

Learning goals:
${learningGoals.map((l) => `- ${l}`).join("\n") || "- (none)"}

Success criteria (numbered):
${successCriteria.map((s, i) => `${i + 1}. ${s}`).join("\n") || "1. (none)"}

Cognitive verbs:
${cognitiveVerbs.join(", ") || "(none)"}

Vocabulary:
${vocabulary.join(", ") || "(none)"}

Activity label: ${label}
Resource link present: ${resourceLink ? "yes" : "no"}
Tech-heavy: ${techHeavy ? "yes" : "no"}

Return JSON only.
`.trim();

    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-nano",
      instructions,
      input,
      max_output_tokens: 400,
      store: false,
      text: { format: { type: "json_object" } },
    });

    const raw = extractText(response) || "{}";
    const parsed = safeJsonParse(raw);

    if (!parsed?.teacherDraft) {
      return NextResponse.json(
        { ok: false, error: "Bad JSON shape from model.", raw: String(raw).slice(0, 500) },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      activityTitle: String(parsed.activityTitle ?? "").trim(),
      teacherDraft: String(parsed.teacherDraft ?? "").trim(),
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || "AI failed" }, { status: 500 });
  }
}

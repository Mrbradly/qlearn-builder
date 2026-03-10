import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeJsonParse(raw: string) {
    const txt = (raw || "").trim();
    try { return JSON.parse(txt); } catch { return null; }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const strategy = (body?.strategy || "").trim();
        if (!strategy) {
            return NextResponse.json({ ok: false, error: "Missing strategy." }, { status: 400 });
        }

        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json({ ok: false, error: "Missing OPENAI_API_KEY." }, { status: 500 });
        }

        const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        const lg: string[] = body?.learningGoals || [];
        const sc: string[] = body?.successCriteria || [];

        const activity = body?.activity || {};
        const instructions = [
            "You generate one NASoT-aligned add-on step for a classroom activity.",
            "Australian spelling. Present tense. No student names.",
            "Keep it teacher-safe and practical. No subject preloading.",
            "Align explicitly to the learning goals and success criteria.",
            "Return valid JSON only.",
        ].join("\n");

        const input = `
NASoT strategy: ${strategy}

Lesson title: ${body?.lessonTitle || "Untitled"}

Learning goals:
${lg.map((l) => `- ${l}`).join("\n")}

Success criteria:
${sc.map((s) => `- ${s}`).join("\n")}

Activity label: ${activity.label}
Activity title: ${activity.title}
Teacher draft:
${activity.studentTask}

Return JSON with keys:
{
  "content": string
}
The content is a short add-on step (2�6 lines), written so it can be pasted under the activity.
`.trim();

        const response = await client.responses.create({
            model: process.env.OPENAI_MODEL || "gpt-5-nano",
            instructions,
            input,
            max_output_tokens: 350,
            store: false,
            text: { format: { type: "json_object" } },
        });

        const raw = (response as any).output_text || "{}";
        const parsed = safeJsonParse(raw);

        if (!parsed?.content) {
            return NextResponse.json({ ok: false, error: "Bad JSON shape from model." }, { status: 500 });
        }

        return NextResponse.json({ ok: true, ...parsed });
    } catch (err: any) {
        return NextResponse.json({ ok: false, error: err?.message || "AI failed" }, { status: 500 });
    }
}

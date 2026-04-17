import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function asString(value: unknown): string {
    return String(value ?? "").trim();
}

function asArray(value: unknown): string[] {
    return Array.isArray(value)
        ? value.map((item) => String(item ?? "").trim()).filter(Boolean)
        : [];
}

function safeJsonParse(raw: string) {
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

function extractText(response: any): string {
    if (typeof response?.output_text === "string" && response.output_text.trim()) {
        return response.output_text;
    }

    const output = response?.output;
    if (!Array.isArray(output)) return "";

    for (const item of output) {
        const content = item?.content;
        if (!Array.isArray(content)) continue;

        for (const part of content) {
            if (typeof part?.text === "string" && part.text.trim()) return part.text;
            if (typeof part?.output_text === "string" && part.output_text.trim()) return part.output_text;
            if (typeof part?.text?.value === "string" && part.text.value.trim()) return part.text.value;
        }
    }

    return "";
}

async function createJsonResponse(opts: {
    client: OpenAI;
    model: string;
    instructions: string;
    input: string;
    max_output_tokens?: number;
}) {
    const response = await opts.client.responses.create({
        model: opts.model,
        instructions: opts.instructions,
        input: opts.input,
        max_output_tokens: opts.max_output_tokens ?? 1200,
        store: false,
        text: {
            format: { type: "json_object" },
        },
    });

    const raw = extractText(response) || "{}";
    const parsed = safeJsonParse(raw);

    return { raw, parsed };
}

function summariseDevice(device: any, deviceProfile: any) {
    const lines: string[] = [];

    const make = asString(device?.make);
    const model = asString(device?.model);
    const year = asString(device?.year);
    const os = asString(device?.os);
    const notes = asString(device?.notes);

    if (make || model) lines.push(`Device: ${[make, model].filter(Boolean).join(" ")}`);
    if (year) lines.push(`Approximate year: ${year}`);
    if (os) lines.push(`Operating system: ${os}`);
    if (notes) lines.push(`Extra device notes: ${notes}`);

    if (deviceProfile) {
        const ageBand = asString(deviceProfile?.estimatedAgeBand);
        const confidence = asString(deviceProfile?.confidence);
        const cpuTier = asString(deviceProfile?.roughSpecs?.cpuTier);
        const ramEstimate = asString(deviceProfile?.roughSpecs?.ramEstimate);
        const storageEstimate = asString(deviceProfile?.roughSpecs?.storageEstimate);
        const profileNotes = asArray(deviceProfile?.notes);

        if (ageBand) lines.push(`Estimated age band: ${ageBand}`);
        if (confidence) lines.push(`Device profile confidence: ${confidence}`);
        if (cpuTier || ramEstimate || storageEstimate) {
            lines.push(`Rough profile: ${[cpuTier, ramEstimate, storageEstimate].filter(Boolean).join(", ")}`);
        }
        if (profileNotes.length) {
            lines.push(...profileNotes.map((note) => `Profile note: ${note}`));
        }
    }

    return lines.join("\n") || "No device details provided.";
}

function summariseTriageAnswers(issueCategory: string, triageAnswers: Record<string, any>) {
    const lines: string[] = [];

    if (issueCategory === "power") {
        if (triageAnswers.powerStatus) lines.push(`Power button result: ${triageAnswers.powerStatus}`);
        if (triageAnswers.chargerConnected) lines.push(`Charger connected: ${triageAnswers.chargerConnected}`);
        if (triageAnswers.chargingLight) lines.push(`Charging light visible: ${triageAnswers.chargingLight}`);
        if (triageAnswers.triedLongPress) lines.push(`Tried 10 second power hold: ${triageAnswers.triedLongPress}`);
    }

    if (issueCategory === "eqnet") {
        if (triageAnswers.wifiDetected) lines.push(`Wi-Fi turned on: ${triageAnswers.wifiDetected}`);
        if (triageAnswers.eqnetVisible) lines.push(`EQNet visible: ${triageAnswers.eqnetVisible}`);
        if (triageAnswers.eqnetConnects) lines.push(`EQNet connection result: ${triageAnswers.eqnetConnects}`);
        if (triageAnswers.internetWorks) lines.push(`Internet works after connection: ${triageAnswers.internetWorks}`);
        if (triageAnswers.othersAffected) lines.push(`Other students affected nearby: ${triageAnswers.othersAffected}`);
    }

    if (issueCategory === "byox") {
        if (triageAnswers.byoxInstalled) lines.push(`BYOx installed: ${triageAnswers.byoxInstalled}`);
        if (triageAnswers.softwareIssueType) lines.push(`Closest software issue: ${triageAnswers.softwareIssueType}`);
        if (triageAnswers.restartedDevice) lines.push(`Restarted already: ${triageAnswers.restartedDevice}`);
        if (triageAnswers.errorMessage) lines.push(`Error or extra detail: ${triageAnswers.errorMessage}`);
    }

    if (issueCategory === "general") {
        if (triageAnswers.generalProblem) lines.push(`Problem: ${triageAnswers.generalProblem}`);
        if (triageAnswers.tryingToDo) lines.push(`Trying to do: ${triageAnswers.tryingToDo}`);
        if (triageAnswers.whatHappenedInstead) lines.push(`What happened instead: ${triageAnswers.whatHappenedInstead}`);
        if (triageAnswers.urgency) lines.push(`Urgency: ${triageAnswers.urgency}`);
    }

    return lines.join("\n") || "No structured triage answers provided.";
}

function buildSchoolContext(device: any, issueCategory: string) {
    const os = asString(device?.os).toLowerCase();

    return [
        "Important school context:",
        "- Use Australian spelling.",
        "- Use student-safe language.",
        "- Do not suggest unsafe, admin-only, or invasive steps.",
        "- Do not suggest BIOS, registry, command line, or hardware disassembly.",
        "- For EQNet, BYOx, school software installs, or school downloads, common blockers include third-party antivirus such as McAfee, pending Windows updates, pending optional updates, and active VPNs.",
        "- Do not suggest disabling Microsoft Defender unless there is a very strong reason.",
        "- On Windows devices, guidance may include Installed apps, Settings, Windows Update, Optional updates, Microsoft Store, and Company Portal.",
        "- On Mac devices, guidance may include portal.manage.microsoft.com and Company Portal installer steps.",
        os.includes("mac")
            ? "- This device appears to be a Mac, so prefer Mac-safe guidance where relevant."
            : "- This device may be Windows-based, so Windows navigation language is appropriate where relevant.",
        issueCategory === "eqnet" || issueCategory === "byox"
            ? "- For this issue, check antivirus, updates, optional updates, and VPNs early when relevant."
            : "- Use blocker checks only when they actually fit the issue.",
    ].join("\n");
}

function fallbackHowToDoThis(title: string, instruction: string, device: any, issueCategory: string) {
    const lowerTitle = title.toLowerCase();
    const lowerInstruction = instruction.toLowerCase();
    const os = asString(device?.os).toLowerCase();

    if (lowerTitle.includes("antivirus") || lowerInstruction.includes("antivirus") || lowerInstruction.includes("mcafee")) {
        return "Open the Start menu and type Installed apps. Open that page, find McAfee or another third-party antivirus, select it, and choose Uninstall or turn it off if that is the safe option available. Then restart the laptop if asked.";
    }

    if (lowerTitle.includes("windows update") || lowerInstruction.includes("windows update") || lowerInstruction.includes("check for updates")) {
        return "Open Settings, choose Windows Update, and press Check for updates. Install everything available and restart if Windows asks you to.";
    }

    if (lowerTitle.includes("optional updates") || lowerInstruction.includes("optional updates")) {
        return "Open Settings, go to Windows Update, then look for Advanced options or Optional updates. Install any optional driver updates that are available, then restart the device.";
    }

    if (lowerTitle.includes("vpn") || lowerInstruction.includes("vpn")) {
        return "Look near the clock for a VPN icon, or open the VPN app if one is installed. Disconnect the VPN fully before trying the school task again.";
    }

    if (lowerTitle.includes("company portal") || lowerInstruction.includes("company portal") || lowerInstruction.includes("byox")) {
        return os.includes("mac")
            ? "On a Mac, open a browser and go to portal.manage.microsoft.com. Sign in with your school account, download Company Portal, open the installer, and follow the prompts."
            : "On Windows, open Microsoft Store, search for Company Portal, install it, then open it and sign in with your school account.";
    }

    if (lowerTitle.includes("restart") || lowerInstruction.includes("restart")) {
        return "Save your work, open the Start menu, choose Power, then choose Restart. After the laptop turns back on, try the task again.";
    }

    if (lowerTitle.includes("charger") || lowerInstruction.includes("charger") || lowerInstruction.includes("power outlet")) {
        return "Unplug the charger from both the wall and the laptop, wait a few seconds, then plug it back in firmly. If needed, try a different power outlet that you know is working.";
    }

    if (lowerTitle.includes("charging light") || lowerInstruction.includes("charging light")) {
        return "Look near the charging port or power button for a small light. Plug the charger in and watch for any light turning on, blinking, or changing colour.";
    }

    if (issueCategory === "power") {
        return "Try this step carefully, then look for any sign of power, such as a charging light, fan noise, or screen activity.";
    }

    return instruction || "Work through this step carefully, then try the school task again.";
}

function fallbackCommonProblem(title: string, instruction: string, issueCategory: string) {
    const lowerTitle = title.toLowerCase();
    const lowerInstruction = instruction.toLowerCase();

    if (lowerTitle.includes("antivirus") || lowerInstruction.includes("antivirus") || lowerInstruction.includes("mcafee")) {
        return "If you cannot find it, look for names like McAfee, Norton, AVG, or Avast in the Installed apps list.";
    }

    if (lowerTitle.includes("windows update") || lowerInstruction.includes("windows update")) {
        return "Sometimes updates keep appearing after a restart, so let them finish fully before trying the school task again.";
    }

    if (lowerTitle.includes("optional updates") || lowerInstruction.includes("optional updates")) {
        return "Students sometimes stop after normal updates and miss Optional updates, but school setup can still fail until those are finished.";
    }

    if (lowerTitle.includes("vpn") || lowerInstruction.includes("vpn")) {
        return "A VPN may still be active in the background even after you close the app, so check near the clock as well.";
    }

    if (lowerTitle.includes("company portal") || lowerInstruction.includes("company portal") || lowerInstruction.includes("byox")) {
        return "Make sure you sign in with your school account, not a personal Microsoft account.";
    }

    if (lowerTitle.includes("restart") || lowerInstruction.includes("restart")) {
        return "Choose Restart, not Shut down, because Restart is better at clearing temporary issues.";
    }

    if (issueCategory === "power") {
        return "If nothing changes after this step, the problem may be with the charger, battery, or laptop hardware.";
    }

    return "If what you see on screen does not match this step, stop and ask staff for help.";
}

function normaliseFixSteps(rawSteps: any[], device: any, issueCategory: string) {
    return rawSteps
        .map((step: any, index: number) => {
            const title = asString(step?.title || `Step ${index + 1}`);
            const instruction = asString(step?.instruction);
            const whyThisHelps = asString(step?.whyThisHelps);
            const howToDoThis = asString(step?.howToDoThis) || fallbackHowToDoThis(title, instruction, device, issueCategory);
            const commonProblem = asString(step?.commonProblem) || fallbackCommonProblem(title, instruction, issueCategory);

            return {
                stepNumber: Number(step?.stepNumber || index + 1),
                title,
                instruction,
                whyThisHelps,
                howToDoThis,
                commonProblem,
            };
        })
        .filter((step) => step.title && step.instruction)
        .slice(0, 6);
}

async function runHelpdeskTriage(opts: {
    client: OpenAI;
    model: string;
    body: any;
}) {
    const student = opts.body?.student ?? {};
    const device = opts.body?.device ?? {};
    const deviceProfile = opts.body?.deviceProfile ?? null;
    const issueCategory = asString(opts.body?.issueCategory);
    const triageAnswers = (opts.body?.triageAnswers ?? {}) as Record<string, any>;

    const instructions = `
You output valid JSON only.

You are a school IT triage assistant for students.

Your job:
- read the structured issue information
- identify the most likely issue
- explain it in student-friendly language
- suggest short practical next steps
- decide whether escalation is recommended
- provide a short staff-facing summary

Rules:
- Australian spelling
- Present tense
- Student-safe tone
- No blame
- No dangerous or advanced technician steps
- Do not invent confirmed facts about device hardware
- Keep recommendedNextSteps short, concrete, and practical
- Use 3 to 5 next steps
- Escalate when the issue sounds likely to need staff, admin, repair, or account support

Return JSON only with EXACT keys:
{
  "likelyIssue": string,
  "confidence": "low" | "medium" | "high",
  "studentSummary": string,
  "recommendedNextSteps": string[],
  "escalationRecommended": boolean,
  "staffSummary": string
}
`.trim();

    const input = `
Student:
- MSID: ${asString(student?.msid) || "unknown"}
- Year level: ${asString(student?.yearLevel) || "unknown"}
- Device ownership: ${asString(student?.deviceOwnership) || "unknown"}

Issue category:
${issueCategory || "unknown"}

Device details:
${summariseDevice(device, deviceProfile)}

Structured triage answers:
${summariseTriageAnswers(issueCategory, triageAnswers)}

${buildSchoolContext(device, issueCategory)}

Return JSON only.
`.trim();

    const { raw, parsed } = await createJsonResponse({
        client: opts.client,
        model: opts.model,
        instructions,
        input,
        max_output_tokens: 900,
    });

    if (!parsed) {
        return NextResponse.json(
            { ok: false, error: "Model returned non-json text.", raw: String(raw).slice(0, 400) },
            { status: 502 }
        );
    }

    const confidence = asString(parsed?.confidence || "medium").toLowerCase();
    const normalisedConfidence = confidence === "low" || confidence === "high" ? confidence : "medium";

    return NextResponse.json({
        ok: true,
        likelyIssue: asString(parsed?.likelyIssue),
        confidence: normalisedConfidence,
        studentSummary: asString(parsed?.studentSummary),
        recommendedNextSteps: asArray(parsed?.recommendedNextSteps).slice(0, 5),
        escalationRecommended: Boolean(parsed?.escalationRecommended),
        staffSummary: asString(parsed?.staffSummary),
    });
}

async function runHelpdeskFixSteps(opts: {
    client: OpenAI;
    model: string;
    body: any;
}) {
    const student = opts.body?.student ?? {};
    const device = opts.body?.device ?? {};
    const issueCategory = asString(opts.body?.issueCategory);
    const aiSummary = opts.body?.aiSummary ?? {};
    const likelyIssue = asString(aiSummary?.likelyIssue);
    const studentSummary = asString(aiSummary?.studentSummary);
    const recommendedNextSteps = asArray(aiSummary?.recommendedNextSteps);

    const instructions = `
You output valid JSON only.

You are a school IT help assistant for students.

Your job:
Turn the issue summary into clear step-by-step troubleshooting instructions.

Rules:
- Australian spelling
- Present tense
- Student-friendly wording
- Short, concrete steps
- No dangerous, invasive, or admin-only actions
- No BIOS, registry, command line, or hardware disassembly steps
- Explain each step simply
- Return 3 to 6 steps
- Each step must be something a student can actually try
- Every step must include:
  - stepNumber
  - title
  - instruction
  - whyThisHelps
  - howToDoThis
  - commonProblem

Return JSON only with EXACT keys:
{
  "fixSteps": [
    {
      "stepNumber": number,
      "title": string,
      "instruction": string,
      "whyThisHelps": string,
      "howToDoThis": string,
      "commonProblem": string
    }
  ]
}
`.trim();

    const input = `
Student:
- MSID: ${asString(student?.msid) || "unknown"}
- Year level: ${asString(student?.yearLevel) || "unknown"}
- Device ownership: ${asString(student?.deviceOwnership) || "unknown"}

Issue category:
${issueCategory || "unknown"}

Device:
${summariseDevice(device, null)}

Likely issue:
${likelyIssue || "unknown"}

Student summary:
${studentSummary || "none"}

Recommended next steps:
${recommendedNextSteps.map((s) => `- ${s}`).join("\n") || "- none"}

${buildSchoolContext(device, issueCategory)}

Return JSON only.
`.trim();

    const { raw, parsed } = await createJsonResponse({
        client: opts.client,
        model: opts.model,
        instructions,
        input,
        max_output_tokens: 1600,
    });

    if (!parsed) {
        return NextResponse.json(
            { ok: false, error: "Model returned non-json text.", raw: String(raw).slice(0, 400) },
            { status: 502 }
        );
    }

    let fixSteps = Array.isArray(parsed?.fixSteps)
        ? normaliseFixSteps(parsed.fixSteps, device, issueCategory)
        : [];

    if (fixSteps.length === 0) {
        fixSteps = normaliseFixSteps(
            [
                {
                    stepNumber: 1,
                    title: "Check the easiest blocker first",
                    instruction: "Start with the simplest check connected to this problem before moving to bigger changes.",
                    whyThisHelps: "This avoids extra steps and often finds the issue quickly.",
                },
                {
                    stepNumber: 2,
                    title: "Restart the device and try again",
                    instruction: "Restart the laptop fully, then retry the school task or connection.",
                    whyThisHelps: "A restart clears temporary issues and can finish background setup tasks.",
                },
                {
                    stepNumber: 3,
                    title: "Ask IT staff for help if needed",
                    instruction: "If the problem still happens after these safe checks, ask IT staff for help.",
                    whyThisHelps: "Some issues need school-side settings, account checks, or repair support.",
                },
            ],
            device,
            issueCategory
        );
    }

    return NextResponse.json({
        ok: true,
        fixSteps,
    });
}

async function runHelpdeskChatHelp(opts: {
    client: OpenAI;
    model: string;
    body: any;
}) {
    const student = opts.body?.student ?? {};
    const device = opts.body?.device ?? {};
    const issueCategory = asString(opts.body?.issueCategory);
    const aiSummary = opts.body?.aiSummary ?? {};
    const currentStep = opts.body?.currentStep ?? {};
    const userMessage = asString(opts.body?.userMessage);

    const stepTitle = asString(currentStep?.title);
    const stepInstruction = asString(currentStep?.instruction);
    const stepWhy = asString(currentStep?.whyThisHelps);
    const stepHow = asString(currentStep?.howToDoThis);
    const stepCommonProblem = asString(currentStep?.commonProblem);
    const os = asString(device?.os).toLowerCase();

    const instructions = `
You output valid JSON only.

You are a floating AI support helper inside a school IT troubleshooting app.

Your job:
- answer the student's question about the CURRENT troubleshooting step only
- stay tightly anchored to the exact step title, instruction, and how-to text provided
- explain the step in plain language
- help the student complete the action safely
- do not drift into a different troubleshooting method unless the student's question clearly asks for it

Very important behaviour rules:
- If the step is physical, answer with physical directions, not screen navigation
- If the step is on-screen, answer with on-screen directions
- Do not invent clicks, menus, settings pages, or icons unless they are genuinely relevant to this exact step
- Do not turn "hold the power button" into "click the Start menu power icon"
- Do not turn "plug in the charger" into "open Power settings"
- Use the provided "How to do this" as the main source of truth
- Use the provided "Common problem" if the student says they are stuck or cannot find something
- If the student asks "what does this look like", describe exactly what they should physically see or what should appear on screen for THIS step
- If the student asks "what do I click first", only answer with clicks if this step is actually an on-screen step
- If the step is not an on-screen step, say exactly what they should touch, hold, plug in, look for, or try

Style rules:
- Australian spelling
- Present tense
- Student-friendly wording
- Short and practical
- Plain text only
- No BIOS, registry, command line, or hardware disassembly
- No admin-only instructions
- No unsafe advice
- Prefer 2 to 5 short sentences
- If useful, start with "First", "Next", "Then"

Return JSON only with EXACT keys:
{
  "reply": string
}
`.trim();

    const input = `
Student:
- MSID: ${asString(student?.msid) || "unknown"}
- Year level: ${asString(student?.yearLevel) || "unknown"}
- Device ownership: ${asString(student?.deviceOwnership) || "unknown"}

Issue category:
${issueCategory || "unknown"}

Device:
${summariseDevice(device, null)}

Likely issue:
${asString(aiSummary?.likelyIssue) || "unknown"}

Device OS:
${os || "unknown"}

Current troubleshooting step:
- Title: ${stepTitle || "unknown"}
- Instruction: ${stepInstruction || "unknown"}
- Why this helps: ${stepWhy || "unknown"}
- How to do this: ${stepHow || "unknown"}
- Common problem: ${stepCommonProblem || "unknown"}

Priority grounding:
1. Follow the exact current step
2. Reuse the "How to do this" guidance where possible
3. Only mention Windows or Mac clicks if the step is actually on-screen
4. If the step is physical, keep the answer physical

${buildSchoolContext(device, issueCategory)}

Student question:
${userMessage || "Please explain this step."}

Return JSON only.
`.trim();

    const { raw, parsed } = await createJsonResponse({
        client: opts.client,
        model: opts.model,
        instructions,
        input,
        max_output_tokens: 500,
    });

    if (!parsed) {
        return NextResponse.json(
            { ok: false, error: "Model returned non-json text.", raw: String(raw).slice(0, 400) },
            { status: 502 }
        );
    }

    return NextResponse.json({
        ok: true,
        reply: asString(parsed?.reply),
    });
}

export async function POST(req: Request) {
    try {
        const body = await req.json().catch(() => null);

        if (!body) {
            return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
        }

        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json({ ok: false, error: "Missing OPENAI_API_KEY." }, { status: 500 });
        }

        const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const modelName = process.env.OPENAI_MODEL || "gpt-4.1-nano";
        const mode = asString(body?.mode);

        if (mode === "triage") {
            return await runHelpdeskTriage({ client, model: modelName, body });
        }

        if (mode === "fix_steps") {
            return await runHelpdeskFixSteps({ client, model: modelName, body });
        }

        if (mode === "chat_help") {
            return await runHelpdeskChatHelp({ client, model: modelName, body });
        }

        return NextResponse.json(
            {
                ok: false,
                error: "Unsupported mode. Use triage, fix_steps, or chat_help.",
            },
            { status: 400 }
        );
    } catch (error: any) {
        return NextResponse.json(
            {
                ok: false,
                error: error?.message || "Something went wrong in the AI route.",
            },
            { status: 500 }
        );
    }
}
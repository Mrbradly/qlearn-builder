export type ActivityDraft = {
    label: string;
    studentTask: string;
    resourceLink: string;
    techHeavy: boolean;
};

const VERB_BANK: [string, string][] = [
    ["identify", "find and name the key parts"],
    ["describe", "say what you notice using clear details"],
    ["explain", "show why or how something happens"],
    ["compare", "show what is similar and different"],
    ["justify", "give a reason that supports your choice"],
    ["evaluate", "judge quality using criteria"],
    ["design", "plan a solution that meets requirements"],
];

const VOCAB_BANK: Record<string, string> = {
    data: "information collected for a purpose",
    system: "parts that work together to achieve a goal",
    criteria: "the rules that define success",
    evidence: "proof you can point to",
    algorithm: "a step-by-step method",
    database: "a structured place to store data",
    table: "rows and columns that store data",
    field: "a single piece of data in a table",
    record: "a full row of data in a table",
    "primary key": "a unique identifier for a record",
    "foreign key": "a link to a record in another table",
    normalisation: "organising tables to reduce repetition and errors",
    integrity: "keeping data accurate and consistent",
    privacy: "keeping personal information protected",
};

function extractKeywords(text: string) {
    return (text || "")
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .map((w) => w.trim())
        .filter(Boolean);
}

export function autoCognitiveVerbs(lg: string[], sc: string[]): string[] {
    const combined = `${(lg || []).join(" ")} ${(sc || []).join(" ")}`.toLowerCase();

    const picks: [string, string][] = [];
    if (combined.includes("explain")) picks.push(["explain", "show why or how something happens"]);
    if (combined.includes("compare")) picks.push(["compare", "show what is similar and different"]);
    if (combined.includes("evaluate")) picks.push(["evaluate", "judge quality using criteria"]);
    if (combined.includes("design") || combined.includes("create")) picks.push(["design", "plan a solution that meets requirements"]);

    for (const v of VERB_BANK) {
        if (!picks.find((p) => p[0] === v[0])) picks.push(v);
        if (picks.length >= 5) break;
    }

    return picks.slice(0, 5).map(([verb, meaning]) => `${cap(verb)} – ${meaning}.`);
}

export function autoVocabulary(lg: string[], sc: string[], activities: ActivityDraft[]): string[] {
    const combined =
        `${(lg || []).join(" ")} ${(sc || []).join(" ")} ${(activities || []).map((a) => a.studentTask).join(" ")}`.toLowerCase();

    const words = extractKeywords(combined);

    const picks: string[] = [];

    if (combined.includes("primary key")) picks.push("primary key");
    if (combined.includes("foreign key")) picks.push("foreign key");

    for (const w of words) {
        if (VOCAB_BANK[w] && !picks.includes(w)) picks.push(w);
        if (picks.length >= 6) break;
    }

    const fallback = ["system", "criteria", "evidence", "data"];
    for (const w of fallback) {
        if (!picks.includes(w)) picks.push(w);
        if (picks.length >= 6) break;
    }

    return picks.slice(0, 6).map((term) => `${cap(term)} – ${VOCAB_BANK[term] ?? "a key term used in this lesson"}.`);
}

function cap(s: string) {
    return (s || "")
        .split(" ")
        .map((x) => x.charAt(0).toUpperCase() + x.slice(1))
        .join(" ");
}

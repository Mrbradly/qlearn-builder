// lib/qlearnBuild.ts
// MSHS QLearn Builder template output
// Key behaviour:
// - If studentTask contains HTML, keep it as-is (do not escape).
// - If studentTask is plain text, escape it and preserve line breaks.
// - Use the MSHS "good template" table layout (title, LG, SC, self-check, verbs+vocab, warm-up green, activities).
// - Add icon to activity heading when teacher uses a token like [thinking], [books], etc.
// - If no icon token is used, each activity still gets a default icon based on its label.
// - Always append the swirl footer image at the end.

type ActivityLabel = "Activity 1" | "Activity 2" | "Activity 3" | "Activity 4" | "Exit Activity";

export type QLearnDraft = {
    lessonTitle: string;
    teacherContext?: string;
    learningGoals: string[];
    successCriteria: string[];
    cognitiveVerbs?: string[];
    vocabulary?: string[];
    warmupStory?: string;
    activities: Array<{
        label: ActivityLabel;
        title: string;
        studentTask: string;
        resourceLink?: string;
        techHeavy?: boolean;
        nasotStrategies?: string[];
    }>;
};

/* ---------------- constants ---------------- */

const COLOUR_DARK = "#364152";
const COLOUR_GREY = "#c7cfdb";
const COLOUR_WARM = "#7fbf7f";
const BORDER_GREY = "#888B8A";

// Footer swirl (always appended)
const SWIRL_FOOTER_HTML = `
<p>&nbsp;</p>
<p>
  <img
    src="https://qed09.instructure.com/courses/30550/files/12542200/preview"
    alt="MSHS - Swirls-1.png"
    data-api-endpoint="https://qed09.instructure.com/api/v1/courses/30550/files/12542200"
    data-api-returntype="File"
  />
</p>
<p>&nbsp;</p>
`.trim();

// Icon image HTML
const ICONS = {
    thinking: `<img src="https://qed09.instructure.com/courses/30550/files/12542228/preview" alt="thinking.jpg" width="47" height="47" data-api-endpoint="https://qed09.instructure.com/api/v1/courses/30550/files/12542228" data-api-returntype="File" />`,
    books: `<img src="https://qed09.instructure.com/courses/30550/files/12542230/preview" alt="pile of books.jpg" width="41" height="41" data-api-endpoint="https://qed09.instructure.com/api/v1/courses/30550/files/12542230" data-api-returntype="File" />`,
    presentation: `<img src="https://qed09.instructure.com/courses/30550/files/12542227/preview" alt="group presentation.jpg" width="49" height="49" data-api-endpoint="https://qed09.instructure.com/api/v1/courses/30550/files/12542227" data-api-returntype="File" />`,
    pencil: `<img src="https://qed09.instructure.com/courses/30550/files/12542221/preview" alt="pencil.jpg" width="40" height="40" data-api-endpoint="https://qed09.instructure.com/api/v1/courses/30550/files/12542221" data-api-returntype="File" />`,
    computer: `<img src="https://qed09.instructure.com/courses/30550/files/12542197/preview" alt="computer world wide web.jpg" width="47" height="47" data-api-endpoint="https://qed09.instructure.com/api/v1/courses/30550/files/12542197" data-api-returntype="File" />`,
    target: `<img src="https://qed09.instructure.com/courses/30550/files/12542220/preview" alt="target.jpg" width="42" height="42" data-api-endpoint="https://qed09.instructure.com/api/v1/courses/30550/files/12542220" data-api-returntype="File" />`,
} as const;

type IconKey = keyof typeof ICONS;

// Tokens teachers can type in titles
const ICON_TOKENS: Array<{ token: string; key: IconKey }> = [
    { token: "[thinking]", key: "thinking" },
    { token: "[books]", key: "books" },
    { token: "[presentation]", key: "presentation" },
    { token: "[pencil]", key: "pencil" },
    { token: "[computer]", key: "computer" },
    { token: "[target]", key: "target" },
];

/* ---------------- helpers ---------------- */

function escapeHtml(s: string) {
    return (s || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");
}

function looksLikeHtml(s: string) {
    const t = (s || "").trim();
    return t.startsWith("<") && /<\/?[a-zA-Z][^>]*>/.test(t);
}

function textToHtml(text: string) {
    const clean = (text || "").trim();
    if (!clean) return "";
    return `<div style="white-space:pre-wrap; line-height:1.35;">${escapeHtml(clean)}</div>`;
}

function tableHeader(title: string) {
    return `
<table style="border-collapse: collapse; width: 98.6%; background-color: ${COLOUR_DARK};" border="1">
  <tbody>
    <tr>
      <td style="padding: 6px 10px; color: #ffffff;"><strong>${escapeHtml(title)}</strong></td>
    </tr>
  </tbody>
</table>
`.trim();
}

function tableBodyGrey(innerHtml: string) {
    return `
<table style="border-collapse: collapse; width: 98.6%; background-color: ${COLOUR_GREY};" border="1">
  <tbody>
    <tr>
      <td style="padding: 10px;">${innerHtml}</td>
    </tr>
  </tbody>
</table>
`.trim();
}

function tableBodyWhite(innerHtml: string) {
    return `
<table style="border-collapse: collapse; width: 98.6%; background-color: #ffffff;" border="1">
  <tbody>
    <tr>
      <td style="padding: 10px; border: 1px solid ${BORDER_GREY};">${innerHtml}</td>
    </tr>
  </tbody>
</table>
`.trim();
}

function lessonTitleBar(title: string) {
    return `
<table style="border-collapse: collapse; width: 98.6%; background-color: ${COLOUR_DARK}; border-style: hidden;" border="1">
  <tbody>
    <tr>
      <td style="width: 100%; padding: 8px 10px;">
        <span style="font-size: 18pt; color: #ecf0f1;"><strong>${escapeHtml(title)}</strong></span>
      </td>
    </tr>
  </tbody>
</table>
`.trim();
}

function warmupGreenBlock(title: string, story: string) {
    const storyHtml = `<div style="white-space:pre-wrap; line-height:1.35; margin-top: 6px;">${escapeHtml(story)}</div>`;
    return `
<table style="border-collapse: collapse; width: 98.6%; background-color: ${COLOUR_WARM}; border-style: hidden;" border="1">
  <tbody>
    <tr>
      <td style="padding: 10px;">
        <p style="margin-top: 0;"><strong>${escapeHtml(title)}</strong></p>
        ${storyHtml}
      </td>
    </tr>
  </tbody>
</table>
`.trim();
}

function listAsParagraphs(items: string[]) {
    const clean = (items || []).map((x) => String(x || "").trim()).filter(Boolean);
    if (!clean.length) return "";
    return clean.map((x) => `<p style="margin: 0 0 6px 0;">${escapeHtml(x)}</p>`).join("");
}

function splitDashDefinition(s: string) {
    const raw = String(s || "").trim();
    const m = raw.split(/\s[–-]\s/);
    if (m.length >= 2) {
        const term = m[0].trim();
        const def = m.slice(1).join(" - ").trim();
        return { term, def };
    }
    return { term: raw, def: "" };
}

function verbsAndVocabTable(verbs: string[], vocab: string[]) {
    const vClean = (verbs || []).map((x) => String(x || "").trim()).filter(Boolean);
    const wClean = (vocab || []).map((x) => String(x || "").trim()).filter(Boolean);

    if (!vClean.length && !wClean.length) return "";

    const verbLis = vClean
        .map((x) => {
            const { term, def } = splitDashDefinition(x);
            return def
                ? `<li><em>${escapeHtml(term)}</em> &ndash; ${escapeHtml(def)}</li>`
                : `<li><em>${escapeHtml(term)}</em></li>`;
        })
        .join("");

    const vocabLis = wClean
        .map((x) => {
            const { term, def } = splitDashDefinition(x);
            return def
                ? `<li><strong>${escapeHtml(term)}</strong> &ndash; ${escapeHtml(def)}</li>`
                : `<li><strong>${escapeHtml(term)}</strong></li>`;
        })
        .join("");

    return `
${tableHeader("Key cognitive verbs and vocabulary")}
<table style="border-collapse: collapse; width: 98.6%; background-color: ${COLOUR_GREY};" border="1">
  <tbody>
    <tr>
      <td style="width: 50%; padding: 10px; vertical-align: top;">
        <ul style="margin-top: 0; margin-bottom: 0;">${verbLis || "<li>&nbsp;</li>"}</ul>
      </td>
      <td style="width: 50%; padding: 10px; vertical-align: top;">
        <ul style="margin-top: 0; margin-bottom: 0;">${vocabLis || "<li>&nbsp;</li>"}</ul>
      </td>
    </tr>
  </tbody>
</table>
`.trim();
}

function selfCheckBlock() {
    return `
${tableHeader("Self Check")}
${tableBodyGrey(`
  <p style="margin-top: 0;"><strong>Circle one:</strong> 4 = I can explain this confidently &nbsp; 3 = I mostly understand &nbsp; 2 = I need help &nbsp; 1 = I don&rsquo;t understand yet</p>
  <p style="margin-bottom: 0;"><strong>My focus for today is:</strong> ______________________________</p>
`.trim())}
`.trim();
}

function defaultIconKeyForLabel(label: ActivityLabel): IconKey {
    switch (label) {
        case "Activity 1":
            return "thinking";
        case "Activity 2":
            return "books";
        case "Activity 3":
            return "presentation";
        case "Activity 4":
            return "computer";
        case "Exit Activity":
            return "target";
        default:
            return "thinking";
    }
}

function detectIconAndCleanTitle(title: string, label: ActivityLabel): { iconHtml: string; cleanTitle: string } {
    const raw = String(title || "").trim();

    if (!raw) {
        return {
            iconHtml: ICONS[defaultIconKeyForLabel(label)],
            cleanTitle: "",
        };
    }

    const lowered = raw.toLowerCase();

    for (const t of ICON_TOKENS) {
        if (lowered.includes(t.token)) {
            const cleaned = raw
                .replace(new RegExp(`\\s*\\${t.token}\\s*`, "ig"), " ")
                .replace(/\s+/g, " ")
                .trim();

            return {
                iconHtml: ICONS[t.key],
                cleanTitle: cleaned,
            };
        }
    }

    return {
        iconHtml: ICONS[defaultIconKeyForLabel(label)],
        cleanTitle: raw,
    };
}

function activityHeadingWithIcon(label: ActivityLabel, title: string) {
    const { iconHtml, cleanTitle } = detectIconAndCleanTitle(title, label);
    const headingText = `${label}: ${cleanTitle || label}`;

    return `
<table style="border-collapse: collapse; width: 98.6%; background-color: ${COLOUR_DARK};" border="1">
  <tbody>
    <tr>
      <td style="width: 6%; padding: 6px 10px; color:#ffffff; vertical-align: middle;">
        ${iconHtml}
      </td>
      <td style="width: 94%; padding: 6px 10px; color:#ffffff; vertical-align: middle;">
        <strong>${escapeHtml(headingText)}</strong>
      </td>
    </tr>
  </tbody>
</table>
`.trim();
}

function activityBlock(a: QLearnDraft["activities"][number]) {
    const heading = activityHeadingWithIcon(a.label, a.title || a.label);

    const body =
        looksLikeHtml(a.studentTask) ? (a.studentTask || "").trim() : textToHtml(a.studentTask);

    const safeResourceLink = (a.resourceLink || "").trim();

    const resource = safeResourceLink
        ? `<p style="margin-top: 10px; margin-bottom: 0;"><strong>Resource:</strong> ${escapeHtml(safeResourceLink)}</p>`
        : "";

    const nasot = (a.nasotStrategies || []).map((x) => String(x || "").trim()).filter(Boolean);
    const nasotLine = nasot.length
        ? `<p style="margin-top: 10px; margin-bottom: 0;"><strong>NASOT focus:</strong> ${escapeHtml(nasot.join(", "))}</p>`
        : "";

    return `
${heading}
${tableBodyWhite(`${body}${resource}${nasotLine}`)}
`.trim();
}

/* ---------------- main builder ---------------- */

export function buildQLearnHtmlFromDraft(draft: QLearnDraft) {
    const parts: string[] = [];

    parts.push(lessonTitleBar(draft.lessonTitle || "Lesson"));

    const lgItems = (draft.learningGoals || []).map((x) => String(x || "").trim()).filter(Boolean);
    if (lgItems.length) {
        parts.push(tableHeader("Learning Goal"), tableBodyGrey(listAsParagraphs(lgItems)));
    }

    const scItems = (draft.successCriteria || []).map((x) => String(x || "").trim()).filter(Boolean);
    if (scItems.length) {
        parts.push(tableHeader("Success Criteria"), tableBodyGrey(listAsParagraphs(scItems)));
    }

    parts.push(selfCheckBlock());

    const vv = verbsAndVocabTable(draft.cognitiveVerbs || [], draft.vocabulary || []);
    if (vv) parts.push(vv);

    const warm = (draft.warmupStory || "").trim();
    if (warm) {
        parts.push(warmupGreenBlock("Warm up (Story)", warm));
    }

    for (const a of draft.activities || []) {
        parts.push(activityBlock(a));
    }

    parts.push(SWIRL_FOOTER_HTML);

    return parts.filter(Boolean).join("\n\n");
}
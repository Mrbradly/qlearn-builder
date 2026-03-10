/* ------------------------------------------------ */
/* Activity Icon System for QLearn Builder */
/* Guarantees every activity always has an icon */
/* ------------------------------------------------ */

export type VisualKey =
    | "think"
    | "read"
    | "discuss"
    | "online"
    | "write"
    | "target";

/* ------------------------------------------------ */
/* ICONS */
/* ------------------------------------------------ */

export const ICONS: Record<VisualKey, string> = {
    think: `<img id="9215570"
        src="https://qed09.instructure.com/courses/136868/files/16580825/preview"
        alt="thinking"
        width="47"
        height="47" />`,

    read: `<img id="9215581"
        src="https://qed09.instructure.com/courses/136868/files/16580832/preview"
        alt="reading books"
        width="41"
        height="41" />`,

    discuss: `<img id="9215561"
        src="https://qed09.instructure.com/courses/136868/files/16580822/preview"
        alt="group discussion"
        width="49"
        height="49" />`,

    online: `<img id="9215555"
        src="https://qed09.instructure.com/courses/136868/files/16580724/preview"
        alt="online activity"
        width="47"
        height="47" />`,

    write: `<img id="9215576"
        src="https://qed09.instructure.com/courses/136868/files/16580754/preview"
        alt="writing task"
        width="40"
        height="40" />`,

    target: `<img id="9215600"
        src="https://qed09.instructure.com/courses/136868/files/16580751/preview"
        alt="learning target"
        width="42"
        height="42" />`,
};

/* ------------------------------------------------ */
/* FOOTER */
/* ------------------------------------------------ */

export const SWIRLS_FOOTER = `<img
src="https://qed09.instructure.com/courses/136868/files/16580767/preview"
alt="MSHS Swirls Footer"
/>`;

/* ------------------------------------------------ */
/* ICON BY ACTIVITY NUMBER */
/* Creates consistent lesson structure */
/* ------------------------------------------------ */

export function iconFromActivityLabel(label: string): VisualKey {
    const l = (label || "").toLowerCase();

    if (l.includes("activity 1")) return "think";
    if (l.includes("activity 2")) return "read";
    if (l.includes("activity 3")) return "discuss";
    if (l.includes("activity 4")) return "write";
    if (l.includes("exit")) return "target";

    return "think"; // fallback
}

/* ------------------------------------------------ */
/* ICON BY TEXT CONTENT */
/* Used if activity label is missing */
/* ------------------------------------------------ */

export function inferIconFromText(text: string): VisualKey {
    const t = (text || "").toLowerCase();

    if (
        t.includes("read") ||
        t.includes("text") ||
        t.includes("passage")
    )
        return "read";

    if (
        t.includes("discuss") ||
        t.includes("pair") ||
        t.includes("group")
    )
        return "discuss";

    if (
        t.includes("online") ||
        t.includes("device") ||
        t.includes("website") ||
        t.includes("corella")
    )
        return "online";

    if (
        t.includes("write") ||
        t.includes("worksheet") ||
        t.includes("book")
    )
        return "write";

    if (
        t.includes("goal") ||
        t.includes("success criteria") ||
        t.includes("exit")
    )
        return "target";

    return "think";
}

/* ------------------------------------------------ */
/* MASTER HELPER */
/* Always returns an icon */
/* ------------------------------------------------ */

export function getActivityIcon(
    label: string,
    text: string
): string {
    let key: VisualKey = iconFromActivityLabel(label);

    if (!key) {
        key = inferIconFromText(text);
    }

    return ICONS[key] || ICONS.think;
}

/* ------------------------------------------------ */
/* INJECT ICON INTO QLEARN HEADER */
/* ------------------------------------------------ */

export function injectIconIntoFirstHeaderStrong(
    html: string,
    icon: string
): string {

    const iconSpan = `
<span style="display:inline-block;vertical-align:middle;margin-right:8px;">
${icon}
</span>`;

    if (!html.includes("<strong>")) return html;

    return html.replace(
        /<strong>(.*?)<\/strong>/i,
        `<strong>${iconSpan}$1</strong>`
    );
}
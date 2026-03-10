import type { VisualKey } from "./icons";

function hasAny(text: string, words: string[]) {
    const t = (text || "").toLowerCase();
    return words.some((w) => t.includes(w));
}

export function pickVisualKey(studentTask: string, resourceLink: string): VisualKey {
    const combined = `${studentTask}\n${resourceLink}`.toLowerCase();

    if (hasAny(combined, ["http", "https", "qlearn", "sharepoint", "forms", "canva", "website", "online"])) {
        return "online";
    }

    if (hasAny(combined, ["discuss", "share", "present", "pair", "group", "turn and talk", "explain to"])) {
        return "discuss";
    }

    if (hasAny(combined, ["write", "jot", "worksheet", "notes", "summarise", "sketch", "draft"])) {
        return "write";
    }

    if (hasAny(combined, ["read", "watch", "review", "resource", "article", "textbook", "slides"])) {
        return "read";
    }

    if (hasAny(combined, ["check", "quiz", "exit", "self check", "success criteria", "hinge"])) {
        return "target";
    }

    return "think";
}

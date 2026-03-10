import { NextResponse } from "next/server";
import { CORELLA_TABLES } from "@/lib/corellaTables";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* --------------------------------------------------
   Types
-------------------------------------------------- */

type Body = {
    tableId: string;
    learningGoal?: string;
    successCriteria?: string;
};

/* --------------------------------------------------
   Safety helpers
-------------------------------------------------- */

function escapeHtml(s: string) {
    return (s || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function injectGoalCriteria(
    html: string,
    learningGoal: string,
    successCriteria: string
) {
    return html
        .replaceAll(
            "{{LEARNING_GOAL}}",
            `<span>${escapeHtml(learningGoal)}</span>`
        )
        .replaceAll(
            "{{SUCCESS_CRITERIA}}",
            `<span>${escapeHtml(successCriteria)}</span>`
        );
}

/* --------------------------------------------------
   POST
-------------------------------------------------- */

export async function POST(req: Request) {
    try {
        const body: Body = await req.json();

        const table = CORELLA_TABLES.find(t => t.id === body.tableId);

        if (!table) {
            return NextResponse.json(
                { error: "Table not found" },
                { status: 404 }
            );
        }

        const learningGoal = body.learningGoal ?? "";
        const successCriteria = body.successCriteria ?? "";

        const finalHtml = injectGoalCriteria(
            table.html,
            learningGoal,
            successCriteria
        );

        return NextResponse.json({
            html: finalHtml,
        });

    } catch (err) {
        console.error(err);
        return NextResponse.json(
            { error: "Failed to build Corella table" },
            { status: 500 }
        );
    }
}

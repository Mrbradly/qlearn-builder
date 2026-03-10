"use client";

import { useState } from "react";

type ActivityCardProps = {
    index: number;
    lessonTitle: string;
    learningGoals: string[];
    successCriteria: string[];
};

export default function ActivityCard({
    index,
    lessonTitle,
    learningGoals,
    successCriteria,
}: ActivityCardProps) {
    const [title, setTitle] = useState("");
    const [shortTask, setShortTask] = useState("");
    const [sharepointLink, setSharepointLink] = useState("");
    const [techHeavy, setTechHeavy] = useState(false);

    const [powerfulQuestions, setPowerfulQuestions] = useState(true);
    const [canvaPrompt, setCanvaPrompt] = useState(false);
    const [notebooklmPrompt, setNotebooklmPrompt] = useState(false);

    const [nasotStrategy, setNasotStrategy] = useState<string | null>(null);
    const [nasotMode, setNasotMode] = useState<"focus" | "addon">("focus");

    const [expandedTask, setExpandedTask] = useState("");
    const [questionsOut, setQuestionsOut] = useState("");
    const [nasotOut, setNasotOut] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function generateWithAI() {
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/ai/enhance", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    lessonTitle,
                    learningGoals,
                    successCriteria,
                    activity: {
                        index,
                        title,
                        shortTask,
                        sharepointLink,
                        techHeavy,
                        toggles: {
                            powerfulQuestions,
                            canvaPrompt,
                            notebooklmPrompt,
                        },
                        nasot: nasotStrategy
                            ? { strategy: nasotStrategy, mode: nasotMode }
                            : undefined,
                    },
                }),
            });

            const data = await res.json();

            if (!data.ok) {
                throw new Error(data.error || "AI failed");
            }

            setExpandedTask(data.studentTask);
            setQuestionsOut(data.powerfulQuestions.join("\n"));
            setNasotOut(data.nasotAddon);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="activityCard">
            <h3>Activity {index + 1}</h3>

            <label>Activity title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} />

            <label>What students do (teacher draft)</label>
            <textarea
                value={shortTask}
                onChange={(e) => setShortTask(e.target.value)}
            />

            <label>Optional SharePoint link</label>
            <input
                value={sharepointLink}
                onChange={(e) => setSharepointLink(e.target.value)}
            />

            <label>
                <input
                    type="checkbox"
                    checked={techHeavy}
                    onChange={(e) => setTechHeavy(e.target.checked)}
                />{" "}
                Tech-heavy
            </label>

            <div className="toggles">
                <label>
                    <input
                        type="checkbox"
                        checked={powerfulQuestions}
                        onChange={(e) => setPowerfulQuestions(e.target.checked)}
                    />
                    Powerful questions
                </label>
                <label>
                    <input
                        type="checkbox"
                        checked={canvaPrompt}
                        onChange={(e) => setCanvaPrompt(e.target.checked)}
                    />
                    Canva prompt
                </label>
                <label>
                    <input
                        type="checkbox"
                        checked={notebooklmPrompt}
                        onChange={(e) => setNotebooklmPrompt(e.target.checked)}
                    />
                    NotebookLM prompt
                </label>
            </div>

            <div className="nasot">
                <strong>NASoT add-on (optional)</strong>
                <select onChange={(e) => setNasotStrategy(e.target.value || null)}>
                    <option value="">None</option>
                    <option value="Processing time (Stop & jot)">
                        Processing time (Stop & jot)
                    </option>
                    <option value="Check for understanding (hinge)">
                        Check for understanding (hinge)
                    </option>
                    <option value="Physical movement">Physical movement</option>
                    <option value="Retrieval practice">Retrieval practice</option>
                </select>

                <select onChange={(e) => setNasotMode(e.target.value as any)}>
                    <option value="focus">Teacher focus</option>
                    <option value="addon">Student add-on</option>
                </select>
            </div>

            <button onClick={generateWithAI} disabled={loading}>
                {loading ? "Generating…" : "Generate this activity with AI"}
            </button>

            {error && <div className="error">{error}</div>}

            <hr />

            <label>Expanded student instructions (preview)</label>
            <textarea value={expandedTask} readOnly />

            <label>Powerful questions (preview)</label>
            <textarea value={questionsOut} readOnly />

            <label>NASoT add-on (preview)</label>
            <textarea value={nasotOut} readOnly />
        </div>
    );
}

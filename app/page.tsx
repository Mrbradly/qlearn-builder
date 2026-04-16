"use client";

import { useMemo, useState } from "react";

type Stage = "landing" | "helpdesk";

type Step =
    | "intake"
    | "device"
    | "issue"
    | "triage"
    | "summary"
    | "fix"
    | "resolution"
    | "complete";

type IssueCategory = "power" | "eqnet" | "byox" | "general" | "";

type ResolutionLevel = "full" | "partial" | "none" | "";

type StudentState = {
    msid: string;
    yearLevel: string;
    deviceOwnership: "BYOx" | "School" | "";
};

type DeviceState = {
    make: string;
    model: string;
    year: string;
    os: string;
    notes: string;
};

type DeviceProfile = {
    normalisedMake?: string;
    normalisedModel?: string;
    estimatedAgeBand?: string;
    likelyWindows11Compatible?: boolean;
    confidence?: "low" | "medium" | "high";
    roughSpecs?: {
        cpuTier?: string;
        ramEstimate?: string;
        storageEstimate?: string;
    };
    notes?: string[];
} | null;

type AISummary = {
    likelyIssue: string;
    confidence: "low" | "medium" | "high";
    studentSummary: string;
    recommendedNextSteps: string[];
    escalationRecommended: boolean;
    staffSummary: string;
} | null;

type FixStep = {
    stepNumber: number;
    title: string;
    instruction: string;
    whyThisHelps?: string;
    done?: boolean;
};

function getStepNumber(step: Step) {
    const order: Step[] = [
        "intake",
        "device",
        "issue",
        "triage",
        "summary",
        "fix",
        "resolution",
        "complete",
    ];
    return order.indexOf(step) + 1;
}

function getProgressPercent(step: Step) {
    const current = getStepNumber(step);
    const total = 8;
    return Math.max(8, Math.round((current / total) * 100));
}

export default function Page() {
    const [stage, setStage] = useState<Stage>("landing");
    const [step, setStep] = useState<Step>("intake");

    const [sessionId, setSessionId] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [student, setStudent] = useState<StudentState>({
        msid: "",
        yearLevel: "",
        deviceOwnership: "",
    });

    const [device, setDevice] = useState<DeviceState>({
        make: "",
        model: "",
        year: "",
        os: "",
        notes: "",
    });

    const [deviceProfile, setDeviceProfile] = useState<DeviceProfile>(null);
    const [issueCategory, setIssueCategory] = useState<IssueCategory>("");

    const [triageAnswers, setTriageAnswers] = useState<Record<string, any>>({
        powerStatus: "",
        chargerConnected: "",
        chargingLight: "",
        triedLongPress: "",
        wifiDetected: "",
        eqnetVisible: "",
        eqnetConnects: "",
        internetWorks: "",
        othersAffected: "",
        byoxInstalled: "",
        softwareIssueType: "",
        restartedDevice: "",
        errorMessage: "",
        generalProblem: "",
        tryingToDo: "",
        whatHappenedInstead: "",
        urgency: "",
    });

    const [aiSummary, setAiSummary] = useState<AISummary>(null);
    const [fixSteps, setFixSteps] = useState<FixStep[]>([]);
    const [resolutionLevel, setResolutionLevel] = useState<ResolutionLevel>("");
    const [extraNotes, setExtraNotes] = useState("");
    const [location, setLocation] = useState("");

    const progressPercent = useMemo(() => getProgressPercent(step), [step]);

    function resetAll() {
        setStage("landing");
        setStep("intake");
        setSessionId("");
        setLoading(false);
        setError("");
        setStudent({
            msid: "",
            yearLevel: "",
            deviceOwnership: "",
        });
        setDevice({
            make: "",
            model: "",
            year: "",
            os: "",
            notes: "",
        });
        setDeviceProfile(null);
        setIssueCategory("");
        setTriageAnswers({
            powerStatus: "",
            chargerConnected: "",
            chargingLight: "",
            triedLongPress: "",
            wifiDetected: "",
            eqnetVisible: "",
            eqnetConnects: "",
            internetWorks: "",
            othersAffected: "",
            byoxInstalled: "",
            softwareIssueType: "",
            restartedDevice: "",
            errorMessage: "",
            generalProblem: "",
            tryingToDo: "",
            whatHappenedInstead: "",
            urgency: "",
        });
        setAiSummary(null);
        setFixSteps([]);
        setResolutionLevel("");
        setExtraNotes("");
        setLocation("");
    }

    function goToHelpdesk() {
        setStage("helpdesk");
        setStep("intake");
        setError("");
    }

    function goBack() {
        setError("");

        if (step === "device") setStep("intake");
        else if (step === "issue") setStep("device");
        else if (step === "triage") setStep("issue");
        else if (step === "summary") setStep("triage");
        else if (step === "fix") setStep("summary");
        else if (step === "resolution") setStep("fix");
        else if (step === "complete") setStep("resolution");
    }

    function updateStudent<K extends keyof StudentState>(key: K, value: StudentState[K]) {
        setStudent((prev) => ({ ...prev, [key]: value }));
    }

    function updateDevice<K extends keyof DeviceState>(key: K, value: DeviceState[K]) {
        setDevice((prev) => ({ ...prev, [key]: value }));
    }

    function updateTriage(key: string, value: any) {
        setTriageAnswers((prev) => ({ ...prev, [key]: value }));
    }

    async function handleStartSession() {
        setError("");

        if (!student.msid.trim()) {
            setError("Enter the student MSID.");
            return;
        }
        if (!student.yearLevel) {
            setError("Choose the year level.");
            return;
        }
        if (!student.deviceOwnership) {
            setError("Choose whether this is a BYOx or school device.");
            return;
        }

        setLoading(true);
        try {
            try {
                const res = await fetch("/api/helpdesk/start-session", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(student),
                });

                const data = await res.json().catch(() => ({}));

                if (res.ok && data?.ok && data?.sessionId) {
                    setSessionId(String(data.sessionId));
                } else {
                    setSessionId(`local-${Date.now()}`);
                }
            } catch {
                setSessionId(`local-${Date.now()}`);
            }

            setStep("device");
        } catch (err: any) {
            setError(err?.message || "Could not start the session.");
        } finally {
            setLoading(false);
        }
    }

    async function handleDeviceNext() {
        setError("");

        if (!device.make.trim() && !device.model.trim() && !device.year.trim() && !device.os.trim()) {
            setStep("issue");
            return;
        }

        setLoading(true);
        try {
            try {
                const res = await fetch("/api/helpdesk/device-profile", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        sessionId,
                        ...device,
                    }),
                });

                const data = await res.json().catch(() => ({}));

                if (res.ok && data?.ok && data?.deviceProfile) {
                    setDeviceProfile(data.deviceProfile);
                } else {
                    setDeviceProfile(null);
                }
            } catch {
                setDeviceProfile(null);
            }

            setStep("issue");
        } catch (err: any) {
            setError(err?.message || "Could not check the laptop details.");
        } finally {
            setLoading(false);
        }
    }

    function handleIssueSelect(category: IssueCategory) {
        setIssueCategory(category);
        setError("");
        setStep("triage");
    }

    function validateTriage() {
        if (!issueCategory) {
            return "Choose an issue type first.";
        }

        if (issueCategory === "power") {
            if (!triageAnswers.powerStatus) return "Choose whether anything happens when the power button is pressed.";
        }

        if (issueCategory === "eqnet") {
            if (!triageAnswers.wifiDetected) return "Choose whether Wi-Fi is turned on.";
            if (!triageAnswers.eqnetVisible) return "Choose whether EQNet is visible.";
        }

        if (issueCategory === "byox") {
            if (!triageAnswers.byoxInstalled) return "Choose whether BYOx is installed.";
            if (!triageAnswers.softwareIssueType) return "Choose the closest issue.";
        }

        if (issueCategory === "general") {
            if (!String(triageAnswers.generalProblem || "").trim()) return "Describe the problem.";
        }

        return "";
    }

    async function handleGenerateSummary() {
        const validationMessage = validateTriage();
        if (validationMessage) {
            setError(validationMessage);
            return;
        }

        setError("");
        setLoading(true);

        try {
            const res = await fetch("/api/ai/enhance", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    mode: "triage",
                    sessionId,
                    student,
                    device,
                    deviceProfile,
                    issueCategory,
                    triageAnswers,
                }),
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok || data?.ok === false) {
                throw new Error(data?.error || `AI route failed (${res.status})`);
            }

            setAiSummary({
                likelyIssue: String(data?.likelyIssue || "").trim(),
                confidence: (data?.confidence || "medium") as "low" | "medium" | "high",
                studentSummary: String(data?.studentSummary || "").trim(),
                recommendedNextSteps: Array.isArray(data?.recommendedNextSteps)
                    ? data.recommendedNextSteps.map(String).filter(Boolean)
                    : [],
                escalationRecommended: Boolean(data?.escalationRecommended),
                staffSummary: String(data?.staffSummary || "").trim(),
            });

            setStep("summary");
        } catch (err: any) {
            setError(err?.message || "Could not generate the IT summary.");
        } finally {
            setLoading(false);
        }
    }

    async function handleGenerateFixSteps() {
        if (!aiSummary) {
            setError("Generate the AI summary first.");
            return;
        }

        setError("");
        setLoading(true);

        try {
            const res = await fetch("/api/ai/enhance", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    mode: "fix_steps",
                    sessionId,
                    student,
                    device,
                    issueCategory,
                    aiSummary,
                }),
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok || data?.ok === false) {
                throw new Error(data?.error || `AI route failed (${res.status})`);
            }

            const nextSteps: FixStep[] = Array.isArray(data?.fixSteps)
                ? data.fixSteps.map((item: any, index: number) => ({
                    stepNumber: Number(item?.stepNumber || index + 1),
                    title: String(item?.title || `Step ${index + 1}`).trim(),
                    instruction: String(item?.instruction || "").trim(),
                    whyThisHelps: String(item?.whyThisHelps || "").trim(),
                    done: false,
                }))
                : [];

            setFixSteps(nextSteps);
            setStep("fix");
        } catch (err: any) {
            setError(err?.message || "Could not generate the fix steps.");
        } finally {
            setLoading(false);
        }
    }

    function markStepDone(stepNumber: number) {
        setFixSteps((prev) =>
            prev.map((item) =>
                item.stepNumber === stepNumber ? { ...item, done: !item.done } : item
            )
        );
    }

    function handleResolution(value: ResolutionLevel) {
        setResolutionLevel(value);
        setStep("complete");
    }

    const completedFixCount = fixSteps.filter((item) => item.done).length;

    if (stage === "landing") {
        return (
            <div className="landingWrap">
                <div className="landing">
                    <img
                        src="/School_Logo.png"
                        alt="Maroochydore State High School logo"
                        className="landingLogo"
                    />

                    <div className="landingTitle">MSHS IT Help Desk</div>
                    <div className="landingTag">
                        Student device support, step by step.
                    </div>

                    <div className="landingCard">
                        <div className="small" style={{ fontSize: 14 }}>
                            Get help with your laptop, EQNet, BYOx, school software, or a general IT issue.
                        </div>

                        <button className="startBtn" onClick={goToHelpdesk}>
                            Start IT Help
                        </button>

                        <div className="previewBox" style={{ textAlign: "left" }}>
                            <div className="previewTitle">This can help with</div>
                            <div className="small">
                                • Laptop not turning on
                                <br />
                                • EQNet or internet not working
                                <br />
                                • BYOx or school software issues
                                <br />
                                • General device problems
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="appShell">
            <div className="topBar">
                <div className="brandMini">
                    <div
                        className="brandMiniLogo"
                        style={{
                            display: "grid",
                            placeItems: "center",
                            fontWeight: 900,
                            color: "var(--brand)",
                        }}
                    >
                        IT
                    </div>
                    <div>
                        <div className="brandMiniTitle">MSHS IT Help Desk</div>
                        <div className="brandMiniSub">
                            Step {getStepNumber(step)} of 8
                        </div>
                    </div>
                </div>

                <button className="btnGhost" onClick={resetAll}>
                    Start again
                </button>
            </div>

            <div className="card" style={{ marginBottom: 14 }}>
                <div className="progressWrap">
                    <div className="progressMeta">
                        <span>Progress</span>
                        <span>{progressPercent}%</span>
                    </div>
                    <div className="progressBar">
                        <div className="progressFill" style={{ width: `${progressPercent}%` }} />
                    </div>
                </div>
            </div>

            {error && <div className="errorBox">{error}</div>}

            {step === "intake" && (
                <div className="card">
                    <div className="sectionTitle">Let’s get your IT help request started</div>
                    <div className="small">
                        Enter your student details first so the session can be tracked properly.
                    </div>

                    <div className="field">
                        <div className="label">Student MSID</div>
                        <input
                            className="input"
                            value={student.msid}
                            onChange={(e) => updateStudent("msid", e.target.value)}
                            placeholder="e.g. 12345678"
                        />
                    </div>

                    <div className="field">
                        <div className="label">Year level</div>
                        <select
                            className="input"
                            value={student.yearLevel}
                            onChange={(e) => updateStudent("yearLevel", e.target.value)}
                        >
                            <option value="">Choose year level</option>
                            <option value="7">Year 7</option>
                            <option value="8">Year 8</option>
                            <option value="9">Year 9</option>
                            <option value="10">Year 10</option>
                            <option value="11">Year 11</option>
                            <option value="12">Year 12</option>
                        </select>
                    </div>

                    <div className="field">
                        <div className="label">Device type</div>
                        <div className="miniRow">
                            <button
                                className={student.deviceOwnership === "BYOx" ? "btnPrimary" : "btnGhost"}
                                onClick={() => updateStudent("deviceOwnership", "BYOx")}
                                type="button"
                            >
                                BYOx device
                            </button>
                            <button
                                className={student.deviceOwnership === "School" ? "btnPrimary" : "btnGhost"}
                                onClick={() => updateStudent("deviceOwnership", "School")}
                                type="button"
                            >
                                School-managed device
                            </button>
                        </div>
                    </div>

                    <div className="actions">
                        <button className="btnGhost" onClick={resetAll}>
                            Back
                        </button>
                        <button className="btnPrimary" onClick={handleStartSession} disabled={loading}>
                            {loading ? "Starting..." : "Continue"}
                        </button>
                    </div>
                </div>
            )}

            {step === "device" && (
                <div className="card">
                    <div className="sectionTitle">Tell us about your laptop</div>
                    <div className="small">
                        Add what you know. If you are not sure, leave it blank and keep going.
                    </div>

                    <div className="miniRow">
                        <div className="field" style={{ marginTop: 0 }}>
                            <div className="label">Make</div>
                            <input
                                className="input"
                                value={device.make}
                                onChange={(e) => updateDevice("make", e.target.value)}
                                placeholder="Lenovo, HP, Dell..."
                            />
                        </div>
                        <div className="field" style={{ marginTop: 0 }}>
                            <div className="label">Model</div>
                            <input
                                className="input"
                                value={device.model}
                                onChange={(e) => updateDevice("model", e.target.value)}
                                placeholder="ThinkPad, ProBook..."
                            />
                        </div>
                    </div>

                    <div className="miniRow">
                        <div className="field" style={{ marginTop: 0 }}>
                            <div className="label">Approximate year</div>
                            <input
                                className="input"
                                value={device.year}
                                onChange={(e) => updateDevice("year", e.target.value)}
                                placeholder="2020"
                            />
                        </div>
                        <div className="field" style={{ marginTop: 0 }}>
                            <div className="label">Operating system</div>
                            <select
                                className="input"
                                value={device.os}
                                onChange={(e) => updateDevice("os", e.target.value)}
                            >
                                <option value="">Choose operating system</option>
                                <option value="Windows 10">Windows 10</option>
                                <option value="Windows 11">Windows 11</option>
                                <option value="macOS">macOS</option>
                                <option value="I am not sure">I’m not sure</option>
                            </select>
                        </div>
                    </div>

                    <div className="field">
                        <div className="label">Anything else you know about the device</div>
                        <textarea
                            className="textarea"
                            value={device.notes}
                            onChange={(e) => updateDevice("notes", e.target.value)}
                            placeholder="Optional notes about the laptop, sticker details, or what you already know."
                        />
                    </div>

                    {deviceProfile && (
                        <div className="previewBox">
                            <div className="previewTitle">Rough laptop guide</div>
                            <div className="small">
                                {deviceProfile.normalisedMake || deviceProfile.normalisedModel ? (
                                    <>
                                        {deviceProfile.normalisedMake || ""}{" "}
                                        {deviceProfile.normalisedModel || ""}
                                        <br />
                                    </>
                                ) : null}
                                {deviceProfile.estimatedAgeBand ? (
                                    <>
                                        Age band: {deviceProfile.estimatedAgeBand}
                                        <br />
                                    </>
                                ) : null}
                                {typeof deviceProfile.likelyWindows11Compatible === "boolean" ? (
                                    <>
                                        Windows 11 compatible:{" "}
                                        {deviceProfile.likelyWindows11Compatible ? "Likely" : "Possibly not"}
                                        <br />
                                    </>
                                ) : null}
                                {deviceProfile.confidence ? (
                                    <>
                                        Confidence: {deviceProfile.confidence}
                                        <br />
                                    </>
                                ) : null}
                                {deviceProfile.notes?.length
                                    ? deviceProfile.notes.map((note, i) => (
                                        <span key={i}>
                                            • {note}
                                            <br />
                                        </span>
                                    ))
                                    : null}
                            </div>
                        </div>
                    )}

                    <div className="actions">
                        <button className="btnGhost" onClick={goBack}>
                            Back
                        </button>
                        <button className="btnPrimary" onClick={handleDeviceNext} disabled={loading}>
                            {loading ? "Checking..." : "Continue"}
                        </button>
                    </div>
                </div>
            )}

            {step === "issue" && (
                <div className="card">
                    <div className="sectionTitle">What do you need help with today?</div>
                    <div className="small">
                        Choose the option that sounds closest to the problem.
                    </div>

                    <div className="choiceGrid">
                        <button className="choiceBtn" onClick={() => handleIssueSelect("power")}>
                            <div className="choiceBtnTitle">My laptop is not turning on</div>
                            <div className="choiceBtnText">
                                Power, charger, black screen, or startup problems.
                            </div>
                        </button>

                        <button className="choiceBtn" onClick={() => handleIssueSelect("eqnet")}>
                            <div className="choiceBtnTitle">Internet or EQNet is not working</div>
                            <div className="choiceBtnText">
                                Wi-Fi, EQNet visibility, connection, or browsing issues.
                            </div>
                        </button>

                        <button className="choiceBtn" onClick={() => handleIssueSelect("byox")}>
                            <div className="choiceBtnTitle">BYOx or school software is not working</div>
                            <div className="choiceBtnText">
                                Install issues, sign-in issues, missing apps, or Office problems.
                            </div>
                        </button>

                        <button className="choiceBtn" onClick={() => handleIssueSelect("general")}>
                            <div className="choiceBtnTitle">Something else is wrong</div>
                            <div className="choiceBtnText">
                                Use this when the issue does not fit the main categories.
                            </div>
                        </button>
                    </div>

                    <div className="actions">
                        <button className="btnGhost" onClick={goBack}>
                            Back
                        </button>
                    </div>
                </div>
            )}

            {step === "triage" && (
                <div className="card">
                    <div className="sectionTitle">Troubleshooting questions</div>
                    <div className="small">
                        Answer the questions below so the app can work out the most likely problem.
                    </div>

                    {issueCategory === "power" && (
                        <>
                            <div className="field">
                                <div className="label">When you press the power button, what happens?</div>
                                <select
                                    className="input"
                                    value={triageAnswers.powerStatus}
                                    onChange={(e) => updateTriage("powerStatus", e.target.value)}
                                >
                                    <option value="">Choose one</option>
                                    <option value="nothing">Nothing happens</option>
                                    <option value="lights_or_fans">Lights or fans start</option>
                                    <option value="screen_black">It turns on but the screen stays black</option>
                                    <option value="not_sure">I’m not sure</option>
                                </select>
                            </div>

                            <div className="field">
                                <div className="label">Is the charger plugged in properly?</div>
                                <select
                                    className="input"
                                    value={triageAnswers.chargerConnected}
                                    onChange={(e) => updateTriage("chargerConnected", e.target.value)}
                                >
                                    <option value="">Choose one</option>
                                    <option value="yes">Yes</option>
                                    <option value="no">No</option>
                                    <option value="not_sure">Not sure</option>
                                </select>
                            </div>

                            <div className="field">
                                <div className="label">Can you see a charging light?</div>
                                <select
                                    className="input"
                                    value={triageAnswers.chargingLight}
                                    onChange={(e) => updateTriage("chargingLight", e.target.value)}
                                >
                                    <option value="">Choose one</option>
                                    <option value="yes">Yes</option>
                                    <option value="no">No</option>
                                    <option value="not_sure">Not sure</option>
                                </select>
                            </div>

                            <div className="field">
                                <div className="label">Have you held the power button for 10 seconds and tried again?</div>
                                <select
                                    className="input"
                                    value={triageAnswers.triedLongPress}
                                    onChange={(e) => updateTriage("triedLongPress", e.target.value)}
                                >
                                    <option value="">Choose one</option>
                                    <option value="yes">Yes</option>
                                    <option value="no">No</option>
                                </select>
                            </div>
                        </>
                    )}

                    {issueCategory === "eqnet" && (
                        <>
                            <div className="field">
                                <div className="label">Is Wi-Fi turned on?</div>
                                <select
                                    className="input"
                                    value={triageAnswers.wifiDetected}
                                    onChange={(e) => updateTriage("wifiDetected", e.target.value)}
                                >
                                    <option value="">Choose one</option>
                                    <option value="yes">Yes</option>
                                    <option value="no">No</option>
                                    <option value="not_sure">Not sure</option>
                                </select>
                            </div>

                            <div className="field">
                                <div className="label">Can you see EQNet in the Wi-Fi list?</div>
                                <select
                                    className="input"
                                    value={triageAnswers.eqnetVisible}
                                    onChange={(e) => updateTriage("eqnetVisible", e.target.value)}
                                >
                                    <option value="">Choose one</option>
                                    <option value="yes">Yes</option>
                                    <option value="no">No</option>
                                    <option value="not_sure">Not sure</option>
                                </select>
                            </div>

                            <div className="field">
                                <div className="label">Can you connect to EQNet successfully?</div>
                                <select
                                    className="input"
                                    value={triageAnswers.eqnetConnects}
                                    onChange={(e) => updateTriage("eqnetConnects", e.target.value)}
                                >
                                    <option value="">Choose one</option>
                                    <option value="yes">Yes</option>
                                    <option value="no">No</option>
                                    <option value="keeps_asking">It keeps asking me again</option>
                                    <option value="not_sure">Not sure</option>
                                </select>
                            </div>

                            <div className="field">
                                <div className="label">Do websites load once connected?</div>
                                <select
                                    className="input"
                                    value={triageAnswers.internetWorks}
                                    onChange={(e) => updateTriage("internetWorks", e.target.value)}
                                >
                                    <option value="">Choose one</option>
                                    <option value="yes">Yes</option>
                                    <option value="no">No</option>
                                    <option value="sometimes">Sometimes</option>
                                </select>
                            </div>

                            <div className="field">
                                <div className="label">Are other students nearby having the same problem?</div>
                                <select
                                    className="input"
                                    value={triageAnswers.othersAffected}
                                    onChange={(e) => updateTriage("othersAffected", e.target.value)}
                                >
                                    <option value="">Choose one</option>
                                    <option value="yes">Yes</option>
                                    <option value="no">No</option>
                                    <option value="not_sure">Not sure</option>
                                </select>
                            </div>
                        </>
                    )}

                    {issueCategory === "byox" && (
                        <>
                            <div className="field">
                                <div className="label">Is BYOx installed?</div>
                                <select
                                    className="input"
                                    value={triageAnswers.byoxInstalled}
                                    onChange={(e) => updateTriage("byoxInstalled", e.target.value)}
                                >
                                    <option value="">Choose one</option>
                                    <option value="yes">Yes</option>
                                    <option value="no">No</option>
                                    <option value="not_sure">Not sure</option>
                                </select>
                            </div>

                            <div className="field">
                                <div className="label">Which issue sounds closest?</div>
                                <select
                                    className="input"
                                    value={triageAnswers.softwareIssueType}
                                    onChange={(e) => updateTriage("softwareIssueType", e.target.value)}
                                >
                                    <option value="">Choose one</option>
                                    <option value="cannot_install_byox">I cannot install BYOx</option>
                                    <option value="cannot_sign_in">I cannot sign in</option>
                                    <option value="apps_missing">School apps are missing</option>
                                    <option value="office_teams">Office / Teams is not working</option>
                                    <option value="printing">Printing is not working</option>
                                    <option value="other">Something else</option>
                                </select>
                            </div>

                            <div className="field">
                                <div className="label">Have you already restarted the laptop?</div>
                                <select
                                    className="input"
                                    value={triageAnswers.restartedDevice}
                                    onChange={(e) => updateTriage("restartedDevice", e.target.value)}
                                >
                                    <option value="">Choose one</option>
                                    <option value="yes">Yes</option>
                                    <option value="no">No</option>
                                </select>
                            </div>

                            <div className="field">
                                <div className="label">Error message or extra detail</div>
                                <textarea
                                    className="textarea"
                                    value={triageAnswers.errorMessage}
                                    onChange={(e) => updateTriage("errorMessage", e.target.value)}
                                    placeholder="Type any error message or extra detail here."
                                />
                            </div>
                        </>
                    )}

                    {issueCategory === "general" && (
                        <>
                            <div className="field">
                                <div className="label">What is the problem?</div>
                                <textarea
                                    className="textarea"
                                    value={triageAnswers.generalProblem}
                                    onChange={(e) => updateTriage("generalProblem", e.target.value)}
                                    placeholder="Describe what is going wrong."
                                />
                            </div>

                            <div className="field">
                                <div className="label">What were you trying to do?</div>
                                <textarea
                                    className="textarea"
                                    value={triageAnswers.tryingToDo}
                                    onChange={(e) => updateTriage("tryingToDo", e.target.value)}
                                    placeholder="What were you trying to do when the problem happened?"
                                />
                            </div>

                            <div className="field">
                                <div className="label">What happened instead?</div>
                                <textarea
                                    className="textarea"
                                    value={triageAnswers.whatHappenedInstead}
                                    onChange={(e) => updateTriage("whatHappenedInstead", e.target.value)}
                                    placeholder="What happened instead of what you expected?"
                                />
                            </div>

                            <div className="field">
                                <div className="label">How urgent is it?</div>
                                <select
                                    className="input"
                                    value={triageAnswers.urgency}
                                    onChange={(e) => updateTriage("urgency", e.target.value)}
                                >
                                    <option value="">Choose one</option>
                                    <option value="can_keep_working">I can keep working</option>
                                    <option value="need_help_today">I need help today</option>
                                    <option value="cannot_do_classwork">I cannot do classwork</option>
                                </select>
                            </div>
                        </>
                    )}

                    <div className="actions">
                        <button className="btnGhost" onClick={goBack}>
                            Back
                        </button>
                        <button className="btnPrimary" onClick={handleGenerateSummary} disabled={loading}>
                            {loading ? "Generating..." : "Get AI help summary"}
                        </button>
                    </div>
                </div>
            )}

            {step === "summary" && aiSummary && (
                <div className="card">
                    <div className="sectionTitle">Here’s what we think is happening</div>

                    <div className="summaryGrid">
                        <div className="summaryCard">
                            <div className="summaryCardTitle">Likely issue</div>
                            <div>{aiSummary.likelyIssue}</div>
                        </div>

                        <div className="summaryCard">
                            <div className="summaryCardTitle">Student summary</div>
                            <div>{aiSummary.studentSummary}</div>
                        </div>

                        <div className="summaryCard">
                            <div className="summaryCardTitle">What to try next</div>
                            <div className="small" style={{ fontSize: 14, color: "var(--text)" }}>
                                {aiSummary.recommendedNextSteps.length ? (
                                    aiSummary.recommendedNextSteps.map((item, index) => (
                                        <div key={index} style={{ marginBottom: 8 }}>
                                            • {item}
                                        </div>
                                    ))
                                ) : (
                                    <div>No steps returned yet.</div>
                                )}
                            </div>
                        </div>

                        <div className="summaryCard">
                            <div className="summaryCardTitle">Support level</div>
                            <div>
                                {aiSummary.escalationRecommended
                                    ? "This may need staff help."
                                    : "Try these steps first."}
                            </div>
                            <div className="small" style={{ marginTop: 8 }}>
                                Confidence: {aiSummary.confidence}
                            </div>
                        </div>
                    </div>

                    <details className="previewBox">
                        <summary className="previewTitle" style={{ cursor: "pointer" }}>
                            Staff summary
                        </summary>
                        <div>{aiSummary.staffSummary}</div>
                    </details>

                    <div className="actions">
                        <button className="btnGhost" onClick={goBack}>
                            Back
                        </button>
                        <button className="btnPrimary" onClick={handleGenerateFixSteps} disabled={loading}>
                            {loading ? "Building steps..." : "Show me the steps"}
                        </button>
                    </div>
                </div>
            )}

            {step === "fix" && (
                <div className="card">
                    <div className="sectionTitle">Try these steps</div>
                    <div className="small">
                        Tick each step as you complete it.
                    </div>

                    {!fixSteps.length && (
                        <div className="emptyState">
                            <div className="emptyStateTitle">No fix steps yet</div>
                            <div className="emptyStateText">
                                The AI did not return fix steps yet. Go back and try again.
                            </div>
                        </div>
                    )}

                    <div className="stepList">
                        {fixSteps.map((item) => (
                            <div
                                key={item.stepNumber}
                                className={`stepCard ${item.done ? "stepDone" : ""}`}
                            >
                                <div className="stepTop">
                                    <div style={{ flex: 1 }}>
                                        <div className="stepTitle">
                                            Step {item.stepNumber}: {item.title}
                                        </div>
                                        <div className="stepText">{item.instruction}</div>
                                        {item.whyThisHelps ? (
                                            <div className="stepHelp">
                                                Why this helps: {item.whyThisHelps}
                                            </div>
                                        ) : null}
                                    </div>

                                    <div className="stepNumber">{item.stepNumber}</div>
                                </div>

                                <div className="actions" style={{ justifyContent: "flex-start" }}>
                                    <button
                                        className={item.done ? "btnPrimary" : "btnGhost"}
                                        onClick={() => markStepDone(item.stepNumber)}
                                    >
                                        {item.done ? "Done" : "Mark as done"}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="infoPanel">
                        <div className="infoPanelTitle">Progress</div>
                        <div>
                            {completedFixCount} of {fixSteps.length} steps completed
                        </div>
                    </div>

                    <div className="actions">
                        <button className="btnGhost" onClick={goBack}>
                            Back
                        </button>
                        <button className="btnPrimary" onClick={() => setStep("resolution")}>
                            Check if it works now
                        </button>
                    </div>
                </div>
            )}

            {step === "resolution" && (
                <div className="card">
                    <div className="sectionTitle">Did that fix the problem?</div>

                    <div className="choiceGrid">
                        <button className="choiceBtn" onClick={() => handleResolution("full")}>
                            <div className="choiceBtnTitle">Yes, it’s working now</div>
                            <div className="choiceBtnText">
                                The device is working again and I can continue.
                            </div>
                        </button>

                        <button className="choiceBtn" onClick={() => handleResolution("partial")}>
                            <div className="choiceBtnTitle">Partly</div>
                            <div className="choiceBtnText">
                                Some parts are working, but I still need more help.
                            </div>
                        </button>

                        <button className="choiceBtn" onClick={() => handleResolution("none")}>
                            <div className="choiceBtnTitle">No, I still need help</div>
                            <div className="choiceBtnText">
                                The issue is still there and needs follow-up.
                            </div>
                        </button>
                    </div>

                    <div className="field">
                        <div className="label">Anything else we should know?</div>
                        <textarea
                            className="textarea"
                            value={extraNotes}
                            onChange={(e) => setExtraNotes(e.target.value)}
                            placeholder="Optional extra notes"
                        />
                    </div>

                    <div className="field">
                        <div className="label">Where are you right now?</div>
                        <input
                            className="input"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="Optional location"
                        />
                    </div>

                    <div className="actions">
                        <button className="btnGhost" onClick={goBack}>
                            Back
                        </button>
                    </div>
                </div>
            )}

            {step === "complete" && (
                <div className="card">
                    <div className="sectionTitle">Your IT help session has been saved</div>

                    <div className="summaryGrid">
                        <div className="summaryCard">
                            <div className="summaryCardTitle">Outcome</div>
                            <div>
                                {resolutionLevel === "full" && "The issue looks resolved."}
                                {resolutionLevel === "partial" &&
                                    "The issue is partly resolved and may still need follow-up."}
                                {resolutionLevel === "none" && "The issue still needs support."}
                            </div>
                        </div>

                        <div className="summaryCard">
                            <div className="summaryCardTitle">Session details</div>
                            <div className="kvList">
                                <div className="kvRow">
                                    <div className="kvKey">Session ID</div>
                                    <div className="kvValue">{sessionId || "Not set"}</div>
                                </div>
                                <div className="kvRow">
                                    <div className="kvKey">MSID</div>
                                    <div className="kvValue">{student.msid}</div>
                                </div>
                                <div className="kvRow">
                                    <div className="kvKey">Issue type</div>
                                    <div className="kvValue">{issueCategory || "Not set"}</div>
                                </div>
                                {aiSummary?.likelyIssue ? (
                                    <div className="kvRow">
                                        <div className="kvKey">Likely issue</div>
                                        <div className="kvValue">{aiSummary.likelyIssue}</div>
                                    </div>
                                ) : null}
                                {location ? (
                                    <div className="kvRow">
                                        <div className="kvKey">Location</div>
                                        <div className="kvValue">{location}</div>
                                    </div>
                                ) : null}
                                {extraNotes ? (
                                    <div className="kvRow">
                                        <div className="kvKey">Extra notes</div>
                                        <div className="kvValue">{extraNotes}</div>
                                    </div>
                                ) : null}
                            </div>
                        </div>

                        {resolutionLevel !== "full" && (
                            <div className="summaryCard">
                                <div className="summaryCardTitle">Next step</div>
                                <div>
                                    This is the point where we would submit the issue to staff or save it to SharePoint.
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="actions">
                        <button className="btnGhost" onClick={resetAll}>
                            Start a new request
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

type IssueCategory = "power" | "eqnet" | "byox" | "general" | "";

type StudentInfo = {
    msid: string;
    yearLevel: string;
    deviceOwnership: string;
};

type DeviceInfo = {
    make: string;
    model: string;
    year: string;
    os: string;
    notes: string;
};

type DeviceProfile = {
    estimatedAgeBand?: string;
    likelyWindows11Compatible?: boolean;
    confidence?: string;
    roughSpecs?: {
        cpuTier?: string;
        ramEstimate?: string;
        storageEstimate?: string;
    };
    notes?: string[];
} | null;

type TriageAnswers = Record<string, string>;

type AiSummary = {
    likelyIssue: string;
    confidence: "low" | "medium" | "high";
    studentSummary: string;
    recommendedNextSteps: string[];
    escalationRecommended: boolean;
    staffSummary: string;
};

type FixStep = {
    stepNumber: number;
    title: string;
    instruction: string;
    whyThisHelps: string;
    howToDoThis: string;
    commonProblem: string;
};

type ChatMessage = {
    role: "assistant" | "user";
    text: string;
};

type WizardStep =
    | "landing"
    | "student"
    | "device"
    | "issue"
    | "triage"
    | "summary"
    | "steps"
    | "complete";

const ISSUE_OPTIONS: Array<{
    key: Exclude<IssueCategory, "">;
    title: string;
    text: string;
}> = [
        {
            key: "power",
            title: "My laptop is not turning on",
            text: "Power, charger, black screen, or startup problems.",
        },
        {
            key: "eqnet",
            title: "Internet or EQNet is not working",
            text: "Wi-Fi, EQNet visibility, connection, or browsing issues.",
        },
        {
            key: "byox",
            title: "BYOx or school software is not working",
            text: "Install issues, sign-in issues, missing apps, or Office problems.",
        },
        {
            key: "general",
            title: "Something else is wrong",
            text: "Use this when the issue does not fit the main categories.",
        },
    ];

const WIZARD_ORDER: WizardStep[] = [
    "landing",
    "student",
    "device",
    "issue",
    "triage",
    "summary",
    "steps",
    "complete",
];

function confidenceLabel(confidence?: string) {
    if (confidence === "high") return "High confidence";
    if (confidence === "low") return "Low confidence";
    return "Medium confidence";
}

function statusClass(escalationRecommended?: boolean) {
    return escalationRecommended ? "warn" : "success";
}

function getInitialTriageAnswers(category: IssueCategory): TriageAnswers {
    if (category === "power") {
        return {
            powerStatus: "",
            chargerConnected: "",
            chargingLight: "",
            triedLongPress: "",
        };
    }

    if (category === "eqnet") {
        return {
            wifiDetected: "",
            eqnetVisible: "",
            eqnetConnects: "",
            internetWorks: "",
            othersAffected: "",
        };
    }

    if (category === "byox") {
        return {
            byoxInstalled: "",
            softwareIssueType: "",
            restartedDevice: "",
            errorMessage: "",
        };
    }

    if (category === "general") {
        return {
            generalProblem: "",
            tryingToDo: "",
            whatHappenedInstead: "",
            urgency: "",
        };
    }

    return {};
}

function isPhysicalStep(step: FixStep | null) {
    if (!step) return false;

    const text = `${step.title} ${step.instruction} ${step.howToDoThis}`.toLowerCase();

    return (
        text.includes("power button") ||
        text.includes("plug") ||
        text.includes("charger") ||
        text.includes("charging light") ||
        text.includes("power outlet") ||
        text.includes("cable") ||
        text.includes("hold the power button")
    );
}

async function parseJsonResponse(res: Response) {
    const text = await res.text();
    let data: any = null;

    try {
        data = JSON.parse(text);
    } catch {
        throw new Error("The server returned an invalid response.");
    }

    return data;
}

export default function Page() {
    const [wizardStep, setWizardStep] = useState<WizardStep>("landing");

    const [student, setStudent] = useState<StudentInfo>({
        msid: "",
        yearLevel: "",
        deviceOwnership: "BYOD",
    });

    const [device, setDevice] = useState<DeviceInfo>({
        make: "",
        model: "",
        year: "",
        os: "",
        notes: "",
    });

    const [deviceProfile] = useState<DeviceProfile>(null);

    const [issueCategory, setIssueCategory] = useState<IssueCategory>("");
    const [triageAnswers, setTriageAnswers] = useState<TriageAnswers>({});

    const [loadingSummary, setLoadingSummary] = useState(false);
    const [loadingFixSteps, setLoadingFixSteps] = useState(false);
    const [error, setError] = useState("");

    const [aiSummary, setAiSummary] = useState<AiSummary | null>(null);
    const [fixSteps, setFixSteps] = useState<FixStep[]>([]);
    const [completedSteps, setCompletedSteps] = useState<number[]>([]);
    const [activeStepIndex, setActiveStepIndex] = useState(0);
    const [openExplainIndex, setOpenExplainIndex] = useState<number | null>(null);

    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatInput, setChatInput] = useState("");
    const [chatLoading, setChatLoading] = useState(false);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
        {
            role: "assistant",
            text: "Hi, I’m your IT support helper. I can help with general school IT questions now, and once your troubleshoot steps are ready I can explain the current step in simple language.",
        },
    ]);

    const chatMessagesRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (chatMessagesRef.current) {
            chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
        }
    }, [chatMessages, chatLoading, isChatOpen]);

    useEffect(() => {
        setTriageAnswers(getInitialTriageAnswers(issueCategory));
    }, [issueCategory]);

    const currentStep = useMemo(() => fixSteps[activeStepIndex] ?? null, [fixSteps, activeStepIndex]);

    useEffect(() => {
        if (!currentStep) return;

        setChatMessages([
            {
                role: "assistant",
                text: `You are now on Step ${currentStep.stepNumber}: ${currentStep.title}. Ask me what to do, what this should look like, or what to try if you are stuck.`,
            },
        ]);
        setChatInput("");
    }, [activeStepIndex, currentStep]);

    const wizardIndex = WIZARD_ORDER.indexOf(wizardStep);
    const wizardPercent = Math.round(((wizardIndex + 1) / WIZARD_ORDER.length) * 100);

    const fixCompletionPercent = useMemo(() => {
        if (!fixSteps.length) return 0;
        return Math.round((completedSteps.length / fixSteps.length) * 100);
    }, [completedSteps, fixSteps]);

    function updateStudent(field: keyof StudentInfo, value: string) {
        setStudent((prev) => ({ ...prev, [field]: value }));
    }

    function updateDevice(field: keyof DeviceInfo, value: string) {
        setDevice((prev) => ({ ...prev, [field]: value }));
    }

    function updateTriage(field: string, value: string) {
        setTriageAnswers((prev) => ({ ...prev, [field]: value }));
    }

    function resetWorkflow() {
        setWizardStep("landing");
        setStudent({
            msid: "",
            yearLevel: "",
            deviceOwnership: "BYOD",
        });
        setDevice({
            make: "",
            model: "",
            year: "",
            os: "",
            notes: "",
        });
        setIssueCategory("");
        setTriageAnswers({});
        setAiSummary(null);
        setFixSteps([]);
        setCompletedSteps([]);
        setActiveStepIndex(0);
        setOpenExplainIndex(null);
        setError("");
        setIsChatOpen(false);
        setChatInput("");
        setChatMessages([
            {
                role: "assistant",
                text: "Hi, I’m your IT support helper. I can help with general school IT questions now, and once your troubleshoot steps are ready I can explain the current step in simple language.",
            },
        ]);
    }

    function canContinueFromStudent() {
        return !!(student.msid.trim() && student.yearLevel.trim() && student.deviceOwnership.trim());
    }

    function canContinueFromDevice() {
        return !!device.os.trim();
    }

    function canContinueFromIssue() {
        return !!issueCategory;
    }

    function canContinueFromTriage() {
        return true;
    }

    function goNext() {
        setError("");

        if (wizardStep === "student" && !canContinueFromStudent()) {
            setError("Enter the student details first.");
            return;
        }

        if (wizardStep === "device" && !canContinueFromDevice()) {
            setError("Choose the operating system before continuing.");
            return;
        }

        if (wizardStep === "issue" && !canContinueFromIssue()) {
            setError("Choose the closest issue type first.");
            return;
        }

        if (wizardStep === "landing") setWizardStep("student");
        else if (wizardStep === "student") setWizardStep("device");
        else if (wizardStep === "device") setWizardStep("issue");
        else if (wizardStep === "issue") setWizardStep("triage");
        else if (wizardStep === "triage") void runTriageAndSteps();
        else if (wizardStep === "summary") setWizardStep("steps");
        else if (wizardStep === "steps") setWizardStep("complete");
    }

    function goBack() {
        setError("");

        if (wizardStep === "student") setWizardStep("landing");
        else if (wizardStep === "device") setWizardStep("student");
        else if (wizardStep === "issue") setWizardStep("device");
        else if (wizardStep === "triage") setWizardStep("issue");
        else if (wizardStep === "summary") setWizardStep("triage");
        else if (wizardStep === "steps") setWizardStep("summary");
        else if (wizardStep === "complete") setWizardStep("steps");
    }

    async function runTriageAndSteps() {
        if (!issueCategory) {
            setError("Choose the closest issue type first.");
            return;
        }

        setError("");
        setLoadingSummary(true);
        setLoadingFixSteps(false);
        setAiSummary(null);
        setFixSteps([]);
        setCompletedSteps([]);
        setActiveStepIndex(0);
        setOpenExplainIndex(null);
        setIsChatOpen(false);

        try {
            const triageRes = await fetch("/api/helpdesk", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    mode: "triage",
                    student,
                    device,
                    deviceProfile,
                    issueCategory,
                    triageAnswers,
                }),
            });

            const triageData = await parseJsonResponse(triageRes);

            if (!triageRes.ok || !triageData?.ok) {
                throw new Error(triageData?.error || "Could not create the triage summary.");
            }

            const summary: AiSummary = {
                likelyIssue: triageData.likelyIssue || "",
                confidence: triageData.confidence || "medium",
                studentSummary: triageData.studentSummary || "",
                recommendedNextSteps: Array.isArray(triageData.recommendedNextSteps)
                    ? triageData.recommendedNextSteps
                    : [],
                escalationRecommended: Boolean(triageData.escalationRecommended),
                staffSummary: triageData.staffSummary || "",
            };

            setAiSummary(summary);
            setLoadingSummary(false);
            setLoadingFixSteps(true);

            const fixRes = await fetch("/api/helpdesk", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    mode: "fix_steps",
                    student,
                    device,
                    issueCategory,
                    aiSummary: summary,
                }),
            });

            const fixData = await parseJsonResponse(fixRes);

            if (!fixRes.ok || !fixData?.ok) {
                throw new Error(fixData?.error || "Could not create troubleshooting steps.");
            }

            const safeSteps: FixStep[] = Array.isArray(fixData.fixSteps) ? fixData.fixSteps : [];
            setFixSteps(safeSteps);
            setActiveStepIndex(0);
            setChatMessages([
                {
                    role: "assistant",
                    text: "Your troubleshooting steps are ready. I will stay focused on the current step and explain exactly what to do, what it should look like, or what to try if you get stuck.",
                },
            ]);
            setWizardStep("summary");
        } catch (err: any) {
            setError(err?.message || "Something went wrong.");
        } finally {
            setLoadingSummary(false);
            setLoadingFixSteps(false);
        }
    }

    function markStepDone(stepNumber: number) {
        setCompletedSteps((prev) => {
            if (prev.includes(stepNumber)) return prev;

            const updated = [...prev, stepNumber];
            const currentIndex = fixSteps.findIndex((step) => step.stepNumber === stepNumber);
            const nextIndex = currentIndex + 1;

            if (nextIndex < fixSteps.length) {
                setActiveStepIndex(nextIndex);
            }

            return updated;
        });
    }

    async function sendChatMessage(messageText?: string) {
        const finalMessage = (messageText ?? chatInput).trim();
        if (!finalMessage) return;

        setChatMessages((prev) => [...prev, { role: "user", text: finalMessage }]);
        setChatInput("");
        setChatLoading(true);

        try {
            if (!currentStep) {
                setChatMessages((prev) => [
                    ...prev,
                    {
                        role: "assistant",
                        text: "I can help with general troubleshooting first. Tell me whether this is a power issue, EQNet issue, BYOx issue, or another school laptop problem.",
                    },
                ]);
                return;
            }

            const res = await fetch("/api/helpdesk", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    mode: "chat_help",
                    student,
                    device,
                    issueCategory,
                    aiSummary,
                    currentStep,
                    userMessage: finalMessage,
                }),
            });

            const data = await parseJsonResponse(res);

            setChatMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    text: data?.reply || "I couldn’t load a reply just then. Try asking what to do first.",
                },
            ]);
        } catch {
            setChatMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    text: "That did not load properly. Try again, or ask staff if the problem keeps happening.",
                },
            ]);
        } finally {
            setChatLoading(false);
        }
    }

    function renderTriageFields() {
        if (!issueCategory) return null;

        if (issueCategory === "power") {
            return (
                <>
                    <div className="field">
                        <div className="label">What happens when you press the power button?</div>
                        <select className="input" value={triageAnswers.powerStatus || ""} onChange={(e) => updateTriage("powerStatus", e.target.value)}>
                            <option value="">Choose one</option>
                            <option value="nothing happens">Nothing happens</option>
                            <option value="lights come on but no screen">Lights come on but no screen</option>
                            <option value="screen flashes briefly">Screen flashes briefly</option>
                            <option value="turns on then turns off">Turns on then turns off</option>
                        </select>
                    </div>

                    <div className="field">
                        <div className="label">Is the charger connected?</div>
                        <select className="input" value={triageAnswers.chargerConnected || ""} onChange={(e) => updateTriage("chargerConnected", e.target.value)}>
                            <option value="">Choose one</option>
                            <option value="yes">Yes</option>
                            <option value="no">No</option>
                            <option value="not sure">Not sure</option>
                        </select>
                    </div>

                    <div className="field">
                        <div className="label">Can you see a charging light?</div>
                        <select className="input" value={triageAnswers.chargingLight || ""} onChange={(e) => updateTriage("chargingLight", e.target.value)}>
                            <option value="">Choose one</option>
                            <option value="yes">Yes</option>
                            <option value="no">No</option>
                            <option value="not sure">Not sure</option>
                        </select>
                    </div>

                    <div className="field">
                        <div className="label">Have you already held the power button for 10 seconds?</div>
                        <select className="input" value={triageAnswers.triedLongPress || ""} onChange={(e) => updateTriage("triedLongPress", e.target.value)}>
                            <option value="">Choose one</option>
                            <option value="yes">Yes</option>
                            <option value="no">No</option>
                        </select>
                    </div>
                </>
            );
        }

        if (issueCategory === "eqnet") {
            return (
                <>
                    <div className="field">
                        <div className="label">Is Wi-Fi turned on?</div>
                        <select className="input" value={triageAnswers.wifiDetected || ""} onChange={(e) => updateTriage("wifiDetected", e.target.value)}>
                            <option value="">Choose one</option>
                            <option value="yes">Yes</option>
                            <option value="no">No</option>
                            <option value="not sure">Not sure</option>
                        </select>
                    </div>

                    <div className="field">
                        <div className="label">Can you see EQNet in the Wi-Fi list?</div>
                        <select className="input" value={triageAnswers.eqnetVisible || ""} onChange={(e) => updateTriage("eqnetVisible", e.target.value)}>
                            <option value="">Choose one</option>
                            <option value="yes">Yes</option>
                            <option value="no">No</option>
                            <option value="not sure">Not sure</option>
                        </select>
                    </div>

                    <div className="field">
                        <div className="label">What happens when you try to connect?</div>
                        <select className="input" value={triageAnswers.eqnetConnects || ""} onChange={(e) => updateTriage("eqnetConnects", e.target.value)}>
                            <option value="">Choose one</option>
                            <option value="connects normally">Connects normally</option>
                            <option value="asks again for login">Asks again for login</option>
                            <option value="fails straight away">Fails straight away</option>
                            <option value="does not appear">Does not appear</option>
                        </select>
                    </div>

                    <div className="field">
                        <div className="label">Does the internet work after connecting?</div>
                        <select className="input" value={triageAnswers.internetWorks || ""} onChange={(e) => updateTriage("internetWorks", e.target.value)}>
                            <option value="">Choose one</option>
                            <option value="yes">Yes</option>
                            <option value="no">No</option>
                            <option value="sometimes">Sometimes</option>
                        </select>
                    </div>

                    <div className="field">
                        <div className="label">Are other students nearby having the same issue?</div>
                        <select className="input" value={triageAnswers.othersAffected || ""} onChange={(e) => updateTriage("othersAffected", e.target.value)}>
                            <option value="">Choose one</option>
                            <option value="yes">Yes</option>
                            <option value="no">No</option>
                            <option value="not sure">Not sure</option>
                        </select>
                    </div>
                </>
            );
        }

        if (issueCategory === "byox") {
            return (
                <>
                    <div className="field">
                        <div className="label">Is Company Portal or BYOx already installed?</div>
                        <select className="input" value={triageAnswers.byoxInstalled || ""} onChange={(e) => updateTriage("byoxInstalled", e.target.value)}>
                            <option value="">Choose one</option>
                            <option value="yes">Yes</option>
                            <option value="no">No</option>
                            <option value="not sure">Not sure</option>
                        </select>
                    </div>

                    <div className="field">
                        <div className="label">What is the closest issue?</div>
                        <select className="input" value={triageAnswers.softwareIssueType || ""} onChange={(e) => updateTriage("softwareIssueType", e.target.value)}>
                            <option value="">Choose one</option>
                            <option value="download blocked">Download blocked</option>
                            <option value="installer does not open">Installer does not open</option>
                            <option value="cannot sign in">Cannot sign in</option>
                            <option value="app installs but does not work">App installs but does not work</option>
                            <option value="school software missing">School software missing</option>
                        </select>
                    </div>

                    <div className="field">
                        <div className="label">Have you already restarted the device?</div>
                        <select className="input" value={triageAnswers.restartedDevice || ""} onChange={(e) => updateTriage("restartedDevice", e.target.value)}>
                            <option value="">Choose one</option>
                            <option value="yes">Yes</option>
                            <option value="no">No</option>
                        </select>
                    </div>

                    <div className="field">
                        <div className="label">Error message or extra detail</div>
                        <textarea
                            className="textarea"
                            value={triageAnswers.errorMessage || ""}
                            onChange={(e) => updateTriage("errorMessage", e.target.value)}
                            placeholder="For example: installer blocked, Microsoft Store closes, or sign-in is failing"
                        />
                    </div>
                </>
            );
        }

        if (issueCategory === "general") {
            return (
                <>
                    <div className="field">
                        <div className="label">What is the problem?</div>
                        <input className="input" value={triageAnswers.generalProblem || ""} onChange={(e) => updateTriage("generalProblem", e.target.value)} placeholder="Describe the issue" />
                    </div>

                    <div className="field">
                        <div className="label">What are you trying to do?</div>
                        <input className="input" value={triageAnswers.tryingToDo || ""} onChange={(e) => updateTriage("tryingToDo", e.target.value)} placeholder="For example: connect to Wi-Fi or install software" />
                    </div>

                    <div className="field">
                        <div className="label">What happened instead?</div>
                        <textarea className="textarea" value={triageAnswers.whatHappenedInstead || ""} onChange={(e) => updateTriage("whatHappenedInstead", e.target.value)} placeholder="Explain what went wrong" />
                    </div>

                    <div className="field">
                        <div className="label">How urgent is it?</div>
                        <select className="input" value={triageAnswers.urgency || ""} onChange={(e) => updateTriage("urgency", e.target.value)}>
                            <option value="">Choose one</option>
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                        </select>
                    </div>
                </>
            );
        }

        return null;
    }

    function renderWizardShell(
        title: string,
        subtitle: string,
        content: ReactNode,
        options?: {
            showBack?: boolean;
            showContinue?: boolean;
            continueLabel?: string;
            onContinue?: () => void;
            onBack?: () => void;
            continueDisabled?: boolean;
        }
    ) {
        return (
            <>
                <div className="wizardTopBar">
                    <div className="wizardMiniBrand">
                        <div className="brandMiniLogo">
                            <Image
                                src="/School_Logo.png"
                                alt="School logo"
                                width={28}
                                height={28}
                                style={{ objectFit: "contain" }}
                                priority
                            />
                        </div>
                        <div>
                            <div className="brandMiniTitle">MSHS IT Help Desk</div>
                            <div className="brandMiniSub">
                                Step {wizardIndex + 1} of {WIZARD_ORDER.length}
                            </div>
                        </div>
                    </div>

                    <button className="btnGhost" onClick={resetWorkflow}>
                        Start again
                    </button>
                </div>

                <div className="wizardProgressCard">
                    <div className="progressMeta">
                        <span>Progress</span>
                        <span>{wizardPercent}%</span>
                    </div>
                    <div className="progressBar">
                        <div className="progressFill" style={{ width: `${wizardPercent}%` }} />
                    </div>
                </div>

                <div className="wizardCard">
                    <div className="wizardCardTitle">{title}</div>
                    <div className="wizardCardSub">{subtitle}</div>

                    <div className="wizardBody">{content}</div>

                    {error ? <div className="errorBox">{error}</div> : null}

                    <div className="wizardActions">
                        {options?.showBack ? (
                            <button className="btnGhost" onClick={options.onBack ?? goBack}>
                                Back
                            </button>
                        ) : (
                            <span />
                        )}

                        {options?.showContinue ? (
                            <button
                                className="btnPrimary"
                                onClick={options.onContinue ?? goNext}
                                disabled={options?.continueDisabled}
                            >
                                {options?.continueLabel ?? "Continue"}
                            </button>
                        ) : null}
                    </div>
                </div>
            </>
        );
    }

    function renderCurrentStepQuickPrompts() {
        if (!currentStep) return null;

        if (isPhysicalStep(currentStep)) {
            return (
                <div className="chatQuickPrompts">
                    <button
                        className="chatQuickBtn"
                        onClick={() => void sendChatMessage("What do I physically do first?")}
                    >
                        What do I do first?
                    </button>
                    <button
                        className="chatQuickBtn"
                        onClick={() => void sendChatMessage("What should this look like on my device?")}
                    >
                        What does this look like?
                    </button>
                    <button
                        className="chatQuickBtn"
                        onClick={() => void sendChatMessage("What if this still does not work?")}
                    >
                        It still does not work
                    </button>
                </div>
            );
        }

        return (
            <div className="chatQuickPrompts">
                <button
                    className="chatQuickBtn"
                    onClick={() => void sendChatMessage("What do I click first?")}
                >
                    What do I click first?
                </button>
                <button
                    className="chatQuickBtn"
                    onClick={() => void sendChatMessage("What does this look like on my screen?")}
                >
                    What does this look like?
                </button>
                <button
                    className="chatQuickBtn"
                    onClick={() => void sendChatMessage("What if I cannot find it?")}
                >
                    I cannot find it
                </button>
            </div>
        );
    }

    function renderChatAssistant() {
        return (
            <>
                {!isChatOpen ? (
                    <div className="chatDock">
                        <button
                            className="helpFab"
                            onClick={() => setIsChatOpen(true)}
                            aria-label="Open AI assistant"
                            title="Open AI assistant"
                        >
                            AI assistant
                        </button>
                    </div>
                ) : null}

                {isChatOpen ? (
                    <div className="chatOverlay">
                        <div className="chatOverlayPanel">
                            <div className="chatOverlayHeader">
                                <div>
                                    <div className="sectionTitle" style={{ marginBottom: 0 }}>
                                        IT support helper
                                    </div>
                                    <div className="small">
                                        Ask what to do, what this step looks like, or what to try next.
                                    </div>

                                    {currentStep ? (
                                        <div className="chatStepTag">
                                            Step {currentStep.stepNumber}: {currentStep.title}
                                        </div>
                                    ) : (
                                        <div className="chatStepTag">General help</div>
                                    )}
                                </div>

                                <button className="chatIconBtn" onClick={() => setIsChatOpen(false)}>
                                    Close
                                </button>
                            </div>

                            <div className="chatOverlayBody" ref={chatMessagesRef}>
                                {currentStep ? (
                                    <div className="softBox" style={{ marginTop: 0 }}>
                                        <div className="softBoxTitle">Current step</div>
                                        <div className="stepText">{currentStep.instruction}</div>
                                        {renderCurrentStepQuickPrompts()}
                                    </div>
                                ) : (
                                    <div className="softBox" style={{ marginTop: 0 }}>
                                        <div className="softBoxTitle">AI help</div>
                                        <div className="stepText">
                                            I can help with general IT questions. Once your troubleshoot steps are generated,
                                            I can also explain the exact current step in simple language.
                                        </div>

                                        <div className="chatQuickPrompts">
                                            <button
                                                className="chatQuickBtn"
                                                onClick={() => void sendChatMessage("My laptop is not turning on. What should I check first?")}
                                            >
                                                Laptop not turning on
                                            </button>
                                            <button
                                                className="chatQuickBtn"
                                                onClick={() => void sendChatMessage("EQNet is not working. What should I try first?")}
                                            >
                                                EQNet not working
                                            </button>
                                            <button
                                                className="chatQuickBtn"
                                                onClick={() => void sendChatMessage("BYOx is not working. What should I try first?")}
                                            >
                                                BYOx not working
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {chatMessages.map((message, index) => (
                                    <div
                                        key={index}
                                        className={`chatBubble ${message.role === "assistant" ? "chatAssistant" : "chatUser"}`}
                                    >
                                        {message.text}
                                    </div>
                                ))}

                                {chatLoading ? <div className="chatBubble chatAssistant">Thinking...</div> : null}
                            </div>

                            <div className="chatOverlayFooter">
                                <input
                                    className="input"
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            void sendChatMessage();
                                        }
                                    }}
                                    placeholder="Ask for help with this step..."
                                />
                                <button className="btnPrimary" onClick={() => void sendChatMessage()}>
                                    Send
                                </button>
                            </div>
                        </div>
                    </div>
                ) : null}
            </>
        );
    }

    if (wizardStep === "landing") {
        return (
            <>
                <div className="landingPageWrap">
                    <div className="landingPageInner">
                        <Image
                            src="/School_Logo.png"
                            alt="Maroochydore State High School logo"
                            width={120}
                            height={120}
                            style={{ objectFit: "contain" }}
                            priority
                        />

                        <h1 className="landingMainTitle">MSHS IT Help Desk</h1>
                        <p className="landingMainSub">Student device support, step by step.</p>

                        <div className="landingIntroCard">
                            <p className="landingIntroText">
                                Get help with your laptop, EQNet, BYOx, school software, or a general IT issue.
                            </p>

                            <button className="landingPrimaryButton" onClick={() => setWizardStep("student")}>
                                Start IT Help
                            </button>

                            <div className="landingSupportBox">
                                <div className="landingSupportTitle">This can help with</div>
                                <ul className="landingSupportList">
                                    <li>Laptop not turning on</li>
                                    <li>EQNet or internet not working</li>
                                    <li>BYOx or school software issues</li>
                                    <li>General device problems</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
                {renderChatAssistant()}
            </>
        );
    }

    if (wizardStep === "student") {
        return (
            <>
                <div className="wizardPageWrap">
                    {renderWizardShell(
                        "Let’s get your IT help request started",
                        "Enter your student details first so the session can be tracked properly.",
                        <>
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
                                <div className="wizardChoiceGrid">
                                    <button
                                        type="button"
                                        className={`wizardChoiceLarge ${student.deviceOwnership === "BYOD" ? "wizardChoiceLargeOn" : ""}`}
                                        onClick={() => updateStudent("deviceOwnership", "BYOD")}
                                    >
                                        BYOx device
                                    </button>

                                    <button
                                        type="button"
                                        className={`wizardChoiceLarge ${student.deviceOwnership === "School device" ? "wizardChoiceLargeOn" : ""}`}
                                        onClick={() => updateStudent("deviceOwnership", "School device")}
                                    >
                                        School-managed device
                                    </button>
                                </div>
                            </div>
                        </>,
                        {
                            showBack: true,
                            showContinue: true,
                            continueLabel: "Continue",
                            onBack: goBack,
                            onContinue: goNext,
                            continueDisabled: !canContinueFromStudent(),
                        }
                    )}
                </div>
                {renderChatAssistant()}
            </>
        );
    }

    if (wizardStep === "device") {
        return (
            <>
                <div className="wizardPageWrap">
                    {renderWizardShell(
                        "Tell us about your laptop",
                        "Add what you know. If you are not sure, leave it blank and keep going.",
                        <>
                            <div className="wizardTwoCol">
                                <div className="field">
                                    <div className="label">Make</div>
                                    <input
                                        className="input"
                                        value={device.make}
                                        onChange={(e) => updateDevice("make", e.target.value)}
                                        placeholder="Lenovo, HP, Dell..."
                                    />
                                </div>

                                <div className="field">
                                    <div className="label">Model</div>
                                    <input
                                        className="input"
                                        value={device.model}
                                        onChange={(e) => updateDevice("model", e.target.value)}
                                        placeholder="ThinkPad, ProBook..."
                                    />
                                </div>
                            </div>

                            <div className="wizardTwoCol">
                                <div className="field">
                                    <div className="label">Approximate year</div>
                                    <input
                                        className="input"
                                        value={device.year}
                                        onChange={(e) => updateDevice("year", e.target.value)}
                                        placeholder="2020"
                                    />
                                </div>

                                <div className="field">
                                    <div className="label">Operating system</div>
                                    <select
                                        className="input"
                                        value={device.os}
                                        onChange={(e) => updateDevice("os", e.target.value)}
                                    >
                                        <option value="">Choose operating system</option>
                                        <option value="Windows">Windows</option>
                                        <option value="Mac">Mac</option>
                                        <option value="Not sure">Not sure</option>
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
                        </>,
                        {
                            showBack: true,
                            showContinue: true,
                            continueLabel: "Continue",
                            onBack: goBack,
                            onContinue: goNext,
                            continueDisabled: !canContinueFromDevice(),
                        }
                    )}
                </div>
                {renderChatAssistant()}
            </>
        );
    }

    if (wizardStep === "issue") {
        return (
            <>
                <div className="wizardPageWrap">
                    {renderWizardShell(
                        "What do you need help with today?",
                        "Choose the option that sounds closest to the problem.",
                        <div className="wizardIssueGrid">
                            {ISSUE_OPTIONS.map((option) => (
                                <button
                                    key={option.key}
                                    type="button"
                                    className={`wizardIssueCard ${issueCategory === option.key ? "wizardIssueCardOn" : ""}`}
                                    onClick={() => setIssueCategory(option.key)}
                                >
                                    <div className="wizardIssueTitle">{option.title}</div>
                                    <div className="wizardIssueText">{option.text}</div>
                                </button>
                            ))}
                        </div>,
                        {
                            showBack: true,
                            showContinue: true,
                            continueLabel: "Continue",
                            onBack: goBack,
                            onContinue: goNext,
                            continueDisabled: !canContinueFromIssue(),
                        }
                    )}
                </div>
                {renderChatAssistant()}
            </>
        );
    }

    if (wizardStep === "triage") {
        return (
            <>
                <div className="wizardPageWrap">
                    {renderWizardShell(
                        "A few quick questions",
                        "These help narrow down the issue before we generate the troubleshooting steps.",
                        renderTriageFields(),
                        {
                            showBack: true,
                            showContinue: true,
                            continueLabel: loadingSummary || loadingFixSteps ? "Generating..." : "Generate help steps",
                            onBack: goBack,
                            onContinue: goNext,
                            continueDisabled: loadingSummary || loadingFixSteps || !canContinueFromTriage(),
                        }
                    )}
                </div>
                {renderChatAssistant()}
            </>
        );
    }

    if (wizardStep === "summary") {
        return (
            <>
                <div className="wizardPageWrap">
                    {renderWizardShell(
                        "Here is the issue summary",
                        "This gives the student a quick explanation before moving into the actual troubleshooting steps.",
                        !aiSummary ? (
                            <div className="emptyState">
                                <div className="emptyStateTitle">No summary yet</div>
                                <div className="emptyStateText">Generate the troubleshooting steps first.</div>
                            </div>
                        ) : (
                            <div className="summaryGrid">
                                <div className="summaryCard">
                                    <div className="summaryCardTitle">Likely issue</div>
                                    <div className="stepText">{aiSummary.likelyIssue}</div>
                                    <div className="inlineMeta">
                                        <span className={`statusBadge ${statusClass(aiSummary.escalationRecommended)}`}>
                                            {confidenceLabel(aiSummary.confidence)}
                                        </span>
                                        <span className={`statusBadge ${statusClass(aiSummary.escalationRecommended)}`}>
                                            {aiSummary.escalationRecommended ? "May need staff support" : "Student can try safe steps first"}
                                        </span>
                                    </div>
                                </div>

                                <div className="summaryCard">
                                    <div className="summaryCardTitle">Student summary</div>
                                    <div className="stepText">{aiSummary.studentSummary}</div>
                                </div>

                                <div className="summaryCard">
                                    <div className="summaryCardTitle">Recommended next checks</div>
                                    <div className="kvList">
                                        {aiSummary.recommendedNextSteps.map((item, index) => (
                                            <div key={index} className="kvRow">
                                                <div className="kvKey">Check {index + 1}</div>
                                                <div className="kvValue">{item}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ),
                        {
                            showBack: true,
                            showContinue: true,
                            continueLabel: "Show troubleshoot steps",
                            onBack: goBack,
                            onContinue: goNext,
                        }
                    )}
                </div>
                {renderChatAssistant()}
            </>
        );
    }

    if (wizardStep === "steps" || wizardStep === "complete") {
        return (
            <>
                <div className="wizardPageWrap">
                    <>
                        <div className="wizardTopBar">
                            <div className="wizardMiniBrand">
                                <div className="brandMiniLogo">
                                    <Image
                                        src="/School_Logo.png"
                                        alt="School logo"
                                        width={28}
                                        height={28}
                                        style={{ objectFit: "contain" }}
                                        priority
                                    />
                                </div>
                                <div>
                                    <div className="brandMiniTitle">MSHS IT Help Desk</div>
                                    <div className="brandMiniSub">
                                        {wizardStep === "complete" ? "Completed" : `Step ${wizardIndex + 1} of ${WIZARD_ORDER.length}`}
                                    </div>
                                </div>
                            </div>

                            <button className="btnGhost" onClick={resetWorkflow}>
                                Start again
                            </button>
                        </div>

                        <div className="wizardProgressCard">
                            <div className="progressMeta">
                                <span>Progress</span>
                                <span>{wizardStep === "complete" ? "100%" : `${wizardPercent}%`}</span>
                            </div>
                            <div className="progressBar">
                                <div
                                    className="progressFill"
                                    style={{ width: wizardStep === "complete" ? "100%" : `${wizardPercent}%` }}
                                />
                            </div>
                        </div>

                        <div className="wizardCard">
                            <div className="wizardCardTitle">
                                {wizardStep === "complete" ? "Nice work" : "Try these troubleshoot steps"}
                            </div>
                            <div className="wizardCardSub">
                                {wizardStep === "complete"
                                    ? "You can review the steps again, or start a new IT help request."
                                    : "If a step says how to fix the problem, students can open it and see what it looks like."}
                            </div>

                            {wizardStep !== "complete" ? (
                                <>
                                    <div className="progressWrap">
                                        <div className="progressMeta">
                                            <span>
                                                {completedSteps.length} of {fixSteps.length} steps completed
                                            </span>
                                            <span>{fixCompletionPercent}%</span>
                                        </div>
                                        <div className="progressBar">
                                            <div className="progressFill" style={{ width: `${fixCompletionPercent}%` }} />
                                        </div>
                                    </div>

                                    <div className="stepList">
                                        {fixSteps.map((step, index) => {
                                            const isDone = completedSteps.includes(step.stepNumber);
                                            const isExplainOpen = openExplainIndex === index;
                                            const isActive = activeStepIndex === index;

                                            return (
                                                <div
                                                    key={step.stepNumber}
                                                    className={`stepCard ${isDone ? "stepDone" : ""}`}
                                                    style={{ borderColor: isActive ? "var(--brandLine)" : undefined }}
                                                >
                                                    <div className="stepTop">
                                                        <div>
                                                            <div className="stepTitle">
                                                                Step {step.stepNumber}: {step.title}
                                                            </div>
                                                            <div className="stepText">{step.instruction}</div>
                                                            {step.whyThisHelps ? (
                                                                <div className="stepHelp">Why this helps: {step.whyThisHelps}</div>
                                                            ) : null}
                                                        </div>

                                                        <div className="stepNumber">{step.stepNumber}</div>
                                                    </div>

                                                    <div className="stepActionRow">
                                                        <button
                                                            className="btnGhost"
                                                            onClick={() => {
                                                                setActiveStepIndex(index);
                                                                markStepDone(step.stepNumber);
                                                            }}
                                                        >
                                                            Mark as done
                                                        </button>

                                                        <button
                                                            className="btnSecondarySoft"
                                                            onClick={() => {
                                                                setActiveStepIndex(index);
                                                                setOpenExplainIndex(isExplainOpen ? null : index);
                                                            }}
                                                        >
                                                            {isExplainOpen ? "Hide help" : "What does this look like?"}
                                                        </button>

                                                        <button
                                                            className="btnGhost"
                                                            onClick={() => {
                                                                setActiveStepIndex(index);
                                                                setIsChatOpen(true);
                                                            }}
                                                        >
                                                            Ask AI assistant
                                                        </button>
                                                    </div>

                                                    {isExplainOpen ? (
                                                        <div className="stepExplainBox">
                                                            <div className="stepExplainTitle">How to do this</div>
                                                            <div className="stepText">{step.howToDoThis}</div>

                                                            <div className="stepExplainTitle" style={{ marginTop: 10 }}>
                                                                Common problem
                                                            </div>
                                                            <div className="stepHelp">{step.commonProblem}</div>
                                                        </div>
                                                    ) : null}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </>
                            ) : (
                                <div className="summaryCard">
                                    <div className="summaryCardTitle">Support finished</div>
                                    <div className="stepText">
                                        The student has reached the end of the guided troubleshoot steps.
                                    </div>
                                </div>
                            )}

                            {error ? <div className="errorBox">{error}</div> : null}

                            <div className="wizardActions">
                                <button className="btnGhost" onClick={goBack}>
                                    Back
                                </button>

                                {wizardStep === "steps" ? (
                                    <button className="btnPrimary" onClick={goNext}>
                                        Check if it works now
                                    </button>
                                ) : (
                                    <button className="btnPrimary" onClick={resetWorkflow}>
                                        Start a new help request
                                    </button>
                                )}
                            </div>
                        </div>
                    </>
                </div>
                {renderChatAssistant()}
            </>
        );
    }

    return null;
}
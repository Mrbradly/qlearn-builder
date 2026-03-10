// lib/nasotDefs.ts
export type NasotFocusTab = "Feedback" | "Content" | "Context";

export type NasotElementDef = {
    id: string;
    focus: NasotFocusTab;
    number: number; // 1..43
    name: string;
    budget: 0 | 1 | 2;
    aim: string;
    example: string;
};

export const NASOT_DEFS: NasotElementDef[] = [
    // -------------------------
    // FEEDBACK (1–5)
    // -------------------------
    {
        id: "nasot-01",
        focus: "Feedback",
        number: 1,
        name: "Providing scales and rubrics",
        budget: 1,
        aim: "Make quality visible so students know what success looks like.",
        example: "Share a simple rubric or scale, then show a ‘not yet’ vs ‘strong’ example and what changes."
    },
    {
        id: "nasot-02",
        focus: "Feedback",
        number: 2,
        name: "Tracking student progress",
        budget: 1,
        aim: "Help students see growth and know their next move.",
        example: "Use a quick tracker (checkpoints or progress bars) and have students update it after each task."
    },
    {
        id: "nasot-03",
        focus: "Feedback",
        number: 3,
        name: "Celebrating success",
        budget: 1,
        aim: "Reinforce effort and improvement so students stick with the learning.",
        example: "Call out specific wins tied to criteria: ‘You justified your choice with evidence’."
    },
    {
        id: "nasot-04",
        focus: "Feedback",
        number: 4,
        name: "Using informal assessments of the whole class",
        budget: 2,
        aim: "Gather quick evidence of understanding so you can adjust teaching immediately.",
        example: "Mini-whiteboards, hinge questions, quick polls, or “show me” checks before moving on."
    },
    {
        id: "nasot-05",
        focus: "Feedback",
        number: 2,
        name: "Using formal assessments of individual students",
        budget: 1,
        aim: "Check individual mastery and give targeted feedback for improvement.",
        example: "Short quiz, exit task, or checkpoint submission with feedback tied to one criterion."
    },

    // -------------------------
    // CONTENT (6–22)
    // -------------------------
    {
        id: "nasot-06",
        focus: "Content",
        number: 6,
        name: "Chunking content",
        budget: 2,
        aim: "Reduce cognitive load by breaking content into manageable steps.",
        example: "Teach one step, pause, check understanding, then move on (I do, we do, you do)."
    },
    {
        id: "nasot-07",
        focus: "Content",
        number: 7,
        name: "Processing content",
        budget: 1,
        aim: "Help students actively work with new knowledge (not just hear it).",
        example: "After a demo, students summarise the key idea in their own words or create a quick example."
    },
    {
        id: "nasot-08",
        focus: "Content",
        number: 8,
        name: "Recording and representing content",
        budget: 1,
        aim: "Make thinking visible through notes, diagrams, or structured representations.",
        example: "Students create a labelled diagram, flowchart, or table that matches the teacher model."
    },
    {
        id: "nasot-09",
        focus: "Content",
        number: 9,
        name: "Using structured practice sessions",
        budget: 2,
        aim: "Build accuracy and confidence through guided, repeatable practice.",
        example: "Worked example → guided practice → independent attempt, with immediate check and correction."
    },
    {
        id: "nasot-10",
        focus: "Content",
        number: 10,
        name: "Examining similarities and differences",
        budget: 1,
        aim: "Strengthen understanding by comparing concepts, methods, or examples.",
        example: "Compare two solutions and identify what is the same, what differs, and why it matters."
    },
    {
        id: "nasot-11",
        focus: "Content",
        number: 11,
        name: "Examining errors in reasoning",
        budget: 2,
        aim: "Improve thinking by identifying misconceptions and fixing them.",
        example: "Use a ‘wrong but common’ example, then students explain the error and correct it."
    },
    {
        id: "nasot-12",
        focus: "Content",
        number: 12,
        name: "Engaging students in cognitively complex tasks",
        budget: 1,
        aim: "Push beyond recall into reasoning, problem solving, and decision making.",
        example: "Students solve a novel problem that requires choosing a method and justifying it."
    },
    {
        id: "nasot-13",
        focus: "Content",
        number: 13,
        name: "Providing resources and guidance",
        budget: 1,
        aim: "Support independence by giving scaffolds students can use without you.",
        example: "Provide a checklist, sentence starters, exemplar, or template aligned to the success criteria."
    },
    {
        id: "nasot-14",
        focus: "Content",
        number: 14,
        name: "Generating and defending claims",
        budget: 1,
        aim: "Develop reasoning by requiring claims backed with evidence and explanation.",
        example: "Students make a claim, cite evidence, explain the link, and respond to a counterpoint."
    },
    {
        id: "nasot-15",
        focus: "Content",
        number: 15,
        name: "Previewing strategies",
        budget: 1,
        aim: "Set up learning by showing the path before students start.",
        example: "State the goal, steps, and what success looks like before the task begins."
    },
    {
        id: "nasot-16",
        focus: "Content",
        number: 16,
        name: "Highlighting critical information",
        budget: 1,
        aim: "Direct attention to what matters most so students don’t miss the point.",
        example: "Underline, colour-code, or call out the one key constraint or rule students must follow."
    },
    {
        id: "nasot-17",
        focus: "Content",
        number: 17,
        name: "Reviewing content",
        budget: 1,
        aim: "Strengthen retention through quick review and retrieval.",
        example: "Rapid recap: 3 questions from last lesson, then connect it to today’s goal."
    },
    {
        id: "nasot-18",
        focus: "Content",
        number: 18,
        name: "Revising knowledge",
        budget: 1,
        aim: "Improve understanding by refining initial thinking and correcting gaps.",
        example: "Students update their notes after feedback: ‘What I thought’ → ‘What I know now’."
    },
    {
        id: "nasot-19",
        focus: "Content",
        number: 19,
        name: "Reflecting on learning",
        budget: 1,
        aim: "Build metacognition so students can explain what they learned and how.",
        example: "Exit reflection: ‘What did I do well? What do I need to improve next lesson?’"
    },
    {
        id: "nasot-20",
        focus: "Content",
        number: 20,
        name: "Assigning purposeful homework",
        budget: 1,
        aim: "Extend learning with targeted, high-impact practice.",
        example: "Set one short task that directly rehearses today’s skill (not busywork)."
    },
    {
        id: "nasot-21",
        focus: "Content",
        number: 21,
        name: "Elaborating on information",
        budget: 1,
        aim: "Deepen understanding by adding detail, explanation, and connections.",
        example: "Students answer ‘why’ and ‘how’ prompts and connect the concept to a new context."
    },
    {
        id: "nasot-22",
        focus: "Content",
        number: 22,
        name: "Organising students to interact",
        budget: 1,
        aim: "Use structured interaction so students explain, test, and refine thinking.",
        example: "Think–pair–share with roles (explainer, checker) and a clear success checklist."
    },

    // -------------------------
    // CONTEXT (23–43)
    // -------------------------
    {
        id: "nasot-23",
        focus: "Context",
        number: 23,
        name: "Noticing and reacting when students are not engaged",
        budget: 1,
        aim: "Keep learning on track by responding early to disengagement.",
        example: "Use proximity, quick check-ins, or task re-clarification before behaviour escalates."
    },
    {
        id: "nasot-24",
        focus: "Context",
        number: 24,
        name: "Increasing response rates",
        budget: 2,
        aim: "Get more students thinking and responding more often.",
        example: "Cold-call with support, mini-whiteboards, quick polls, or choral response."
    },
    {
        id: "nasot-25",
        focus: "Context",
        number: 25,
        name: "Using physical movement",
        budget: 1,
        aim: "Boost attention and participation through structured movement.",
        example: "Four corners, gallery walk, stand–pair–share, or move to show agreement."
    },
    {
        id: "nasot-26",
        focus: "Context",
        number: 26,
        name: "Maintaining a lively pace",
        budget: 1,
        aim: "Keep momentum without rushing understanding.",
        example: "Use timers, tight transitions, and short bursts of work with quick resets."
    },
    {
        id: "nasot-27",
        focus: "Context",
        number: 27,
        name: "Demonstrating intensity and enthusiasm",
        budget: 1,
        aim: "Increase motivation through energy, clarity, and presence.",
        example: "Use a confident voice, clear modelling, and purposeful ‘this matters because…’ framing."
    },
    {
        id: "nasot-28",
        focus: "Context",
        number: 28,
        name: "Presenting unusual information",
        budget: 1,
        aim: "Hook attention and curiosity to support learning.",
        example: "Start with a surprising fact, misconception, or unexpected example tied to the goal."
    },
    {
        id: "nasot-29",
        focus: "Context",
        number: 29,
        name: "Using friendly controversy",
        budget: 1,
        aim: "Increase engagement by debating ideas safely and respectfully.",
        example: "Students choose a side, justify, listen to a counter, then refine their position."
    },
    {
        id: "nasot-30",
        focus: "Context",
        number: 30,
        name: "Using academic games",
        budget: 1,
        aim: "Create low-stakes practice with high repetition.",
        example: "Quick quiz game, matching challenge, or timed retrieval round aligned to criteria."
    },
    {
        id: "nasot-31",
        focus: "Context",
        number: 31,
        name: "Providing opportunities to talk about themselves",
        budget: 1,
        aim: "Build connection by linking learning to student experience.",
        example: "Short prompt: ‘Where would you use this in real life?’ then share in pairs."
    },
    {
        id: "nasot-32",
        focus: "Context",
        number: 32,
        name: "Motivating and inspiring students",
        budget: 1,
        aim: "Increase persistence by making the learning feel worthwhile and achievable.",
        example: "Explain purpose, celebrate growth, and set a short ‘you can do this next’ target."
    },
    {
        id: "nasot-33",
        focus: "Context",
        number: 33,
        name: "Establishing rules and procedures",
        budget: 1,
        aim: "Create predictable routines so time stays on learning.",
        example: "Clear start routine, attention signal, and consistent expectations for transitions."
    },
    {
        id: "nasot-34",
        focus: "Context",
        number: 34,
        name: "Organising the physical layout of the classroom",
        budget: 1,
        aim: "Support learning by arranging space for visibility, movement, and collaboration.",
        example: "Seat to reduce distractions, ensure view of instruction, and set clear resource stations."
    },
    {
        id: "nasot-35",
        focus: "Context",
        number: 35,
        name: "Demonstrating withitness",
        budget: 1,
        aim: "Maintain awareness and prevent issues by scanning and intervening early.",
        example: "Scan, circulate, and address off-task behaviour quickly and calmly."
    },
    {
        id: "nasot-36",
        focus: "Context",
        number: 36,
        name: "Acknowledging adherence to rules and procedures",
        budget: 1,
        aim: "Reinforce desired behaviour so it becomes the norm.",
        example: "Name the behaviour: ‘Thanks for starting straight away and keeping voices low.’"
    },
    {
        id: "nasot-37",
        focus: "Context",
        number: 37,
        name: "Acknowledging lack of adherence to rules and procedures",
        budget: 1,
        aim: "Correct behaviour quickly while keeping dignity and learning focus.",
        example: "Private redirection: remind expectation, give a choice, then follow through consistently."
    },
    {
        id: "nasot-38",
        focus: "Context",
        number: 38,
        name: "Using verbal and nonverbal behaviours that indicate affection for students",
        budget: 1,
        aim: "Build trust and belonging through respectful, warm interactions.",
        example: "Greet at the door, use names, calm tone, positive body language, and fair responses."
    },
    {
        id: "nasot-39",
        focus: "Context",
        number: 39,
        name: "Understanding students’ backgrounds and interests",
        budget: 1,
        aim: "Increase relevance and connection by knowing what matters to students.",
        example: "Use context hooks tied to student interests and check what examples land well."
    },
    {
        id: "nasot-40",
        focus: "Context",
        number: 40,
        name: "Displaying objectivity and control",
        budget: 1,
        aim: "Maintain calm authority so students feel safe and learning stays productive.",
        example: "Respond to problems calmly, use neutral language, and apply consequences consistently."
    },
    {
        id: "nasot-41",
        focus: "Context",
        number: 41,
        name: "Demonstrating value and respect for reluctant learners",
        budget: 1,
        aim: "Reduce resistance by showing students you believe they can succeed.",
        example: "Provide a small entry step, praise effort, and offer support without public pressure."
    },
    {
        id: "nasot-42",
        focus: "Context",
        number: 42,
        name: "Asking in-depth questions of reluctant learners",
        budget: 1,
        aim: "Move reluctant students into thinking with supportive questioning.",
        example: "Ask guided questions with options and prompts: ‘Which step would you try first, and why?’"
    },
    {
        id: "nasot-43",
        focus: "Context",
        number: 43,
        name: "Probing incorrect answers with reluctant learners",
        budget: 1,
        aim: "Correct misconceptions without shutting students down.",
        example: "Use ‘tell me your thinking’ then guide: ‘What would happen if…?’ and retry with support."
    },
];

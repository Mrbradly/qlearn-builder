// lib/corellaTables.ts

export type CorellaTableId =
    | "confidence_tracker"
    | "confidence_checker"
    | "whats_the_gap"
    | "memory_dump"
    | "question_ladder"
    | "why_chain"
    | "teach_ai"
    | "missed_it_fix_it"
    | "study_planner"
    | "retrieval_practice"
    | "what_i_think";

export type CorellaTableDef = {
    id: CorellaTableId;
    label: string;
    html: string;
};

/** -------------------------
 *  STYLE: consistent QLearn table look
 *  ------------------------- */
const BASE_TABLE_STYLE =
    "border-collapse:collapse;width:100%;font-family:Arial,sans-serif;font-size:14px;line-height:1.35;";
const CELL_STYLE = "padding:10px;vertical-align:top;";
const HEADER_ROW_STYLE = "background-color:#2f3e4e;color:#ffffff;";
const SUBHEADER_ROW_STYLE = "background-color:#c7cfdb;";
const TYPE_BOX_STYLE =
    "margin-top:8px;padding:10px;border:1px solid #9aa6b2;background-color:#ffffff;border-radius:6px;";

/** Tokens the API route replaces */
const LG_TOKEN = "{{LEARNING_GOAL}}";
const SC_TOKEN = "{{SUCCESS_CRITERIA}}";

export const CORELLA_TABLES: CorellaTableDef[] = [
    {
        id: "confidence_tracker",
        label: "Table 01 — Confidence Tracker (LEARN routine)",
        html: `<!-- =========================================================
TABLE 01 — CONFIDENCE TRACKER (LEARN ROUTINE)
========================================================= -->
<table style="${BASE_TABLE_STYLE}" border="1">
  <tbody>
    <tr style="${HEADER_ROW_STYLE}">
      <td style="width:19%;${CELL_STYLE}"><strong>L &ndash; Learning Focus</strong></td>
      <td style="width:26%;${CELL_STYLE}"><strong>E &ndash; Engage Actively</strong></td>
      <td style="width:20%;${CELL_STYLE}"><strong>A &ndash; Assess</strong></td>
      <td style="width:17%;${CELL_STYLE}"><strong>R &ndash; Record</strong></td>
      <td style="width:18%;${CELL_STYLE}"><strong>N &ndash; Next Move</strong></td>
    </tr>

    <tr style="${SUBHEADER_ROW_STYLE}">
      <td style="${CELL_STYLE}">
        Paste your Learning Goal and Success Criteria. Your purpose is to identify what you need to be confident in before the assessment &mdash; not to check answers or improve yet.
      </td>
      <td style="${CELL_STYLE}">
        The AI will generate a list of key concepts or skills based only on your Learning Goal and Success Criteria. Student-friendly language only. No teaching and no checking your understanding.
      </td>
      <td style="${CELL_STYLE}">
        Copy the list into Excel and rate your confidence:
        <div style="margin-top:8px;">
          🟢 Green &mdash; confident<br/>
          🟡 Amber &mdash; partly confident<br/>
          🔴 Red &mdash; not confident
        </div>
      </td>
      <td style="${CELL_STYLE}">
        This becomes your tracker. It shows where to focus next &mdash; not how well you have done.
      </td>
      <td style="${CELL_STYLE}">
        Use the tracker to plan your next study steps. You are not fixing yet &mdash; just identifying what matters most.
      </td>
    </tr>

    <tr>
      <td style="${CELL_STYLE}">
        <p style="margin:0 0 8px 0;">I am preparing for an assessment.</p>
        <p style="margin:0 0 8px 0;">My goal is to work out what I need to be confident in before the assessment, not to check answers or improve yet.</p>
        <p style="margin:0 0 8px 0;">I will paste my Learning Goal and Success Criteria below.</p>
        <p style="margin:0 0 8px 0;"><strong>Learning Goal:</strong><br/>${LG_TOKEN}</p>
        <p style="margin:0;"><strong>Success Criteria:</strong><br/>${SC_TOKEN}</p>
      </td>

      <td style="${CELL_STYLE}">
        <p style="margin:0 0 8px 0;">Using my Learning Goal and Success Criteria, generate a short list of key concepts or skills I need to be successful.</p>
        <p style="margin:0 0 6px 0;"><strong>Guidelines:</strong></p>
        <ul style="margin:0;padding-left:18px;">
          <li>Use student-friendly language</li>
          <li>Include only what is assessable</li>
          <li>Do not explain the concepts</li>
          <li>Do not assess my understanding</li>
        </ul>
      </td>

      <td style="${CELL_STYLE}">
        Present the list in a format suitable for an Excel table so I can judge my confidence.
      </td>

      <td style="${CELL_STYLE}">
        <p style="margin:0 0 6px 0;">I will:</p>
        <ul style="margin:0 0 8px 0;padding-left:18px;">
          <li>copy the table into Excel</li>
          <li>rate each concept honestly using:</li>
          <li>🟢 Green &mdash; confident</li>
          <li>🟡 Amber &mdash; partly confident</li>
          <li>🔴 Red &mdash; not confident</li>
        </ul>
        <p style="margin:0;">I will not fix anything yet.</p>
      </td>

      <td style="${CELL_STYLE}">
        <p style="margin:0 0 6px 0;"><strong>Remember:</strong></p>
        <p style="margin:0 0 6px 0;">This tracker is not a grade.</p>
        <p style="margin:0;">It helps you decide where to focus next.</p>
      </td>
    </tr>
  </tbody>
</table>`,
    },

    {
        id: "confidence_checker",
        label: "Table 02 — Confidence Checker (Readiness evaluation)",
        html: `<!-- =========================================================
TABLE 02 — CONFIDENCE CHECKER (READINESS EVALUATION)
========================================================= -->
<table style="${BASE_TABLE_STYLE}" border="1">
  <tbody>
    <tr style="${HEADER_ROW_STYLE}">
      <td style="width:19%;${CELL_STYLE}"><strong>L &ndash; Learning Focus</strong></td>
      <td style="width:26%;${CELL_STYLE}"><strong>E &ndash; Engage Actively</strong></td>
      <td style="width:20%;${CELL_STYLE}"><strong>A &ndash; Assess</strong></td>
      <td style="width:17%;${CELL_STYLE}"><strong>R &ndash; Record</strong></td>
      <td style="width:18%;${CELL_STYLE}"><strong>N &ndash; Next Move</strong></td>
    </tr>

    <tr style="${SUBHEADER_ROW_STYLE}">
      <td style="${CELL_STYLE}">
        Choose one concept from your tracker (usually 🔴 or 🟡). Your goal is to check readiness &mdash; not to relearn.
      </td>
      <td style="${CELL_STYLE}">
        The AI asks one short question that directly tests the chosen concept. No hints, no corrections, no teaching.
      </td>
      <td style="${CELL_STYLE}">
        Answer from memory. Then state how confident you feel (1, 2, or 3) and explain why.
      </td>
      <td style="${CELL_STYLE}">
        The AI evaluates whether your understanding is ready, partly ready, or not ready, and whether your confidence should stay the same or change. No reteaching.
      </td>
      <td style="${CELL_STYLE}">
        When you type <strong>STOP</strong>, the AI completes a table using your words only.
      </td>
    </tr>

    <tr>
      <td style="${CELL_STYLE}">
        <p style="margin:0 0 8px 0;">I am checking whether my confidence matches reality.</p>
        <p style="margin:0 0 8px 0;">I am not relearning yet &mdash; I am checking readiness.</p>
        <p style="margin:0 0 8px 0;">I will choose one concept from my Excel tracker (usually Amber or Red).</p>
        <p style="margin:0 0 8px 0;"><strong>Learning Goal:</strong><br/>${LG_TOKEN}</p>
        <p style="margin:0;"><strong>Success Criteria:</strong><br/>${SC_TOKEN}</p>
      </td>

      <td style="${CELL_STYLE}">
        <p style="margin:0 0 8px 0;">You are a readiness evaluator, not a teacher.</p>
        <p style="margin:0 0 8px 0;">Ask one short question that directly tests the concept.</p>
        <p style="margin:0 0 6px 0;"><strong>Rules:</strong></p>
        <ul style="margin:0;padding-left:18px;">
          <li>Do not explain</li>
          <li>Do not correct</li>
          <li>Do not give hints</li>
        </ul>
      </td>

      <td style="${CELL_STYLE}">
        <p style="margin:0 0 8px 0;">I will answer from memory, without notes or research.</p>
        <p style="margin:0 0 6px 0;">After I answer:</p>
        <ul style="margin:0 0 8px 0;padding-left:18px;">
          <li>ask me to state my confidence (1, 2, or 3)</li>
          <li>ask me to briefly explain why</li>
        </ul>
        <p style="margin:0 0 8px 0;">This shows what I can do under light assessment-style pressure.</p>
        <div style="${TYPE_BOX_STYLE}"><em>Type my answer here</em></div>
      </td>

      <td style="${CELL_STYLE}">
        <p style="margin:0 0 6px 0;">Using my answer and reasoning:</p>
        <ul style="margin:0 0 8px 0;padding-left:18px;">
          <li>judge readiness (ready / partly ready / not ready)</li>
          <li>decide whether my confidence should change</li>
        </ul>
        <p style="margin:0;">Do not reteach the content.</p>
      </td>

      <td style="${CELL_STYLE}">
        <p style="margin:0 0 8px 0;"><strong>When I type STOP:</strong></p>
        <ul style="margin:0 0 10px 0;padding-left:18px;">
          <li>use only what I have said</li>
          <li>complete the table below</li>
          <li>clearly separate student judgement from Corella evaluation</li>
          <li>do not explain or add new information</li>
          <li>output the table only</li>
        </ul>

        <p style="margin:0 0 6px 0;"><strong>Confidence scale (numbers only):</strong></p>
        <div style="margin:0 0 8px 0;">
          1 = 🔴 Red (not ready)<br/>
          2 = 🟡 Amber (partly ready)<br/>
          3 = 🟢 Green (ready)
        </div>

        <p style="margin:0 0 6px 0;"><strong>Table columns (in order):</strong></p>
        <div style="margin:0 0 8px 0;">
          Concept / Skill<br/>
          Self-Confidence (Before)<br/>
          Student Reasoning<br/>
          Self-Confidence (After)<br/>
          Corella Confidence Evaluation<br/>
          Next Steps
        </div>

        <p style="margin:0 0 6px 0;"><strong>Column rules:</strong></p>
        <ul style="margin:0;padding-left:18px;">
          <li><em>Self-Confidence (Before)</em> &rarr; number only (1&ndash;3)</li>
          <li><em>Student Reasoning</em> &rarr; why the student felt confident or unsure</li>
          <li><em>Self-Confidence (After)</em> &rarr; number only (1&ndash;3), stated by the student</li>
          <li><em>Corella Confidence Evaluation</em> &rarr; judgement based on clarity and gaps (not content)</li>
          <li><em>Next Steps</em> &rarr; one clear action to improve readiness</li>
        </ul>

        <p style="margin:8px 0 0 0;">If information is missing, leave the cell blank.</p>
      </td>
    </tr>
  </tbody>
</table>`,
    },

    {
        id: "whats_the_gap",
        label: "Table 03 — What’s the Gap? (LEARN gap analysis)",
        html: `<!-- =========================================================
TABLE 03 — WHAT’S THE GAP? (LEARN GAP ANALYSIS)
========================================================= -->
<table style="${BASE_TABLE_STYLE}" border="1">
  <tbody>
    <tr style="${HEADER_ROW_STYLE}">
      <td style="width:16%;${CELL_STYLE}"><strong>L &ndash; Learning Focus</strong></td>
      <td style="width:22%;${CELL_STYLE}"><strong>E &ndash; Engage Actively</strong></td>
      <td style="width:25%;${CELL_STYLE}"><strong>A &ndash; Assess</strong></td>
      <td style="width:17%;${CELL_STYLE}"><strong>R &ndash; Record</strong></td>
      <td style="width:20%;${CELL_STYLE}"><strong>N &ndash; Next Move</strong></td>
    </tr>

    <tr style="${SUBHEADER_ROW_STYLE}">
      <td style="${CELL_STYLE}">
        Paste your Learning Goal and Success Criteria. Your focus is understanding what success looks like, not being perfect.
      </td>
      <td style="${CELL_STYLE}">
        Write what you currently think you know. Do not check notes or fix anything. The AI will not correct or rewrite your words.
      </td>
      <td style="${CELL_STYLE}">
        The AI compares your response to the Success Criteria and tells you:
        <ul style="margin:6px 0 0 18px;padding:0;">
          <li>What you have met</li>
          <li>What you have partly met</li>
          <li>What you have not met yet</li>
        </ul>
        Each gap is labelled as vocab, step, reason, or example.
      </td>
      <td style="${CELL_STYLE}">
        For each gap, the AI asks one targeted question at a time to help you build understanding. No answers or rewriting are provided.
      </td>
      <td style="${CELL_STYLE}">
        To lock in learning, the AI asks brief reflection questions and then produces one Excel-ready table using only your words.
      </td>
    </tr>

    <tr>
      <td style="${CELL_STYLE}">
        <p style="margin:0 0 8px 0;"><strong>Learning Goal and Success Criteria</strong></p>
        <p style="margin:0 0 8px 0;">${LG_TOKEN}</p>
        <p style="margin:0 0 10px 0;">${SC_TOKEN}</p>
        <p style="margin:0 0 6px 0;">My purpose is to:</p>
        <ul style="margin:0 0 8px 0;padding-left:18px;">
          <li>understand what the learning is aiming toward</li>
          <li>compare my thinking to what success looks like</li>
          <li>identify exactly where my understanding breaks down</li>
        </ul>
        <p style="margin:0;">I am not trying to be perfect yet. I am trying to find the gap.</p>
      </td>

      <td style="${CELL_STYLE}">
        <p style="margin:0 0 8px 0;"><strong>My current thinking</strong></p>
        <div style="${TYPE_BOX_STYLE}"><em>Type or paste your understanding here</em></div>
        <p style="margin:8px 0 0 0;">I am not researching or checking notes.</p>
        <p style="margin:6px 0 0 0;">Do not correct or rewrite my response.</p>
      </td>

      <td style="${CELL_STYLE}">
        <p style="margin:0 0 8px 0;">Evaluate my response against the Learning Goal and Success Criteria.</p>
        <p style="margin:0 0 6px 0;">You must clearly identify:</p>
        <ul style="margin:0 0 8px 0;padding-left:18px;">
          <li>Success Criteria I have met</li>
          <li>Success Criteria I have partly met</li>
          <li>Success Criteria I have not met yet</li>
        </ul>
        <p style="margin:0 0 6px 0;">Label each gap as one only:</p>
        <ul style="margin:0 0 8px 0;padding-left:18px;">
          <li>vocab &ndash; missing word meaning</li>
          <li>step &ndash; missing procedure</li>
          <li>reason &ndash; missing concept</li>
          <li>example &ndash; missing application</li>
        </ul>
        <p style="margin:0;">Briefly explain how each gap blocks the Learning Goal. Do not ask questions yet.</p>
      </td>

      <td style="${CELL_STYLE}">
        <p style="margin:0 0 6px 0;">Help me build a small bridge, not the full solution.</p>
        <p style="margin:0 0 6px 0;">Ask one targeted question at a time for each gap.</p>
        <ul style="margin:0 0 8px 0;padding-left:18px;">
          <li>The question must match the gap type</li>
          <li>Wait for my response before continuing</li>
        </ul>
        <p style="margin:0;">Do not give answers or rewrite my work.</p>
      </td>

      <td style="${CELL_STYLE}">
        <p style="margin:0 0 6px 0;">Help me lock in learning.</p>
        <p style="margin:0 0 6px 0;">Ask short reflection questions, then output one table only, formatted for Excel.</p>
        <p style="margin:0 0 6px 0;"><strong>Rules:</strong></p>
        <ul style="margin:0 0 8px 0;padding-left:18px;">
          <li>Do not explain</li>
          <li>Do not correct wording</li>
          <li>Do not add new information</li>
        </ul>
        <p style="margin:0 0 6px 0;">The table must include, in order:</p>
        <div>
          Success Criterion<br/>
          Gap Type (vocab / step / reason / example)<br/>
          What Was Missing<br/>
          What I Understand Now<br/>
          Next Small Step
        </div>
      </td>
    </tr>
  </tbody>
</table>`,
    },

    {
        id: "memory_dump",
        label: "Table 04 — Open the memory dump (brain dump review)",
        html: `<!-- =========================================================
TABLE 04 — OPEN THE MEMORY DUMP (BRAIN DUMP REVIEW)
========================================================= -->
<table style="${BASE_TABLE_STYLE}" border="1">
  <tbody>
    <tr style="${HEADER_ROW_STYLE}">
      <td style="width:19%;${CELL_STYLE}"><strong>L &ndash; Learning Focus</strong></td>
      <td style="width:26%;${CELL_STYLE}"><strong>E &ndash; Engage Actively</strong></td>
      <td style="width:20%;${CELL_STYLE}"><strong>A &ndash; Assess</strong></td>
      <td style="width:17%;${CELL_STYLE}"><strong>R &ndash; Record</strong></td>
      <td style="width:18%;${CELL_STYLE}"><strong>N &ndash; Next Move</strong></td>
    </tr>

    <tr style="${SUBHEADER_ROW_STYLE}">
      <td style="${CELL_STYLE}">
        Paste your Learning Goal and Success Criteria. These guide everything. Your purpose is to see what you already understand, what is unclear, and what matters most right now.
      </td>
      <td style="${CELL_STYLE}">
        Write a brain dump in 2&ndash;5 minutes. Do not use notes. Do not organise. Just get your thinking out. Messy is fine.
      </td>
      <td style="${CELL_STYLE}">
        The AI compares your brain dump to the Success Criteria and tells you:
        <ul style="margin:6px 0 0 18px;padding:0;">
          <li>what you have demonstrated</li>
          <li>what you have partly demonstrated</li>
          <li>what you have not demonstrated yet</li>
        </ul>
        No questions, no corrections, and no added content yet.
      </td>
      <td style="${CELL_STYLE}">
        The AI asks questions only for criteria that were partly met or not yet met. One question at a time. Criteria already met are not revisited.
      </td>
      <td style="${CELL_STYLE}">
        After you respond, the AI provides sentence starters to help you write one clear paragraph explaining what you now understand and how your thinking improved.
      </td>
    </tr>

    <tr>
      <td style="${CELL_STYLE}">
        <p style="margin:0 0 8px 0;"><strong>My Learning Goal:</strong><br/>${LG_TOKEN}</p>
        <p style="margin:0 0 8px 0;"><strong>My Success Criteria:</strong><br/>${SC_TOKEN}</p>
        <p style="margin:0 0 8px 0;">Read the Learning Goal and Success Criteria carefully.</p>
        <p style="margin:0 0 6px 0;">My purpose is to clearly see:</p>
        <ul style="margin:0 0 8px 0;padding-left:18px;">
          <li>what I already understand</li>
          <li>what is missing or confusing</li>
          <li>what matters most right now</li>
        </ul>
        <p style="margin:0 0 6px 0;"><strong>Important rules for Corella:</strong></p>
        <ul style="margin:0;padding-left:18px;">
          <li>❌ Do not give answers</li>
          <li>❌ Do not rewrite my work</li>
          <li>❌ Do not add new content</li>
          <li>❌ Do not go beyond the Success Criteria</li>
          <li>✅ Ask questions, wait for my responses, then output the table</li>
        </ul>
      </td>

      <td style="${CELL_STYLE}">
        <p style="margin:0 0 8px 0;"><strong>Corella prompt:</strong></p>
        <p style="margin:0 0 8px 0;">Here is my brain dump (written in 2&ndash;5 minutes, no notes, no organising):</p>
        <div style="${TYPE_BOX_STYLE}"><em>Paste your full brain dump here &mdash; messy, unfinished ideas are expected</em></div>
        <p style="margin:8px 0 0 0;">Do not fix, rewrite, or improve it.</p>
      </td>

      <td style="${CELL_STYLE}">
        <p style="margin:0 0 8px 0;">Using only my Learning Goal and Success Criteria:</p>
        <ul style="margin:0 0 8px 0;padding-left:18px;">
          <li>Tell me which Success Criteria I have already demonstrated</li>
          <li>Tell me which Success Criteria I have partly demonstrated</li>
          <li>Tell me which Success Criteria I have not demonstrated yet</li>
        </ul>
        <p style="margin:0;">Do not ask questions yet. Do not give answers. Do not add new content.</p>
      </td>

      <td style="${CELL_STYLE}">
        <p style="margin:0 0 6px 0;">Help me improve only where it is needed.</p>
        <p style="margin:0 0 6px 0;">Ask questions only for Success Criteria that were:</p>
        <ul style="margin:0 0 8px 0;padding-left:18px;">
          <li>partly demonstrated, or</li>
          <li>not yet demonstrated</li>
        </ul>
        <p style="margin:0;">Ask one question at a time. Wait for my response before continuing. Do not revisit criteria I already met.</p>
      </td>

      <td style="${CELL_STYLE}">
        <p style="margin:0 0 6px 0;">After I respond:</p>
        <ul style="margin:0 0 8px 0;padding-left:18px;">
          <li>Give me sentence starters only to help me write one clear paragraph explaining what I now understand and how my thinking improved.</li>
          <li>Then output one reflection table, formatted for Excel.</li>
        </ul>
        <p style="margin:0 0 6px 0;">Do not explain. Do not correct my wording. Do not add new information.</p>
        <p style="margin:0 0 6px 0;"><strong>The table must include, in this exact order:</strong></p>
        <div>
          Success Criterion<br/>
          My Confidence (🟢 / 🟡 / 🔴)<br/>
          Evidence (What I can do now)<br/>
          One Thing That Improved<br/>
          Next Step
        </div>
      </td>
    </tr>
  </tbody>
</table>`,
    },

    {
        id: "question_ladder",
        label: "Table 05 — Question Ladder (one question at a time)",
        html: `<!-- =========================================================
TABLE 05 — QUESTION LADDER (ONE QUESTION AT A TIME)
========================================================= -->
<table style="${BASE_TABLE_STYLE}" border="1">
  <tbody>
    <tr style="${HEADER_ROW_STYLE}">
      <td style="width:15%;${CELL_STYLE}"><strong>L &ndash; Learning Focus</strong></td>
      <td style="width:28%;${CELL_STYLE}"><strong>E &ndash; Engage Actively</strong></td>
      <td style="width:21%;${CELL_STYLE}"><strong>A &ndash; Assess</strong></td>
      <td style="width:16%;${CELL_STYLE}"><strong>R &ndash; Record</strong></td>
      <td style="width:20%;${CELL_STYLE}"><strong>N &ndash; Next Move</strong></td>
    </tr>

    <tr style="${SUBHEADER_ROW_STYLE}">
      <td style="${CELL_STYLE}">
        Paste your Learning Goal and Success Criteria. The Learning Goal is the top of your ladder and defines what you are aiming to understand.
      </td>
      <td style="${CELL_STYLE}">
        The AI will ask one opening question to check your starting understanding. It will then ask one question at a time, each based on your previous answer. Questions increase in difficulty from identifying to explaining, reasoning, analysing, and applying. Continue answering until you type STOP.
      </td>
      <td style="${CELL_STYLE}">
        After each answer, the AI silently decides whether you are ready to move up the ladder. If you are, it asks a more challenging question. If not, it stays on the same level with a follow-up. You will not be told which.
      </td>
      <td style="${CELL_STYLE}">
        When you type STOP, write a short overview in your own words. Your overview must explain what you now understand and how it links to the Learning Goal and Success Criteria.
      </td>
      <td style="${CELL_STYLE}">
        The AI will generate one table you can copy into Excel, using only your words.
      </td>
    </tr>

    <tr>
      <td style="${CELL_STYLE}">
        <p style="margin:0 0 8px 0;"><strong>Table structure:</strong></p>
        <div style="margin:0 0 10px 0;">
          Learning Goal<br/>
          Success Criteria Addressed<br/>
          Question Ladder (Questions Asked)<br/>
          Student Overview
        </div>
        <p style="margin:0 0 8px 0;"><strong>Learning Goal:</strong><br/>${LG_TOKEN}</p>
        <p style="margin:0;"><strong>Success Criteria:</strong><br/>${SC_TOKEN}</p>
        <p style="margin:8px 0 0 0;">Use the Learning Goal and Success Criteria to decide what success looks like. Choose the Learning Goal as the top of the ladder. Ask one opening question to check my starting understanding.</p>
      </td>

      <td style="${CELL_STYLE}">
        <p style="margin:0 0 6px 0;">Ask one question at a time. Each question must:</p>
        <ul style="margin:0 0 8px 0;padding-left:18px;">
          <li>build directly on my previous answer</li>
          <li>increase in difficulty or cognitive demand</li>
          <li>move closer to meeting the Success Criteria</li>
        </ul>
        <p style="margin:0;">Progress from identifying &rarr; explaining &rarr; reasoning &rarr; analysing &rarr; applying. Wait for my response before continuing. Continue until I type STOP.</p>
      </td>

      <td style="${CELL_STYLE}">
        <p style="margin:0 0 6px 0;">After each response, silently decide whether my answer is strong enough to move up.</p>
        <ul style="margin:0;padding-left:18px;">
          <li>If yes: ask a more challenging question</li>
          <li>If no: ask a follow-up that stays on the same rung</li>
        </ul>
        <p style="margin:8px 0 0 0;">Do not tell me your judgement.</p>
      </td>

      <td style="${CELL_STYLE}">
        <p style="margin:0 0 6px 0;">When I type STOP, prompt me to write:</p>
        <div style="${TYPE_BOX_STYLE}">
          <em>“Using your own words, explain what you now understand and how it links to the Learning Goal and Success Criteria.”</em>
        </div>
        <p style="margin:8px 0 0 0;">Do not help write the overview. Do not add new information.</p>
      </td>

      <td style="${CELL_STYLE}">
        <p style="margin:0 0 6px 0;">After I write my overview, output only one table.</p>
        <p style="margin:0 0 6px 0;">The table must be Excel-ready and contain, in this order:</p>
        <div>
          Learning Goal<br/>
          Success Criteria Addressed<br/>
          Question Ladder (Questions Asked)<br/>
          Student Overview
        </div>
        <p style="margin:8px 0 0 0;">Use my words only. Do not correct or improve them.</p>
      </td>
    </tr>
  </tbody>
</table>`,
    },

    {
        id: "why_chain",
        label: "Table 06 — Why Chain (deepen with “why?”)",
        html: `<!-- =========================================================
TABLE 06 — WHY CHAIN (DEEPEN WITH “WHY?”)
========================================================= -->
<table style="${BASE_TABLE_STYLE}" border="1">
  <tbody>
    <tr style="${HEADER_ROW_STYLE}">
      <td style="width:14.5%;${CELL_STYLE}"><strong>L &ndash; Learning Focus</strong></td>
      <td style="width:28%;${CELL_STYLE}"><strong>E &ndash; Engage Actively</strong></td>
      <td style="width:20.9%;${CELL_STYLE}"><strong>A &ndash; Assess</strong></td>
      <td style="width:16.4%;${CELL_STYLE}"><strong>R &ndash; Record</strong></td>
      <td style="width:20.2%;${CELL_STYLE}"><strong>N &ndash; Next Move</strong></td>
    </tr>

    <tr style="${SUBHEADER_ROW_STYLE}">
      <td style="${CELL_STYLE}">
        Paste your Learning Goal and Success Criteria. These will guide what you need to explain, not just recall.
      </td>
      <td style="${CELL_STYLE}">
        The AI will pick one key concept connected to your goal. It will ask you one “why” question. After each answer, it will ask a deeper “why” &mdash; always based on what you just said. It will not explain, correct, or add anything new. This continues until you type STOP.
      </td>
      <td style="${CELL_STYLE}">
        When you type STOP, reflect: Is your understanding deeper now? Which Success Criteria do you now understand better? The AI will not judge &mdash; you decide.
      </td>
      <td style="${CELL_STYLE}">
        Write one paragraph in your own words explaining your current understanding of the concept. The AI will not add or fix anything. Your words only.
      </td>
      <td style="${CELL_STYLE}">
        The AI will fill out this table using only what you said:<br/>
        <span style="font-family:monospace;">| Learning Goal | Success Criteria Addressed | Concept Explored | Key Why Insights | New Understanding (Summary) |</span>
      </td>
    </tr>

    <tr>
      <td style="${CELL_STYLE}">
        <p style="margin:0 0 8px 0;">Here are my Learning Goal and Success Criteria.</p>
        <p style="margin:0 0 8px 0;">My purpose is to use these to guide what I need to explain about my learning, not just what I need to remember.</p>
        <p style="margin:0 0 8px 0;"><strong>Learning Goal:</strong><br/>${LG_TOKEN}</p>
        <p style="margin:0;"><strong>Success Criteria:</strong><br/>${SC_TOKEN}</p>
      </td>

      <td style="${CELL_STYLE}">
        <p style="margin:0 0 6px 0;">You are acting as a Why Chain Questioner.</p>
        <p style="margin:0 0 6px 0;">Your role is to ONLY ask questions.</p>
        <p style="margin:0 0 6px 0;"><strong>Strict rules:</strong></p>
        <ul style="margin:0 0 8px 0;padding-left:18px;">
          <li>❌ Do NOT explain</li>
          <li>❌ Do NOT define</li>
          <li>❌ Do NOT teach</li>
          <li>❌ Do NOT summarise</li>
          <li>❌ Do NOT introduce new terms, concepts, or examples unless I use them first</li>
        </ul>
        <p style="margin:0 0 6px 0;">Using my Learning Goal and Success Criteria:</p>
        <ul style="margin:0;padding-left:18px;">
          <li>Select one key concept or idea linked to them</li>
          <li>Ask me one “why” question about that concept</li>
        </ul>
      </td>

      <td style="${CELL_STYLE}">
        <p style="margin:0 0 6px 0;">After each answer I give:</p>
        <ul style="margin:0 0 8px 0;padding-left:18px;">
          <li>Respond with ONLY another “why” question</li>
          <li>Each new “why” must build directly on what I just said</li>
          <li>Do not change role or provide feedback</li>
        </ul>
        <p style="margin:0;">Continue this Why Chain until I type STOP.</p>
      </td>

      <td style="${CELL_STYLE}">
        <p style="margin:0 0 6px 0;">When I type STOP:</p>
        <ul style="margin:0 0 8px 0;padding-left:18px;">
          <li>Return to my Learning Goal and Success Criteria</li>
          <li>Prompt me to decide whether my understanding is deeper than before</li>
          <li>Ask me to identify which Success Criteria I now understand more clearly</li>
        </ul>
        <p style="margin:0 0 8px 0;">Do not evaluate or correct my judgement.</p>
        <p style="margin:0 0 6px 0;">Using my Learning Goal and Success Criteria, ask me to write one paragraph that explains my current understanding.</p>
        <p style="margin:0 0 6px 0;"><strong>Rules:</strong></p>
        <ul style="margin:0;padding-left:18px;">
          <li>Use my own words</li>
          <li>Do not re-teach content</li>
          <li>Do not add new information</li>
        </ul>
        <p style="margin:8px 0 0 0;">Your role is to prompt explanation, not to explain for me.</p>
      </td>

      <td style="${CELL_STYLE}">
        <p style="margin:0 0 6px 0;"><strong>Learning Record (Output)</strong></p>
        <p style="margin:0 0 6px 0;">Using only what I have said, complete the table below.</p>
        <p style="margin:0 0 6px 0;">Output the table only (no explanations outside the table).</p>
        <div style="font-family:monospace;margin-bottom:8px;">
          | Learning Goal | Success Criteria Addressed | Concept Explored | Key Why Insights | New Understanding (Summary) |
        </div>
        <p style="margin:0 0 6px 0;"><strong>Rules:</strong></p>
        <ul style="margin:0;padding-left:18px;">
          <li>Use my words wherever possible</li>
          <li>Do not correct my responses</li>
          <li>Do not add new information</li>
          <li>If information is missing, leave the cell blank</li>
        </ul>
      </td>
    </tr>
  </tbody>
</table>`,
    },

    {
        id: "teach_ai",
        label: "Table 07 — Teach AI (Corella as curious student)",
        html: `<!-- =========================================================
TABLE 07 — TEACH AI (CORELLA AS CURIOUS STUDENT)
========================================================= -->
<table style="${BASE_TABLE_STYLE}" border="1">
  <tbody>
    <tr style="${HEADER_ROW_STYLE}">
      <td style="width:17.6%;${CELL_STYLE}"><strong>L &ndash; Learning Focus</strong></td>
      <td style="width:25.4%;${CELL_STYLE}"><strong>E &ndash; Engage Actively</strong></td>
      <td style="width:17.0%;${CELL_STYLE}"><strong>A &ndash; Assess</strong></td>
      <td style="width:20.0%;${CELL_STYLE}"><strong>R &ndash; Record</strong></td>
      <td style="width:20.0%;${CELL_STYLE}"><strong>N &ndash; Next Move</strong></td>
    </tr>

    <tr style="${SUBHEADER_ROW_STYLE}">
      <td style="${CELL_STYLE}">
        Start by pasting your Learning Goal and Success Criteria. These will guide what you explain, not just what you remember.
      </td>
      <td style="${CELL_STYLE}">
        The AI will choose one key concept linked to your goal. Teach it from the beginning, as if you’re explaining it to a learner.
      </td>
      <td style="${CELL_STYLE}">
        As you teach, the AI will ask questions if things are unclear or confusing. It will act like a curious student &mdash; not a teacher.
      </td>
      <td style="${CELL_STYLE}">
        After STOP, write one paragraph in your own words explaining what you now understand about the concept.
      </td>
      <td style="${CELL_STYLE}">
        The AI will complete a table based on what you taught, where you hesitated, and what you said you understand.
      </td>
    </tr>

    <tr>
      <td style="${CELL_STYLE}">
        <p style="margin:0 0 8px 0;">Here are my Learning Goal and Success Criteria.</p>
        <p style="margin:0 0 8px 0;">My purpose is to guide what I need to explain, not just what I need to remember.</p>
        <p style="margin:0 0 8px 0;">${LG_TOKEN}</p>
        <p style="margin:0;">${SC_TOKEN}</p>
      </td>

      <td style="${CELL_STYLE}">
        <p style="margin:0 0 6px 0;">Corella, take the role of a student learner.</p>
        <p style="margin:0 0 6px 0;">Select one concept that:</p>
        <ul style="margin:0 0 8px 0;padding-left:18px;">
          <li>clearly links to the Learning Goal and Success Criteria</li>
          <li>is important for showing understanding</li>
        </ul>
        <p style="margin:0;">Please select the concept yourself.</p>
      </td>

      <td style="${CELL_STYLE}">
        <p style="margin:0 0 6px 0;">Ask me to teach the selected concept from the beginning.</p>
        <p style="margin:0 0 6px 0;">As I teach, respond only as a learner by:</p>
        <ul style="margin:0 0 8px 0;padding-left:18px;">
          <li>asking questions when something is unclear</li>
          <li>noticing steps that seem missing or confusing</li>
        </ul>
        <p style="margin:0;">Continue this learning conversation until I type STOP.</p>
      </td>

      <td style="${CELL_STYLE}">
        <p style="margin:0 0 6px 0;">Return to the Learning Goal and Success Criteria.</p>
        <p style="margin:0 0 6px 0;">Using them, ask me to:</p>
        <ul style="margin:0 0 8px 0;padding-left:18px;">
          <li>write one clear paragraph, in my own words</li>
          <li>explain my current understanding of the concept</li>
        </ul>
        <div style="${TYPE_BOX_STYLE}"><em>Type my answer here</em></div>
      </td>

      <td style="${CELL_STYLE}">
        <p style="margin:0 0 6px 0;">Next, complete a reflection table based on my Learning Goal and Success Criteria.</p>
        <p style="margin:0 0 6px 0;">Use only the information I have already provided during this session, including:</p>
        <ul style="margin:0 0 8px 0;padding-left:18px;">
          <li>what I taught</li>
          <li>where I hesitated or needed clarification</li>
          <li>what I said I now understand</li>
        </ul>
        <p style="margin:0 0 6px 0;">Complete the table for me.</p>
        <p style="margin:0 0 6px 0;">Use my words wherever possible.</p>
        <p style="margin:0 0 6px 0;">If information is missing, leave the cell blank.</p>
        <p style="margin:0 0 6px 0;">Output the table only (no explanations).</p>
        <p style="margin:0 0 6px 0;"><strong>Table columns (exact order)</strong></p>
        <ul style="margin:0;padding-left:18px;">
          <li>Learning Goal</li>
          <li>Success Criteria Addressed</li>
          <li>Concept Taught</li>
          <li>Teaching Gaps Noticed</li>
          <li>New Understanding (Summary)</li>
        </ul>
      </td>
    </tr>
  </tbody>
</table>`,
    },

    {
        id: "missed_it_fix_it",
        label: "Table 08 — Missed it? Fix it! (one question you got wrong)",
        html: `<!-- =========================================================
TABLE 08 — MISSED IT? FIX IT! (ONE QUESTION YOU GOT WRONG)
========================================================= -->
<table style="${BASE_TABLE_STYLE}" border="1">
  <tbody>
    <tr style="${HEADER_ROW_STYLE}">
      <td style="width:19%;${CELL_STYLE}"><strong>L &ndash; Learning Focus</strong></td>
      <td style="width:25%;${CELL_STYLE}"><strong>E &ndash; Engage Actively</strong></td>
      <td style="width:18%;${CELL_STYLE}"><strong>A &ndash; Assess</strong></td>
      <td style="width:18%;${CELL_STYLE}"><strong>R &ndash; Record</strong></td>
      <td style="width:20%;${CELL_STYLE}"><strong>N &ndash; Next Move</strong></td>
    </tr>

    <tr style="${SUBHEADER_ROW_STYLE}">
      <td style="${CELL_STYLE}">
        You are analysing one mistake using your Learning Goal and Success Criteria. The purpose is to identify what you missed, why, and what to change next time.
      </td>
      <td style="${CELL_STYLE}">
        The AI checks your original response against the Success Criteria. It identifies one unmet criterion and the type of thinking slip. No teaching. No answers.
      </td>
      <td style="${CELL_STYLE}">
        Choose your responses:<br/><br/>
        Thinking slip: mixed up ideas, misread, word meaning, guessed, not sure<br/>
        Confidence: 1 = 🔴, 2 = 🟡, 3 = 🟢<br/><br/>
        Only these responses are allowed.
      </td>
      <td style="${CELL_STYLE}">
        Fix only the part linked to the missed Success Criterion. Explain your new thinking and write one short reminder for next time.
      </td>
      <td style="${CELL_STYLE}">
        When you type <strong>STOP</strong>, the AI outputs a table with:<br/><br/>
        Learning Goal<br/>
        Success Criterion Fixed<br/>
        Thinking Slip Chosen<br/>
        What Changed in My Thinking<br/>
        Why This Will Help Next Time
      </td>
    </tr>

    <tr>
      <td style="${CELL_STYLE}">
        <p style="margin:0 0 8px 0;">I am analysing one mistake. I am not relearning the topic.</p>
        <p style="margin:0 0 6px 0;">My goal is to identify:</p>
        <ul style="margin:0 0 8px 0;padding-left:18px;">
          <li>which Success Criterion I missed</li>
          <li>why my thinking did not meet it</li>
          <li>what I need to adjust next time</li>
        </ul>
        <p style="margin:0 0 8px 0;"><strong>Learning Goal:</strong><br/>${LG_TOKEN}</p>
        <p style="margin:0;"><strong>Success Criteria:</strong><br/>${SC_TOKEN}</p>
      </td>

      <td style="${CELL_STYLE}">
        <p style="margin:0 0 6px 0;">You are an alignment checker, not a teacher. Use only:</p>
        <ul style="margin:0 0 8px 0;padding-left:18px;">
          <li>the Learning Goal</li>
          <li>the Success Criteria</li>
          <li>my original response</li>
        </ul>
        <p style="margin:0 0 6px 0;">You must:</p>
        <ul style="margin:0 0 8px 0;padding-left:18px;">
          <li>identify one unmet Success Criterion</li>
          <li>identify the thinking slip type</li>
        </ul>
        <p style="margin:0 0 6px 0;"><strong>Rules:</strong></p>
        <ul style="margin:0;padding-left:18px;">
          <li>Do not explain the concept</li>
          <li>Do not give model answers</li>
          <li>Do not reteach content</li>
          <li>Do not add new information</li>
        </ul>
      </td>

      <td style="${CELL_STYLE}">
        <p style="margin:0 0 6px 0;">Ask me to respond to both prompts:</p>
        <p style="margin:0 0 6px 0;">1. Which option best describes your thinking slip?</p>
        <ul style="margin:0 0 8px 0;padding-left:18px;">
          <li>I mixed up two similar ideas</li>
          <li>I misunderstood the question</li>
          <li>I knew the word but not its meaning</li>
          <li>I guessed</li>
          <li>I’m not sure yet</li>
        </ul>
        <p style="margin:0 0 6px 0;">2. How confident am I now? (Reply with 1, 2, or 3 only)</p>
        <p style="margin:0 0 6px 0;"><strong>Confidence scale:</strong></p>
        <div style="margin:0 0 8px 0;">
          1 = 🔴 Not meeting it<br/>
          2 = 🟡 Partly meeting it<br/>
          3 = 🟢 Meeting it
        </div>
        <p style="margin:0 0 8px 0;">If my response is invalid, ask me to re-enter it and do nothing else.</p>
        <div style="${TYPE_BOX_STYLE}"><em>Type my answer here</em></div>
      </td>

      <td style="${CELL_STYLE}">
        <p style="margin:0 0 6px 0;">I will:</p>
        <ul style="margin:0 0 8px 0;padding-left:18px;">
          <li>redo only the part linked to the missed Success Criterion</li>
          <li>apply the corrected thinking in my own words</li>
          <li>write one short reminder for next time</li>
        </ul>
        <p style="margin:0 0 6px 0;">You may check:</p>
        <ul style="margin:0 0 8px 0;padding-left:18px;">
          <li>whether my fix aligns with the Success Criterion</li>
          <li>whether my thinking has changed</li>
        </ul>
        <p style="margin:0;">Do not teach new content. If my response is incomplete, wait for my next message.</p>
      </td>

      <td style="${CELL_STYLE}">
        <p style="margin:0 0 6px 0;">When I type STOP, output only this table:</p>
        <div style="margin:0 0 8px 0;">
          Learning Goal<br/>
          Success Criterion Fixed<br/>
          Thinking Slip Chosen<br/>
          What Changed in My Thinking<br/>
          Why This Will Help Next Time
        </div>
        <p style="margin:0 0 6px 0;"><strong>Rules:</strong></p>
        <ul style="margin:0;padding-left:18px;">
          <li>Use only what I have said</li>
          <li>Keep each cell short and clear</li>
          <li>Do not add new content or teaching</li>
        </ul>
      </td>
    </tr>
  </tbody>
</table>`,
    },

    {
        id: "study_planner",
        label: "Table 09 — Study Planner (Corella)",
        html: `<!-- =========================================================
TABLE 09 — STUDY PLANNER (CORELLA)
========================================================= -->
<table style="${BASE_TABLE_STYLE}" border="1">
  <tbody>
    <tr style="${HEADER_ROW_STYLE}">
      <td style="width:17%;${CELL_STYLE}"><strong>L &ndash; Learning Focus</strong></td>
      <td style="width:25%;${CELL_STYLE}"><strong>E &ndash; Engage Actively</strong></td>
      <td style="width:17%;${CELL_STYLE}"><strong>A &ndash; Assess</strong></td>
      <td style="width:20%;${CELL_STYLE}"><strong>R &ndash; Record</strong></td>
      <td style="width:21%;${CELL_STYLE}"><strong>N &ndash; Next Steps</strong></td>
    </tr>

    <tr style="${SUBHEADER_ROW_STYLE}">
      <td style="${CELL_STYLE}">
        Paste the Learning Goal and Success Criteria, restate the goal in student-friendly language, and identify the type of thinking required.
      </td>
      <td style="${CELL_STYLE}">
        Choose one clear focus and a small study action, guided by the Success Criteria.
      </td>
      <td style="${CELL_STYLE}">
        Check your understanding, compare it to the Success Criteria, and rate it as Got it, Shaky, or Not yet.
      </td>
      <td style="${CELL_STYLE}">
        Explain the idea in your own words and answer one application question.
      </td>
      <td style="${CELL_STYLE}">
        Type STOP to summarise what improved and identify your next step.
      </td>
    </tr>

    <tr>
      <td style="${CELL_STYLE}">
        <p style="margin:0 0 8px 0;">Here is my Learning Goal and Success Criteria.</p>
        <p style="margin:0 0 8px 0;">Use these to guide everything we do.</p>
        <p style="margin:0 0 8px 0;"><strong>Learning Goal:</strong><br/>${LG_TOKEN}</p>
        <p style="margin:0 0 8px 0;"><strong>Success Criteria:</strong><br/>${SC_TOKEN}</p>
        <p style="margin:0 0 6px 0;"><strong>Before we start:</strong></p>
        <ul style="margin:0;padding-left:18px;">
          <li>Restate the learning goal in student-friendly language</li>
          <li>Identify the type of thinking required</li>
          <li>Do not explain the content</li>
        </ul>
      </td>

      <td style="${CELL_STYLE}">
        <p style="margin:0 0 6px 0;">Help me plan my study:</p>
        <ul style="margin:0 0 8px 0;padding-left:18px;">
          <li>Choose one clear focus</li>
          <li>Select one small study action</li>
          <li>Focus on understanding, not memorising</li>
        </ul>
        <p style="margin:0 0 8px 0;">Ask me what to work on first.</p>
        <div style="${TYPE_BOX_STYLE}"><em>Type my answer here</em></div>
      </td>

      <td style="${CELL_STYLE}">
        <p style="margin:0 0 6px 0;">After I complete the study action:</p>
        <ul style="margin:0;padding-left:18px;">
          <li>Ask questions to check understanding</li>
          <li>Compare answers to the Success Criteria</li>
          <li>Rate understanding:
            <ul style="margin:6px 0 0 18px;padding:0;">
              <li>Got it</li>
              <li>Shaky</li>
              <li>Not yet</li>
            </ul>
          </li>
        </ul>
        <p style="margin:8px 0 0 0;">Do not correct answers yet &mdash; notice gaps first.</p>
      </td>

      <td style="${CELL_STYLE}">
        <p style="margin:0 0 6px 0;">When I am ready:</p>
        <ul style="margin:0 0 8px 0;padding-left:18px;">
          <li>Explain the idea in my own words</li>
          <li>Answer one application-style question</li>
          <li>Use accurate vocabulary</li>
        </ul>
        <p style="margin:0;">Do not model the answer.</p>
      </td>

      <td style="${CELL_STYLE}">
        <p style="margin:0 0 6px 0;">When I type STOP, Corella will:</p>
        <ul style="margin:0 0 8px 0;padding-left:18px;">
          <li>Summarise what I worked on</li>
          <li>Restate the Learning Goal</li>
          <li>Identify the Success Criteria focus</li>
          <li>Describe what improved</li>
          <li>Generate an Excel-ready reflection table</li>
          <li>Finish with one encouragement sentence</li>
        </ul>
        <p style="margin:0 0 6px 0;"><strong>Rules:</strong></p>
        <ul style="margin:0;padding-left:18px;">
          <li>Table appears only after STOP</li>
          <li>No answers or new content</li>
          <li>Your words stay your words</li>
        </ul>
      </td>
    </tr>
  </tbody>
</table>`,
    },

    {
        id: "retrieval_practice",
        label: "Table 10 — Retrieval Practice (10 Q, one at a time)",
        html: `<!-- =========================================================
TABLE 10 — RETRIEVAL PRACTICE (10 Q, ONE AT A TIME)
========================================================= -->
<table style="${BASE_TABLE_STYLE}" border="1">
  <tbody>
    <tr style="${HEADER_ROW_STYLE}">
      <td style="width:19%;${CELL_STYLE}"><strong>L &ndash; Learning focus</strong></td>
      <td style="width:25%;${CELL_STYLE}"><strong>E &ndash; Engage actively</strong></td>
      <td style="width:18%;${CELL_STYLE}"><strong>A &ndash; Assess</strong></td>
      <td style="width:18%;${CELL_STYLE}"><strong>R &ndash; Record</strong></td>
      <td style="width:20%;${CELL_STYLE}"><strong>N &ndash; Next steps</strong></td>
    </tr>

    <tr style="${SUBHEADER_ROW_STYLE}">
      <td style="${CELL_STYLE}">
        Define the learning target using the goals or success criteria. Decide what the quiz will be based on (goals, criteria, passage, or mix).
      </td>
      <td style="${CELL_STYLE}">
        Generate a 10-question quiz that targets recall, explanation, or application of key ideas.
      </td>
      <td style="${CELL_STYLE}">
        Rate your confidence for each answer to spot gaps and strengths.
      </td>
      <td style="${CELL_STYLE}">
        Mark what was correct or needs review. Track patterns and progress in a simple table.
      </td>
      <td style="${CELL_STYLE}">
        Plan what to revisit. Use results to guide your next quiz cycle.
      </td>
    </tr>

    <tr>
      <td style="${CELL_STYLE}">
        <p style="margin:0 0 8px 0;">Here are my Learning Goals and Success Criteria:</p>
        <p style="margin:0 0 8px 0;"><strong>Learning Goals:</strong><br/>${LG_TOKEN}</p>
        <p style="margin:0 0 8px 0;"><strong>Success Criteria:</strong><br/>${SC_TOKEN}</p>
        <p style="margin:0 0 6px 0;"><strong>Before we begin, ask me one question only:</strong></p>
        <p style="margin:0;">Do you want me to generate the retrieval quiz based on:</p>
        <ul style="margin:6px 0 0 18px;padding:0;">
          <li>Learning Goals and Success Criteria</li>
          <li>A passage or stimulus</li>
          <li>A mix (to help find my thinking zone)</li>
        </ul>
        <p style="margin:8px 0 0 0;">Wait for my response before doing anything else.</p>
      </td>

      <td style="${CELL_STYLE}">
        <p style="margin:0 0 6px 0;">After I choose, I will paste one or more of the following:</p>
        <ul style="margin:0 0 8px 0;padding-left:18px;">
          <li>the Learning Goal(s) and/or</li>
          <li>the Success Criteria and/or</li>
          <li>a passage or stimulus</li>
        </ul>

        <p style="margin:0 0 6px 0;"><strong>Quiz Generation Rules (NON-NEGOTIABLE)</strong></p>
        <p style="margin:0 0 6px 0;">Using only what I provide, create a 10-question retrieval quiz with exactly:</p>

        <p style="margin:0 0 6px 0;"><strong>Questions 1&ndash;7: Multiple-Choice</strong></p>
        <ul style="margin:0 0 8px 0;padding-left:18px;">
          <li>Each multiple-choice question must:</li>
          <li>include 4 options labelled A, B, C, D</li>
          <li>have one best answer</li>
          <li>test understanding, not surface recall</li>
          <li>not include:
            <ul style="margin:6px 0 0 18px;padding:0;">
              <li>“all of the above”</li>
              <li>“none of the above”</li>
            </ul>
          </li>
        </ul>

        <p style="margin:0 0 6px 0;">You must not:</p>
        <ul style="margin:0 0 8px 0;padding-left:18px;">
          <li>ask open-ended questions</li>
          <li>mix formats</li>
          <li>explain the question</li>
          <li>explain the options</li>
          <li>indicate the correct answer</li>
        </ul>

        <p style="margin:0 0 6px 0;"><strong>Questions 8&ndash;10: Short Response</strong></p>
        <ul style="margin:0 0 8px 0;padding-left:18px;">
          <li>Each short-response question must:</li>
          <li>require 1&ndash;3 sentences</li>
          <li>include no scaffolding</li>
          <li>include no sentence starters</li>
          <li>include no hints</li>
        </ul>

        <p style="margin:0 0 6px 0;"><strong>Cognitive Rules</strong></p>
        <ul style="margin:0 0 8px 0;padding-left:18px;">
          <li>All questions must:</li>
          <li>require retrieval from memory, not recognition</li>
          <li>align directly to the chosen focus (Learning Goals, Success Criteria, passage, or mix)</li>
          <li>avoid teaching, modelling, or explaining</li>
        </ul>

        <p style="margin:0 0 6px 0;"><strong>Delivery Rules (STRICT &mdash; DO NOT DEVIATE)</strong></p>
        <ul style="margin:0;padding-left:18px;">
          <li>Generate all 10 questions internally, but never display them all at once.</li>
          <li>Display one question only per message.</li>
          <li>After displaying a question, stop output immediately and wait for my response.</li>
          <li>Do not preview, summarise, number ahead, or reference future questions.</li>
          <li>After I respond, display only the next question.</li>
          <li>Continue until all 10 questions are answered.</li>
          <li>If you output more than one question in a single message, stop and wait.</li>
        </ul>
      </td>

      <td style="${CELL_STYLE}">
        <p style="margin:0 0 6px 0;">After the final question, ask me:</p>
        <p style="margin:0 0 8px 0;"><strong>How confident are you overall for this retrieval set?</strong><br/>(Reply with 1, 2, or 3 only)</p>
        <p style="margin:0 0 6px 0;"><strong>Confidence scale (numbers only):</strong></p>
        <div style="margin:0 0 8px 0;">
          1 = 🔴 Red (still not meeting it)<br/>
          2 = 🟡 Amber (partly meeting it)<br/>
          3 = 🟢 Green (meeting it confidently)
        </div>
        <p style="margin:0;">If I respond with anything other than 1, 2, or 3, ask me to re-enter a valid response. Do nothing else.</p>
      </td>

      <td style="${CELL_STYLE}">
        <p style="margin:0 0 6px 0;">After I respond to the confidence scale:</p>
        <p style="margin:0 0 6px 0;">You may now mark the quiz.</p>
        <p style="margin:0 0 6px 0;">Using only:</p>
        <ul style="margin:0 0 8px 0;padding-left:18px;">
          <li>my answers</li>
          <li>the Learning Goal(s)</li>
          <li>the Success Criteria</li>
        </ul>
        <p style="margin:0 0 6px 0;">You will:</p>
        <ol style="margin:0 0 8px 18px;padding:0;">
          <li>Indicate which questions were correct and incorrect</li>
          <li>Link each incorrect response to the relevant Learning Goal or Success Criterion</li>
          <li>Identify patterns (for example: concept gaps, quote recall, misunderstanding task language)</li>
        </ol>
        <p style="margin:0 0 6px 0;"><strong>Rules:</strong></p>
        <ul style="margin:0 0 8px 0;padding-left:18px;">
          <li>Do not reteach content</li>
          <li>Do not explain the correct answer</li>
          <li>Do not add new information</li>
          <li>Do not rewrite or improve my responses</li>
        </ul>
        <p style="margin:0 0 6px 0;">After marking, ask me to respond to both prompts below:</p>
        <ol style="margin:0 0 8px 18px;padding:0;">
          <li>Which Learning Goal or Success Criterion needs the most attention next?</li>
          <li>What is one specific action you will take to revisit it?</li>
        </ol>
        <p style="margin:0;">Wait for my response. Do nothing else.</p>
      </td>

      <td style="${CELL_STYLE}">
        <p style="margin:0 0 6px 0;">When I type STOP, output only the table below.</p>
        <p style="margin:0 0 6px 0;">No explanations before or after.</p>
        <div style="font-family:monospace;margin:0 0 8px 0;">
          | Focus Used (LG / SC / Passage) | Questions Correct / 10 | Overall Confidence (1&ndash;3) | Key Area to Revisit | My Next Action |
        </div>
        <p style="margin:0 0 6px 0;">After the table, add one short reminder sentence only:</p>
        <div style="${TYPE_BOX_STYLE}">
          <em>“Come back to this chat soon to generate another set of retrieval questions and see how your results change.”</em>
        </div>
        <p style="margin:8px 0 0 0;"><strong>Rules:</strong></p>
        <ul style="margin:0;padding-left:18px;">
          <li>Use only what I have said and answered</li>
          <li>Keep each cell short and clear</li>
          <li>Do not add teaching, explanations, or advice</li>
        </ul>
      </td>
    </tr>
  </tbody>
</table>`,
    },

    {
        id: "what_i_think",
        label: "Table 11 — What I Think (initial thinking snapshot)",
        html: `<!-- =========================================================
TABLE 11 — WHAT I THINK (INITIAL THINKING SNAPSHOT)
========================================================= -->
<table style="${BASE_TABLE_STYLE}" border="1">
  <tbody>
    <tr style="${HEADER_ROW_STYLE}">
      <td style="width:19%;${CELL_STYLE}"><strong>L &ndash; Learning Focus</strong></td>
      <td style="width:26%;${CELL_STYLE}"><strong>E &ndash; Engage Actively</strong></td>
      <td style="width:20%;${CELL_STYLE}"><strong>A &ndash; Assess</strong></td>
      <td style="width:17%;${CELL_STYLE}"><strong>R &ndash; Record</strong></td>
      <td style="width:18%;${CELL_STYLE}"><strong>N &ndash; Next Steps</strong></td>
    </tr>

    <tr style="${SUBHEADER_ROW_STYLE}">
      <td style="${CELL_STYLE}">
        Paste the Learning Goal and Success Criteria. Don’t teach or explain.
      </td>
      <td style="${CELL_STYLE}">
        Ask me to write everything I think I know, no notes, no fixing.
      </td>
      <td style="${CELL_STYLE}">
        Compare my response to each Success Criterion. Say what I meet, partly meet, or don’t yet. Label confidence: Got it / Shaky / Not yet. No corrections.
      </td>
      <td style="${CELL_STYLE}">
        After practice, I rewrite my explanation. You compare it to my first version and show what improved.
      </td>
      <td style="${CELL_STYLE}">
        When I type STOP, make a table of before vs now. Help me write:<br/>
        “At first I thought ____. Now I understand ____.”<br/>
        End with one sentence about my progress. Remind me: learning = change in thinking.
      </td>
    </tr>

    <tr>
      <td style="${CELL_STYLE}">
        <p style="margin:0 0 8px 0;"><strong>Corella prompt:</strong></p>
        <p style="margin:0 0 8px 0;">I am going to paste my Learning Goal and Success Criteria below. Use these as the anchor for everything you do.</p>
        <p style="margin:0 0 8px 0;"><strong>Learning Goal:</strong><br/>${LG_TOKEN}</p>
        <p style="margin:0 0 8px 0;"><strong>Success Criteria:</strong><br/>${SC_TOKEN}</p>
        <p style="margin:0 0 6px 0;"><strong>Important rules:</strong></p>
        <ul style="margin:0;padding-left:18px;">
          <li>Do not teach the content.</li>
          <li>Do not explain mathematical concepts.</li>
          <li>Do not give examples unless they come directly from my writing.</li>
          <li>Do not ask me questions unless I explicitly ask you to.</li>
        </ul>
        <p style="margin:8px 0 0 0;">Your role is to compare my thinking to the Learning Goal and Success Criteria and make changes in my thinking visible.</p>
      </td>

      <td style="${CELL_STYLE}">
        <p style="margin:0 0 6px 0;">Ask me to write everything I currently think I know about linear equations.</p>
        <p style="margin:0 0 6px 0;">Remind me:</p>
        <ul style="margin:0 0 8px 0;padding-left:18px;">
          <li>this is a full brain dump</li>
          <li>no notes, no fixing, no research</li>
          <li>mistakes are allowed</li>
        </ul>
        <p style="margin:0;">Wait while I write my response.</p>
      </td>

      <td style="${CELL_STYLE}">
        <p style="margin:0 0 6px 0;">Compare my response to the Learning Goal and Success Criteria.</p>
        <p style="margin:0 0 6px 0;">Tell me clearly:</p>
        <ul style="margin:0 0 8px 0;padding-left:18px;">
          <li>which success criteria I am already meeting</li>
          <li>which success criteria I am partially meeting</li>
          <li>which success criteria I am not yet meeting</li>
        </ul>
        <p style="margin:0 0 6px 0;">For each success criterion, label confidence as:</p>
        <div style="margin:0 0 8px 0;">Got it / Shaky / Not yet</div>
        <p style="margin:0;">Briefly identify gaps between my thinking and the Learning Goal. Do not teach content or suggest activities.</p>
      </td>

      <td style="${CELL_STYLE}">
        <p style="margin:0 0 6px 0;">After teaching, activities, and practice, prompt me to rewrite my explanation.</p>
        <p style="margin:0 0 6px 0;">Compare my revised explanation to:</p>
        <ul style="margin:0 0 8px 0;padding-left:18px;">
          <li>my original response</li>
          <li>the Learning Goal</li>
          <li>the Success Criteria</li>
        </ul>
        <p style="margin:0 0 6px 0;">Tell me:</p>
        <ul style="margin:0 0 8px 0;padding-left:18px;">
          <li>what has improved in my thinking</li>
          <li>which success criteria are now clearer</li>
          <li>which success criteria still need practice</li>
        </ul>
        <p style="margin:0;"><strong>STOP Instruction</strong><br/>When I type STOP, move immediately to N &ndash; Next Steps. Do not end the conversation.</p>
      </td>

      <td style="${CELL_STYLE}">
        <p style="margin:0 0 6px 0;">Create a table with this structure:</p>
        <ul style="margin:0 0 8px 0;padding-left:18px;">
          <li>Success Criterion</li>
          <li>What I Knew Before</li>
          <li>What I Know Now</li>
          <li>Confidence Before</li>
          <li>Confidence Now</li>
          <li>Got it / Shaky / Not yet</li>
        </ul>
        <p style="margin:0 0 6px 0;">Then write one reflection sentence:</p>
        <div style="${TYPE_BOX_STYLE}">
          <em>“At the start of the lesson, I thought ____. Now I understand ____.”</em>
        </div>
        <p style="margin:8px 0 0 0;">Finish by reminding me that learning is shown by change in thinking, not just effort.</p>
      </td>
    </tr>
  </tbody>
</table>`,
    },
];
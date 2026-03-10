export const QLEARN_TEMPLATE = `
<table style="border-collapse: collapse; width: 98.6%; background-color: #364152; border-style: hidden;" border="1">
<tbody>
<tr>
<td style="width: 100%; padding: 8px 10px;"><span style="font-size: 18pt; color: #ecf0f1;"><strong>{{LESSON_TITLE}}</strong></span></td>
</tr>
</tbody>
</table>

<table style="border-collapse: collapse; width: 98.6%; background-color: #364152;" border="1">
<tbody><tr><td style="padding: 6px 10px; color: #ffffff;"><strong>Learning Goal</strong></td></tr></tbody>
</table>

<table style="border-collapse: collapse; width: 98.6%; background-color: #c7cfdb;" border="1">
<tbody><tr><td style="padding: 10px;"><p style="margin: 0;">{{LEARNING_GOALS}}</p></td></tr></tbody>
</table>

<table style="border-collapse: collapse; width: 98.6%; background-color: #364152;" border="1">
<tbody><tr><td style="padding: 6px 10px; color: #ffffff;"><strong>Success Criteria</strong></td></tr></tbody>
</table>

<table style="border-collapse: collapse; width: 98.6%; background-color: #c7cfdb;" border="1">
<tbody><tr><td style="padding: 10px;">{{SUCCESS_CRITERIA}}</td></tr></tbody>
</table>

<table style="border-collapse: collapse; width: 98.6%; background-color: #364152;" border="1">
<tbody><tr><td style="padding: 6px 10px; color: #ffffff;"><strong>Self Check</strong></td></tr></tbody>
</table>

<table style="border-collapse: collapse; width: 98.6%; background-color: #c7cfdb;" border="1">
<tbody>
<tr>
<td style="padding: 10px;">
<p style="margin-top: 0;"><strong>Circle one:</strong> 4 = I can explain this confidently &nbsp; 3 = I mostly understand &nbsp; 2 = I need help &nbsp; 1 = I don’t understand yet</p>
<p style="margin-bottom: 0;"><strong>My focus for today is:</strong> ______________________________</p>
</td>
</tr>
</tbody>
</table>

<table style="border-collapse: collapse; width: 98.6%; background-color: #364152;" border="1">
<tbody><tr><td style="padding: 6px 10px; color: #ffffff;"><strong>Key cognitive verbs and vocabulary</strong></td></tr></tbody>
</table>

<table style="border-collapse: collapse; width: 98.6%; background-color: #c7cfdb;" border="1">
<tbody>
<tr>
<td style="width: 50%; padding: 10px; vertical-align: top;">{{COGNITIVE_VERBS}}</td>
<td style="width: 50%; padding: 10px; vertical-align: top;">{{VOCABULARY}}</td>
</tr>
</tbody>
</table>

<table style="border-collapse: collapse; width: 98.6%; background-color: #7fbf7f; border-style: hidden;" border="1">
<tbody>
<tr>
<td style="padding: 10px;">
<p style="margin-top: 0;"><strong>Warm up (Story): {{WARMUP_TITLE}}</strong></p>
<p style="margin-top: 6px; margin-bottom: 0;">{{WARMUP_STORY}}</p>

<details style="margin-top: 10px;">
<summary style="cursor: pointer;"><strong>Think like a systems thinker</strong> (click to open)</summary>
<div style="background: #c7cfdb; padding: 10px; margin-top: 8px; border: 1px solid #b4bdca;">
<ul style="margin-top: 0; margin-bottom: 0;">
<li><strong>Identify:</strong> {{SYSTEMS_IDENTIFY}}</li>
<li><strong>Explain:</strong> {{SYSTEMS_EXPLAIN}}</li>
<li><strong>Compare:</strong> {{SYSTEMS_COMPARE}}</li>
<li><strong>Judge:</strong> {{SYSTEMS_JUDGE}}</li>
</ul>
</div>
</details>

<p style="margin-top: 10px; margin-bottom: 0;"><strong>Feedback focus:</strong> {{FEEDBACK_FOCUS}}</p>
</td>
</tr>
</tbody>
</table>

{{ACTIVITIES_HTML}}

<div style="margin-top: 18px; text-align: centre;">{{SWIRLS_FOOTER}}</div>
`.trim();

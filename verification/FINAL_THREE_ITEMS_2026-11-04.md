# Three final items — 4 November 2026
Completed technical checkpoints: H03, H05, H10. Delivery tracker: 48 checked, 80 open out of 128.

## AI boundary (H03)
- A shared server/chat-policy.js owns provider settings and instructions for Vercel, Netlify and the optional Worker build.
- Only bounded alternating user/assistant text is accepted. Client system prompts, model overrides, tool requests, extra metadata and school-record context are rejected before the provider.
- There is no database client, record retrieval or action tool in the assistant path. Browser sends only typed conversation and completed assistant answers; application data/device-storage canary tests pass.
- Direct private-record prompt abuse and obvious credential patterns receive a fixed refusal without a provider call.
- Provider responses are normalised to assistant text; extra diagnostics and unexpected fields are not passed to the browser. Failure messages omit credentials/provider dumps.
- General learning success, failure and malformed-provider paths pass with mocked responses. Optional Netlify/Worker parity is unit-tested, not deployed.
- Actual Vercel preview request asking to export all students returned the intended refusal. Actual normal learning request fell back: environment metadata confirms LDK_AI_API_KEY targets production only. No secret was decrypted or scope changed. H01 remains open; do not report an upstream provider outage from this result.
- Limit: arbitrary sensitive free text cannot be recognised perfectly. The UI and Privacy page tell people not to paste private information. H02 remains open for complete durable rate/cost controls.

## Chat accessibility (H05)
- Enter sends; Shift+Enter/composition preserve typing. Request starts with focus in the textarea; Escape closes the nonmodal region and restores launcher focus.
- Transcript is keyboard focusable; messages have speaker labels.
- Visual progressive text does not update the polite announcement per character. The complete answer is placed once in an atomic polite status region. Stop/clear receive explicit status announcements.
- Reduced-motion path immediately renders the complete text and disables waiting-dot animation.
- Focused tests and actual browser accessibility-tree/DOM checks passed for input focus, expanded state, Escape and complete refusal announcement.
- This is semantic/keyboard/reduced-motion implementation verification. No real screen-reader audio or full device certification was performed; I01/I03 remain open.
- Reference reviewed: https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA23.html

## Information pages (H10)
- Replaced placeholder footer links with privacy.html, terms.html and support.html; styling in info.css uses the existing green identity.
- Pages explain demo/device storage versus the connected pilot, current providers, private-data handling, support by role, offline drafts, duplicate attendance, notebook conflicts and unfinished account/import workflows.
- Documents clearly identify pilot status and pending school-owned support/policy/retention approval; no invented support address or final legal approval.
- Internal navigation/anchor targets checked across the main page and all three information pages. Existing external contact links were not independently verified; H09 remains open.
- Actual deployed Privacy → Terms → Support navigation passed. Support disclosure opened with Enter. At the observed 1348px viewport there was no horizontal overflow.
- Screenshot returned: ruhuka-help-preview-20261104.jpg.
- Final small markup correction adds tabindex=-1 to main content so skip links can move keyboard focus reliably.

## Validation and changed files
77 Node tests pass; JavaScript syntax/whitespace checks pass. No database change in this session.
Changed: server/chat-policy.js; api/chat.js; netlify/functions/chat.js; worker.js; chat.js; chat.css; index.html; info.css; privacy.html; terms.html; support.html; tests/chat-boundary.test.js; tests/chat.test.js; HANDOVER_CHECKLIST.md; this evidence file.
PR #10 remains draft. School acceptance, live configured AI-provider testing, rate/cost controls, final portal integration and school-owned support/policy approval are still open.

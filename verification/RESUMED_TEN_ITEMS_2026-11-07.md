# Resumed ten work items — 7 November 2026

Code: 1fb1a696c2c7052958f526bf165ef0d9a78ed00e, draft PR #10. Production unchanged.

| Work item | Result |
| --- | --- |
| Remove notebooks | No entry point/import in public or connected workspace; stored notes and old code/tests preserved. |
| Remove student absence submissions | Forms/navigation removed; database RPC and restrictive INSERT policy reject new requests; old private records and officer correction retained. |
| Clean Today | Both server and frontend omit deferred explanation tasks/actions; only permitted attendance/roster/notices/concerns/uploads remain. |
| Shorten AI | Trusted policy requests 2–4 sentences or up to 3 bullets; default 300 output tokens, explicit detail 800. Not a hard word cap; configured provider acceptance remains open. |
| Update help | Requirements, handoff brief, support/privacy/terms and workspace README revised. School approval still required. |
| Reduce generic content | Replaced oversized hidden-portal landing document with simple school introduction, book/helper art and no fabricated school statistics/contact claims. |
| Reduce startup | Only public.js is application startup JS; chat.js loads on first opening. No portal/sample-record/notebook startup, canvas or external font dependencies. |
| Improve phone layout | Single-column public/sign-in rendering and accessible menu at narrow width; real workspace uses role navigation and expandable forms. Physical phone acceptance remains open. |
| Real attendance integration | Sign-in opens role-derived Staff/Admin navigation; students get own read-only records. Mock integration and SQL pass; real multi-role browser demonstration remains open. |
| Verify and record | 87 Node tests pass; extended SQL rollback suite passes; READY preview browser checks below. PR remains draft. |

## Evidence

- Migration 20261107072057 applied to RUHUKA system. SQL fixtures were rolled back; zero synthetic accounts remain.
- Own-record student endpoint verifies active role and linked identity. No client-selected student ID. Missing results say Not recorded; numeric zero remains zero. Complete release/ranking interface still unfinished.
- Browser: public/sign-in CSS widths 320; public 768/1280. Reported document scrollWidth equals clientWidth (305/320/753/1265 respectively, including native scrollbar differences). No sideways overflow observed.
- Phone menu open/expanded and Escape/closed; assistant lazy load opens and focuses question field. Preview has no AI provider key, so no successful provider response is claimed.
- Public school sign-in reaches /connected/. Support, Privacy, Terms and Home navigation browser-checked.
- Public desktop screenshot retained for review. CSS-frame checks do not establish touch keyboard, landscape, zoom, screen-reader audio or every signed-in workflow.
- Source sizes (not measured transfer speed): previous index 95,926 bytes; new index 5,926; public.js 2,110; public.css 5,140. Chat and school modules load only when needed.

## Still required before merge/handover

Actual signed-in role walkthrough and staff-to-officer attendance trial; physical phones/tablet keyboards and slow/interrupted-network acceptance; configured AI provider and durable cost/rate limits; complete imports/results/account recovery; school content/privacy/support approval and release review. See the master checklist for all remaining work.

Tracker: 41 active verified, 75 active open, 12 deferred. Five existing checks completed in this session; ten work items do not equal ten handover completions.

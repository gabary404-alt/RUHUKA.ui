# Ten follow-up / Today items — 4 November 2026
## Completed technical outcomes
| ID | Outcome | Evidence |
|---|---|---|
| E07 | Five consecutive recorded main absence detection | SQL cases for exactly five/four, unknown mark, excluded follow-up and inactive student |
| E08 | Cases persist until human review; returns break streak only | SQL Present/Late/Excused tests and persisted-open return test |
| E09 | Same-streak reopen and distinct post-return history | SQL same-day refresh stays closed, next absence reopens, later new streak distinct |
| E10 | Separate academic <50% and official discipline <20/40 cases | Applied-batch weighted maxima/zero/boundary/missing-source fixtures; independent category IDs/reviews |
| E11 | Human follow-up tasks, notes and history without automatic school decisions | Source-linked read-only metrics; revision-checked review; unchanged scores; scoped audit history tests |
| G01 | Role-specific Today workspace | Authenticated SQL and UI tests |
| G02 | Missing registers, pending explanations, upload statuses and priority roster tasks | SQL role/target/count/privacy tests |
| G10 | Today action paths | Component and attendance-controller tests for class opening, explanations, roster/notices and in-page upload details |
| H07 | Two original lightweight illustrations shown in preview | Browser render of landing and both local SVGs |
| H08 | Static/reduced-motion/failure-safe illustration design | Standalone SVG browser render, local-resource checks, intrinsic dimensions and CSS reduced-motion check |

## Validation
- 65 Node tests pass; script syntax and whitespace checks pass.
- supabase/tests/daily_followup.sql passes on RUHUKA system and rolls back every fixture.
- Seven fixture accounts remaining: zero.
- Role checks include Headmaster read-only concern review; Dean academic only; officer attendance/discipline only; teacher/patron/student/legacy-admin concern denial; disabled officer denial.
- Revision errors preserve a typed review note.
- Restricted concern history prevents old broad admin audit policies exposing the new concern reviews.
- Vercel preview READY: https://ruhuka-p6peyyxn5-izere-osees-projects.vercel.app/ (commit 7f0e20258f9299a94269ff99fcc45c93cdddd1de).
- Browser verified landing, original SVG asset renders and signed-out connected entry. Hero image loaded at native 520×440, zero horizontal overflow at observed 1348-pixel viewport, no remaining globe canvas/shooting-star elements.
- Hero screenshot: ruhuka-learning-illustration-20261104.jpg (returned separately).
- Security advisor reports only the pre-existing leaked-password-protection warning; no new security lint. https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

## Limits that remain open
The final portal integration, real signed-in Today browser test, real phone/tablet keyboard, cross-device acceptance and school pilot remain open. The school roster is empty, so no claim of real-school usability acceptance is made.
Academic cases currently adapt the existing applied academic subject records; weighted percentage uses only those recorded subjects. The source does not yet represent the approved future named-release/supplied-overall model or expected subject completeness. That integration and file validation remain F01–F08, and must be verified before importing school results. No demo cache is used as authority.
Upload details are read-only; complete connected import correction/application is pending. Review records change only concern state and append audit. They never change student marks, official discipline points or promotion decisions.
Today refreshes visible task counts every five seconds and scans for new concerns approximately every 30 seconds. It is not server push or background delivery.
Performance advisories from older tables remain tracked under I05; no unused index was removed based on an empty school's usage data.

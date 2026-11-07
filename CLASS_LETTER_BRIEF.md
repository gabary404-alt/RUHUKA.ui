# Class letter — approved addition for first-handover planning

Reviewed 4 November 2026. Value: 8/10, conditional on school pilot confirming that weekly/term summaries are useful. Implement after attendance/results/discipline sources and report permissions are reliable. Supports the Today dashboard; does not replace it. No automatic external sending.

Purpose: Dean or Discipline Officer selects a class and date range, reviews a draft written from stored school records, adds narrative/context, then saves for Headmaster and prints a normal school letter (school identity and Strive to Excel). Minimise retyping, avoid unverified time-saving claims.

Required boundaries:
- Explicit dates, class/year/enrolment membership, author and generated-at time.
- Attendance: distinguish unique students absent from absence-days. Use official main marks; follow-up lessons excluded. Late/present return and excused absence differ. Missing registers are incomplete coverage, never automatic absences. Show submitted/expected coverage where school calendar supports it; otherwise disclose unknown expected coverage.
- Academic release selected explicitly; no mixing releases/terms. Blank means Not recorded, zero remains zero. Academic results and official discipline totals stay separate; no composite best-student score.
- Discipline is a dated official snapshot, not a sum of changing totals. Preserve source event reason/recorder where actually available; distinguish external recorder from website uploader, label missing attribution. No editing points from letter.
- Respect record permissions. Never put private absence explanations, medical attachments, guardian contacts, passwords/codes or notebook text in the Headmaster letter. Aggregate attendance/status is sufficient. This feature does not override officer-only explanation privacy.
- Generated numeric blocks come from a validated deterministic report builder. Editable narrative is stored separately; user wording must not alter official metric fields. Flag narrative inconsistency if detectable, and require review; do not promise unrestricted prose cannot contain a wrong number.
- Saving produces a versioned dated snapshot with source IDs/release/snapshot identifiers. Later source corrections prompt a new version; earlier letter remains reproducible. Clearly label saved snapshot versus unsaved current preview.
- Dean/Discipline Officer authors/reviews; Headmaster reads saved authorised letters. Record author/version/save time. No additional Headmaster approval prerequisite for publication unless school later requests it.
- Print layout aims at a concise summary; lengthy supporting details can follow on additional pages. Never cut off records to force one page.
- If a demo is used before backend completion, label device-only storage. Final handover letters require shared account-controlled persistence.

Acceptance examples: missing class register stays incomplete; corrected midday return changes official status without double-counting; missing subject remains Not recorded; previous source correction does not rewrite a saved letter; Headmaster can read letter without gaining private explanation access; filtered print matches snapshot totals.

# Second five-item batch — 4 November 2026

D12: connected class/date summary derives official values exclusively from submitted main records. SQL suite sets deliberately false cached student totals; real summary stays correct. Follow-up absent excluded. Excused denominator excluded; late attended. Empty range rate NULL. Demo recalculation now resets stale baseline/rate rather than adding hardcoded absences; dedicated regression passes.

D13: private validated follow-up function checks active teacher assignment/patron role, full active roster, status validity and lesson name. Public invoker wrapper used by separate pilot mode. Follow-up draft key includes lesson; two-step review retained. Duplicate lesson rejected by existing unique index. Follow-ups view read-only through class/day selector. Clients cannot directly insert attendance sessions or records. SQL valid/duplicate tests and mocked follow-up endpoint test pass; shared validation copied from tested main submit. Cross-device acceptance still open.

D14: UI labels Late (counts as attended) vs Excused absence; main-summary report shows separate Present/Late/Excused/Absent mark counts, denominator explanation and non-unique-student warning. SQL exercises absent → excused → absent → present return while another main row is late. Percentages verified at 100 and 66.7, with preserved correction notes/history. No automatic excuse for late return.

G06: connected notebook interface already verified with actual Headmaster account creation/text/checklist save and reopen. SQL suite additionally exercises teacher, discipline staff, discipline officer, Dean and Headmaster ownership; other-user access and student creation denied. G07 remains open for real cross-device and safe-delete/conflict workflows.

H06: main script no longer registers background stars, foreground stars, cursor spotlight, hero parallax, click sparks or card tilt. Related canvas/spotlight nodes removed. Globe remains and pauses offscreen; static reduced-motion fallback. Deployed anonymous homepage and Admin demo notebook navigation load without application errors. Screenshot captured. No measured performance percentage claimed.

46 Node tests pass; SQL rollback tests pass; no real student data used. Browser verification of newly connected follow-up with two real accounts remains part of larger acceptance. PR remains draft.

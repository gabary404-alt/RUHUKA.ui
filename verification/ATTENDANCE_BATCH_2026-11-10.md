# Attendance and recovery checks, 10 November 2026

| # | Scenario | Evidence |
|---|---|---|
| 1 | Staff and Admin attendance navigation | Sign-in resolves server roles. Automated UI handlers open the role-specific workspace and Attendance. The preview serves the school sign-in entry. |
| 2 | Teacher main register | Rollback database test uses a teacher identity to save the complete assigned-class roster. UI requires a review before submitting. |
| 3 | Patron and follow-up attendance | Rollback tests cover patron access and separate follow-up marks. Follow-ups stay out of official main totals. |
| 4 | Duplicate attendance | Database rejects the second main register. UI regression simulates the server conflict and verifies the draft and warning. Simultaneous database sessions remain a separate check. |
| 5 | Draft storage and account, class and date isolation | Automated draft tests reopen stored marks only for the matching account, class and date. Browser reload and offline verification remain open. |
| 6 | Connection and refresh failures | UI reconnect check detects another device's register without uploading the draft. A save remains confirmed when the subsequent overview refresh fails. |
| 7 | Officer sees and corrects the teacher's register | The database scenario switches from teacher to officer, verifies submitter and counts, makes a correction with reason and checks the authenticated audit entry. |
| 8 | Delayed register details | Regression changes the date during a pending read. The old response and old action cannot restore the previous register. |
| 9 | Report and print privacy | The same database scenario asserts the correction in the report's student row and official totals. Existing automated UI checks cover print construction and temporary copy cleanup. |
| 10 | Student access and recovery | Student setup/reset database suite covers expiring, single-use codes and account scope. UI tests cover expired recovery links, failure messages and clearing unfinished credentials. Actual email delivery remains open. |

Four rollback suites passed: accounts_roster_handover, daily_followup, discipline_reports, student_access. The account suite was rerun after extending its report assertion. All 168 Node tests passed. Database checks use synthetic records inside rollback transactions. The Chromium launch was blocked by a denied socket operation before the local browser workflow ran. No actual offline browser trial, two-device test, physical print or school email delivery is claimed.

D06 was closed for the integrated release code. The remaining browser and school acceptance gates stay open. Tracker totals are 77 verified, 39 open and 12 postponed.

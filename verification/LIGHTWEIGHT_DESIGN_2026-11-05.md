# Native scroll and lightweight character — 5 November 2026

## Implementation
- Removed custom wheel preventDefault/animated scroll path. Browser scroll and section links now use native behaviour.
- Removed reveal observer dependency; content remains visible with no reveal animation.
- Removed pointer-following bento tilt/glow and decorative blurred hero layers. No backdrop blur remains.
- Compact desktop hero retains the existing local book illustration; existing responsive single-column CSS is preserved/refined. Public section spacing reduced.
- Added an original static green/ivory RUHUKA helper to the existing chat launcher and avatar. 971 bytes raw / 456 bytes local gzip; no new widget, package, JS behaviour or canvas. This is original code-native SVG artwork, not copied from Grok or ChatGPT.
- Modal cards get bounded viewport height and their own overflow. This is implemented but not full modal/device acceptance.
- Light theme heading gradient adjusted after browser review.

## Evidence
Vercel design preview 7e16c23aaa38b61a0ca812196e321e68efe1e245 was READY.
At observed desktop width 1348px:
- Scroll moved from Y=0 to Y=936 after one downward gesture.
- Hero height 547.1875px.
- document scrollWidth equals clientWidth (1348px).
- zero canvas elements.
- zero visible elements with backdrop-filter.
- Hero book image and helper image loaded successfully.
- Existing assistant opens and focuses the question field.
- Dark and light themes observed. No application-origin console error observed; browser extension messages excluded.

77 Node tests pass; script syntax and whitespace checks pass.
Source script.js: 125,028 -> 120,599 bytes (4,429 fewer). Baseline is the prior PR head, not the older production build. CSS source size also reduced, with a small later contrast adjustment. No measured loading-time or CPU claim.
The previous production desktop review observed a 936px hero and a scroll gesture returning Y=0. Production is still unchanged; this increment is preview only.

## Files
script.js, style.css, index.html, chat.css, assets/ruhuka-helper.svg, HANDOVER_CHECKLIST.md and this evidence file.

## Remaining
I01/I02/H09 are still open: actual phone/tablet, phone keyboard, zoom, modal/table/chat scrolling, slow-network and broader performance checks remain. This increment does not remove notebooks or student explanation workflows yet. Those are the next scoped cleanup tasks, with existing data preserved. No database change or production merge performed.

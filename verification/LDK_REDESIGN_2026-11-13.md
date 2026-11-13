# Lycée de Kigali visitor redesign
Completed 13 November 2026 (Africa/Kigali). Draft PR #10; production unchanged.

## Director decisions implemented
- LDK is the school. RUHUKA appears only as a discreet public footer developer credit; technical identifiers remain stable.
- School red and green identity with warm ivory surfaces. Serif system font stack on supported devices, readable body text, flat editorial sections, no decorative animation library or network fonts. Light by default; explicitly saved dark preference preserved.
- Supplied newcomer crest used byte-for-byte (114px source displayed at 34–57px). An image-generation restoration altered fine emblem details and was rejected, not deployed. A clearer original remains desirable.
- Boldened book/engineering sketch and restrained paper/book landscape, optimized responsive WebP. No people or fake campus photography.
- Same-tab internal navigation across six real visitor pages; anchored homepage academics link and history/story deep links.
- Old subject combinations removed. Contact office for current combinations; no replacement list invented.
- Approximate 6,000+ alumni count supplied and approved by the director, not independently verified.
- Older official site is the public-content reference. Director confirms ldkedu.com is a student showcase project, not the official authority.

## Content and sources
Approved heritage: established 1974/opened 1975; 1982 government handover; 8 June 2024 golden jubilee.
https://www.newtimes.co.rw/article/16575/news/education/lycee-de-kigali-gears-up-for-golden-jubilee/amp
https://www.newtimes.co.rw/article/17491/in-pictures/in-pictures-glamour-as-lycee-de-kigali-marks-golden-jubilee/amp

Additional dated achievements researched, with public source links in news.html:
- 14 March 2018 Pi Day mathematics challenge: first and third place by LDK students, reported by University of Rwanda. Historical academic milestone, not a current exam ranking.
https://ursweden.ur.ac.rw/?q=node/388
- February 2023 gymnasium inauguration: dated project, not a claim of a continuing sponsorship.
https://rwanda.basketball/2023/02/10/photos-inauguration-of-lycee-de-kigalis-new-look-gymnasium/
- 26 June 2025 Police Volleyball Academy launch at LDK, reported 27 June by Rwanda National Police.
https://police.gov.rw/media/news-detail/news/rwanda-national-police-launches-volleyball-academy-to-nurture-future-champions/
- 26 June 2026 girls’ memorial 3x3 tournament win (12–8), report 27 June. Cross-checked in Kigali Today, UMUSEKE and The New Times. Not represented as a national championship.
https://www.kigalitoday.com/imikino/basketball/article/lycee-de-kigali-na-elite-rwanda-nibo-begukanye-irushanwa-ryo-kwibuka-kenrik-kabano-na-mama-we
https://umuseke.rw/ldk-mu-zegukanye-kenrik-rosine-memorial-tournament/
https://www.newtimes.co.rw/article/36902/sports/basketball/kenrick-kabano-mother-honoured-through-3x3-basketball-tournament/amp

Club descriptions use director-approved old school content; visitors are directed to ask about current schedules. Existing school contact fallback and approved-public-text replacement behaviour remain. No students’ private records, photographs, made-up testimonials, pass percentages or updated combinations were published.

## Changed files
Visitor HTML: index, our-school, academics, school-life, contact; new news.html.
Design: public.css, public.js; four new assets (supplied crest, bold sketch two sizes, paper hills).
Identity: chat.js, server/chat-policy.js, support/privacy/terms, connected index/account/guide HTML, connected attendance/discipline/progression/reports JS. Internal config/storage/RPC identifiers unchanged.
Packaging: scripts/build-public-site.cjs (52 allowlisted files).
Tests: public-page, illustrations, chat expected branding/navigation updated.
Checklist and this evidence report.

## Verification
- 184 Node tests pass.
- Hosted isolated Chromium fixture: 320, 390, 768, 1280 widths; six visitor pages each; no horizontal overflow, supplied crest/hero decode, mobile responsive hero asset, menu and same-tab links, back navigation, anchored scrolling, saved theme preference, assistant lazy opening and close. No browser JS errors.
- Desktop/mobile full-page screenshots inspected. One cramped 390px motto row corrected to span two columns; final fixture rechecked separately.
- Local link scan: 12 built HTML files. connected/config.js is intentionally served by the existing Vercel rewrite, not a missing static file.
- Asset bytes: crest 16,260; phone sketch 27,984; large sketch 110,890; lazy paper illustration 15,804. public.css approximately 21KB, public.js 2,110 bytes. These are file sizes, not measured network transfer timings.
- No real school data written, no Supabase changes, invitations, messages, merge or production promotion.

## Limits and release
Preview design is ready for director review, not full first-handover acceptance. Real-device/browser acceptance, school formats, email and remaining operational gates stay open. Original tracker remains 98 verified / 18 open / 12 postponed; no additional master workflow check is closed by this redesign.
No demo notice is hidden to disguise unfinished capabilities. Production cleanup remains linked to disabling demo routes and completing capability acceptance.

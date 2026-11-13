'use strict';

const { copyFileSync, mkdirSync, rmSync } = require('node:fs');
const { dirname, resolve } = require('node:path');

const files = [
  'index.html', 'our-school.html', 'academics.html', 'school-life.html', 'contact.html', 'news.html',
  'privacy.html', 'support.html', 'terms.html',
  'public.css', 'info.css', 'chat.css', 'public.js', 'public-content.js', 'chat.js',
  'assets/ldk-crest.png', 'assets/learning-sketch.webp', 'assets/learning-sketch-small.webp', 'assets/paper-hills.webp',
  'assets/kigali-hills.webp', 'assets/kigali-hills-small.webp', 'assets/school-court.webp',
  'assets/learning-orbit.svg', 'assets/ruhuka-helper.svg', 'assets/school-day.svg',
  ...[
    'index.html', 'account.html', 'guide.html', 'attendance.css',
    'account.js', 'academics.js', 'attendance.js', 'attendance-state.js',
    'class-letters.js', 'discipline.js', 'drafts.js', 'progression.js',
    'public-editor.js', 'reports.js', 'roster-import.js', 'roster-state.js',
    'roster-xlsx.js', 'school-desk.js', 'staff-accounts.js', 'student-access.js',
    'student-records.js', 'student-report.js', 'today.js',
    'academic-template.csv', 'discipline-events-template.csv',
    'discipline-totals-template.csv', 'roster-template.csv'
  ].map(file => 'connected/' + file)
];

const root = resolve(__dirname, '..');
const output = resolve(root, 'dist');
rmSync(output, { recursive: true, force: true });
for (const file of files) {
  const target = resolve(output, file);
  mkdirSync(dirname(target), { recursive: true });
  copyFileSync(resolve(root, file), target);
}

console.log('Prepared ' + files.length + ' school website files.');

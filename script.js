// ===== CENTRALIZED DATA SYSTEM =====
window.schoolData = {
  students: [],
  staff: [],
  classes: [],
  attendanceRecords: [],
  disciplineEvents: [],
  academicRecords: [],
  importBatches: [],
  auditEvents: [],
  settings: {
    schoolName: 'Lycée de Kigali',
    motto: 'Strive to excel',
    year: '2024-2025',
    term: 'Term 2',
    contact: { address: 'KK 2 Avenue, Kigali, Rwanda', email: 'kigalilycee2022@gmail.com', phone: '+250 791 166 095' }
  },
  content: {},
  activityLog: []
};

// ===== NAVIGATION FIX =====
// Every in-page nav link (top nav, mobile nav, portal sidebars, footer,
// notification items) uses href="#" as a placeholder, since this is a
// single-page app and there's nowhere else to link to. Without blocking
// it, clicking one ALSO triggers the browser's default action for
// href="#" -- jump the scroll position to the very top of the document --
// on top of whatever the onclick handler did. That's what caused every
// click to "send you back to the beginning": the onclick ran fine, then
// the browser immediately overrode it by jumping to the top. This one
// delegated listener blocks that default action for every such link,
// site-wide, instead of editing 30 individual onclick attributes.
document.addEventListener('click', function (e) {
  const link = e.target.closest('a[href="#"]');
  if (link) e.preventDefault();
});

// ===== AI API CONFIGURATION =====
/*
  HOW THE AI CHAT IS WIRED:
  -------------------------
  The browser NEVER talks to api.ejolabs.com directly, and it never sees
  an API key. Instead:

    script.js  --POST-->  /api/chat  (api/chat.js, runs on Vercel's server)
                              --POST, with real key-->  api.ejolabs.com

  This keeps the key out of the page source. To make this work after
  deploying, set an environment variable named LDK_AI_API_KEY in your
  Vercel project settings (Project → Settings → Environment Variables)
  to your real ejolabs.com API key, then redeploy.

  To point this at a different AI provider instead of ejolabs.com later,
  edit the fetch URL inside api/chat.js — not this file.

  TROUBLESHOOTING:
  ----------------
  • Chat says it can't reach the server = api/chat.js isn't deployed,
    or LDK_AI_API_KEY isn't set in Vercel yet.
  • 401 error = wrong or missing LDK_AI_API_KEY.
  • Set USE_API: false below to go back to offline canned responses
    (useful for testing the rest of the site without the API at all).
*/
const AI_CONFIG = {
  API_URL:   '/api/chat', // calls our own serverless proxy — see api/chat.js — which holds the real key server-side
  MODEL:     'MINI LDK',                                  // your model name
  USE_API:   true,                                      // false = offline mode
  SYSTEM_PROMPT: `You are the LDK (Lycée de Kigali) School AI Assistant. You help staff, students, and administrators with school data, student records, discipline points, attendance, rankings, and general school questions. Be concise, professional, and helpful. School: Lycée de Kigali, Rwanda. Motto: "Strive to excel".`
};
let chatHistory = [];  // keeps last 20 messages for context


// Realistic Rwandan names for demo data generation
const firstNames = ['Jean-Paul','Claire','Patrick','Marie','Jean','Bosco','Diane','Eric','Grace','Emmanuel','Alice','David','Samuel','Jeanne','Cedric','Olivia','Kevin','Sandrine','Didier','Aline','Innocent','Chantal','Fabrice','Mireille','Theoneste','Liliane','Pascal','Yvonne','Alain','Clemence'];
const lastNames = ['Manirafasha','Umutoni','Habyarimana','Mukamana','Ndayisaba','Uwimana','Nshimiyimana','Murekatete','Habineza','Kwizera','Ingabire','Mutesi','Mukamurigo','Rutayisire','Niyonzima','Mukandayisenga','Hategekimana','Mukashema','Bizimana','Tuyishime','Mukamana','Ndayishimiye','Rukundo','Mukamana','Niyigena','Mukandori','Ndayisenga','Mukamuhire','Niyonzima','Mukeshimana'];
const classNames = ['S1 Stream 1','S1 Stream 2','S1 Stream 3','S2 Stream 1','S2 Stream 2','S2 Stream 3','S3 Stream 1','S3 Stream 2','S3 Stream 3','S4 Stream 1','S4 Stream 2','S4 Stream 3','S5 Stream 1','S5 Stream 2','S5 Stream 3','S6 Stream 1','S6 Stream 2','S6 Stream 3'];

function generateDemoData() {
  const students = [];
  let idCounter = 1;

  classNames.forEach(cls => {
    const count = 8; // light demo roster; full imports still work
    for (let i = 0; i < count; i++) {
      const fn = firstNames[Math.floor(Math.random() * firstNames.length)];
      const ln = lastNames[Math.floor(Math.random() * lastNames.length)];
      const gender = Math.random() > 0.45 ? 'M' : 'F';
      const level = cls.startsWith('S1') || cls.startsWith('S2') || cls.startsWith('S3') ? 'O-Level' : 'A-Level';
      const discipline = Math.floor(22 + Math.random() * 18); // 22-40
      const academic = Math.floor(50 + Math.random() * 50); // 50-100
      const attendance = Math.floor(85 + Math.random() * 15); // 85-100
      const absences = Math.floor(Math.random() * 8);

      students.push({
        id: 'LDK-' + (2020 + Math.floor(Math.random() * 5)) + '-' + String(idCounter).padStart(3, '0'),
        name: fn + ' ' + ln,
        gender: gender,
        class: cls,
        level: level,
        disciplinePoints: discipline,
        academicScore: academic,
        attendanceRate: attendance,
        absences: absences,
        status: 'Active',
        photo: null
      });
      idCounter++;
    }
  });

  // Add known demo students with specific values for consistency
  students[0] = { id: 'LDK-2023-001', name: 'Jean-Paul Manirafasha', gender: 'M', class: 'S5 Stream 1', level: 'A-Level', disciplinePoints: 35, academicScore: 88, attendanceRate: 96, absences: 3, status: 'Active', photo: null };
  students[1] = { id: 'LDK-2023-045', name: 'Claire Umutoni', gender: 'F', class: 'S4 Stream 2', level: 'A-Level', disciplinePoints: 32, academicScore: 91, attendanceRate: 94, absences: 2, status: 'Active', photo: null };
  students[2] = { id: 'LDK-2022-089', name: 'Patrick Habyarimana', gender: 'M', class: 'S6 Stream 1', level: 'A-Level', disciplinePoints: 38, academicScore: 94, attendanceRate: 98, absences: 1, status: 'Active', photo: null };

  // ===== 40-STUDENT SHOWCASE SET =====
  // The 3 named students above + 37 more here = 40 stable, named students
  // for live demos -- same names/IDs every time (not re-randomized on
  // reload), a deliberate mix of top performers and flagged/at-risk
  // students so Rankings and "Needs Attention" have real examples to show,
  // and 14 of them concentrated in S5 Stream 1 -- the class Mark
  // Attendance opens to by default -- so marking someone absent live
  // during a presentation is one click away, no hunting required.
  const showcase = [
    { name: 'Marie Mukamana', id: 'LDK-2023-112', gender: 'F', class: 'S5 Stream 1', discipline: 30, academic: 82, attendance: 93, absences: 3 },
    { name: 'Jean Bosco Ndayisaba', id: 'LDK-2024-034', gender: 'M', class: 'S5 Stream 1', discipline: 18, academic: 54, attendance: 78, absences: 9 },
    { name: 'Diane Uwimana', gender: 'F', class: 'S5 Stream 1', discipline: 38, academic: 93, attendance: 98, absences: 1 },
    { name: 'Eric Nshimiyimana', gender: 'M', class: 'S5 Stream 1', discipline: 29, academic: 78, attendance: 92, absences: 4 },
    { name: 'Grace Murekatete', gender: 'F', class: 'S5 Stream 1', discipline: 24, academic: 58, attendance: 81, absences: 8 },
    { name: 'Emmanuel Habineza', gender: 'M', class: 'S5 Stream 1', discipline: 31, academic: 80, attendance: 94, absences: 3 },
    { name: 'Alice Kwizera', gender: 'F', class: 'S5 Stream 1', discipline: 39, academic: 96, attendance: 99, absences: 0 },
    { name: 'David Ingabire', gender: 'M', class: 'S5 Stream 1', discipline: 27, academic: 74, attendance: 90, absences: 5 },
    { name: 'Samuel Mutesi', gender: 'M', class: 'S5 Stream 1', discipline: 16, academic: 62, attendance: 83, absences: 7 },
    { name: 'Jeanne Mukamurigo', gender: 'F', class: 'S5 Stream 1', discipline: 33, academic: 85, attendance: 95, absences: 2 },
    { name: 'Cedric Rutayisire', gender: 'M', class: 'S5 Stream 1', discipline: 28, academic: 72, attendance: 91, absences: 4 },
    { name: 'Olivia Niyonzima', gender: 'F', class: 'S5 Stream 1', discipline: 37, academic: 91, attendance: 97, absences: 1 },
    { name: 'Kevin Mukandayisenga', gender: 'M', class: 'S5 Stream 1', discipline: 30, academic: 76, attendance: 93, absences: 3 },
    { name: 'Sandrine Hategekimana', gender: 'F', class: 'S5 Stream 1', discipline: 22, academic: 55, attendance: 79, absences: 9 },
    { name: 'Didier Mukashema', gender: 'M', class: 'S5 Stream 1', discipline: 26, academic: 70, attendance: 89, absences: 5 },
    { name: 'Aline Bizimana', gender: 'F', class: 'S5 Stream 1', discipline: 40, academic: 98, attendance: 100, absences: 0 },
    { name: 'Chantal Ndayishimiye', gender: 'F', class: 'S4 Stream 2', discipline: 29, academic: 77, attendance: 92, absences: 3 },
    { name: 'Fabrice Rukundo', gender: 'M', class: 'S4 Stream 2', discipline: 19, academic: 59, attendance: 80, absences: 8 },
    { name: 'Mireille Niyigena', gender: 'F', class: 'S4 Stream 2', discipline: 36, academic: 90, attendance: 96, absences: 1 },
    { name: 'Theoneste Mukandori', gender: 'M', class: 'S4 Stream 2', discipline: 25, academic: 68, attendance: 88, absences: 5 },
    { name: 'Liliane Ndayisenga', gender: 'F', class: 'S4 Stream 2', discipline: 32, academic: 83, attendance: 94, absences: 2 },
    { name: 'Pascal Mukamuhire', gender: 'M', class: 'S6 Stream 1', discipline: 39, academic: 95, attendance: 99, absences: 0 },
    { name: 'Yvonne Niyonzima', gender: 'F', class: 'S6 Stream 1', discipline: 28, academic: 75, attendance: 91, absences: 4 },
    { name: 'Alain Mukeshimana', gender: 'M', class: 'S6 Stream 1', discipline: 15, academic: 51, attendance: 76, absences: 10 },
    { name: 'Clemence Habimana', gender: 'F', class: 'S6 Stream 1', discipline: 31, academic: 81, attendance: 93, absences: 3 },
    { name: 'Jean Claude Nsengimana', gender: 'M', class: 'S6 Stream 1', discipline: 37, academic: 92, attendance: 98, absences: 1 },
    { name: 'Vestine Mukamana', gender: 'F', class: 'S3 Stream 2', discipline: 27, academic: 71, attendance: 90, absences: 4 },
    { name: 'Boniface Ntawuruhunga', gender: 'M', class: 'S3 Stream 2', discipline: 21, academic: 57, attendance: 82, absences: 7 },
    { name: 'Josiane Uwamahoro', gender: 'F', class: 'S3 Stream 2', discipline: 35, academic: 88, attendance: 96, absences: 1 },
    { name: 'Emile Habyarimana', gender: 'M', class: 'S3 Stream 2', discipline: 26, academic: 69, attendance: 89, absences: 5 },
    { name: 'Solange Mukagatare', gender: 'F', class: 'S2 Stream 1', discipline: 30, academic: 79, attendance: 93, absences: 3 },
    { name: 'Damascene Nkurunziza', gender: 'M', class: 'S2 Stream 1', discipline: 38, academic: 94, attendance: 97, absences: 1 },
    { name: 'Christine Uwase', gender: 'F', class: 'S2 Stream 1', discipline: 17, academic: 53, attendance: 77, absences: 9 },
    { name: 'Bernard Sibomana', gender: 'M', class: 'S2 Stream 1', discipline: 29, academic: 73, attendance: 91, absences: 4 },
    { name: 'Providence Mukamazimpaka', gender: 'F', class: 'S1 Stream 1', discipline: 28, academic: 72, attendance: 90, absences: 4 },
    { name: 'Vincent Habyarimana', gender: 'M', class: 'S1 Stream 1', discipline: 36, academic: 89, attendance: 96, absences: 1 },
    { name: 'Beatrice Nyirahabimana', gender: 'F', class: 'S1 Stream 1', discipline: 20, academic: 56, attendance: 80, absences: 8 }
  ];
  showcase.forEach(sh => {
    const level = /^S[123]/.test(sh.class) ? 'O-Level' : 'A-Level';
    students.push({
      id: sh.id || ('LDK-' + (2020 + Math.floor(Math.random() * 5)) + '-' + String(idCounter++).padStart(3, '0')),
      name: sh.name, gender: sh.gender, class: sh.class, level,
      disciplinePoints: sh.discipline, academicScore: sh.academic, attendanceRate: sh.attendance,
      absences: sh.absences, status: 'Active', photo: null
    });
  });

  window.schoolData.students = students;
  computeClassStats();
}

// ===== STUDENT DATA PERSISTENCE =====
// Without this, every reload wiped out anything an admin added/changed
// (new users, imports, discipline marks) because generateDemoData()
// always rebuilt the array from scratch.
function saveStudents() {
  try {
    localStorage.setItem('ldk-students', JSON.stringify(window.schoolData.students));
  } catch (e) {
    console.error('Could not save student data', e);
  }
}
function saveSchoolRecords() {
  try {
    ['attendanceRecords', 'disciplineEvents', 'academicRecords', 'importBatches', 'activityLog', 'auditEvents'].forEach(key => {
      localStorage.setItem('ldk-' + key, JSON.stringify(window.schoolData[key] || []));
    });
  } catch (e) {
    console.error('Could not save school records', e);
    toast('Browser storage is full. Export a backup before continuing.');
  }
}
function loadSchoolRecords() {
  ['attendanceRecords', 'disciplineEvents', 'academicRecords', 'importBatches', 'activityLog', 'auditEvents'].forEach(key => {
    try {
      const saved = localStorage.getItem('ldk-' + key);
      if (saved) window.schoolData[key] = JSON.parse(saved);
    } catch (e) {
      console.error('Could not load ' + key, e);
      window.schoolData[key] = [];
    }
  });
  window.schoolData.attendanceRecords = window.schoolData.attendanceRecords.flatMap(record => {
    const status = normalizeAttendanceStatus(record.status);
    if (!status) {
      console.warn('Ignoring attendance record with an unsupported status', record.id);
      return [];
    }
    return [{ ...record, status }];
  });
}
function loadStudents() {
  const saved = localStorage.getItem('ldk-students');
  if (!saved) return false;
  try {
    window.schoolData.students = JSON.parse(saved);
    computeClassStats();
    return true;
  } catch (e) {
    console.error('Could not load saved student data', e);
    return false;
  }
}

function computeClassStats() {
  const classMap = {};
  window.schoolData.students.filter(s => s.status !== 'Archived').forEach(s => {
    if (!classMap[s.class]) {
      classMap[s.class] = { name: s.class, level: s.level, students: [], teacher: 'TBD' };
    }
    classMap[s.class].students.push(s);
  });

  window.schoolData.classes = Object.values(classMap).map(c => {
    const average = (key) => {
      const values = c.students.map(student => numberOrNull(student[key])).filter(value => value !== null);
      return values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length * 10) / 10 : null;
    };
    return {
      name: c.name,
      level: c.level,
      studentCount: c.students.length,
      teacher: c.teacher,
      avgDiscipline: average('disciplinePoints'),
      avgAcademic: average('academicScore'),
      avgAttendance: average('attendanceRate')
    };
  });
}

function numberOrNull(value) {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}
function normalizedScore(student, key, maximum = 100) {
  const value = numberOrNull(student[key]);
  return value === null ? null : value / maximum * 100;
}
function combinedPerformanceIndex(student) {
  const discipline = normalizedScore(student, 'disciplinePoints', 40);
  const academic = normalizedScore(student, 'academicScore');
  return discipline === null || academic === null ? null : (discipline + academic) / 2;
}
function getClassRankings() {
  return [...window.schoolData.classes].sort((a, b) => (b.avgDiscipline ?? -1) - (a.avgDiscipline ?? -1));
}

function getAcademicRankings() {
  return [...window.schoolData.classes].sort((a, b) => (b.avgAcademic ?? -1) - (a.avgAcademic ?? -1));
}

function getTop30Overall() {
  return window.schoolData.students.filter(s => s.status !== 'Archived' && combinedPerformanceIndex(s) !== null)
    .map(s => ({ ...s, index: Math.round(combinedPerformanceIndex(s) * 10) / 10 }))
    .sort((a, b) => b.index - a.index)
    .slice(0, 30);
}

function getTop30Discipline() {
  return window.schoolData.students.filter(s => s.status !== 'Archived')
    .filter(s => numberOrNull(s.disciplinePoints) !== null)
    .sort((a, b) => b.disciplinePoints - a.disciplinePoints)
    .slice(0, 30);
}

function getNeedsAttention() {
  return window.schoolData.students.filter(s => s.status !== 'Archived' &&
    ((numberOrNull(s.disciplinePoints) !== null && Number(s.disciplinePoints) < 20) ||
    (numberOrNull(s.academicScore) !== null && Number(s.academicScore) < 60)))
    .sort((a, b) => (combinedPerformanceIndex(a) ?? 0) - (combinedPerformanceIndex(b) ?? 0));
}

function getClassesBelowTarget() {
  return window.schoolData.classes.filter(c =>
    (c.avgDiscipline !== null && c.avgDiscipline < 20) ||
    (c.avgAcademic !== null && c.avgAcademic < 70))
    .sort((a, b) => ((a.avgDiscipline ?? 40) / 40 + (a.avgAcademic ?? 100) / 100) -
      ((b.avgDiscipline ?? 40) / 40 + (b.avgAcademic ?? 100) / 100));
}

function getClassLeaders() {
  const leaders = [];
  window.schoolData.classes.forEach(cls => {
    const clsStudents = window.schoolData.students.filter(s => s.class === cls.name && s.status !== 'Archived');
    const rankedStudents = clsStudents.filter(s => combinedPerformanceIndex(s) !== null);
    if (rankedStudents.length > 0) {
      const leader = rankedStudents
        .map(s => ({ ...s, index: Math.round(combinedPerformanceIndex(s) * 10) / 10 }))
        .sort((a, b) => b.index - a.index)[0];
      leaders.push({ class: cls.name, student: leader });
    }
  });
  return leaders.sort((a, b) => b.student.index - a.student.index);
}

function getInitials(name) {
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}
function getLocalDateString(date = new Date()) {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
}

function getAvatarColor(seed) {
  const colors = ['linear-gradient(135deg,#15803d,#14532d)','linear-gradient(135deg,#16a34a,#166534)','linear-gradient(135deg,#f59e0b,#d97706)','linear-gradient(135deg,#dc2626,#991b1b)','linear-gradient(135deg,#4ade80,#15803d)','linear-gradient(135deg,#b91c1c,#7f1d1d)','linear-gradient(135deg,#14b8a6,#0d9488)','linear-gradient(135deg,#f97316,#ea580c)'];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

// ===== RENDER FUNCTIONS =====
function renderAllClassRankings() {
  const container = document.getElementById('allClassRankings');
  if (!container) return;
  const rankings = getClassRankings();
  container.innerHTML = rankings.map((c, i) => {
    const rankClass = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
    const scoreClass = c.avgDiscipline === null ? 'avg' : c.avgDiscipline >= 32 ? 'good' : c.avgDiscipline >= 20 ? 'avg' : 'bad';
    const disciplinePct = c.avgDiscipline === null ? 0 : c.avgDiscipline / 40 * 100;
    return `<div class="rank-row">
      <div class="rank-num ${rankClass}">${i + 1}</div>
      <div class="rank-avatar" style="background:${getAvatarColor(c.name)}">${escapeHTML(c.name.substring(0,2))}</div>
      <div class="rank-info"><div class="rank-name">${escapeHTML(c.name)}</div><div class="rank-meta">${c.studentCount} students | ${escapeHTML(c.level)}</div></div>
      <div style="text-align:right;min-width:80px"><div class="rank-score ${scoreClass}">${c.avgDiscipline === null ? 'N/A' : c.avgDiscipline + '/40'}</div><div style="font-size:11px;color:var(--t3)">Avg Discipline</div></div>
    </div>
    <div class="rank-bar-bg"><div class="rank-bar-fill" style="width:${disciplinePct}%;background:var(--${scoreClass === 'good' ? 'g' : scoreClass === 'avg' ? 'w' : 'r'})"></div></div>`;
  }).join('');
}

function renderAllAcademicRankings() {
  const container = document.getElementById('allAcademicRankings');
  if (!container) return;
  const rankings = getAcademicRankings();
  container.innerHTML = rankings.map((c, i) => {
    const rankClass = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
    const scoreClass = c.avgAcademic === null ? 'avg' : c.avgAcademic >= 80 ? 'good' : c.avgAcademic >= 65 ? 'avg' : 'bad';
    return `<div class="rank-row">
      <div class="rank-num ${rankClass}">${i + 1}</div>
      <div class="rank-avatar" style="background:${getAvatarColor(c.name)}">${escapeHTML(c.name.substring(0,2))}</div>
      <div class="rank-info"><div class="rank-name">${escapeHTML(c.name)}</div><div class="rank-meta">${c.studentCount} students | ${escapeHTML(c.level)}</div></div>
      <div style="text-align:right;min-width:80px"><div class="rank-score ${scoreClass}">${c.avgAcademic === null ? 'N/A' : c.avgAcademic + '%'}</div><div style="font-size:11px;color:var(--t3)">Avg Academic</div></div>
    </div>
    <div class="rank-bar-bg"><div class="rank-bar-fill" style="width:${c.avgAcademic ?? 0}%;background:var(--${scoreClass === 'good' ? 'g' : scoreClass === 'avg' ? 'w' : 'r'})"></div></div>`;
  }).join('');
}

function renderTop30Overall() {
  const container = document.getElementById('top30Overall');
  if (!container) return;
  const top = getTop30Overall();
  container.innerHTML = top.map((s, i) => {
    const rankClass = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
    return `<div class="rank-row">
      <div class="rank-num ${rankClass}">${i + 1}</div>
      <div class="avatar-md" style="background:${getAvatarColor(s.name)}">${escapeHTML(getInitials(s.name))}</div>
      <div class="rank-info"><div class="rank-name">${escapeHTML(s.name)}</div><div class="rank-meta">${escapeHTML(s.class)} | ${escapeHTML(s.id)}</div></div>
      <div style="text-align:right"><div class="rank-score good">${s.index}</div><div style="font-size:11px;color:var(--t3)">Index</div></div>
    </div>`;
  }).join('');
}

function renderTop30Discipline() {
  const container = document.getElementById('top30Discipline');
  if (!container) return;
  const top = getTop30Discipline();
  container.innerHTML = top.map((s, i) => {
    const rankClass = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
    return `<div class="rank-row">
      <div class="rank-num ${rankClass}">${i + 1}</div>
      <div class="avatar-md" style="background:${getAvatarColor(s.name)}">${escapeHTML(getInitials(s.name))}</div>
      <div class="rank-info"><div class="rank-name">${escapeHTML(s.name)}</div><div class="rank-meta">${escapeHTML(s.class)} | ${escapeHTML(s.id)}</div></div>
      <div style="text-align:right"><div class="rank-score good">${s.disciplinePoints}/40</div></div>
    </div>`;
  }).join('');
}

function renderNeedsAttention() {
  const container = document.getElementById('needsAttentionList');
  if (!container) return;
  const list = getNeedsAttention();
  if (list.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:24px;color:var(--t3)">No students need attention. Great job!</div>';
    return;
  }
  container.innerHTML = list.map(s => {
    const issues = [];
    if (numberOrNull(s.disciplinePoints) !== null && Number(s.disciplinePoints) < 20) issues.push(`Discipline ${Number(s.disciplinePoints)}/40`);
    if (numberOrNull(s.academicScore) !== null && Number(s.academicScore) < 60) issues.push(`Academic ${Number(s.academicScore)}%`);
    return `<div class="rank-row">
      <div class="rank-num" style="background:var(--r);color:#fff">!</div>
      <div class="avatar-md" style="background:linear-gradient(135deg,var(--r),#dc2626)">${escapeHTML(getInitials(s.name))}</div>
      <div class="rank-info"><div class="rank-name">${escapeHTML(s.name)}</div><div class="rank-meta">${escapeHTML(s.class)} | ${escapeHTML(s.id)}</div></div>
      <div style="text-align:right"><div class="rank-score bad">${escapeHTML(issues.join(' · '))}</div><div style="font-size:11px;color:var(--t3)">Needs attention</div></div>
    </div>`;
  }).join('');
}

function renderClassesBelowTarget() {
  const container = document.getElementById('classesBelowTarget');
  if (!container) return;
  const list = getClassesBelowTarget();
  if (list.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:24px;color:var(--t3)">All classes are above target. Excellent!</div>';
    return;
  }
  container.innerHTML = list.map(c => {
    const issues = [];
    if (c.avgDiscipline !== null && c.avgDiscipline < 20) issues.push(`Discipline: ${c.avgDiscipline}/40`);
    if (c.avgAcademic !== null && c.avgAcademic < 70) issues.push(`Academic: ${c.avgAcademic}%`);
    const barWidth = Math.max(c.avgDiscipline === null ? 0 : c.avgDiscipline / 40 * 100, c.avgAcademic ?? 0);
    return `<div class="rank-row">
      <div class="rank-num" style="background:var(--w);color:#000">!</div>
      <div class="rank-avatar" style="background:linear-gradient(135deg,var(--w),#d97706)">${escapeHTML(c.name.substring(0,2))}</div>
      <div class="rank-info"><div class="rank-name">${escapeHTML(c.name)}</div><div class="rank-meta">${c.studentCount} students</div></div>
      <div style="text-align:right"><div class="rank-score avg">${escapeHTML(issues.join(' · '))}</div></div>
    </div>
    <div class="rank-bar-bg"><div class="rank-bar-fill" style="width:${barWidth}%;background:var(--w)"></div></div>`;
  }).join('');
}

function renderClassLeaders() {
  const container = document.getElementById('classLeadersList');
  if (!container) return;
  const leaders = getClassLeaders();
  container.innerHTML = leaders.map((l, i) => {
    const rankClass = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
    return `<div class="rank-class-header">
      <div class="rank-num ${rankClass}">${i + 1}</div>
      <span>${escapeHTML(l.class)}</span>
    </div>
    <div class="rank-row" style="margin-bottom:16px">
      <div class="avatar-lg" style="background:${getAvatarColor(l.student.name)}">${escapeHTML(getInitials(l.student.name))}</div>
      <div class="rank-info"><div class="rank-name">${escapeHTML(l.student.name)}</div><div class="rank-meta">${escapeHTML(l.student.id)} | Discipline: ${numberOrNull(l.student.disciplinePoints) === null ? 'N/A' : Number(l.student.disciplinePoints) + '/40'} | Academic: ${numberOrNull(l.student.academicScore) === null ? 'N/A' : Number(l.student.academicScore) + '%'}</div></div>
      <div style="text-align:right"><div class="rank-score good">${l.student.index}</div><div style="font-size:11px;color:var(--t3)">Leader Index</div></div>
    </div>`;
  }).join('');
}

function renderUserTable() {
  const tbody = document.getElementById('userTableBody');
  if (!tbody) return;
  const includeArchived = document.getElementById('includeArchivedStudents')?.checked;
  const students = window.schoolData.students
    .filter(s => includeArchived || s.status !== 'Archived')
    .slice(0, 500);
  tbody.innerHTML = students.map(s => {
    const dColor = s.disciplinePoints >= 32 ? 'var(--g)' : s.disciplinePoints >= 20 ? 'var(--w)' : 'var(--r)';
    const aColor = s.academicScore >= 80 ? 'var(--g)' : s.academicScore >= 65 ? 'var(--w)' : 'var(--r)';
    const studentKey = encodeURIComponent(s.id);
    return `<tr>
      <td><div class="avatar-sm" style="background:${getAvatarColor(s.name)}">${escapeHTML(getInitials(s.name))}</div></td>
      <td>${escapeHTML(s.id)}</td>
      <td>${escapeHTML(s.name)}</td>
      <td>${escapeHTML(s.class || '')}</td>
      <td style="color:${dColor};font-weight:700">${Number(s.disciplinePoints || 0)}</td>
      <td style="color:${aColor};font-weight:700">${Number(s.academicScore || 0)}%</td>
      <td><span class="tag ${s.status === 'Archived' ? 'tag-ab' : 'tag-ap'}">${escapeHTML(s.status || 'Active')}</span></td>
      <td><div style="display:flex;gap:6px"><button class="btn btn-g btn-sm" onclick="viewStudent(decodeURIComponent('${studentKey}'))">Profile</button><button class="btn btn-a btn-sm" onclick="editStudent(decodeURIComponent('${studentKey}'))">Edit</button><button class="btn btn-d btn-sm" onclick="toggleStudentArchive(decodeURIComponent('${studentKey}'))">${s.status === 'Archived' ? 'Restore' : 'Archive'}</button></div></td>
    </tr>`;
  }).join('');
}
function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

// ===== REAL-TIME DASHBOARD STATS =====
// These cards used to be static text baked into the HTML -- marking a
// class's attendance or adding a discipline mark never changed what the
// Staff or Admin dashboard displayed. Now every relevant number is
// computed live from window.schoolData and re-rendered both the moment
// data changes (called from subAtt/addDM/resolveJustification below) and
// every time a dashboard tab is opened, so switching between Staff and
// Admin views during a demo always shows the current state.
function updateDashboardStats() {
  const totalEl = document.getElementById('dashTotalStudents');
  if (totalEl) totalEl.textContent = window.schoolData.students.filter(student => student.status !== 'Archived').length.toLocaleString();

  const { presentPct } = computeSchoolAttendanceToday();
  const attEl = document.getElementById('dashAttendanceToday');
  if (attEl) attEl.textContent = presentPct + '%';

  const pendingCount = getNeedsAttention().length + window.schoolData.justifications.filter(j => j.status === 'Pending').length;
  const pendingEl = document.getElementById('dashPendingIssues');
  if (pendingEl) pendingEl.textContent = pendingCount;

  updateAttendanceOverviewBars();
  renderAdminActivity();
}

function updateStaffDashboardStats() {
  const { present, absent, presentPct } = computeSchoolAttendanceToday();
  const presentEl = document.getElementById('staffPresentCount');
  const presentPctEl = document.getElementById('staffPresentPct');
  const absentEl = document.getElementById('staffAbsentCount');
  const absentPctEl = document.getElementById('staffAbsentPct');
  if (presentEl) presentEl.textContent = present.toLocaleString();
  if (presentPctEl) presentPctEl.textContent = presentPct + '% today';
  if (absentEl) absentEl.textContent = absent.toLocaleString();
  if (absentPctEl) absentPctEl.textContent = (Math.round((100 - presentPct) * 10) / 10) + '% today';

  const pendingEl = document.getElementById('staffPendingJust');
  if (pendingEl) pendingEl.textContent = window.schoolData.justifications.filter(j => j.status === 'Pending').length;

  const disciplineEl = document.getElementById('staffDisciplineReports');
  if (disciplineEl) disciplineEl.textContent = window.schoolData.activityLog.filter(a => a.type === 'discipline').length;

  renderStaffActivity();
}

// "Today's" attendance is derived from every student's running
// attendanceRate, which subAtt() updates the instant a class is
// submitted -- so this always reflects the latest marks, on both
// dashboards, without a separate daily log to keep in sync.
function computeSchoolAttendanceToday() {
  const students = window.schoolData.students.filter(student => student.status !== 'Archived');
  if (!students.length) return { presentPct: 0, present: 0, absent: 0 };
  const today = getLocalDateString();
  const records = window.schoolData.attendanceRecords.filter(record => record.date === today && record.status !== 'excused');
  if (records.length) {
    const present = records.filter(record => record.status === 'present' || record.status === 'late').length;
    return { presentPct: Math.round(present / records.length * 1000) / 10, present, absent: records.length - present };
  }
  const avg = students.reduce((a, s) => a + s.attendanceRate, 0) / students.length;
  const presentPct = Math.round(avg * 10) / 10;
  const present = Math.round(students.length * avg / 100);
  return { presentPct, present, absent: students.length - present };
}

function updateAttendanceOverviewBars() {
  ['1', '2', '3', '4', '5', '6'].forEach(n => {
    const classesForSenior = window.schoolData.classes.filter(c => c.name.startsWith('S' + n + ' '));
    if (!classesForSenior.length) return;
    const avg = Math.round(classesForSenior.reduce((a, c) => a + c.avgAttendance, 0) / classesForSenior.length);
    const valEl = document.getElementById('attOverviewVal-S' + n);
    const barEl = document.getElementById('attOverviewBar-S' + n);
    if (valEl) valEl.textContent = avg + '%';
    if (barEl) { barEl.style.width = avg + '%'; barEl.style.background = avg >= 90 ? 'var(--g)' : avg >= 80 ? 'var(--w)' : 'var(--r)'; }
  });
}

// ===== ACTIVITY LOG =====
// Feeds "Recent Activity" (Staff) and "System Activity" (Admin) -- these
// were static rows that never changed regardless of what happened in the
// system. Every attendance submission, discipline mark, justification
// decision, and broadcast now gets logged here and both tables re-render
// from it immediately, so the two dashboards genuinely reflect each
// other's actions in real time within the session.
function logActivity(type, action, by, details) {
  window.schoolData.activityLog.unshift({
    time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    type, action, by, details
  });
  if (window.schoolData.activityLog.length > 30) window.schoolData.activityLog.length = 30;
  saveSchoolRecords();
  renderAdminActivity();
  renderStaffActivity();
}

function recordAuditEvent(actor, action, entityId, details) {
  window.schoolData.auditEvents.unshift({
    id: 'audit-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
    time: new Date().toISOString(),
    actor, action, entityId: String(entityId ?? ''), details: String(details ?? '')
  });
  if (window.schoolData.auditEvents.length > 1000) window.schoolData.auditEvents.length = 1000;
  saveSchoolRecords();
  renderAuditHistory();
}

function renderAdminActivity() {
  const tbody = document.getElementById('adminActivityBody');
  if (!tbody) return;
  const rows = window.schoolData.activityLog.slice(0, 6);
  tbody.innerHTML = rows.length
    ? rows.map(a => `<tr><td>${escapeHTML(a.time)}</td><td>${escapeHTML(a.by)}</td><td>${escapeHTML(a.action)}</td><td>${escapeHTML(a.details)}</td></tr>`).join('')
    : '<tr><td colspan="4" style="text-align:center;color:var(--t3)">No activity yet this session.</td></tr>';
}

function renderStaffActivity() {
  const tbody = document.getElementById('staffActivityBody');
  if (!tbody) return;
  const rows = window.schoolData.activityLog.slice(0, 6);
  tbody.innerHTML = rows.length
    ? rows.map(a => `<tr><td>${escapeHTML(a.time)}</td><td>${escapeHTML(a.action)}</td><td>${escapeHTML(a.by)}</td><td>${escapeHTML(a.details)}</td></tr>`).join('')
    : '<tr><td colspan="4" style="text-align:center;color:var(--t3)">No activity yet this session.</td></tr>';
}

// ===== DISCIPLINE MARK STUDENT PICKER =====
// Was a hardcoded list of 5 students in the HTML -- two of them
// ('Marie Mukamana', 'Jean Bosco Ndayisaba') didn't reliably exist in the
// actual generated data, so picking them and clicking "Add Discipline
// Mark" failed with "could not find that student in the system." Now
// populated dynamically from the real roster, so every listed student is
// a valid, working choice.
function populateDMStudentDropdown() {
  const sel = document.getElementById('dmstu');
  if (!sel) return;
  const prev = sel.value;
  const sorted = window.schoolData.students.filter(s => s.status !== 'Archived').sort((a, b) => a.name.localeCompare(b.name));
  sel.innerHTML = sorted.map(s => `<option value="${escapeHTML(s.name)} (${escapeHTML(s.id)})">${escapeHTML(s.name)} (${escapeHTML(s.id)})</option>`).join('');
  if (prev && sorted.some(s => (s.name + ' (' + s.id + ')') === prev)) sel.value = prev;
}

// ===== BULK IMPORT SYSTEM =====
function clearImport() {
  document.getElementById('bulkImportArea').value = '';
  document.getElementById('importFile').value = '';
  document.getElementById('importPreviewSection').classList.add('hidden');
  delete window._pendingImport;
  delete window._pendingImportType;
}

function loadImportFile(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  if (file.size > 5_000_000) {
    event.target.value = '';
    return toast('CSV file is too large. Maximum size is 5 MB.');
  }
  const reader = new FileReader();
  reader.onload = () => { document.getElementById('bulkImportArea').value = String(reader.result || ''); };
  reader.onerror = () => toast('Could not read that CSV file.');
  reader.readAsText(file);
}

function parseCSV(text) {
  const rows = [];
  let row = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted && char === '"' && text[i + 1] === '"') { field += '"'; i++; }
    else if (char === '"') quoted = !quoted;
    else if (char === ',' && !quoted) { row.push(field.trim()); field = ''; }
    else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && text[i + 1] === '\n') i++;
      row.push(field.trim());
      if (row.some(value => value !== '')) rows.push(row);
      row = []; field = '';
    } else field += char;
  }
  row.push(field.trim());
  if (row.some(value => value !== '')) rows.push(row);
  return rows;
}

function normalizeAttendanceStatus(value) {
  const status = String(value ?? '').trim().toLowerCase().replace(/[\s_-]+/g, '');
  const aliases = {
    present: 'present', p: 'present', here: 'present',
    absent: 'absent', a: 'absent', missing: 'absent',
    late: 'late', l: 'late', tardy: 'late',
    excused: 'excused', e: 'excused', justified: 'excused', justifiedabsence: 'excused'
  };
  return aliases[status] || null;
}

function previewImport() {
  const raw = document.getElementById('bulkImportArea').value.trim();
  if (!raw) { toast('Please paste student data first'); return; }
  if (raw.length > 5_000_000) { toast('Import data is too large. Maximum size is 5 MB.'); return; }
  const type = document.getElementById('importType').value;
  const rows = parseCSV(raw);
  if (!rows.length) { toast('No CSV rows found.'); return; }
  if (rows.length > 10_001) { toast('Imports are limited to 10,000 data rows at a time.'); return; }
  const normalize = value => value.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  const first = rows[0].map(normalize);
  const hasHeader = first.some(value => ['id', 'student_id', 'name', 'student_name'].includes(value));
  const headers = hasHeader ? rows.shift().map(normalize) : [];
  const aliases = {
    id: ['id', 'student_id', 'studentid'], name: ['name', 'student_name', 'fullname', 'full_name'],
    class: ['class', 'grade', 'form'], stream: ['stream'], level: ['level'], gender: ['gender', 'sex'],
    guardianName: ['guardian_name', 'parent_name', 'guardian', 'parent'], guardianPhone: ['guardian_phone', 'parent_phone', 'phone'], guardianEmail: ['guardian_email', 'parent_email', 'email'],
    academicScore: ['academic_score', 'academic', 'average', 'score'], disciplinePoints: ['discipline_points', 'discipline_total', 'discipline_score', 'discipline'],
    status: ['status'], term: ['term', 'semester'], subject: ['subject', 'course'], score: ['score', 'mark'], maxScore: ['max_score', 'maximum', 'out_of'],
    reason: ['reason', 'description', 'incident'], change: ['change', 'points_change', 'delta'], recordedBy: ['recorded_by', 'staff', 'teacher'], date: ['date', 'recorded_at'], source: ['source'],
    period: ['period', 'session'], attendanceStatus: ['status', 'attendance_status']
  };
  const get = (row, key, positionalIndex) => {
    if (!hasHeader) return row[positionalIndex] ?? '';
    const idx = headers.findIndex(header => aliases[key].includes(header));
    return idx < 0 ? '' : (row[idx] ?? '');
  };
  const preview = [];
  const seenIds = new Set();
  rows.forEach((row, index) => {
    const item = { type, rowNumber: index + (hasHeader ? 2 : 1), validation: 'ok', msg: 'Ready' };
    if (type === 'students') {
      const cls = get(row, 'class', 3);
      const stream = get(row, 'stream', 4);
      item.name = get(row, 'name', 0);
      item.id = get(row, 'id', 1);
      item.gender = get(row, 'gender', 2);
      item.class = cls && stream && !cls.toLowerCase().includes(stream.toLowerCase()) ? cls + ' ' + stream : cls;
      item.level = get(row, 'level', 5) || (/^S[123]/i.test(cls) ? 'O-Level' : 'A-Level');
      item.guardianName = get(row, 'guardianName', 6);
      item.guardianPhone = get(row, 'guardianPhone', 7);
      item.guardianEmail = get(row, 'guardianEmail', 8);
      item.academicScore = get(row, 'academicScore', 9);
      item.studentStatus = get(row, 'status', 11) || 'Active';
      if (!item.name || !item.id || !item.class) { item.validation = 'err'; item.msg = 'Name, ID, and class required'; }
      else if (item.gender && !['m', 'f', 'male', 'female'].includes(item.gender.toLowerCase())) { item.validation = 'err'; item.msg = 'Gender must be M, F, Male, or Female'; }
      else if (!['active', 'transferred', 'graduated', 'archived'].includes(item.studentStatus.toLowerCase())) { item.validation = 'err'; item.msg = 'Unknown student status'; }
      else if (item.academicScore !== '' && (!Number.isFinite(Number(item.academicScore)) || Number(item.academicScore) < 0 || Number(item.academicScore) > 100)) { item.validation = 'err'; item.msg = 'Academic score must be 0-100'; }
    } else {
      item.id = get(row, 'id', 0);
      if (type === 'academics') {
        item.term = get(row, 'term', 1); item.subject = get(row, 'subject', 2);
        item.score = get(row, 'score', 3); item.maxScore = get(row, 'maxScore', 4); item.date = get(row, 'date', 5);
        if (!item.id || item.score === '' || !Number.isFinite(Number(item.score)) || (item.maxScore && (!Number.isFinite(Number(item.maxScore)) || Number(item.maxScore) <= 0)) || Number(item.score) < 0 || Number(item.score) > Number(item.maxScore || 100)) { item.validation = 'err'; item.msg = 'Score must be within the maximum score'; }
        else if (!window.schoolData.students.some(student => student.id.toLowerCase() === item.id.toLowerCase())) { item.validation = 'err'; item.msg = 'Student ID not found; import roster first'; }
      } else if (type === 'attendance') {
        item.date = get(row, 'date', 1);
        item.class = get(row, 'class', 2) || window.schoolData.students.find(student => student.id.toLowerCase() === String(item.id).toLowerCase())?.class || '';
        item.period = get(row, 'period', 3) || 'Full Day';
        item.status = normalizeAttendanceStatus(get(row, 'attendanceStatus', 4));
        if (!item.id || !item.date || !item.class || !item.status) {
          item.validation = 'err'; item.msg = !item.status ? 'Unknown attendance status' : 'ID, date, and class required';
        } else if (isNaN(Date.parse(item.date))) {
          item.validation = 'err'; item.msg = 'Invalid attendance date';
        } else if (!window.schoolData.students.some(student => student.id.toLowerCase() === String(item.id).toLowerCase())) {
          item.validation = 'err'; item.msg = 'Student ID not found; import roster first';
        }
      } else {
        item.disciplinePoints = get(row, 'disciplinePoints', 1); item.reason = get(row, 'reason', 2);
        item.change = get(row, 'change', 3); item.recordedBy = get(row, 'recordedBy', 4); item.date = get(row, 'date', 5); item.source = get(row, 'source', 6);
        if (!item.id) { item.validation = 'err'; item.msg = 'Student ID required'; }
        else if (!window.schoolData.students.some(student => student.id.toLowerCase() === item.id.toLowerCase())) { item.validation = 'err'; item.msg = 'Student ID not found; import roster first'; }
        else if (item.disciplinePoints !== '' && (!Number.isFinite(Number(item.disciplinePoints)) || Number(item.disciplinePoints) < 0 || Number(item.disciplinePoints) > 40)) { item.validation = 'err'; item.msg = 'Discipline total must be 0-40'; }
      }
      const matchedStudent = window.schoolData.students.find(student => student.id.toLowerCase() === String(item.id).toLowerCase());
      item.name = matchedStudent?.name || item.id;
      if (!item.class) item.class = matchedStudent?.class || '';
    }
    const normalizedId = item.id.toLowerCase();
    if (item.validation !== 'err' && type === 'students' && seenIds.has(normalizedId)) { item.validation = 'err'; item.msg = 'Duplicate ID in file'; }
    if (type === 'students') seenIds.add(normalizedId);
    if (item.validation === 'ok' && type === 'students' && !/^S[1-6]/i.test(item.class)) { item.validation = 'warn'; item.msg = 'Unusual class; review before import'; }
    if (item.validation === 'ok' && type === 'students' && window.schoolData.students.some(student => student.id.toLowerCase() === item.id.toLowerCase())) item.msg = 'Will update existing student';
    preview.push(item);
  });

  const okCount = preview.filter(p => p.validation === 'ok').length;
  const warnCount = preview.filter(p => p.validation === 'warn').length;
  const errCount = preview.filter(p => p.validation === 'err').length;

  document.getElementById('importStats').innerHTML = `
    <span class="import-status ok">${okCount} OK</span>
    ${warnCount ? `<span class="import-status warn">${warnCount} Warn</span>` : ''}
    ${errCount ? `<span class="import-status err">${errCount} Error</span>` : ''}
  `;

  const table = document.getElementById('importPreviewTable');
  table.innerHTML = `
    <div class="import-row header"><div style="width:40px">Row</div><div style="flex:1">Student / ID</div><div style="width:140px">Class / Details</div><div style="width:180px">Validation</div></div>
    ${preview.map((p, i) => `
      <div class="import-row">
        <div style="width:40px">${p.rowNumber}</div>
        <div style="flex:1">${escapeHTML(p.name || p.id || '')} <span style="font-family:monospace;color:var(--t3)">${escapeHTML(p.id || '')}</span></div>
        <div style="width:140px">${escapeHTML(p.class || p.subject || p.reason || '')}</div>
        <div style="width:180px"><span class="import-status ${p.validation}">${escapeHTML(p.msg)}</span></div>
      </div>
    `).join('')}
  `;

  document.getElementById('importPreviewSection').classList.remove('hidden');
  window._pendingImport = preview.filter(p => p.validation !== 'err');
  window._pendingImportType = type;
}

function confirmImport() {
  if (!window._pendingImport || window._pendingImport.length === 0) {
    toast('No valid students to import');
    return;
  }

  const type = window._pendingImportType;
  const batchId = 'import-' + Date.now();
  const rows = window._pendingImport;
  if (type === 'discipline') {
    window.schoolData.importBatches.unshift({
      id: batchId, type, rows: rows.map(item => ({ ...item })),
      createdAt: new Date().toISOString(), status: 'review'
    });
    recordAuditEvent('Admin', 'Discipline import staged for review', batchId, `${rows.length} rows`);
    saveSchoolRecords();
    renderImportReviewQueue();
    toast('Discipline import staged. Official totals remain unchanged until reviewed.');
    finishImportPreview();
    return;
  }
  window._pendingImport.forEach(item => {
    const student = window.schoolData.students.find(existing => existing.id.toLowerCase() === String(item.id).toLowerCase());
    if (type === 'students') {
      const record = student || { id: item.id, absences: 0, photo: null, attendanceRate: 0, academicScore: 0, disciplinePoints: null };
      Object.assign(record, {
        id: item.id, name: item.name, gender: ['f', 'female'].includes(item.gender.toLowerCase()) ? 'F' : (item.gender ? 'M' : ''), class: item.class, level: item.level,
        guardianName: item.guardianName || record.guardianName || '', guardianPhone: item.guardianPhone || record.guardianPhone || '',
        guardianEmail: item.guardianEmail || record.guardianEmail || '', status: item.studentStatus || 'Active', archived: false
      });
      if (item.academicScore !== '') record.academicScore = Number(item.academicScore);
      if (!student) window.schoolData.students.push(record);
    } else if (type === 'academics') {
      const score = Number(item.score), maxScore = Number(item.maxScore || 100);
      const record = window.schoolData.academicRecords.find(existing => existing.studentId === student.id && existing.term === item.term && existing.subject === item.subject);
      const values = { studentId: student.id, term: item.term, subject: item.subject, score, maxScore, date: item.date || getLocalDateString(), importedAt: new Date().toISOString(), importBatchId: batchId };
      if (record) Object.assign(record, values);
      else window.schoolData.academicRecords.push({ id: batchId + '-' + item.rowNumber, ...values });
      student.academicTerm = item.term;
    } else if (type === 'attendance') {
      const key = record => record.studentId === student.id && record.date === item.date && record.className === item.class && record.period === item.period;
      const existing = window.schoolData.attendanceRecords.find(key);
      const values = {
        studentId: student.id, date: item.date, className: item.class, period: item.period,
        status: normalizeAttendanceStatus(item.status), submittedBy: 'Imported', updatedAt: new Date().toISOString()
      };
      if (existing) Object.assign(existing, values);
      else window.schoolData.attendanceRecords.push({ id: batchId + '-' + item.rowNumber, ...values, createdAt: values.updatedAt });
      recalculateAttendanceStats(student);
    }
  });
  const academicStudentIds = new Set(window._pendingImport.filter(item => type === 'academics').map(item => item.id.toLowerCase()));
  academicStudentIds.forEach(id => {
    const student = window.schoolData.students.find(item => item.id.toLowerCase() === id);
    const records = window.schoolData.academicRecords.filter(record => record.studentId === student.id && record.term === student.academicTerm && record.maxScore > 0);
    if (records.length) student.academicScore = Math.round(records.reduce((total, record) => total + record.score / record.maxScore * 100, 0) / records.length * 10) / 10;
  });
  window.schoolData.importBatches.unshift({ id: batchId, type, rows: rows.length, createdAt: new Date().toISOString(), status: 'applied' });
  computeClassStats();
  saveStudents();
  saveSchoolRecords();
  renderUserTable();
  populateDMStudentDropdown();
  updateDashboardStats();
  logActivity('import', type + ' import completed', 'Admin', rows.length + ' rows');
  recordAuditEvent('Admin', type + ' import applied', batchId, `${rows.length} rows`);
  toast(`Imported ${rows.length} ${type} rows.`);
  finishImportPreview();
}

function finishImportPreview() {
  document.getElementById('importPreviewSection').classList.add('hidden');
  document.getElementById('bulkImportArea').value = '';
  delete window._pendingImport;
  delete window._pendingImportType;
}

function reviewDisciplineImport(batchId, approve) {
  const batch = window.schoolData.importBatches.find(item => item.id === batchId && item.type === 'discipline' && item.status === 'review');
  if (!batch) return toast('This import is no longer awaiting review.');
  const note = document.getElementById('review-note-' + batchId)?.value.trim() || '';
  const verificationReference = document.getElementById('review-reference-' + batchId)?.value.trim() || '';
  const verified = document.getElementById('review-verified-' + batchId)?.checked;
  if (!note) return toast('Enter a review note before deciding this import.');
  if (approve && (!verificationReference || !verified)) return toast('Enter the official source reference and confirm it was checked before approving.');
  if (approve) {
    batch.rows.forEach(item => {
      const student = window.schoolData.students.find(existing => existing.id.toLowerCase() === String(item.id).toLowerCase());
      if (!student) throw new Error('Student record disappeared while reviewing discipline import: ' + item.id);
      const eventDate = item.date || getLocalDateString();
      if (item.disciplinePoints !== '' && (!student.disciplineSnapshotDate || eventDate >= student.disciplineSnapshotDate)) {
        student.disciplinePoints = Number(item.disciplinePoints);
        student.disciplineSnapshotDate = eventDate;
      }
      window.schoolData.disciplineEvents.push({
        id: batch.id + '-' + item.rowNumber, studentId: student.id, date: eventDate,
        total: item.disciplinePoints === '' ? null : Number(item.disciplinePoints),
        change: item.change === '' ? null : Number(item.change), reason: item.reason,
        recordedBy: item.recordedBy, source: item.source || 'Official discipline import',
        batchId: batch.id, importedAt: new Date().toISOString(), status: 'verified'
      });
    });
    batch.status = 'approved';
    computeClassStats();
    saveStudents();
    logActivity('import', 'Verified discipline import approved', 'Admin', batch.id + ' — ' + batch.rows.length + ' rows');
  } else {
    batch.status = 'rejected';
  }
  batch.reviewedAt = new Date().toISOString();
  batch.reviewedBy = document.getElementById('adn')?.textContent || 'Admin';
  batch.reviewNote = note;
  batch.verificationReference = verificationReference;
  saveSchoolRecords();
  recordAuditEvent(batch.reviewedBy, approve ? 'Verified discipline import approved' : 'Discipline import rejected', batch.id, note);
  renderUserTable();
  updateDashboardStats();
  renderImportReviewQueue();
  toast(approve ? 'Verified discipline import approved and applied.' : 'Discipline import rejected; official totals were not changed.');
}

function renderImportReviewQueue() {
  const container = document.getElementById('importReviewQueue');
  if (!container) return;
  const pending = window.schoolData.importBatches.filter(batch => batch.type === 'discipline' && batch.status === 'review');
  container.innerHTML = pending.length ? pending.map(batch => {
    const safeId = encodeURIComponent(batch.id);
    return `<div style="padding:14px;border:1px solid var(--b);border-radius:10px">
      <div style="font-weight:600">Discipline import · ${escapeHTML(batch.id)}</div>
      <div style="font-size:12px;color:var(--t3);margin:4px 0 10px">${batch.rows.length} rows · staged ${escapeHTML(batch.createdAt)}</div>
      <div class="fg"><label class="lab" for="review-note-${safeId}">Review note</label><input class="inp" id="review-note-${safeId}" maxlength="500" placeholder="Decision rationale"></div>
      <div class="fg"><label class="lab" for="review-reference-${safeId}">Official source reference (approval only)</label><input class="inp" id="review-reference-${safeId}" maxlength="300" placeholder="Reference number or official document title"></div>
      <label style="display:flex;gap:8px;align-items:center;font-size:13px;margin:10px 0"><input type="checkbox" id="review-verified-${safeId}"> I checked this import against the official source</label>
      <div style="display:flex;justify-content:flex-end;gap:8px">
        <button class="btn btn-d btn-sm" onclick="reviewDisciplineImport(decodeURIComponent('${safeId}'),false)">Reject</button>
        <button class="btn btn-a btn-sm" onclick="reviewDisciplineImport(decodeURIComponent('${safeId}'),true)">Approve verified import</button>
      </div>
    </div>`;
  }).join('') : '<div style="color:var(--t3)">No discipline imports are awaiting review.</div>';
  renderAuditHistory();
}

function renderAuditHistory() {
  const tbody = document.getElementById('auditHistoryBody');
  if (!tbody) return;
  const events = window.schoolData.auditEvents.slice(0, 100);
  tbody.innerHTML = events.length
    ? events.map(event => `<tr><td>${escapeHTML(event.time)}</td><td>${escapeHTML(event.actor)}</td><td>${escapeHTML(event.action)}</td><td>${escapeHTML(event.entityId)} · ${escapeHTML(event.details)}</td></tr>`).join('')
    : '<tr><td colspan="4" style="text-align:center;color:var(--t3)">No audit events recorded yet.</td></tr>';
}

// ===== STUDENT RECORD LIFECYCLE =====
function addUser() {
  openStudentForm();
}
function openStudentForm(id) {
  const student = id ? window.schoolData.students.find(item => item.id === id) : null;
  const form = document.getElementById('studentForm');
  form.reset();
  document.getElementById('studentFormTitle').textContent = student ? 'Edit Student Record' : 'Add Student';
  document.getElementById('studentId').readOnly = !!student;
  document.getElementById('studentId').value = student?.id || '';
  document.getElementById('studentName').value = student?.name || '';
  document.getElementById('studentGender').value = student?.gender || '';
  document.getElementById('studentClass').value = student?.class || '';
  document.getElementById('studentLevel').value = student?.level || 'O-Level';
  document.getElementById('studentStatus').value = student?.status || 'Active';
  document.getElementById('guardianName').value = student?.guardianName || '';
  document.getElementById('guardianPhone').value = student?.guardianPhone || '';
  document.getElementById('guardianEmail').value = student?.guardianEmail || '';
  document.getElementById('studentAcademic').value = student?.academicScore ?? '';
  document.getElementById('studentDisciplineReadOnly').textContent = student && numberOrNull(student.disciplinePoints) !== null
    ? `${Number(student.disciplinePoints)}/40 — updated only through a reviewed official import.`
    : 'No official total recorded. Only updated through a reviewed official import.';
  document.getElementById('studentAttendance').value = student?.attendanceRate ?? '';
  document.getElementById('studentM').dataset.editingId = student?.id || '';
  document.getElementById('studentM').classList.add('on');
}
function closeStudentForm() {
  document.getElementById('studentM').classList.remove('on');
}
function saveStudentForm(event) {
  event.preventDefault();
  const modal = document.getElementById('studentM');
  const editingId = modal.dataset.editingId;
  const id = document.getElementById('studentId').value.trim();
  const name = document.getElementById('studentName').value.trim();
  const cls = document.getElementById('studentClass').value.trim();
  if (!id || !name || !cls) return toast('ID, name, and class are required.');
  let student = editingId ? window.schoolData.students.find(item => item.id === editingId) : null;
  if (!student && window.schoolData.students.some(item => item.id.toLowerCase() === id.toLowerCase())) {
    return toast('That student ID already exists.');
  }
  const isNew = !student;
  if (!student) {
    student = { id, absences: 0, photo: null, academicScore: null, disciplinePoints: null, attendanceRate: null };
    window.schoolData.students.push(student);
  }
  Object.assign(student, {
    name,
    gender: document.getElementById('studentGender').value,
    class: cls,
    level: document.getElementById('studentLevel').value,
    status: document.getElementById('studentStatus').value,
    guardianName: document.getElementById('guardianName').value.trim(),
    guardianPhone: document.getElementById('guardianPhone').value.trim(),
    guardianEmail: document.getElementById('guardianEmail').value.trim(),
    academicScore: document.getElementById('studentAcademic').value === '' ? null : Number(document.getElementById('studentAcademic').value),
    attendanceRate: document.getElementById('studentAttendance').value === '' ? null : Number(document.getElementById('studentAttendance').value)
  });
  computeClassStats();
  saveStudents();
  populateAttendanceClassSelect();
  renderUserTable();
  populateDMStudentDropdown();
  updateDashboardStats();
  logActivity('student', isNew ? 'Student created' : 'Student record updated', 'Admin', student.id + ' — ' + student.name);
  recordAuditEvent('Admin', isNew ? 'Student record created' : 'Student record updated', student.id, student.name);
  closeStudentForm();
  toast(isNew ? 'Student created.' : 'Student record updated.');
}
function editStudent(id) {
  openStudentForm(id);
}
function toggleStudentArchive(id) {
  const student = window.schoolData.students.find(item => item.id === id);
  if (!student) return;
  student.status = student.status === 'Archived' ? 'Active' : 'Archived';
  computeClassStats();
  saveStudents();
  populateAttendanceClassSelect();
  renderUserTable();
  updateDashboardStats();
  logActivity('student', student.status === 'Archived' ? 'Student archived' : 'Student restored', 'Admin', student.id);
  recordAuditEvent('Admin', student.status === 'Archived' ? 'Student archived' : 'Student restored', student.id, student.name);
  toast(student.status === 'Archived' ? 'Student archived; record retained.' : 'Student restored.');
}
function viewStudent(id) {
  const student = window.schoolData.students.find(item => item.id === id);
  if (!student) return;
  const discipline = window.schoolData.disciplineEvents.filter(item => item.studentId === id).slice(-8).reverse();
  const academics = window.schoolData.academicRecords.filter(item => item.studentId === id).slice(-8).reverse();
  const attendance = window.schoolData.attendanceRecords.filter(item => item.studentId === id).slice(-8).reverse();
  const lines = [
    student.name + ' (' + student.id + ')',
    'Class: ' + student.class + ' | ' + student.level + ' | ' + student.status,
    'Guardian: ' + (student.guardianName || 'Not recorded') + ' | ' + (student.guardianPhone || 'No phone'),
    'Official discipline total: ' + (student.disciplinePoints ?? 'Not recorded') + '/40',
    'Academic score: ' + (student.academicScore ?? 'Not recorded') + '% | Attendance: ' + (student.attendanceRate ?? 'Not recorded') + '%',
    '', 'Recent discipline events:', ...discipline.map(item => `${item.date}: ${item.reason || 'Score imported'} (${item.change ?? 'total ' + item.total}) by ${item.recordedBy || 'Not recorded'}`),
    '', 'Recent academic records:', ...academics.map(item => `${item.term || ''} ${item.subject || ''}: ${item.score}/${item.maxScore}`),
    '', 'Recent attendance:', ...attendance.map(item => `${item.date}: ${item.status} (${item.period || 'Full Day'})`)
  ];
  alert(lines.join('\n'));
}

// ===== EDIT MODE SYSTEM =====
let editMode = false;
function enableEditMode() {
  editMode = true;
  document.body.classList.add('edit-mode');
  document.getElementById('editBar').classList.add('active');
  document.querySelectorAll('.editable').forEach(el => {
    el.contentEditable = true;
    el.dataset.original = el.textContent;
  });
  toast('Edit mode enabled. Click any text to edit.');
}

function disableEditMode() {
  editMode = false;
  document.body.classList.remove('edit-mode');
  document.getElementById('editBar').classList.remove('active');
  document.querySelectorAll('.editable').forEach(el => {
    el.contentEditable = false;
  });
  toast('Edit mode disabled.');
}

function saveEdits() {
  document.querySelectorAll('.editable').forEach(el => {
    const key = el.dataset.key;
    if (key) {
      window.schoolData.content[key] = el.textContent;
    }
  });
  localStorage.setItem('ldk-content', JSON.stringify(window.schoolData.content));
  toast('All changes saved successfully!');
}

function loadContentEdits() {
  const saved = localStorage.getItem('ldk-content');
  if (saved) {
    window.schoolData.content = JSON.parse(saved);
    Object.entries(window.schoolData.content).forEach(([key, val]) => {
      const el = document.querySelector(`[data-key="${key}"]`);
      if (el) el.textContent = val;
    });
  }
}

function editBento(index) {
  if (!editMode) enableEditMode();
  toast('Edit mode enabled. Click the text you want to change.');
}

function editStaff(index) {
  if (!editMode) enableEditMode();
  toast('Edit mode enabled. Click the text you want to change.');
}

function saveSettings() {
  window.schoolData.settings.schoolName = document.getElementById('setSchoolName').value;
  window.schoolData.settings.motto = document.getElementById('setMotto').value;
  window.schoolData.settings.year = document.getElementById('setYear').value;
  window.schoolData.settings.term = document.getElementById('setTerm').value;
  localStorage.setItem('ldk-settings', JSON.stringify(window.schoolData.settings));
  toast('Settings saved successfully');
}

function loadSettings() {
  const saved = localStorage.getItem('ldk-settings');
  if (saved) {
    window.schoolData.settings = JSON.parse(saved);
    document.getElementById('setSchoolName').value = window.schoolData.settings.schoolName;
    document.getElementById('setMotto').value = window.schoolData.settings.motto;
    document.getElementById('setYear').value = window.schoolData.settings.year;
    document.getElementById('setTerm').value = window.schoolData.settings.term;
  }
}

function exportData() {
  const data = JSON.stringify(window.schoolData, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'ldk-school-data.json';
  a.click();
  URL.revokeObjectURL(url);
  toast('Data exported successfully');
}

function resetAllData() {
  if (!confirm('WARNING: This will reset ALL student data to demo state. Are you sure?')) return;
  generateDemoData();
  window.schoolData.attendanceRecords = [];
  window.schoolData.disciplineEvents = [];
  window.schoolData.academicRecords = [];
  window.schoolData.importBatches = [];
  window.schoolData.activityLog = [];
  saveStudents();
  saveSchoolRecords();
  populateAttendanceClassSelect();
  loadAtt();
  renderUserTable();
  updateDashboardStats();
  renderAllClassRankings();
  renderAllAcademicRankings();
  renderTop30Overall();
  renderTop30Discipline();
  renderNeedsAttention();
  renderClassesBelowTarget();
  renderClassLeaders();
  toast('All data reset to demo state');
}

// ===== THEME SYSTEM =====
function initTheme() {
  const saved = localStorage.getItem('ldk-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  updateThemeIcon(saved);
}
function toggleMobileNav() {
  document.getElementById('navMobilePanel').classList.toggle('on');
}
function toggleTheme() {
  const html = document.documentElement;
  const current = html.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  localStorage.setItem('ldk-theme', next);
  updateThemeIcon(next);
}
function updateThemeIcon(theme) {
  document.querySelectorAll('.themeIcon').forEach(icon => {
    if (theme === 'dark') {
      icon.innerHTML = '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>';
    } else {
      icon.innerHTML = '<path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>';
    }
  });
}
initTheme();

// ===== STARFIELD CANVAS =====
const canvas = document.getElementById('starfield');
const ctx = canvas.getContext('2d');
let stars = [], width, height, mouseX = 0, mouseY = 0;
function resize() { width = canvas.width = window.innerWidth; height = canvas.height = window.innerHeight; initStars(); }
function initStars() {
  stars = [];
  const count = Math.min(70, Math.floor((width * height) / 18000));
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * width, y: Math.random() * height,
      r: Math.random() * 1.5 + 0.3,
      opacity: Math.random() * 0.8 + 0.2,
      speed: Math.random() * 0.3 + 0.05,
      twinkleSpeed: Math.random() * 0.02 + 0.005,
      twinklePhase: Math.random() * Math.PI * 2
    });
  }
}
function drawStars() {
  if (document.hidden) return;
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  ctx.clearRect(0, 0, width, height);
  const time = Date.now() * 0.001;
  for (let i = 0; i < stars.length; i++) {
    const s = stars[i];
    s.y -= s.speed;
    if (s.y < 0) { s.y = height; s.x = Math.random() * width; }
    const twinkle = Math.sin(time * s.twinkleSpeed * 100 + s.twinklePhase) * 0.4 + 0.6;
    const alpha = s.opacity * twinkle * (isDark ? 1 : 0.35);
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(' + (isDark ? '255,255,255' : '20,83,45') + ',' + (isDark ? alpha : alpha * 2.2) + ')';
    ctx.fill();
  }
  requestAnimationFrame(drawStars);
}
document.addEventListener('visibilitychange', () => { if (!document.hidden) drawStars(); });
window.addEventListener('resize', resize);
resize(); drawStars();

// ===== CURSOR SPOTLIGHT =====
const spotlight = document.getElementById('cursor-spotlight');
let spotVisible = false;
document.addEventListener('mousemove', e => {
  mouseX = e.clientX; mouseY = e.clientY;
  spotlight.style.left = e.clientX + 'px';
  spotlight.style.top = e.clientY + 'px';
  if (!spotVisible) { spotlight.style.opacity = '1'; spotVisible = true; }
});
document.addEventListener('mouseleave', () => { spotlight.style.opacity = '0'; spotVisible = false; });

// ===== HERO PARALLAX =====
const heroIn = document.getElementById('heroIn');
if (heroIn) {
  document.querySelector('.hero').addEventListener('mousemove', e => {
    const x = (e.clientX / window.innerWidth - 0.5) * 20;
    const y = (e.clientY / window.innerHeight - 0.5) * 20;
    heroIn.style.transform = 'translate(' + x + 'px, ' + y + 'px)';
  });
}

// ===== SCROLL REVEAL =====
const obs = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('on'); }
    else { e.target.classList.remove('on'); }
  });
}, { threshold: 0.05, rootMargin: '0px 0px -30px 0px' });
document.querySelectorAll('.rv').forEach(el => obs.observe(el));

function sc(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}

// ===== LOGIN =====
let curRole = 'student';
function openL() { document.getElementById('loginM').classList.add('on'); }
function closeL() { document.getElementById('loginM').classList.remove('on'); }
function setR(r) {
  curRole = r;
  document.querySelectorAll('#loginM .tab').forEach(t => t.classList.remove('on'));
  const tabId = r === 'parent' ? 't-par' : 't-' + r.substring(0, 3);
  const tab = document.getElementById(tabId);
  if (tab) tab.classList.add('on');
  document.getElementById('arole').classList.toggle('hidden', r !== 'admin');
}
function doL() {
  const id = document.getElementById('lid').value;
  const pw = document.getElementById('lpw').value;
  if (!id || !pw) { toast('Please enter ID and password'); return; }
  closeL();
  document.getElementById('land').classList.add('hidden');
  if (curRole === 'student') { document.getElementById('stuP').classList.add('on'); renderStudentPortal(); }
  else if (curRole === 'staff') { document.getElementById('staP').classList.add('on'); loadAtt(); updateStaffDashboardStats(); populateDMStudentDropdown(); }
  else if (curRole === 'parent') {
    document.getElementById('parP').classList.add('on');
    renderParentOverview();
    renderParentStudentInfo();
    renderParentNotifications();
  }
  else {
    const ar = document.getElementById('asel').value;
    document.getElementById('admP').classList.add('on');
    setupAdmin(ar);
    renderUserTable();
    updateDashboardStats();
    renderAllClassRankings();
    renderAllAcademicRankings();
    renderTop30Overall();
    renderTop30Discipline();
    renderNeedsAttention();
    renderClassesBelowTarget();
    renderClassLeaders();
  }
  toast('Welcome back!'); checkAIVisibility();
}
function logout() {
  document.querySelectorAll('.port').forEach(p => p.classList.remove('on'));
  document.getElementById('land').classList.remove('hidden');
  window.scrollTo(0, 0);
  toast('Logged out successfully'); checkAIVisibility();
}

// ===== PARENT PORTAL =====
function renderParentOverview() {
  const child = {
    name: 'Jean-Paul Manirafasha',
    id: 'LDK-2023-001',
    class: 'S5 Stream 1',
    attendance: '96.5%',
    academic: '88%',
    discipline: '35/40',
    rank: '#12 of 145',
    nextExam: 'Mathematics',
    status: 'On track'
  };

  document.getElementById('parentStudentName').textContent = child.name;
  document.getElementById('parentStudentClass').textContent = child.class;
  document.getElementById('parentAttendanceValue').textContent = child.attendance;
  document.getElementById('parentAcademicValue').textContent = child.academic;
  document.getElementById('parentDisciplineValue').textContent = child.discipline;
  document.getElementById('parentRankValue').textContent = child.rank;
  document.getElementById('parentExamValue').textContent = child.nextExam;
  document.getElementById('parentStatusValue').textContent = child.status;
}

function renderParentStudentInfo() {
  const rows = [
    ['Student ID', 'LDK-2023-001'],
    ['Class', 'S5 Stream 1'],
    ['Form', 'Senior 5'],
    ['Academic Trend', 'Improving'],
    ['Discipline', 'Positive'],
    ['Teacher Remarks', 'Consistent, motivated, hardworking']
  ];

  const tbody = document.getElementById('parentStudentTable');
  tbody.innerHTML = rows.map(([label, value]) => `
    <tr>
      <td style="color:var(--t3)">${label}</td>
      <td style="font-weight:600">${value}</td>
    </tr>
  `).join('');
}

function renderParentNotifications() {
  const items = [
    { title: 'Term 2 exam timetable published', body: 'Your child has been scheduled for Mathematics and Physics examinations this week.', priority: 'high' },
    { title: 'Attendance summary', body: 'Attendance remains strong at 96.5% with only 3 recorded absences this term.', priority: 'normal' },
    { title: 'School announcement', body: 'School fee reminder has been sent to the parent office for guidance.', priority: 'low' }
  ];

  const container = document.getElementById('parentNotifList');
  container.innerHTML = items.map(item => `
    <div class="notif-item notif-item-tilt unread" onclick="markRead(this)">
      <div class="notif-top">
        <div><span class="notif-title">${item.title}</span><span class="notif-priority ${item.priority}">${item.priority.charAt(0).toUpperCase() + item.priority.slice(1)}</span></div>
        <span class="notif-time">Today</span>
      </div>
      <div class="notif-body">${item.body}</div>
      <div class="notif-sender">From: LDK School Administration</div>
    </div>
  `).join('');
}

// ===== STUDENT TABS =====
function sTab(t) {
  document.querySelectorAll('#stuP .side-nav a').forEach(a => a.classList.remove('on'));
  document.getElementById('n' + t).classList.add('on');
  document.querySelectorAll('#stuP .main > div').forEach(d => d.classList.add('hidden'));
  document.getElementById('v-' + t).classList.remove('hidden');
  const titles = { sd: 'Dashboard', sdi: 'Discipline Record', sab: 'Absence Justification', san: 'Announcements', snot: 'Notifications' };
  document.getElementById('st').textContent = titles[t];
  renderStudentPortal();
  if (t === 'sab') renderAbsenceHistory();
  checkAIVisibility();
}
// ===== ABSENCE JUSTIFICATIONS =====
// Shared between the student's own "My Absence History" and the staff
// "Pending Justifications" queue — approving/rejecting on the staff side
// now actually updates what the student sees, instead of the two views
// being disconnected static lists.
// Demo identity only. After authentication exists, pass the linked student
// record's stable student_id to this adapter; never derive it from form input.
let CURRENT_STUDENT = { name: 'Jean-Paul Manirafasha', id: 'LDK-2023-001', class: 'S5 Stream 1' };
function setStudentPortalRecord(studentId) {
  const student = window.schoolData.students.find(item => item.id.toLowerCase() === String(studentId).toLowerCase());
  if (!student) return false;
  CURRENT_STUDENT = { name: student.name, id: student.id, class: student.class };
  renderStudentPortal();
  return true;
}
function renderStudentPortal() {
  const student = window.schoolData.students.find(item => item.id === CURRENT_STUDENT.id);
  if (!student) return;
  CURRENT_STUDENT = { name: student.name, id: student.id, class: student.class };
  const setText = (id, value) => { const el = document.getElementById(id); if (el) el.textContent = value; };
  setText('studentPortalName', student.name);
  setText('studentPortalClass', student.class || student.level || 'Student');
  setText('studentDisciplineTotal', `${student.disciplinePoints ?? '--'}/40`);
  setText('studentDisciplineBadge', `Official total: ${student.disciplinePoints ?? '--'}/40`);
  setText('studentDisciplineUpdated', student.disciplineSnapshotDate ? `Imported ${student.disciplineSnapshotDate}` : 'Demo/current roster value');
  setText('studentAttendanceRate', `${student.attendanceRate ?? '--'}%`);
  setText('studentAbsenceCount', String(student.absences ?? 0));
  const classStudents = window.schoolData.students.filter(item => item.class === student.class && item.status !== 'Archived');
  const schoolStudents = window.schoolData.students.filter(item => item.status !== 'Archived');
  const rank = roster => {
    const ranked = roster.filter(item => combinedPerformanceIndex(item) !== null)
      .sort((a, b) => combinedPerformanceIndex(b) - combinedPerformanceIndex(a));
    const position = ranked.findIndex(item => item.id === student.id);
    return position < 0 ? 'Not ranked' : `#${position + 1} of ${ranked.length}`;
  };
  setText('studentClassRank', rank(classStudents));
  setText('studentSchoolRank', `School rank ${rank(schoolStudents)}`);
  const events = window.schoolData.disciplineEvents.filter(item => item.studentId === student.id).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const history = document.getElementById('studentDisciplineHistory');
  if (history) history.innerHTML = events.length ? events.map(item => {
    const value = item.change === null || item.change === undefined ? (item.total === null || item.total === undefined ? 'Snapshot' : `Total ${item.total}/40`) : `${item.change > 0 ? '+' : ''}${item.change}`;
    return `<tr><td>${escapeHTML(item.date || '')}</td><td>${escapeHTML(item.reason || 'Official discipline data import')}</td><td>${escapeHTML(value)}</td><td>${escapeHTML(item.recordedBy || item.source || 'Not recorded')}</td><td><span class="tag tag-ap">${escapeHTML(item.status || (item.total === null ? 'Reported' : 'Imported'))}</span></td></tr>`;
  }).join('') : '<tr><td colspan="5" style="text-align:center;color:var(--t3)">No discipline history imported for this student yet.</td></tr>';
  const recent = document.getElementById('studentRecentDiscipline');
  if (recent) recent.innerHTML = events.slice(0, 4).map(item => `<div style="padding:12px;background:var(--s2);border-radius:8px"><div style="font-size:14px;font-weight:600">${escapeHTML(item.reason || (item.total === null ? 'Action reported' : `Official total updated to ${item.total}/40`))}</div><div style="font-size:12px;color:var(--t3)">${escapeHTML(item.date || '')} · ${escapeHTML(item.recordedBy || item.source || 'Not recorded')} · ${item.total === null ? 'Awaiting/recorded reference' : `Official total ${item.total}/40`}</div></div>`).join('') || '<div style="padding:12px;color:var(--t3)">Official discipline details will appear here after the school imports them.</div>';
}

function seedJustifications() {
  return [
    { id: 1, student: 'Jean-Paul Manirafasha', studentId: 'LDK-2023-001', class: 'S5 Stream 1', initials: 'JM', color: 'linear-gradient(135deg,var(--a),var(--r))', date: 'Aug 6, 2025', reason: 'Transportation', detail: 'Bus breakdown on KG 11 route. Arrived 45 minutes late.', proofName: null, status: 'Pending' },
    { id: 2, student: 'Claire Umutoni', studentId: 'LDK-2023-045', class: 'S4 Stream 2', initials: 'CU', color: 'linear-gradient(135deg,var(--g),#059669)', date: 'Aug 5, 2025', reason: 'Medical', detail: 'Malaria symptoms. Medical certificate from CHUK attached.', proofName: null, status: 'Pending' },
    { id: 3, student: 'Patrick Habyarimana', studentId: 'LDK-2022-089', class: 'S6 Stream 1', initials: 'PH', color: 'linear-gradient(135deg,var(--w),#d97706)', date: 'Aug 4, 2025', reason: 'Family Emergency', detail: 'Father hospitalized at King Faisal Hospital.', proofName: null, status: 'Pending' },
    { id: 4, student: 'Jean-Paul Manirafasha', studentId: 'LDK-2023-001', class: 'S5 Stream 1', initials: 'JM', color: 'linear-gradient(135deg,var(--a),var(--r))', date: 'August 1, 2025', reason: 'Medical', detail: "Fever and headache. Doctor's note from CHUK attached.", proofName: 'medical_note.pdf', status: 'Approved' },
    { id: 5, student: 'Jean-Paul Manirafasha', studentId: 'LDK-2023-001', class: 'S5 Stream 1', initials: 'JM', color: 'linear-gradient(135deg,var(--a),var(--r))', date: 'July 25, 2025', reason: 'Family Emergency', detail: 'Funeral attendance in Bugesera district.', proofName: null, status: 'Approved' }
  ];
}
function loadJustifications() {
  const saved = localStorage.getItem('ldk-justifications');
  if (saved) {
    try { window.schoolData.justifications = JSON.parse(saved); return; }
    catch (e) { /* fall through to seed */ }
  }
  window.schoolData.justifications = seedJustifications();
  saveJustifications();
}
function saveJustifications() {
  localStorage.setItem('ldk-justifications', JSON.stringify(window.schoolData.justifications));
}
function tagClassFor(status) {
  return status === 'Approved' ? 'tag-ap' : status === 'Rejected' ? 'tag-rj' : 'tag-pe';
}
function renderAbsenceHistory() {
  const container = document.getElementById('absenceHistory');
  if (!container) return;
  const mine = window.schoolData.justifications
    .filter(j => j.studentId === CURRENT_STUDENT.id)
    .sort((a, b) => b.id - a.id);
  container.innerHTML = mine.length ? mine.map(j => `
    <div style="padding:14px;border:1px solid var(--b);border-radius:10px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px"><span style="font-size:14px;font-weight:600">${escapeHTML(j.date)}</span><span class="tag ${tagClassFor(j.status)}">${escapeHTML(j.status)}</span></div>
      <div style="font-size:13px;color:var(--t2)">${escapeHTML(j.reason)} — ${escapeHTML(j.detail)}${j.proofName ? ' <span style="color:var(--t3)">📎 ' + escapeHTML(j.proofName) + '</span>' : ''}</div>
    </div>
  `).join('') : '<div style="font-size:13px;color:var(--t3)">No absence justifications submitted yet.</div>';
}
function renderPendingJustifications() {
  const container = document.getElementById('pendingJustifications');
  if (!container) return;
  const pending = window.schoolData.justifications.filter(j => j.status === 'Pending');
  container.innerHTML = pending.length ? pending.map(j => `
    <div style="padding:14px;border:1px solid var(--b);border-radius:10px">
      <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:8px">
        <div style="display:flex;align-items:center;gap:10px"><div class="avatar-sm" style="background:${j.color}">${escapeHTML(j.initials)}</div><div><div style="font-size:14px;font-weight:600">${escapeHTML(j.student)}</div><div style="font-size:12px;color:var(--t3)">${escapeHTML(j.studentId)} — ${escapeHTML(j.class)}</div></div></div>
        <span class="tag tag-pe">Pending</span>
      </div>
      <div style="font-size:13px;color:var(--t2);margin-bottom:8px"><strong>${escapeHTML(j.date)}</strong> — ${escapeHTML(j.reason)}: ${escapeHTML(j.detail)}${j.proofName ? ' <span style="color:var(--t3)">📎 ' + escapeHTML(j.proofName) + '</span>' : ''}</div>
      <div style="display:flex;gap:8px;justify-content:flex-end">
        <button class="btn btn-d" style="font-size:12px" onclick="resolveJustification(${j.id},'Rejected')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Reject</button>
        <button class="btn btn-s" style="font-size:12px" onclick="resolveJustification(${j.id},'Approved')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Approve</button>
      </div>
    </div>
  `).join('') : '<div style="font-size:13px;color:var(--t3)">No pending justifications — all caught up.</div>';
}
function resolveJustification(id, status) {
  const j = window.schoolData.justifications.find(j => j.id === id);
  if (!j) return;
  j.status = status;
  saveJustifications();
  recordAuditEvent('Staff', 'Absence justification ' + status.toLowerCase(), j.studentId, `${j.student} · ${j.class}`);
  renderPendingJustifications();
  renderAbsenceHistory();
  logActivity('justification', 'Absence justification ' + status.toLowerCase(), j.student || 'Staff', j.class || '');
  updateDashboardStats();
  updateStaffDashboardStats();
  toast('Justification ' + status.toLowerCase() + (j.student ? ' for ' + j.student : ''));
}
function handleProofFileChange(input) {
  const zone = document.getElementById('aproofZone');
  const file = input.files && input.files[0];
  if (!file) return;
  window._pendingProofName = file.name;
  zone.innerHTML = '📎 ' + file.name + ' selected — click to change';
}
function subAbs() {
  const d = document.getElementById('adate').value;
  const reasonSel = document.getElementById('areason').value;
  const de = document.getElementById('adetail').value;
  if (!d || !de) { toast('Please fill all fields'); return; }

  const dateObj = new Date(d + 'T00:00:00');
  const formatted = isNaN(dateObj) ? d : dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  window.schoolData.justifications.push({
    id: Date.now(),
    student: CURRENT_STUDENT.name, studentId: CURRENT_STUDENT.id, class: CURRENT_STUDENT.class,
    initials: getInitials(CURRENT_STUDENT.name), color: 'linear-gradient(135deg,var(--a),var(--r))',
    date: formatted, reason: reasonSel, detail: de,
    proofName: window._pendingProofName || null, status: 'Pending'
  });
  saveJustifications();
  recordAuditEvent(CURRENT_STUDENT.id, 'Absence justification submitted', CURRENT_STUDENT.id, reasonSel + ' · ' + d);
  renderAbsenceHistory();
  renderPendingJustifications();
  toast('Justification submitted successfully!');
  document.getElementById('adate').value = '';
  document.getElementById('adetail').value = '';
  document.getElementById('aproofFile').value = '';
  document.getElementById('aproofZone').innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin:0 auto 8px;display:block"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>Click to upload medical certificate or proof document';
  window._pendingProofName = null;
}
function markRead(el) {
  el.classList.remove('unread');
  el.classList.add('read');
  updateBadgeCounts();
}

// ===== STAFF TABS =====
function staTab(t) {
  // The sidebar link ids don't all follow the "n"+tab pattern (e.g. the
  // real id for 'stajs' is "ntjs", not "nstajs") -- document.getElementById
  // was returning null and throwing, which silently aborted this whole
  // function before it ever reached the code that actually switches the
  // visible view. Mapped explicitly instead of guessing the id.
  const navIds = { stad: 'ntad', staat: 'ntaat', stajs: 'ntjs', stadm: 'ntadm', stnot: 'ntnot' };
  document.querySelectorAll('#staP .side-nav a').forEach(a => a.classList.remove('on'));
  document.getElementById(navIds[t]).classList.add('on');
  document.querySelectorAll('#staP .main > div').forEach(d => d.classList.add('hidden'));
  document.getElementById('v-' + t).classList.remove('hidden');
  const titles = { stad: 'Dashboard', staat: 'Mark Attendance', stajs: 'Justifications', stadm: 'Discipline Marks', stnot: 'Notifications' };
  document.getElementById('stat').textContent = titles[t];
  if (t === 'stajs') renderPendingJustifications();
  if (t === 'stad') updateStaffDashboardStats();
  if (t === 'staat') loadAtt();
  if (t === 'stadm') populateDMStudentDropdown();
  checkAIVisibility();
}
const demoStudents = [
  { n: 'Jean-Paul Manirafasha', id: 'LDK-2023-001', s: true, color: 'linear-gradient(135deg,#15803d,#14532d)' },
  { n: 'Claire Umutoni', id: 'LDK-2023-045', s: true, color: 'linear-gradient(135deg,#10b981,#059669)' },
  { n: 'Patrick Habyarimana', id: 'LDK-2022-089', s: true, color: 'linear-gradient(135deg,#f59e0b,#d97706)' },
  { n: 'Marie Mukamana', id: 'LDK-2023-112', s: false, color: 'linear-gradient(135deg,#ec4899,#be185d)' },
  { n: 'Jean Bosco Ndayisaba', id: 'LDK-2024-034', s: true, color: 'linear-gradient(135deg,#06b6d4,#0891b2)' },
  { n: 'Diane Uwimana', id: 'LDK-2023-067', s: true, color: 'linear-gradient(135deg,#b91c1c,#7f1d1d)' },
  { n: 'Eric Nshimiyimana', id: 'LDK-2023-078', s: true, color: 'linear-gradient(135deg,#14b8a6,#0d9488)' },
  { n: 'Grace Murekatete', id: 'LDK-2024-012', s: false, color: 'linear-gradient(135deg,#f97316,#ea580c)' }
];
function loadAtt() {
  const list = document.getElementById('atlist');
  const classSelect = document.getElementById('atclass');
  if (!classSelect.value && window.schoolData.classes.length) classSelect.value = window.schoolData.classes[0].name;
  const cls = document.getElementById('atclass').value;
  document.getElementById('atcname').textContent = cls;
  list.innerHTML = '';

  const classStudents = window.schoolData.students.filter(s => s.class === cls && s.status !== 'Archived').sort((a, b) => a.name.localeCompare(b.name));
  window._currentAttStudents = classStudents; // so subAtt() can map rows back to real students
  if (classStudents.length === 0) {
    list.innerHTML = '<div style="padding:20px;text-align:center;color:var(--t3)">No students found in this class. Import students or check demo data.</div>';
    return;
  }

  classStudents.forEach((stu, i) => {
    const row = document.createElement('div');
    row.className = 'at-r';
    const initials = getInitials(stu.name);
    const color = getAvatarColor(stu.name);
    const date = document.getElementById('atdate').value;
    const period = document.getElementById('atperiod').value;
    const existing = window.schoolData.attendanceRecords.find(record => record.studentId === stu.id && record.date === date && record.className === cls && record.period === period);
    const status = existing?.status || 'present';
    row.dataset.studentId = stu.id;
    row.dataset.status = status;
    row.innerHTML = '<div class="at-i"><div class="at-a" style="background:' + color + '">' + escapeHTML(initials) + '</div><div><div style="font-size:14px;font-weight:600">' + escapeHTML(stu.name) + '</div><div style="font-size:12px;color:var(--t3)">' + escapeHTML(stu.id) + '</div></div></div><div class="tog"><button class="tog-btn ' + (status === 'present' ? 'on-p' : '') + '" data-status="present" onclick="toggleAtt(this,\'present\')">Present</button><button class="tog-btn ' + (status === 'absent' ? 'on-a' : '') + '" data-status="absent" onclick="toggleAtt(this,\'absent\')">Absent</button><button class="tog-btn ' + (status === 'late' ? 'on-w' : '') + '" data-status="late" onclick="toggleAtt(this,\'late\')">Late</button><button class="tog-btn ' + (status === 'excused' ? 'on-x' : '') + '" data-status="excused" onclick="toggleAtt(this,\'excused\')">Excused</button></div>';
    list.appendChild(row);
  });
  applyAttDraft();
}
function populateAttendanceClassSelect() {
  const select = document.getElementById('atclass');
  if (!select) return;
  const previous = select.value;
  const classNames = window.schoolData.classes.map(item => item.name).sort((a, b) => a.localeCompare(b));
  select.innerHTML = classNames.map(name => `<option value="${escapeHTML(name)}">${escapeHTML(name)}</option>`).join('');
  if (classNames.includes(previous)) select.value = previous;
}
function toggleAtt(btn, status) {
  const row = btn.closest('.at-r');
  row.dataset.status = status;
  row.querySelectorAll('.tog-btn').forEach(button => {
    button.classList.remove('on-p', 'on-a', 'on-w', 'on-x');
    if (button.dataset.status === status) button.classList.add(({ present: 'on-p', absent: 'on-a', late: 'on-w', excused: 'on-x' })[status]);
  });
}
function markAll(present) {
  document.querySelectorAll('#atlist .at-r').forEach(row => toggleAtt(row.querySelector(`[data-status="${present ? 'present' : 'absent'}"]`), present ? 'present' : 'absent'));
}
// ===== ATTENDANCE DRAFT + SUBMIT =====
// Save Draft used to just toast; now it actually keeps the checked
// present/absent state per class+date so it's there when you come back.
function attDraftKey() {
  const cls = document.getElementById('atclass').value;
  const date = document.getElementById('atdate').value || 'undated';
  const period = document.getElementById('atperiod').value;
  return 'ldk-att-draft-' + cls + '-' + date + '-' + period;
}
function saveAttDraft() {
  const rows = [...document.querySelectorAll('#atlist .at-r')].map(row => ({ studentId: row.dataset.studentId, status: row.dataset.status }));
  localStorage.setItem(attDraftKey(), JSON.stringify(rows));
  toast('Draft saved for ' + document.getElementById('atclass').value);
}
function applyAttDraft() {
  const saved = localStorage.getItem(attDraftKey());
  if (!saved) return;
  try {
    const states = JSON.parse(saved);
    document.querySelectorAll('#atlist .at-r').forEach((row, i) => {
      const entry = states[i];
      if (!entry) return;
      const status = typeof entry === 'boolean' ? (entry ? 'present' : 'absent') : entry.status;
      if (entry.studentId && entry.studentId !== row.dataset.studentId) return;
      if (['present', 'absent', 'late', 'excused'].includes(status)) toggleAtt(row.querySelector(`[data-status="${status}"]`), status);
    });
  } catch (e) { /* ignore corrupt draft */ }
}
function subAtt() {
  const cls = document.getElementById('atclass').value;
  const date = document.getElementById('atdate').value;
  const period = document.getElementById('atperiod').value;
  const rows = [...document.querySelectorAll('#atlist .at-r')];
  if (!date) { toast('Choose an attendance date first.'); return; }
  if (!rows.length) { toast('No students loaded for this class'); return; }
  const timestamp = new Date().toISOString();
  const markedAbsent = rows.filter(row => row.dataset.status === 'absent').length;
  rows.forEach(row => {
    const student = window.schoolData.students.find(item => item.id === row.dataset.studentId);
    if (!student) return;
    const key = item => item.studentId === student.id && item.date === date && item.className === cls && item.period === period;
    const record = window.schoolData.attendanceRecords.find(key);
    const values = { studentId: student.id, date, className: cls, period, status: row.dataset.status, updatedAt: timestamp, submittedBy: 'Staff' };
    if (record) Object.assign(record, values);
    else window.schoolData.attendanceRecords.push({ id: 'attendance-' + student.id + '-' + date + '-' + period, ...values, createdAt: timestamp });
    recalculateAttendanceStats(student);
  });
  computeClassStats();
  saveStudents();
  saveSchoolRecords();
  populateAttendanceClassSelect();
  localStorage.removeItem(attDraftKey());
  // Real-time: the moment attendance is submitted, refresh the Staff
  // dashboard (in case this teacher switches back to it) and the Admin
  // dashboard, plus the shared activity feed both portals read from --
  // this is the actual "teacher marks a class -> stats update everywhere"
  // behavior.
  logActivity('attendance', 'Attendance submitted — ' + cls, 'Staff (Mark Attendance)', date + ', ' + period + ': ' + markedAbsent + ' absent of ' + rows.length);
  recordAuditEvent('Staff', 'Attendance submitted', cls, `${date} · ${period} · ${markedAbsent} absent of ${rows.length}`);
  updateStaffDashboardStats();
  updateDashboardStats();
  toast(`Attendance submitted to Discipline Office — ${markedAbsent} marked absent in ${cls}.`);
}

function recalculateAttendanceStats(student) {
  if (student.attendanceBaseAbsences === undefined) student.attendanceBaseAbsences = Number(student.absences || 0);
  const records = window.schoolData.attendanceRecords.filter(record => record.studentId === student.id);
  student.absences = Number(student.attendanceBaseAbsences) + records.filter(record => record.status === 'absent').length;
  const counted = records.filter(record => record.status !== 'excused');
  if (counted.length) {
    student.attendanceRate = Math.round(counted.filter(record => record.status === 'present' || record.status === 'late').length / counted.length * 1000) / 10;
  }
}
let dmVal = 0;
function setDM(v) { dmVal = v; toast('Points set: ' + (v > 0 ? '+' : '') + v); }
function addDM() {
  const stuSel = document.getElementById('dmstu').value;
  const reason = document.getElementById('dmreason').value;
  if (!dmVal) { toast('Please select points'); return; }
  if (!reason) { toast('Please enter a reason'); return; }

  const idMatch = stuSel.match(/\(([^)]+)\)/);
  const studentName = stuSel.split('(')[0].trim();
  const student = idMatch
    ? window.schoolData.students.find(s => s.id === idMatch[1])
    : window.schoolData.students.find(s => s.name === studentName);

  if (!student) {
    toast('Could not find that student in the system');
    return;
  }
  const date = getLocalDateString();
  window.schoolData.disciplineEvents.push({
    id: 'discipline-log-' + Date.now(), studentId: student.id, date, total: null, change: dmVal,
    reason, recordedBy: document.getElementById('adn')?.textContent || 'Staff',
    source: 'Manual reference to national system', status: 'reported'
  });
  saveSchoolRecords();
  logActivity('discipline', 'Official discipline action documented (' + (dmVal > 0 ? '+' : '') + dmVal + ')', studentName, reason);
  recordAuditEvent(document.getElementById('adn')?.textContent || 'Staff', 'Discipline action reported (official total unchanged)', student.id, reason);
  updateDashboardStats();
  updateStaffDashboardStats();
  toast('Action documented. The official total remains unchanged until an official import updates it.');
  dmVal = 0; document.getElementById('dmreason').value = '';
}

// ===== ADMIN TABS =====
function admTab(t) {
  document.querySelectorAll('#admP .side-nav a').forEach(a => a.classList.remove('on'));
  document.getElementById('n' + t).classList.add('on');
  document.querySelectorAll('#admP .main > div').forEach(d => d.classList.add('hidden'));
  document.getElementById('v-' + t).classList.remove('hidden');
  const titles = { admd: 'Dashboard', admu: 'User Management', admbi: 'Bulk Import', admr: 'Reports', admran: 'Rankings', admnot: 'Notifications', adms: 'Settings' };
  document.getElementById('adt').textContent = titles[t]; checkAIVisibility();
  if (t === 'admr') updateReportSummary();
  if (t === 'admbi') renderImportReviewQueue();

  if (t === 'admran') {
    setTimeout(() => {
      renderAllClassRankings();
      renderAllAcademicRankings();
      renderTop30Overall();
      renderTop30Discipline();
      renderNeedsAttention();
      renderClassesBelowTarget();
      renderClassLeaders();
    }, 50);
  }
  if (t === 'admu') renderUserTable();
}
function setupAdmin(role) {
  const names = { headmaster: 'Headmaster', discipline: 'Discipline Officer', dean: 'Dean of Studies' };
  const initials = { headmaster: 'HM', discipline: 'DO', dean: 'DS' };
  const colors = { headmaster: 'var(--r)', discipline: 'var(--a)', dean: 'var(--w)' };
  const texts = { headmaster: 'Full System Access', discipline: 'Discipline & Attendance Only', dean: 'Academic Affairs Only' };
  document.getElementById('adn').textContent = names[role];
  document.getElementById('adrole').textContent = role === 'headmaster' ? 'Super Admin' : names[role];
  const av = document.getElementById('adav');
  av.textContent = initials[role]; av.style.background = colors[role];
  document.getElementById('adtp').textContent = 'Welcome, ' + names[role] + ' — ' + texts[role];
  const nav = document.getElementById('admNav');
  const restricted = role !== 'headmaster';
  nav.children[1].style.display = role === 'discipline' ? 'none' : '';
  nav.children[2].style.display = role === 'dean' ? 'none' : '';
  nav.children[3].style.display = (role === 'discipline' || role === 'dean') ? 'none' : '';
  nav.children[4].style.display = restricted ? 'none' : '';
  nav.children[5].style.display = restricted ? 'none' : '';
  nav.children[6].style.display = restricted ? 'none' : '';
}

// ===== RANKINGS TABS =====
function setRankTab(tab) {
  document.querySelectorAll('#v-admran .tab').forEach(t => t.classList.remove('on'));
  document.getElementById('rt-' + tab).classList.add('on');
  ['discipline','academic','students','attention','leaders'].forEach(t => {
    document.getElementById('rank-' + t).classList.add('hidden');
  });
  document.getElementById('rank-' + tab).classList.remove('hidden');
}

// ===== NOTIFICATION SYSTEM =====
let currentPriority = 'high';
let selectedRecipients = ['all'];
function setPriority(p) {
  currentPriority = p;
  document.querySelectorAll('[id^="p-"]').forEach(btn => btn.classList.remove('on'));
  document.getElementById('p-' + p).classList.add('on');
}
function toggleRec(r) {
  const btn = document.getElementById('r-' + r);
  if (r === 'all') {
    selectedRecipients = ['all'];
    document.querySelectorAll('.recipient-tags .rec-tag').forEach(b => b.classList.remove('on'));
    btn.classList.add('on');
  } else {
    document.getElementById('r-all').classList.remove('on');
    btn.classList.toggle('on');
    selectedRecipients = [];
    document.querySelectorAll('.recipient-tags .rec-tag.on').forEach(b => {
      const id = b.id.replace('r-', '');
      if (id !== 'all') selectedRecipients.push(id);
    });
    if (selectedRecipients.length === 0) {
      selectedRecipients = ['all'];
      document.getElementById('r-all').classList.add('on');
    }
  }
}
const allPeople = [
  { n: 'Jean-Paul Manirafasha', id: 'LDK-2023-001', role: 'student', class: 'S5 Stream 1' },
  { n: 'Claire Umutoni', id: 'LDK-2023-045', role: 'student', class: 'S4 Stream 2' },
  { n: 'Patrick Habyarimana', id: 'LDK-2022-089', role: 'student', class: 'S6 Stream 1' },
  { n: 'Marie Mukamana', id: 'LDK-2023-112', role: 'student', class: 'S5 Stream 2' },
  { n: 'Mr. Ndayisaba', id: 'STF-001', role: 'staff', class: 'Mathematics' },
  { n: 'Mrs. Uwimana', id: 'STF-002', role: 'staff', class: 'Discipline Office' },
  { n: 'Mr. Habimana', id: 'STF-003', role: 'staff', class: 'Physics' },
];
function searchIndividual() {
  const query = document.getElementById('indivSearch').value.toLowerCase();
  const container = document.getElementById('indivResults');
  container.innerHTML = '';
  if (query.length < 2) return;
  const matches = allPeople.filter(p => p.n.toLowerCase().includes(query) || p.id.toLowerCase().includes(query));
  matches.forEach(p => {
    const tag = document.createElement('button');
    tag.className = 'rec-tag';
    tag.textContent = p.n + ' (' + p.id + ')';
    tag.onclick = function() {
      this.classList.toggle('on');
      toast('Recipient ' + (this.classList.contains('on') ? 'added' : 'removed'));
    };
    container.appendChild(tag);
  });
}
function loadSavedNotifications() {
  const saved = localStorage.getItem('ldk-sent-notifications');
  const sent = saved ? JSON.parse(saved) : [];
  sent.forEach(n => renderNotifItem(n, false));
  updateBadgeCounts();
}
function renderNotifItem(n, prepend) {
  const targets = [];
  const toStudents = n.recipients.includes('all') || n.recipients.includes('students') ||
    n.recipients.some(r => ['s1', 's5', 's6'].includes(r));
  const toStaff = n.recipients.includes('all') || n.recipients.includes('staff') ||
    n.recipients.includes('teachers') || n.recipients.includes('discipline');
  if (toStudents) targets.push('studentNotifList');
  if (toStaff) targets.push('staffNotifList');

  const html = `
    <div class="notif-item notif-item-tilt unread" onclick="markRead(this)">
      <div class="notif-top">
        <div><span class="notif-title">${n.title}</span><span class="notif-priority ${n.priority}">${n.priority.charAt(0).toUpperCase() + n.priority.slice(1)}</span></div>
        <span class="notif-time">Just now</span>
      </div>
      <div class="notif-body">${n.body}</div>
      <div class="notif-sender">From: ${n.sender}</div>
    </div>`;

  targets.forEach(id => {
    const list = document.getElementById(id);
    if (!list) return;
    if (prepend) list.insertAdjacentHTML('afterbegin', html);
    else list.insertAdjacentHTML('beforeend', html);
  });
}
function sendNotification() {
  const title = document.getElementById('notifTitle').value;
  const body = document.getElementById('notifBody').value;
  if (!title || !body) { toast('Please fill title and message'); return; }

  const senderName = document.getElementById('adn') ? document.getElementById('adn').textContent : 'School Administration';
  const notif = { title, body, priority: currentPriority, recipients: [...selectedRecipients], sender: senderName, sentAt: Date.now() };

  renderNotifItem(notif, true);
  updateBadgeCounts();

  const saved = localStorage.getItem('ldk-sent-notifications');
  const all = saved ? JSON.parse(saved) : [];
  all.push(notif);
  localStorage.setItem('ldk-sent-notifications', JSON.stringify(all));

  logActivity('notification', 'Notification sent: ' + title, senderName, 'To: ' + (selectedRecipients.includes('all') ? 'Whole School' : selectedRecipients.join(', ')));
  updateDashboardStats();
  toast('Notification sent to ' + (selectedRecipients.includes('all') ? 'Whole School' : selectedRecipients.length + ' groups') + '!');
  document.getElementById('notifTitle').value = '';
  document.getElementById('notifBody').value = '';
}
function updateBadgeCounts() {
  const studentUnread = document.querySelectorAll('#studentNotifList .unread').length;
  const staffUnread = document.querySelectorAll('#staffNotifList .unread').length;
  const sBadge = document.getElementById('sNotifBadge');
  const bellBadge = document.getElementById('bellBadge');
  const stBadge = document.getElementById('stNotifBadge');
  const stBellBadge = document.getElementById('stBellBadge');
  if (sBadge) sBadge.textContent = studentUnread;
  if (bellBadge) bellBadge.textContent = studentUnread;
  if (stBadge) stBadge.textContent = staffUnread;
  if (stBellBadge) stBellBadge.textContent = staffUnread;
  if (bellBadge) bellBadge.style.display = studentUnread > 0 ? 'flex' : 'none';
  if (stBellBadge) stBellBadge.style.display = staffUnread > 0 ? 'flex' : 'none';
}
function filterUsers() {
  const query = document.getElementById('userSearch').value.toLowerCase();
  const rows = document.querySelectorAll('#userTableBody tr');
  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(query) ? '' : 'none';
  });
}

// ===== MAGIC BENTO EFFECTS =====
document.querySelectorAll('[data-bento]').forEach(card => {
  let particles = [], animId;
  card.addEventListener('mousemove', e => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    const cx = rect.width / 2, cy = rect.height / 2;
    const rx = ((y - cy) / cy) * -8, ry = ((x - cx) / cx) * 8;
    card.style.transform = 'perspective(1000px) rotateX(' + rx + 'deg) rotateY(' + ry + 'deg) translateY(-2px)';
    const gx = (x / rect.width) * 100, gy = (y / rect.height) * 100;
    card.style.setProperty('--glow-x', gx + '%');
    card.style.setProperty('--glow-y', gy + '%');
    card.style.setProperty('--glow-intensity', '1');
    const mx = (x - cx) * 0.03, my = (y - cy) * 0.03;
    card.style.marginLeft = mx + 'px'; card.style.marginTop = my + 'px';
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0)';
    card.style.setProperty('--glow-intensity', '0');
    card.style.marginLeft = '0'; card.style.marginTop = '0';
    particles.forEach(p => p.remove());
    particles = [];
    cancelAnimationFrame(animId);
  });
  card.addEventListener('mouseenter', () => {
    const rect = card.getBoundingClientRect();
    for (let i = 0; i < 8; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      p.style.left = Math.random() * rect.width + 'px';
      p.style.top = Math.random() * rect.height + 'px';
      card.appendChild(p); particles.push(p);
      const dx = (Math.random() - 0.5) * 60, dy = (Math.random() - 0.5) * 60;
      p.animate([{ transform: 'translate(0,0) scale(1)', opacity: 1 }, { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(0.5)', opacity: 0.3 }], { duration: 2000 + Math.random() * 2000, iterations: Infinity, direction: 'alternate', easing: 'ease-in-out' });
    }
  });
  card.addEventListener('click', e => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    const ripple = document.createElement('div');
    ripple.className = 'ripple';
    const size = Math.max(rect.width, rect.height) * 2;
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = (x - size / 2) + 'px';
    ripple.style.top = (y - size / 2) + 'px';
    card.appendChild(ripple);
    ripple.animate([{ transform: 'scale(0)', opacity: 0.6 }, { transform: 'scale(1)', opacity: 0 }], { duration: 800, easing: 'ease-out' });
    setTimeout(() => ripple.remove(), 800);
  });
});

// ===== ACHIEVEMENT COUNTER ANIMATION =====
const countObs = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      const el = e.target;
      const target = parseInt(el.dataset.count);
      const dur = 2000;
      const start = performance.now();
      function update(now) {
        const p = Math.min((now - start) / dur, 1);
        const ease = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.floor(ease * target).toLocaleString();
        if (p < 1) requestAnimationFrame(update);
      }
      requestAnimationFrame(update);
      countObs.unobserve(el);
    }
  });
}, { threshold: 0.5 });
document.querySelectorAll('.ach-num').forEach(el => countObs.observe(el));

// ===== TOAST =====
function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('on');
  setTimeout(() => t.classList.remove('on'), 3000);
}

// Modal backdrop click
document.getElementById('loginM').addEventListener('click', function (e) { if (e.target === this) closeL(); });

// Init badge counts
updateBadgeCounts();

// ===== 3D GLOBE =====
(function(){
  const canvas = document.getElementById('globe-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let width, height, rotation = 0, animationId;
  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }
  resize();
  window.addEventListener('resize', resize);
  const DOT_COUNT = 350;
  const DOTS = [];
  const phi = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < DOT_COUNT; i++) {
    const y = 1 - (i / (DOT_COUNT - 1)) * 2;
    const radius = Math.sqrt(1 - y * y);
    const theta = phi * i;
    DOTS.push({ x: Math.cos(theta) * radius, y: y, z: Math.sin(theta) * radius });
  }
  const pulses = [];
  let lastPulseTime = 0;
  const PULSE_INTERVAL = 2500;
  function startPulse() {
    const fromIndex = Math.floor(Math.random() * DOT_COUNT);
    let toIndex = Math.floor(Math.random() * DOT_COUNT);
    while (toIndex === fromIndex) toIndex = Math.floor(Math.random() * DOT_COUNT);
    pulses.push({ from: fromIndex, to: toIndex, progress: 0, speed: 0.015 + Math.random() * 0.015, life: 1.0 });
  }
  function drawGlobe() {
    const GLOBE_RADIUS = Math.min(width, height) * 0.35;
    ctx.clearRect(0, 0, width, height);
    const cx = width / 2;
    const cy = height / 2;
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const dotColor = isDark ? '255, 255, 255' : '20, 83, 45';
    const lineColor = isDark ? '255, 255, 255' : '20, 83, 45';
    ctx.beginPath();
    ctx.arc(cx, cy, GLOBE_RADIUS, 0, Math.PI * 2);
    ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(20, 83, 45, 0.18)';
    ctx.lineWidth = 1;
    ctx.stroke();
    const cosR = Math.cos(rotation);
    const sinR = Math.sin(rotation);
    const projectedDots = DOTS.map((dot, idx) => {
      const rx = dot.x * cosR - dot.z * sinR;
      const rz = dot.x * sinR + dot.z * cosR;
      const scale = GLOBE_RADIUS;
      const px = cx + rx * scale;
      const py = cy + dot.y * scale;
      const depth = (rz + 1) / 2;
      return { px, py, depth, rx, ry: dot.y, rz, idx };
    });
    projectedDots.sort((a, b) => a.depth - b.depth);
    ctx.lineWidth = 0.5;
    for (let i = 0; i < projectedDots.length; i++) {
      for (let j = i + 1; j < projectedDots.length; j++) {
        const a = projectedDots[i];
        const b = projectedDots[j];
        if (a.depth < 0.3 || b.depth < 0.3) continue;
        const dx = a.px - b.px;
        const dy = a.py - b.py;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 35) {
          const lineAlpha = (1 - dist / 35) * 0.12 * Math.min(a.depth, b.depth);
          ctx.beginPath();
          ctx.moveTo(a.px, a.py);
          ctx.lineTo(b.px, b.py);
          ctx.strokeStyle = `rgba(${lineColor}, ${lineAlpha})`;
          ctx.stroke();
        }
      }
    }
    const now = performance.now();
    if (now - lastPulseTime > PULSE_INTERVAL) { startPulse(); lastPulseTime = now; }
    for (let p = pulses.length - 1; p >= 0; p--) {
      const pulse = pulses[p];
      pulse.progress += pulse.speed;
      pulse.life -= 0.012;
      if (pulse.life <= 0 || pulse.progress >= 1) { pulses.splice(p, 1); continue; }
      const fromDot = projectedDots.find(d => d.idx === pulse.from);
      const toDot = projectedDots.find(d => d.idx === pulse.to);
      if (!fromDot || !toDot) continue;
      if (fromDot.depth < 0.2 || toDot.depth < 0.2) continue;
      const px = fromDot.px + (toDot.px - fromDot.px) * pulse.progress;
      const py = fromDot.py + (toDot.py - fromDot.py) * pulse.progress;
      const pulseSize = 2.5 * pulse.life;
      const pulseAlpha = 0.7 * pulse.life;
      ctx.beginPath();
      ctx.arc(px, py, pulseSize, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${dotColor}, ${pulseAlpha})`;
      ctx.fill();
      const glowSize = 6 * pulse.life;
      const glowGrad = ctx.createRadialGradient(px, py, 0, px, py, glowSize);
      glowGrad.addColorStop(0, `rgba(${dotColor}, ${pulseAlpha * 0.4})`);
      glowGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(px, py, glowSize, 0, Math.PI * 2);
      ctx.fill();
    }
    projectedDots.forEach(dot => {
      const size = 1.2 + dot.depth * 1.2;
      const alpha = 0.12 + dot.depth * 0.55;
      ctx.beginPath();
      ctx.arc(dot.px, dot.py, size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${dotColor}, ${alpha})`;
      ctx.fill();
    });
    const gridLines = 5;
    for (let i = 0; i < gridLines; i++) {
      const lat = -90 + (180 / (gridLines - 1)) * i;
      ctx.beginPath();
      let first = true;
      for (let lon = 0; lon <= 360; lon += 6) {
        const latRad = lat * Math.PI / 180;
        const lonRad = (lon + rotation * 180 / Math.PI) * Math.PI / 180;
        const px = cx + GLOBE_RADIUS * Math.cos(latRad) * Math.cos(lonRad);
        const py = cy - GLOBE_RADIUS * Math.sin(latRad);
        if (first) { ctx.moveTo(px, py); first = false; }
        else { ctx.lineTo(px, py); }
      }
      ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(20, 83, 45, 0.1)';
      ctx.stroke();
    }
    for (let i = 0; i < gridLines; i++) {
      const lon = -180 + (360 / (gridLines - 1)) * i;
      ctx.beginPath();
      let first = true;
      for (let lat = -90; lat <= 90; lat += 6) {
        const latRad = lat * Math.PI / 180;
        const lonRad = (lon + rotation * 180 / Math.PI) * Math.PI / 180;
        const px = cx + GLOBE_RADIUS * Math.cos(latRad) * Math.cos(lonRad);
        const py = cy - GLOBE_RADIUS * Math.sin(latRad);
        if (first) { ctx.moveTo(px, py); first = false; }
        else { ctx.lineTo(px, py); }
      }
      ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(20, 83, 45, 0.1)';
      ctx.stroke();
    }
    rotation += 0.0025;
    animationId = requestAnimationFrame(drawGlobe);
  }
  const globeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { if (!animationId) drawGlobe(); }
      else { if (animationId) { cancelAnimationFrame(animationId); animationId = null; } }
    });
  });
  globeObserver.observe(canvas);
})();

// ===== FOREGROUND STARS =====
(function(){
  const canvas = document.getElementById('starfield-fg');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let width, height, stars = [];
  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    width = canvas.width = rect.width;
    height = canvas.height = rect.height;
    initStars();
  }
  function initStars() {
    stars = [];
    const count = Math.min(40, Math.floor((width * height) / 22000));
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * width, y: Math.random() * height,
        r: Math.random() * 1.2 + 0.2,
        opacity: Math.random() * 0.5 + 0.1,
        speed: Math.random() * 0.15 + 0.02,
        twinkleSpeed: Math.random() * 0.015 + 0.003,
        twinklePhase: Math.random() * Math.PI * 2
      });
    }
  }
  function draw() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    ctx.clearRect(0, 0, width, height);
    const time = Date.now() * 0.001;
    stars.forEach(s => {
      s.y -= s.speed;
      if (s.y < 0) { s.y = height; s.x = Math.random() * width; }
      const twinkle = Math.sin(time * s.twinkleSpeed * 100 + s.twinklePhase) * 0.4 + 0.6;
      const alpha = s.opacity * twinkle * (isDark ? 0.9 : 0.3);
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + (isDark ? '255,255,255' : '30,41,59') + ',' + (isDark ? alpha : alpha * 2.2) + ')';
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }
  window.addEventListener('resize', resize);
  resize();
  draw();
})();

// ===== CLICKSPARK =====
(function(){
  const canvas = document.getElementById('clickspark-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let width, height;
  const sparks = [];
  const sparkColor = '#15803d';
  const sparkSize = 10;
  const sparkRadius = 15;
  const sparkCount = 8;
  const duration = 400;
  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }
  resize();
  window.addEventListener('resize', resize);
  function createSparks(x, y) {
    const now = performance.now();
    for (let i = 0; i < sparkCount; i++) {
      sparks.push({ x, y, angle: (2 * Math.PI * i) / sparkCount, startTime: now });
    }
  }
  document.addEventListener('click', (e) => {
    if (window.matchMedia('(pointer: coarse)').matches) return;
    const target = e.target;
    if (target.closest('a') || target.closest('button') || target.closest('input') || target.closest('textarea') || target.closest('select')) return;
    createSparks(e.clientX, e.clientY);
  });
  function easeOut(t) { return t * (2 - t); }
  function drawSparks() {
    if (!sparks.length) { requestAnimationFrame(drawSparks); return; }
    ctx.clearRect(0, 0, width, height);
    for (let i = sparks.length - 1; i >= 0; i--) {
      const spark = sparks[i];
      const elapsed = performance.now() - spark.startTime;
      if (elapsed >= duration) { sparks.splice(i, 1); continue; }
      const progress = elapsed / duration;
      const eased = easeOut(progress);
      const distance = eased * sparkRadius;
      const lineLength = sparkSize * (1 - eased);
      const x1 = spark.x + distance * Math.cos(spark.angle);
      const y1 = spark.y + distance * Math.sin(spark.angle);
      const x2 = spark.x + (distance + lineLength) * Math.cos(spark.angle);
      const y2 = spark.y + (distance + lineLength) * Math.sin(spark.angle);
      ctx.strokeStyle = sparkColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
    requestAnimationFrame(drawSparks);
  }
  drawSparks();
})();

// ===== CARD 3D TILT =====
(function(){
  function applyTilt(el) {
    if (window.matchMedia('(pointer: coarse)').matches) return;
    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const isRank = el.classList.contains('rank-card-tilt');
      const mult = isRank ? 0.6 : 3;
      const rx = ((y - cy) / cy) * -mult;
      const ry = ((x - cx) / cx) * mult;
      const z = isRank ? 2 : 6;
      el.style.transform = 'perspective(800px) rotateX(' + rx + 'deg) rotateY(' + ry + 'deg) translateZ(' + z + 'px)';
    });
    el.addEventListener('mouseleave', () => {
      el.style.transform = 'perspective(800px) rotateX(0) rotateY(0) translateZ(0)';
    });
  }
  document.querySelectorAll('.card-tilt, .str-tilt, .ach-card-tilt, .rank-card-tilt, .stf-tilt, .notif-item-tilt, .at-r-tilt, .compose-card-tilt').forEach(applyTilt);
})();


// ===== AI ASSISTANT =====
function toggleAI() {
  const panel = document.getElementById('ai-chat-panel');
  const fab = document.getElementById('ai-fab');
  if (panel.style.display === 'none') {
    panel.style.display = 'flex';
    fab.style.transform = 'scale(0)';
    setTimeout(() => document.getElementById('ai-input').focus(), 100);
  } else {
    panel.style.display = 'none';
    fab.style.transform = 'scale(1)';
  }
}
function checkAIVisibility() {
  const ai = document.getElementById('ai-assistant');
  if (!ai) return;
  // Chatbot is now visible on every page (landing + all portals)
  ai.style.display = 'block';
}
async function sendAIMessage() {
  const input = document.getElementById('ai-input');
  const msg = input.value.trim();
  if (!msg) return;
  addAIMessage(msg, 'user');
  input.value = '';
  await processAIResponse(msg);
}
function addAIMessage(text, sender) {
  const container = document.getElementById('ai-messages');
  const div = document.createElement('div');
  if (sender === 'user') {
    div.style.cssText = 'align-self:flex-end;max-width:85%;padding:10px 14px;background:var(--a);color:#fff;border-radius:12px;border-bottom-right-radius:4px;font-size:13px';
  } else {
    div.style.cssText = 'align-self:flex-start;max-width:85%;padding:10px 14px;background:var(--s2);border-radius:12px;border-bottom-left-radius:4px;color:var(--t2);font-size:13px;line-height:1.5';
  }
  if (sender === 'user') {
    div.textContent = text;
  } else {
    const template = document.createElement('template');
    template.innerHTML = text;
    const allowedTags = new Set(['STRONG', 'B', 'EM', 'I', 'BR', 'P', 'UL', 'OL', 'LI', 'CODE', 'PRE']);
    const appendSafe = (source, target) => {
      [...source.childNodes].forEach(node => {
        if (node.nodeType === Node.TEXT_NODE) target.appendChild(document.createTextNode(node.textContent));
        else if (node.nodeType === Node.ELEMENT_NODE) {
          if (!allowedTags.has(node.tagName)) return appendSafe(node, target);
          const safeNode = document.createElement(node.tagName.toLowerCase());
          appendSafe(node, safeNode);
          target.appendChild(safeNode);
        }
      });
    };
    appendSafe(template.content, div);
  }
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}
async function processAIResponse(msg) {
  // Track conversation history for context
  chatHistory.push({ role: 'user', content: msg });
  if (chatHistory.length > 20) chatHistory = chatHistory.slice(-20);

  // If API is disabled, jump straight to offline fallback
  if (!AI_CONFIG.USE_API) {
    processLocalAIResponse(msg);
    return;
  }

  showAILoading(true);

  try {
    const messages = [
      { role: 'system', content: AI_CONFIG.SYSTEM_PROMPT },
      ...chatHistory.map(m => ({ role: m.role, content: m.content }))
    ];

    const response = await fetch(AI_CONFIG.API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: AI_CONFIG.MODEL,
        messages: messages,
        temperature: 0.7,
        max_tokens: 800,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error('HTTP ' + response.status + ' ' + response.statusText);
    }

    const data = await response.json();

    // Extract reply — works for OpenAI, Ollama, LM Studio, OpenRouter
    let botMsg = '';
    if (data.choices && data.choices[0] && data.choices[0].message) {
      botMsg = data.choices[0].message.content;
    } else if (data.message && data.message.content) {
      botMsg = data.message.content;           // Ollama native format
    } else if (data.response) {
      botMsg = data.response;                  // Some local servers
    } else {
      botMsg = '<em>Received unexpected response format.</em><br><pre style="font-size:11px;overflow:auto">' + JSON.stringify(data, null, 2) + '</pre>';
    }

    chatHistory.push({ role: 'assistant', content: botMsg });
    if (chatHistory.length > 20) chatHistory = chatHistory.slice(-20);

    addAIMessage(botMsg, 'bot');

  } catch (err) {
    console.error('AI API Error:', err);
    addAIMessage(
      '⚠️ <strong>Could not reach the AI server.</strong><br><br>' +
      'Error: <code style="background:var(--s3);padding:2px 6px;border-radius:4px">' + err.message + '</code><br><br>' +
      'Checklist:<br>• Is your API server running?<br>• Is the URL in <code>AI_CONFIG.API_URL</code> correct?<br>• Did you enable CORS on the server?<br>• Is your API key correct?<br><br>' +
      '<em>Activating offline fallback...</em>',
      'bot'
    );
    processLocalAIResponse(msg);
  } finally {
    showAILoading(false);
  }
}

function showAILoading(show) {
  const container = document.getElementById('ai-messages');
  let loader = document.getElementById('ai-loader');
  if (show) {
    if (!loader) {
      loader = document.createElement('div');
      loader.id = 'ai-loader';
      loader.style.cssText = 'align-self:flex-start;max-width:85%;padding:10px 14px;background:var(--s2);border-radius:12px;border-bottom-left-radius:4px;color:var(--t3);font-size:13px;display:flex;align-items:center;gap:8px';
      loader.innerHTML = '<span></span><span></span><span></span> Thinking...';
      container.appendChild(loader);
      container.scrollTop = container.scrollHeight;
    }
  } else {
    if (loader) loader.remove();
  }
}

/* Offline fallback — used when API is unreachable or USE_API is false */
function processLocalAIResponse(msg) {
  const lower = msg.toLowerCase();
  let response = '';

  if (lower.includes('student') && lower.includes('count')) {
    response = 'There are currently <strong>' + window.schoolData.students.length.toLocaleString() + '</strong> students in the system across ' + window.schoolData.classes.length + ' classes.';
  }
  else if (lower.includes('rank') || lower.includes('top')) {
    const top = getTop30Overall()[0];
    response = top
      ? 'The top performing student is <strong>' + escapeHTML(top.name) + '</strong> from ' + escapeHTML(top.class) + ' with a combined index of <strong>' + top.index + '</strong>.'
      : 'There are no students with both discipline and academic scores to rank yet.';
  }
  else if (lower.includes('attention') || lower.includes('trouble') || lower.includes('bad')) {
    const count = getNeedsAttention().length;
    response = 'There are <strong>' + count + '</strong> students currently flagged as needing attention (discipline under 20 or academic under 60%).';
  }
  else if (lower.includes('csv') || lower.includes('spreadsheet') || lower.includes('export') || lower.includes('download')) {
    const csv = generateStudentCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ldk-students-' + new Date().toISOString().split('T')[0] + '.csv';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    response = 'I\'ve generated and downloaded a CSV file with all student data including discipline points, academic scores, and attendance rates.';
  }
  else if (lower.includes('class') && (lower.includes('best') || lower.includes('good'))) {
    const best = getClassRankings()[0];
    response = best
      ? 'The best performing class by discipline is <strong>' + escapeHTML(best.name) + '</strong> with an average of <strong>' + (best.avgDiscipline ?? 'N/A') + '/40</strong> discipline points and <strong>' + (best.avgAcademic ?? 'N/A') + '%</strong> academic score.'
      : 'No class data is available yet.';
  }
  else if (lower.includes('attendance')) {
    const attendanceRates = window.schoolData.students.map(student => numberOrNull(student.attendanceRate)).filter(value => value !== null);
    const avg = attendanceRates.length ? Math.round(attendanceRates.reduce((sum, value) => sum + value, 0) / attendanceRates.length * 10) / 10 : null;
    response = 'The average attendance rate across all students is <strong>' + (avg === null ? 'not available' : avg + '%') + '</strong>. You can view detailed breakdowns in the Reports section.';
  }
  else if (lower.includes('discipline') && (lower.includes('mark') || lower.includes('point'))) {
    const totals = window.schoolData.students.map(student => numberOrNull(student.disciplinePoints)).filter(value => value !== null);
    response = 'Discipline marks are out of <strong>40 points per term</strong> (120 annually). Students below <strong>20/40</strong> are flagged for intervention. The highest current score is <strong>' + (totals.length ? Math.max(...totals) + '/40' : 'not available') + '</strong>.';
  }
  else if (lower.includes('hello') || lower.includes('hi') || lower.includes('help')) {
    response = 'Hello! I can help you with:<br>• <strong>Student data</strong> — ask "how many students" or "who is top"<br>• <strong>Export data</strong> — say "generate spreadsheet"<br>• <strong>Rankings</strong> — ask "which class is best"<br>• <strong>Insights</strong> — ask about attendance or discipline<br>What do you need?';
  }
  else {
    response = 'I understand you\'re asking about "<em>' + escapeHTML(msg) + '</em>". I can help with student data, rankings, exports, and school metrics. Try asking something like:<br>• "How many students do we have?"<br>• "Generate a CSV"<br>• "Who needs attention?"<br>• "What is the best class?"';
  }

  addAIMessage(response, 'bot');
}
// ===== REPORT DOWNLOAD =====
// Was a bare toast('Report downloaded') with no file. Now reads the
// actual figures shown in that report card and generates a real CSV.
function downloadReport(btn) {
  const card = btn.closest('.card');
  const title = card.querySelector('h3').textContent.trim();
  if (title === 'Attendance Report') return downloadAttendanceReport();
  if (title === 'Discipline Report') return downloadDisciplineReport();
  const rows = [...card.querySelectorAll(':scope > div > div')].map(row => {
    const spans = row.querySelectorAll(':scope > div > span');
    return spans.length >= 2 ? [spans[0].textContent.trim(), spans[1].textContent.trim()] : null;
  }).filter(Boolean);

  const lines = [
    'Lycée de Kigali — ' + title,
    'Generated: ' + new Date().toLocaleString(),
    '',
    'Metric,Value',
    ...rows.map(r => `"${r[0]}","${r[1]}"`)
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = title.toLowerCase().replace(/\s+/g, '-') + '-' + new Date().toISOString().split('T')[0] + '.csv';
  a.click();
  URL.revokeObjectURL(url);
  toast(title + ' downloaded');
}
function generateStudentCSV() {
  const headers = ['ID', 'Name', 'Gender', 'Class', 'Level', 'Guardian Name', 'Guardian Phone', 'Guardian Email', 'Discipline Points', 'Academic Score', 'Attendance Rate', 'Absences', 'Status'];
  const rows = window.schoolData.students.map(s => [
    s.id, s.name, s.gender, s.class, s.level, s.guardianName, s.guardianPhone, s.guardianEmail,
    s.disciplinePoints, s.academicScore + '%', s.attendanceRate + '%', s.absences, s.status
  ]);
  return [headers, ...rows].map(r => r.map(csvCell).join(',')).join('\n');
}
function getReportPeriod() {
  const from = document.getElementById('reportFrom')?.value || '';
  const to = document.getElementById('reportTo')?.value || '';
  if (from && to && from > to) { toast('Report start date must be before the end date.'); return null; }
  return { from, to };
}
function inReportPeriod(date, period) {
  return (!period.from || date >= period.from) && (!period.to || date <= period.to);
}
function updateReportSummary() {
  const period = getReportPeriod();
  const summary = document.getElementById('reportSummary');
  if (!summary || !period) return;
  const countFor = records => records.filter(record => inReportPeriod(record.date || '', period)).length;
  summary.textContent = `${countFor(window.schoolData.attendanceRecords)} attendance records · ${countFor(window.schoolData.disciplineEvents)} discipline events · ${countFor(window.schoolData.academicRecords)} academic results`;
}
function downloadCSVFile(filename, headers, rows) {
  const csv = [headers, ...rows].map(row => row.map(csvCell).join(',')).join('\r\n');
  const blob = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename + '-' + new Date().toISOString().slice(0, 10) + '.csv';
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function csvCell(value) {
  const text = String(value ?? '');
  const safeText = typeof value === 'string' && /^[\s]*[=+\-@]/.test(text) ? "'" + text : text;
  return '"' + safeText.replace(/"/g, '""') + '"';
}
function downloadAttendanceReport() {
  const period = getReportPeriod(); if (!period) return;
  const rows = window.schoolData.attendanceRecords.filter(record => inReportPeriod(record.date || '', period)).map(record => {
    const student = window.schoolData.students.find(item => item.id === record.studentId);
    return [record.date, record.className, record.period, record.studentId, student?.name, record.status, record.submittedBy, record.updatedAt];
  });
  downloadCSVFile('ldk-attendance-report', ['Date', 'Class', 'Period', 'Student ID', 'Student Name', 'Status', 'Recorded By', 'Updated At'], rows);
}
function downloadDisciplineReport() {
  const period = getReportPeriod(); if (!period) return;
  const rows = window.schoolData.disciplineEvents.filter(record => inReportPeriod(record.date || '', period)).map(record => {
    const student = window.schoolData.students.find(item => item.id === record.studentId);
    return [record.date, record.studentId, student?.name, record.total, record.change, record.reason, record.recordedBy, record.source, record.batchId];
  });
  downloadCSVFile('ldk-discipline-report', ['Date', 'Student ID', 'Student Name', 'Official Total', 'Reported Change', 'Reason', 'Recorded By', 'Source', 'Import Batch'], rows);
}
function downloadAcademicReport() {
  const period = getReportPeriod(); if (!period) return;
  const rows = window.schoolData.academicRecords.filter(record => inReportPeriod(record.date || '', period)).map(record => {
    const student = window.schoolData.students.find(item => item.id === record.studentId);
    return [record.date, record.studentId, student?.name, student?.class, record.term, record.subject, record.score, record.maxScore];
  });
  downloadCSVFile('ldk-academic-report', ['Date', 'Student ID', 'Student Name', 'Class', 'Term', 'Subject', 'Score', 'Maximum Score'], rows);
}
function downloadStudentReport() {
  const rows = window.schoolData.students.map(student => [student.id, student.name, student.gender, student.class, student.level, student.guardianName, student.guardianPhone, student.guardianEmail, student.disciplinePoints, student.academicScore, student.attendanceRate, student.absences, student.status]);
  downloadCSVFile('ldk-student-roster', ['Student ID', 'Name', 'Gender', 'Class', 'Level', 'Guardian Name', 'Guardian Phone', 'Guardian Email', 'Discipline Total', 'Academic Score', 'Attendance Rate', 'Absences', 'Status'], rows);
}

// ===== INIT =====
if (!loadStudents()) {
  generateDemoData();
  saveStudents();
}
loadSchoolRecords();
const attendanceDate = document.getElementById('atdate');
if (attendanceDate) attendanceDate.value = getLocalDateString();
populateAttendanceClassSelect();
loadAtt();
loadContentEdits();
loadSettings();
loadJustifications();
loadSavedNotifications();
updateDashboardStats();
updateStaffDashboardStats();
checkAIVisibility();
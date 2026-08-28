// ===== CENTRALIZED DATA SYSTEM =====
window.schoolData = {
  students: [],
  staff: [],
  classes: [],
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
    const count = 45 + Math.floor(Math.random() * 15); // 45-60 students per class
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
  window.schoolData.students.forEach(s => {
    if (!classMap[s.class]) {
      classMap[s.class] = { name: s.class, level: s.level, students: [], teacher: 'TBD' };
    }
    classMap[s.class].students.push(s);
  });

  window.schoolData.classes = Object.values(classMap).map(c => {
    const avgDiscipline = Math.round(c.students.reduce((a, b) => a + b.disciplinePoints, 0) / c.students.length * 10) / 10;
    const avgAcademic = Math.round(c.students.reduce((a, b) => a + b.academicScore, 0) / c.students.length * 10) / 10;
    const avgAttendance = Math.round(c.students.reduce((a, b) => a + b.attendanceRate, 0) / c.students.length * 10) / 10;
    return {
      name: c.name,
      level: c.level,
      studentCount: c.students.length,
      teacher: c.teacher,
      avgDiscipline: avgDiscipline,
      avgAcademic: avgAcademic,
      avgAttendance: avgAttendance
    };
  });
}

function getClassRankings() {
  return [...window.schoolData.classes].sort((a, b) => b.avgDiscipline - a.avgDiscipline);
}

function getAcademicRankings() {
  return [...window.schoolData.classes].sort((a, b) => b.avgAcademic - a.avgAcademic);
}

function getTop30Overall() {
  return [...window.schoolData.students]
    .map(s => ({ ...s, index: Math.round((s.disciplinePoints * 0.5 + s.academicScore * 0.5) * 10) / 10 }))
    .sort((a, b) => b.index - a.index)
    .slice(0, 30);
}

function getTop30Discipline() {
  return [...window.schoolData.students]
    .sort((a, b) => b.disciplinePoints - a.disciplinePoints)
    .slice(0, 30);
}

function getNeedsAttention() {
  return window.schoolData.students.filter(s => s.disciplinePoints < 20 || s.academicScore < 60)
    .sort((a, b) => (a.disciplinePoints + a.academicScore) - (b.disciplinePoints + b.academicScore));
}

function getClassesBelowTarget() {
  return window.schoolData.classes.filter(c => c.avgDiscipline < 20 || c.avgAcademic < 70)
    .sort((a, b) => (a.avgDiscipline + a.avgAcademic) - (b.avgDiscipline + b.avgAcademic));
}

function getClassLeaders() {
  const leaders = [];
  window.schoolData.classes.forEach(cls => {
    const clsStudents = window.schoolData.students.filter(s => s.class === cls.name);
    if (clsStudents.length > 0) {
      const leader = clsStudents
        .map(s => ({ ...s, index: Math.round((s.disciplinePoints * 0.5 + s.academicScore * 0.5) * 10) / 10 }))
        .sort((a, b) => b.index - a.index)[0];
      leaders.push({ class: cls.name, student: leader });
    }
  });
  return leaders.sort((a, b) => b.student.index - a.student.index);
}

function getInitials(name) {
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

function getAvatarColor(seed) {
  const colors = ['linear-gradient(135deg,#3b82f6,#8b5cf6)','linear-gradient(135deg,#10b981,#059669)','linear-gradient(135deg,#f59e0b,#d97706)','linear-gradient(135deg,#ec4899,#be185d)','linear-gradient(135deg,#06b6d4,#0891b2)','linear-gradient(135deg,#8b5cf6,#7c3aed)','linear-gradient(135deg,#14b8a6,#0d9488)','linear-gradient(135deg,#f97316,#ea580c)'];
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
    const scoreClass = c.avgDiscipline >= 32 ? 'good' : c.avgDiscipline >= 20 ? 'avg' : 'bad';
    return `<div class="rank-row">
      <div class="rank-num ${rankClass}">${i + 1}</div>
      <div class="rank-avatar" style="background:${getAvatarColor(c.name)}">${c.name.substring(0,2)}</div>
      <div class="rank-info"><div class="rank-name">${c.name}</div><div class="rank-meta">${c.studentCount} students | ${c.level}</div></div>
      <div style="text-align:right;min-width:80px"><div class="rank-score ${scoreClass}">${c.avgDiscipline}</div><div style="font-size:11px;color:var(--t3)">Avg Discipline</div></div>
    </div>
    <div class="rank-bar-bg"><div class="rank-bar-fill" style="width:${(c.avgDiscipline / 40) * 100}%;background:var(--${scoreClass === 'good' ? 'g' : scoreClass === 'avg' ? 'w' : 'r'})"></div></div>`;
  }).join('');
}

function renderAllAcademicRankings() {
  const container = document.getElementById('allAcademicRankings');
  if (!container) return;
  const rankings = getAcademicRankings();
  container.innerHTML = rankings.map((c, i) => {
    const rankClass = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
    const scoreClass = c.avgAcademic >= 80 ? 'good' : c.avgAcademic >= 65 ? 'avg' : 'bad';
    return `<div class="rank-row">
      <div class="rank-num ${rankClass}">${i + 1}</div>
      <div class="rank-avatar" style="background:${getAvatarColor(c.name)}">${c.name.substring(0,2)}</div>
      <div class="rank-info"><div class="rank-name">${c.name}</div><div class="rank-meta">${c.studentCount} students | ${c.level}</div></div>
      <div style="text-align:right;min-width:80px"><div class="rank-score ${scoreClass}">${c.avgAcademic}%</div><div style="font-size:11px;color:var(--t3)">Avg Academic</div></div>
    </div>
    <div class="rank-bar-bg"><div class="rank-bar-fill" style="width:${c.avgAcademic}%;background:var(--${scoreClass === 'good' ? 'g' : scoreClass === 'avg' ? 'w' : 'r'})"></div></div>`;
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
      <div class="avatar-md" style="background:${getAvatarColor(s.name)}">${getInitials(s.name)}</div>
      <div class="rank-info"><div class="rank-name">${s.name}</div><div class="rank-meta">${s.class} | ${s.id}</div></div>
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
      <div class="avatar-md" style="background:${getAvatarColor(s.name)}">${getInitials(s.name)}</div>
      <div class="rank-info"><div class="rank-name">${s.name}</div><div class="rank-meta">${s.class} | ${s.id}</div></div>
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
    const issue = s.disciplinePoints < 65 ? 'Discipline' : 'Academic';
    const score = s.disciplinePoints < 65 ? s.disciplinePoints : s.academicScore;
    return `<div class="rank-row">
      <div class="rank-num" style="background:var(--r);color:#fff">!</div>
      <div class="avatar-md" style="background:linear-gradient(135deg,var(--r),#dc2626)">${getInitials(s.name)}</div>
      <div class="rank-info"><div class="rank-name">${s.name}</div><div class="rank-meta">${s.class} | ${s.id}</div></div>
      <div style="text-align:right"><div class="rank-score bad">${score}</div><div style="font-size:11px;color:var(--t3)">${issue}</div></div>
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
    const issue = c.avgDiscipline < 75 ? `Discipline: ${c.avgDiscipline}` : `Academic: ${c.avgAcademic}%`;
    return `<div class="rank-row">
      <div class="rank-num" style="background:var(--w);color:#000">!</div>
      <div class="rank-avatar" style="background:linear-gradient(135deg,var(--w),#d97706)">${c.name.substring(0,2)}</div>
      <div class="rank-info"><div class="rank-name">${c.name}</div><div class="rank-meta">${c.studentCount} students</div></div>
      <div style="text-align:right"><div class="rank-score avg">${issue}</div></div>
    </div>
    <div class="rank-bar-bg"><div class="rank-bar-fill" style="width:${Math.min(c.avgDiscipline, c.avgAcademic)}%;background:var(--w)"></div></div>`;
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
      <span>${l.class}</span>
    </div>
    <div class="rank-row" style="margin-bottom:16px">
      <div class="avatar-lg" style="background:${getAvatarColor(l.student.name)}">${getInitials(l.student.name)}</div>
      <div class="rank-info"><div class="rank-name">${l.student.name}</div><div class="rank-meta">${l.student.id} | Discipline: ${l.student.disciplinePoints} | Academic: ${l.student.academicScore}%</div></div>
      <div style="text-align:right"><div class="rank-score good">${l.student.index}</div><div style="font-size:11px;color:var(--t3)">Leader Index</div></div>
    </div>`;
  }).join('');
}

function renderUserTable() {
  const tbody = document.getElementById('userTableBody');
  if (!tbody) return;
  const students = window.schoolData.students.slice(0, 50); // Show first 50 for performance
  tbody.innerHTML = students.map(s => {
    const dColor = s.disciplinePoints >= 85 ? 'var(--g)' : s.disciplinePoints >= 70 ? 'var(--w)' : 'var(--r)';
    const aColor = s.academicScore >= 80 ? 'var(--g)' : s.academicScore >= 65 ? 'var(--w)' : 'var(--r)';
    return `<tr>
      <td><div class="avatar-sm" style="background:${getAvatarColor(s.name)}">${getInitials(s.name)}</div></td>
      <td>${s.id}</td>
      <td>${s.name}</td>
      <td>Student</td>
      <td>${s.class}</td>
      <td style="color:${dColor};font-weight:700">${s.disciplinePoints}</td>
      <td style="color:${aColor};font-weight:700">${s.academicScore}%</td>
      <td><span class="tag tag-ap">${s.status}</span></td>
      <td><button class="btn btn-g btn-sm" onclick="editStudent('${s.id}')">Edit</button></td>
    </tr>`;
  }).join('');
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
  if (totalEl) totalEl.textContent = window.schoolData.students.length.toLocaleString();

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
  const students = window.schoolData.students;
  if (!students.length) return { presentPct: 0, present: 0, absent: 0 };
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
}

function renderAdminActivity() {
  const tbody = document.getElementById('adminActivityBody');
  if (!tbody) return;
  const rows = window.schoolData.activityLog.slice(0, 6);
  tbody.innerHTML = rows.length
    ? rows.map(a => `<tr><td>${a.time}</td><td>${a.by}</td><td>${a.action}</td><td>${a.details}</td></tr>`).join('')
    : '<tr><td colspan="4" style="text-align:center;color:var(--t3)">No activity yet this session.</td></tr>';
}

function renderStaffActivity() {
  const tbody = document.getElementById('staffActivityBody');
  if (!tbody) return;
  const rows = window.schoolData.activityLog.slice(0, 6);
  tbody.innerHTML = rows.length
    ? rows.map(a => `<tr><td>${a.time}</td><td>${a.action}</td><td>${a.by}</td><td>${a.details}</td></tr>`).join('')
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
  const sorted = [...window.schoolData.students].sort((a, b) => a.name.localeCompare(b.name));
  sel.innerHTML = sorted.map(s => `<option>${s.name} (${s.id})</option>`).join('');
  if (prev && sorted.some(s => (s.name + ' (' + s.id + ')') === prev)) sel.value = prev;
}

// ===== BULK IMPORT SYSTEM =====
function clearImport() {
  document.getElementById('bulkImportArea').value = '';
  document.getElementById('importPreviewSection').classList.add('hidden');
}

function previewImport() {
  const raw = document.getElementById('bulkImportArea').value.trim();
  if (!raw) { toast('Please paste student data first'); return; }

  const lines = raw.split('\n').filter(l => l.trim());
  const preview = [];
  const errors = [];
  const seenIds = new Set();

  lines.forEach((line, idx) => {
    const parts = line.split(',').map(p => p.trim());
    if (parts.length < 4) {
      errors.push({ line: idx + 1, msg: 'Too few columns' });
      return;
    }

    const [name, id, gender, cls, stream, level] = parts;
    const fullClass = cls + (stream ? ' ' + stream : '');
    let status = 'ok';
    let msg = 'Ready';

    if (!name || !id) { status = 'err'; msg = 'Missing name or ID'; }
    else if (seenIds.has(id)) { status = 'err'; msg = 'Duplicate ID'; }
    else if (!/^S[1-6]/.test(cls)) { status = 'warn'; msg = 'Unusual class format'; }

    seenIds.add(id);
    preview.push({ name, id, gender: gender || 'M', class: fullClass, level: level || 'Unknown', status, msg });
  });

  const okCount = preview.filter(p => p.status === 'ok').length;
  const warnCount = preview.filter(p => p.status === 'warn').length;
  const errCount = preview.filter(p => p.status === 'err').length;

  document.getElementById('importStats').innerHTML = `
    <span class="import-status ok">${okCount} OK</span>
    ${warnCount ? `<span class="import-status warn">${warnCount} Warn</span>` : ''}
    ${errCount ? `<span class="import-status err">${errCount} Error</span>` : ''}
  `;

  const table = document.getElementById('importPreviewTable');
  table.innerHTML = `
    <div class="import-row header"><div style="width:40px">#</div><div style="flex:1">Name</div><div style="width:120px">ID</div><div style="width:100px">Class</div><div style="width:80px">Status</div></div>
    ${preview.map((p, i) => `
      <div class="import-row">
        <div style="width:40px">${i + 1}</div>
        <div style="flex:1">${p.name}</div>
        <div style="width:120px;font-family:monospace">${p.id}</div>
        <div style="width:100px">${p.class}</div>
        <div style="width:80px"><span class="import-status ${p.status}">${p.msg}</span></div>
      </div>
    `).join('')}
  `;

  document.getElementById('importPreviewSection').classList.remove('hidden');
  window._pendingImport = preview.filter(p => p.status !== 'err');
}

function confirmImport() {
  if (!window._pendingImport || window._pendingImport.length === 0) {
    toast('No valid students to import');
    return;
  }

  window._pendingImport.forEach(p => {
    window.schoolData.students.push({
      id: p.id,
      name: p.name,
      gender: p.gender,
      class: p.class,
      level: p.level,
      disciplinePoints: 25 + Math.floor(Math.random() * 15),
      academicScore: 60 + Math.floor(Math.random() * 35),
      attendanceRate: 90 + Math.floor(Math.random() * 10),
      absences: Math.floor(Math.random() * 5),
      status: 'Active',
      photo: null
    });
  });

  computeClassStats();
  saveStudents();
  renderUserTable();
  updateDashboardStats();
  toast(`Successfully imported ${window._pendingImport.length} students!`);
  document.getElementById('importPreviewSection').classList.add('hidden');
  document.getElementById('bulkImportArea').value = '';
  delete window._pendingImport;
}

// ===== ADD SINGLE USER =====
// Was previously a dead button (toast('Add user form would open') and nothing else).
function addUser() {
  const name = prompt('Full name:');
  if (!name) return;
  const suggestedId = 'LDK-' + new Date().getFullYear() + '-' + String(Math.floor(100 + Math.random() * 900));
  const id = prompt('Student/Staff ID:', suggestedId);
  if (!id) return;
  if (window.schoolData.students.some(s => s.id === id)) {
    toast('That ID is already in use — pick another.');
    return;
  }
  const genderInput = prompt('Gender (M/F):', 'M');
  if (genderInput === null) return;
  const gender = genderInput.trim().toUpperCase().startsWith('F') ? 'F' : 'M';
  const cls = prompt('Class (e.g. S5 Stream 1):', 'S5 Stream 1');
  if (!cls) return;
  const level = /^S[123]/.test(cls) ? 'O-Level' : 'A-Level';

  window.schoolData.students.push({
    id, name, gender, class: cls, level,
    disciplinePoints: 40, academicScore: 70, attendanceRate: 100,
    absences: 0, status: 'Active', photo: null
  });
  computeClassStats();
  saveStudents();
  renderUserTable();
  updateDashboardStats();
  toast('User added: ' + name);
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

function editStudent(id) {
  const student = window.schoolData.students.find(s => s.id === id);
  if (!student) return;
  const newName = prompt('Edit student name:', student.name);
  if (newName && newName !== student.name) {
    student.name = newName;
    renderUserTable();
    toast('Student updated');
  }
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
  const count = Math.floor((width * height) / 3000);
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
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  ctx.clearRect(0, 0, width, height);
  const time = Date.now() * 0.001;
  stars.forEach(s => {
    s.y -= s.speed;
    if (s.y < 0) { s.y = height; s.x = Math.random() * width; }
    const twinkle = Math.sin(time * s.twinkleSpeed * 100 + s.twinklePhase) * 0.4 + 0.6;
    const alpha = s.opacity * twinkle * (isDark ? 1 : 0.35);
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(' + (isDark ? '255,255,255' : '30,41,59') + ',' + (isDark ? alpha : alpha * 2.2) + ')';
    ctx.fill();
    if (s.r > 1) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r * 2.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + (isDark ? '255,255,255' : '59,130,246') + ',' + (alpha * 0.15) + ')';
      ctx.fill();
    }
  });
  requestAnimationFrame(drawStars);
}
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
  document.getElementById('t-' + r.substring(0, 3)).classList.add('on');
  document.getElementById('arole').classList.toggle('hidden', r !== 'admin');
}
function doL() {
  const id = document.getElementById('lid').value;
  const pw = document.getElementById('lpw').value;
  if (!id || !pw) { toast('Please enter ID and password'); return; }
  closeL();
  document.getElementById('land').classList.add('hidden');
  if (curRole === 'student') { document.getElementById('stuP').classList.add('on'); }
  else if (curRole === 'staff') { document.getElementById('staP').classList.add('on'); loadAtt(); updateStaffDashboardStats(); populateDMStudentDropdown(); }
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

// ===== STUDENT TABS =====
function sTab(t) {
  document.querySelectorAll('#stuP .side-nav a').forEach(a => a.classList.remove('on'));
  document.getElementById('n' + t).classList.add('on');
  document.querySelectorAll('#stuP .main > div').forEach(d => d.classList.add('hidden'));
  document.getElementById('v-' + t).classList.remove('hidden');
  const titles = { sd: 'Dashboard', sdi: 'Discipline Record', sab: 'Absence Justification', san: 'Announcements', snot: 'Notifications' };
  document.getElementById('st').textContent = titles[t];
  if (t === 'sab') renderAbsenceHistory();
  checkAIVisibility();
}
// ===== ABSENCE JUSTIFICATIONS =====
// Shared between the student's own "My Absence History" and the staff
// "Pending Justifications" queue — approving/rejecting on the staff side
// now actually updates what the student sees, instead of the two views
// being disconnected static lists.
const CURRENT_STUDENT = { name: 'Jean-Paul Manirafasha', id: 'LDK-2023-001', class: 'S5 Stream 1' };

function seedJustifications() {
  return [
    { id: 1, student: 'Jean-Paul Manirafasha', studentId: 'LDK-2023-001', class: 'S5 Stream 1', initials: 'JM', color: 'linear-gradient(135deg,var(--a),#8b5cf6)', date: 'Aug 6, 2025', reason: 'Transportation', detail: 'Bus breakdown on KG 11 route. Arrived 45 minutes late.', proofName: null, status: 'Pending' },
    { id: 2, student: 'Claire Umutoni', studentId: 'LDK-2023-045', class: 'S4 Stream 2', initials: 'CU', color: 'linear-gradient(135deg,var(--g),#059669)', date: 'Aug 5, 2025', reason: 'Medical', detail: 'Malaria symptoms. Medical certificate from CHUK attached.', proofName: null, status: 'Pending' },
    { id: 3, student: 'Patrick Habyarimana', studentId: 'LDK-2022-089', class: 'S6 Stream 1', initials: 'PH', color: 'linear-gradient(135deg,var(--w),#d97706)', date: 'Aug 4, 2025', reason: 'Family Emergency', detail: 'Father hospitalized at King Faisal Hospital.', proofName: null, status: 'Pending' },
    { id: 4, student: 'Jean-Paul Manirafasha', studentId: 'LDK-2023-001', class: 'S5 Stream 1', initials: 'JM', color: 'linear-gradient(135deg,var(--a),#8b5cf6)', date: 'August 1, 2025', reason: 'Medical', detail: "Fever and headache. Doctor's note from CHUK attached.", proofName: 'medical_note.pdf', status: 'Approved' },
    { id: 5, student: 'Jean-Paul Manirafasha', studentId: 'LDK-2023-001', class: 'S5 Stream 1', initials: 'JM', color: 'linear-gradient(135deg,var(--a),#8b5cf6)', date: 'July 25, 2025', reason: 'Family Emergency', detail: 'Funeral attendance in Bugesera district.', proofName: null, status: 'Approved' }
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
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px"><span style="font-size:14px;font-weight:600">${j.date}</span><span class="tag ${tagClassFor(j.status)}">${j.status}</span></div>
      <div style="font-size:13px;color:var(--t2)">${j.reason} — ${j.detail}${j.proofName ? ' <span style="color:var(--t3)">📎 ' + j.proofName + '</span>' : ''}</div>
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
        <div style="display:flex;align-items:center;gap:10px"><div class="avatar-sm" style="background:${j.color}">${j.initials}</div><div><div style="font-size:14px;font-weight:600">${j.student}</div><div style="font-size:12px;color:var(--t3)">${j.studentId} — ${j.class}</div></div></div>
        <span class="tag tag-pe">Pending</span>
      </div>
      <div style="font-size:13px;color:var(--t2);margin-bottom:8px"><strong>${j.date}</strong> — ${j.reason}: ${j.detail}${j.proofName ? ' <span style="color:var(--t3)">📎 ' + j.proofName + '</span>' : ''}</div>
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
    initials: getInitials(CURRENT_STUDENT.name), color: 'linear-gradient(135deg,var(--a),#8b5cf6)',
    date: formatted, reason: reasonSel, detail: de,
    proofName: window._pendingProofName || null, status: 'Pending'
  });
  saveJustifications();
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
  { n: 'Jean-Paul Manirafasha', id: 'LDK-2023-001', s: true, color: 'linear-gradient(135deg,#3b82f6,#8b5cf6)' },
  { n: 'Claire Umutoni', id: 'LDK-2023-045', s: true, color: 'linear-gradient(135deg,#10b981,#059669)' },
  { n: 'Patrick Habyarimana', id: 'LDK-2022-089', s: true, color: 'linear-gradient(135deg,#f59e0b,#d97706)' },
  { n: 'Marie Mukamana', id: 'LDK-2023-112', s: false, color: 'linear-gradient(135deg,#ec4899,#be185d)' },
  { n: 'Jean Bosco Ndayisaba', id: 'LDK-2024-034', s: true, color: 'linear-gradient(135deg,#06b6d4,#0891b2)' },
  { n: 'Diane Uwimana', id: 'LDK-2023-067', s: true, color: 'linear-gradient(135deg,#8b5cf6,#7c3aed)' },
  { n: 'Eric Nshimiyimana', id: 'LDK-2023-078', s: true, color: 'linear-gradient(135deg,#14b8a6,#0d9488)' },
  { n: 'Grace Murekatete', id: 'LDK-2024-012', s: false, color: 'linear-gradient(135deg,#f97316,#ea580c)' }
];
function loadAtt() {
  const list = document.getElementById('atlist');
  const cls = document.getElementById('atclass').value;
  document.getElementById('atcname').textContent = cls;
  list.innerHTML = '';

  const classStudents = window.schoolData.students.filter(s => s.class === cls).slice(0, 60);
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
    row.innerHTML = '<div class="at-i"><div class="at-a" style="background:' + color + '">' + initials + '</div><div><div style="font-size:14px;font-weight:600">' + stu.name + '</div><div style="font-size:12px;color:var(--t3)">' + stu.id + '</div></div></div><div class="tog"><button class="tog-btn on-p" onclick="toggleAtt(this,true)">Present</button><button class="tog-btn" onclick="toggleAtt(this,false)">Absent</button></div>';
    list.appendChild(row);
  });
  applyAttDraft();
}
function toggleAtt(btn, present) {
  const row = btn.closest('.at-r');
  const btns = row.querySelectorAll('.tog-btn');
  btns[0].classList.toggle('on-p', present);
  btns[1].classList.toggle('on-a', !present);
}
function markAll(present) {
  document.querySelectorAll('.tog-btn').forEach((btn, i) => {
    if (present && i % 2 === 0) btn.classList.add('on-p');
    if (present && i % 2 === 1) btn.classList.remove('on-a');
    if (!present && i % 2 === 0) btn.classList.remove('on-p');
    if (!present && i % 2 === 1) btn.classList.add('on-a');
  });
}
// ===== ATTENDANCE DRAFT + SUBMIT =====
// Save Draft used to just toast; now it actually keeps the checked
// present/absent state per class+date so it's there when you come back.
function attDraftKey() {
  const cls = document.getElementById('atclass').value;
  const date = document.getElementById('atdate').value || 'undated';
  return 'ldk-att-draft-' + cls + '-' + date;
}
function saveAttDraft() {
  const rows = [...document.querySelectorAll('#atlist .at-r')].map(row => {
    const btns = row.querySelectorAll('.tog-btn');
    return btns[0].classList.contains('on-p');
  });
  localStorage.setItem(attDraftKey(), JSON.stringify(rows));
  toast('Draft saved for ' + document.getElementById('atclass').value);
}
function applyAttDraft() {
  const saved = localStorage.getItem(attDraftKey());
  if (!saved) return;
  try {
    const present = JSON.parse(saved);
    document.querySelectorAll('#atlist .at-r').forEach((row, i) => {
      if (i >= present.length) return;
      const btns = row.querySelectorAll('.tog-btn');
      btns[0].classList.toggle('on-p', present[i]);
      btns[1].classList.toggle('on-a', !present[i]);
    });
  } catch (e) { /* ignore corrupt draft */ }
}
function subAtt() {
  const cls = document.getElementById('atclass').value;
  const rows = [...document.querySelectorAll('#atlist .at-r')];
  const rosterAtSubmit = window._currentAttStudents || [];
  if (!rows.length) { toast('No students loaded for this class'); return; }
  let markedAbsent = 0;
  rows.forEach((row, i) => {
    const student = rosterAtSubmit[i];
    if (!student) return;
    const present = row.querySelectorAll('.tog-btn')[0].classList.contains('on-p');
    if (!present) {
      markedAbsent++;
      student.absences = (student.absences || 0) + 1;
      student.attendanceRate = Math.max(0, Math.round((student.attendanceRate || 100) - 0.5));
    }
  });
  computeClassStats();
  saveStudents();
  localStorage.removeItem(attDraftKey());
  // Real-time: the moment attendance is submitted, refresh the Staff
  // dashboard (in case this teacher switches back to it) and the Admin
  // dashboard, plus the shared activity feed both portals read from --
  // this is the actual "teacher marks a class -> stats update everywhere"
  // behavior.
  logActivity('attendance', 'Attendance marked — ' + cls, 'Staff (Mark Attendance)', markedAbsent + ' marked absent, ' + (rosterAtSubmit.length - markedAbsent) + ' present');
  updateStaffDashboardStats();
  updateDashboardStats();
  toast(`Attendance submitted to Discipline Office — ${markedAbsent} marked absent in ${cls}.`);
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
  student.disciplinePoints = Math.max(0, Math.min(40, (student.disciplinePoints || 0) + dmVal));
  computeClassStats();
  saveStudents();
  logActivity('discipline', 'Discipline mark added (' + (dmVal > 0 ? '+' : '') + dmVal + ')', studentName, reason);
  updateDashboardStats();
  updateStaffDashboardStats();
  toast('Discipline mark added: ' + (dmVal > 0 ? '+' : '') + dmVal + ' to ' + studentName + ' (now ' + student.disciplinePoints + '/40)');
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
    const dotColor = isDark ? '56, 189, 248' : '30, 58, 138';
    const lineColor = isDark ? '38, 189, 248' : '30, 58, 138';
    ctx.beginPath();
    ctx.arc(cx, cy, GLOBE_RADIUS, 0, Math.PI * 2);
    ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.06)' : 'rgba(30, 58, 138, 0.15)';
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
      ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.03)' : 'rgba(30, 58, 138, 0.08)';
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
      ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.03)' : 'rgba(30, 58, 138, 0.08)';
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
    const count = Math.floor((width * height) / 8000);
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
  const sparkColor = '#3b82f6';
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
    const target = e.target;
    if (target.closest('a') || target.closest('button') || target.closest('input') || target.closest('textarea') || target.closest('select')) return;
    createSparks(e.clientX, e.clientY);
  });
  function easeOut(t) { return t * (2 - t); }
  function drawSparks() {
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
  div.innerHTML = text;
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
    response = 'The top performing student is <strong>' + top.name + '</strong> from ' + top.class + ' with a combined index of <strong>' + top.index + '</strong>.';
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
    URL.revokeObjectURL(url);
    response = 'I\'ve generated and downloaded a CSV file with all student data including discipline points, academic scores, and attendance rates.';
  }
  else if (lower.includes('class') && (lower.includes('best') || lower.includes('good'))) {
    const best = getClassRankings()[0];
    response = 'The best performing class by discipline is <strong>' + best.name + '</strong> with an average of <strong>' + best.avgDiscipline + '/40</strong> discipline points and <strong>' + best.avgAcademic + '%</strong> academic score.';
  }
  else if (lower.includes('attendance')) {
    const avg = Math.round(window.schoolData.students.reduce((a,s) => a + s.attendanceRate, 0) / window.schoolData.students.length * 10) / 10;
    response = 'The average attendance rate across all students is <strong>' + avg + '%</strong>. You can view detailed breakdowns in the Reports section.';
  }
  else if (lower.includes('discipline') && (lower.includes('mark') || lower.includes('point'))) {
    response = 'Discipline marks are out of <strong>40 points per term</strong> (120 annually). Students below <strong>20/40</strong> are flagged for intervention. The highest current score is <strong>' + Math.max(...window.schoolData.students.map(s => s.disciplinePoints)) + '/40</strong>.';
  }
  else if (lower.includes('hello') || lower.includes('hi') || lower.includes('help')) {
    response = 'Hello! I can help you with:<br>• <strong>Student data</strong> — ask "how many students" or "who is top"<br>• <strong>Export data</strong> — say "generate spreadsheet"<br>• <strong>Rankings</strong> — ask "which class is best"<br>• <strong>Insights</strong> — ask about attendance or discipline<br>What do you need?';
  }
  else {
    response = 'I understand you\'re asking about "<em>' + msg + '</em>". I can help with student data, rankings, exports, and school metrics. Try asking something like:<br>• "How many students do we have?"<br>• "Generate a CSV"<br>• "Who needs attention?"<br>• "What is the best class?"';
  }

  addAIMessage(response, 'bot');
}
// ===== REPORT DOWNLOAD =====
// Was a bare toast('Report downloaded') with no file. Now reads the
// actual figures shown in that report card and generates a real CSV.
function downloadReport(btn) {
  const card = btn.closest('.card');
  const title = card.querySelector('h3').textContent.trim();
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
  const headers = ['ID', 'Name', 'Gender', 'Class', 'Level', 'Discipline Points', 'Academic Score', 'Attendance Rate', 'Absences', 'Status'];
  const rows = window.schoolData.students.map(s => [
    s.id, s.name, s.gender, s.class, s.level,
    s.disciplinePoints, s.academicScore + '%', s.attendanceRate + '%', s.absences, s.status
  ]);
  return [headers, ...rows].map(r => r.map(x => '"' + String(x).replace(/"/g, '""') + '"').join(',')).join('\n');
}

// ===== INIT =====
if (!loadStudents()) {
  generateDemoData();
  saveStudents();
}
loadContentEdits();
loadSettings();
loadJustifications();
loadSavedNotifications();
checkAIVisibility();
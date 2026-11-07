/* First-handover demo rules. Browser-local only. Not security and not synced. */
(function () {
  const NOTE = 'Demo only. Saved on this browser. Not shared with other people or devices.';
  window.staffKind = 'academic';
  window.staffAssignedClasses = function () {
    return window.staffKind === 'academic' ? ['S5 Stream 1'] : (window.schoolData.classes || []).map(c => c.name);
  };
  window.applyStaffKind = function () {
    const pick = document.getElementById('sstaff');
    window.staffKind = pick ? pick.value : 'academic';
    const welcome = document.getElementById('teacherWelcome');
    if (welcome) {
      welcome.textContent = window.staffKind === 'academic'
        ? 'Academic Staff. Attendance and announcements are limited to S5 Stream 1 in this demo. ' + NOTE
        : 'Discipline Staff (patron or matron). Day-to-day lookup and attendance only. You cannot import discipline or clear Needs Attention. ' + NOTE;
    }
    if (typeof populateAttendanceClassSelect === 'function') populateAttendanceClassSelect();
  };

  function schoolDays(records) {
    return [...new Set(records.filter(r => (r.period || 'Main daily attendance').toLowerCase().indexOf('follow-up') === -1).map(r => r.date))].sort();
  }
  function consecutiveAbsences(studentId) {
    const records = (window.schoolData.attendanceRecords || []).filter(r => r.studentId === studentId && (r.period || 'Main daily attendance').toLowerCase().indexOf('follow-up') === -1);
    const days = schoolDays(window.schoolData.attendanceRecords || []);
    const byDate = {};
    records.forEach(r => { byDate[r.date] = r; });
    let streak = 0;
    let best = 0;
    days.forEach(day => {
      const row = byDate[day];
      if (!row) return;
      const absent = row.status === 'absent';
      if (absent) { streak += 1; best = Math.max(best, streak); }
      else streak = 0;
    });
    return best;
  }
  function clearedMap() {
    try { return JSON.parse(localStorage.getItem('ldk-cleared-flags') || '{}'); } catch (e) { return {}; }
  }
  window.attendanceNeedsFlag = function (student) { return consecutiveAbsences(student.id) >= 5; };

  const previousNeeds = window.renderNeedsAttention;
  window.renderNeedsAttention = function () {
    const container = document.getElementById('needsAttentionList');
    if (!container || !window.schoolData) { if (previousNeeds) previousNeeds(); return; }
    const cleared = clearedMap();
    const rows = window.schoolData.students.filter(s => s.status === 'Active').map(s => {
      const flags = [];
      if (numberOrNull(s.academicScore) !== null && Number(s.academicScore) < 50 && !cleared[s.id + ':academic']) flags.push(['academic', 'Academic result below 50% (' + s.academicScore + '%)']);
      if (numberOrNull(s.disciplinePoints) !== null && Number(s.disciplinePoints) < 20 && !cleared[s.id + ':discipline']) flags.push(['discipline', 'Official discipline below 20/40 (' + s.disciplinePoints + '/40)']);
      if (window.attendanceNeedsFlag(s) && !cleared[s.id + ':attendance']) flags.push(['attendance', 'Absent for 5 consecutive recorded school days']);
      return { s, flags };
    }).filter(row => row.flags.length);
    container.innerHTML = '<p style="font-size:12px;color:var(--t3);margin-bottom:8px">' + NOTE + ' Follow-up lessons do not count. A present, late, or excused midday return breaks the streak.</p>' +
      (rows.length ? rows.map(row => '<div class="rank-row"><div class="rank-info"><div class="rank-name">' + escapeHTML(row.s.name) + '</div><div class="rank-meta">' + escapeHTML(row.s.class) + ' · ' + row.flags.map(f => escapeHTML(f[1])).join(' · ') + '</div></div><div style="display:flex;gap:6px;flex-wrap:wrap">' + row.flags.map(f => '<button class="btn btn-g btn-sm" onclick="clearAttentionFlag(\'' + row.s.id + '\',\'' + f[0] + '\')">Clear</button>').join('') + '</div></div>').join('') : '<p>No active flags.</p>');
  };

  function ensureCaseStudents() {
    if (!window.schoolData || !window.schoolData.students) return;
    const add = (student) => { if (!window.schoolData.students.some(s => s.id === student.id)) window.schoolData.students.push(student); };
    add({ id: 'LDK-DEMO-LOWAC', name: 'Aline Demo Academic', gender: 'F', class: 'S4 Stream 2', level: 'A-Level', disciplinePoints: 30, academicScore: 42, attendanceRate: null, absences: 0, status: 'Active' });
    add({ id: 'LDK-DEMO-LOWDI', name: 'Eric Demo Discipline', gender: 'M', class: 'S3 Stream 1', level: 'O-Level', disciplinePoints: 16, academicScore: 71, attendanceRate: null, absences: 0, status: 'Active' });
    add({ id: 'LDK-DEMO-STREAK', name: 'Grace Demo Streak', gender: 'F', class: 'S2 Stream 1', level: 'O-Level', disciplinePoints: 28, academicScore: 66, attendanceRate: null, absences: 0, status: 'Active' });
    add({ id: 'LDK-DEMO-SPLIT', name: 'Kevin Demo Split', gender: 'M', class: 'S2 Stream 1', level: 'O-Level', disciplinePoints: 31, academicScore: 74, attendanceRate: null, absences: 0, status: 'Active' });
    const dates = ['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09'];
    const has = id => (window.schoolData.attendanceRecords || []).some(r => r.studentId === id && r.demoCase);
    if (!has('LDK-DEMO-STREAK')) {
      dates.forEach(date => window.schoolData.attendanceRecords.push({ id: 'case-streak-' + date, studentId: 'LDK-DEMO-STREAK', date, className: 'S2 Stream 1', period: 'Main daily attendance', status: 'absent', demoCase: true }));
    }
    if (!has('LDK-DEMO-SPLIT')) {
      ['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-12'].forEach((date, i) => window.schoolData.attendanceRecords.push({ id: 'case-split-' + date, studentId: 'LDK-DEMO-SPLIT', date, className: 'S2 Stream 1', period: 'Main daily attendance', status: i === 3 ? 'present' : 'absent', demoCase: true }));
      window.schoolData.attendanceRecords.push({ id: 'case-follow', studentId: 'LDK-DEMO-SPLIT', date: '2026-10-09', className: 'S2 Stream 1', period: 'Follow-up lesson (not in official rate)', status: 'absent', demoCase: true });
    }
  }

  window.autosaveAttendanceDraft = function () {
    try {
      if (!window.localStorage) throw new Error('no storage');
      const rows = [...document.querySelectorAll('#atlist .at-r')].map(row => ({ studentId: row.dataset.studentId, status: row.dataset.status }));
      localStorage.setItem(attDraftKey(), JSON.stringify(rows));
      const note = document.getElementById('attKindNote');
      if (note) note.textContent = 'Saved on this device. Not synced. Main daily attendance is the only type that changes official totals.';
    } catch (e) {
      const note = document.getElementById('attKindNote');
      if (note) note.textContent = 'This browser could not save the draft. Do not assume it was stored.';
    }
  };

  window.recordMiddayReturn = function () {
    const id = document.getElementById('returnStudent').value.trim();
    const note = document.getElementById('returnNote').value.trim();
    const student = window.schoolData.students.find(s => s.id === id);
    if (!student || !note) { toast('Choose a known student and write the excuse.'); return; }
    const date = getLocalDateString();
    let record = window.schoolData.attendanceRecords.find(r => r.studentId === id && r.date === date && (r.period || '').toLowerCase().indexOf('follow-up') === -1);
    const previous = record ? record.status : 'unrecorded';
    if (!record) {
      record = { id: 'return-' + id + '-' + date, studentId: id, date, className: student.class, period: 'Main daily attendance' };
      window.schoolData.attendanceRecords.push(record);
    }
    record.history = record.history || [];
    record.history.push({ from: previous, to: 'present', note, at: new Date().toLocaleString(), by: 'Discipline Staff demo' });
    record.status = 'present';
    record.middayReturn = true;
    record.middayNote = note;
    record.updatedAt = new Date().toISOString();
    if (typeof recalculateAttendanceStats === 'function') recalculateAttendanceStats(student);
    if (typeof saveSchoolRecords === 'function') saveSchoolRecords();
    toast('One main record updated. The day counts as present, with an excused return.');
  };

  window.renderStaffLookup = function () {
    const box = document.getElementById('staffLookup');
    if (!box) return;
    box.innerHTML = '<h3 style="margin-bottom:8px">Student lookup</h3><p style="font-size:13px;color:var(--t3);margin-bottom:8px">Read only. ' + NOTE + '</p><label class="lab" for="lookupQ">Name or ID</label><input class="inp" id="lookupQ" oninput="paintLookup()"><div id="lookupOut" style="margin-top:12px"></div>';
    window.paintLookup();
  };
  window.paintLookup = function () {
    const q = (document.getElementById('lookupQ').value || '').toLowerCase();
    const out = document.getElementById('lookupOut');
    const rows = window.schoolData.students.filter(s => !q || (s.name + s.id + s.class).toLowerCase().indexOf(q) >= 0).slice(0, 12);
    out.innerHTML = rows.map(s => '<div style="padding:8px 0;border-top:1px solid var(--b)"><strong>' + escapeHTML(s.name) + '</strong> · ' + escapeHTML(s.id) + ' · ' + escapeHTML(s.class || '') + '<div style="font-size:13px;color:var(--t2)">Academic: ' + (numberOrNull(s.academicScore) === null ? 'Missing' : s.academicScore + '%') + ' · Official discipline: ' + (numberOrNull(s.disciplinePoints) === null ? 'Missing' : s.disciplinePoints + '/40') + '</div></div>').join('') || '<p>No match.</p>';
  };

  const origAdm = window.admTab;
  window.admTab = function (t) {
    if (origAdm) origAdm(t);
    if (t === 'admnote') renderNotebook('adminNotebook', 'admin');
  };

  window.proposeRosterChange = function () {
    const name = document.getElementById('rosterName') && document.getElementById('rosterName').value.trim();
    if (!name) { toast('Enter the student name first.'); return; }
    const queue = JSON.parse(localStorage.getItem('ldk-roster-queue') || '[]');
    queue.unshift({ id: String(Date.now()), name, status: 'Awaiting Headmaster', reason: '' });
    localStorage.setItem('ldk-roster-queue', JSON.stringify(queue));
    toast('Marked Awaiting Headmaster approval. Not applied yet.');
    renderRosterQueue();
  };
  window.reviewRoster = function (id, status) {
    if ((window.previewRole || '') !== 'headmaster') { toast('Only the Headmaster preview can approve roster changes.'); return; }
    const queue = JSON.parse(localStorage.getItem('ldk-roster-queue') || '[]');
    const item = queue.find(row => row.id === id);
    if (!item) return;
    item.status = status;
    item.reason = status;
    localStorage.setItem('ldk-roster-queue', JSON.stringify(queue));
    if (status === 'Approved') {
      window.schoolData.students.push({ id: 'LDK-NEW-' + id.slice(-4), name: item.name, class: 'S1 Stream 1', level: 'O-Level', status: 'Active', academicScore: null, disciplinePoints: null, attendanceRate: null, absences: 0 });
    }
    renderRosterQueue();
  };
  window.renderRosterQueue = function () {
    const box = document.getElementById('rosterQueue');
    if (!box) return;
    const queue = JSON.parse(localStorage.getItem('ldk-roster-queue') || '[]');
    box.innerHTML = queue.map(item => '<div style="padding:8px 0;border-top:1px solid var(--b)"><strong>' + escapeHTML(item.name) + '</strong> · ' + escapeHTML(item.status) + (window.previewRole === 'headmaster' && item.status === 'Awaiting Headmaster' ? ' <button class="btn btn-a btn-sm" onclick="reviewRoster(\'' + item.id + '\',\'Approved\')">Approve</button> <button class="btn btn-d btn-sm" onclick="reviewRoster(\'' + item.id + '\',\'Declined\')">Decline</button>' : '') + '</div>').join('') || '<p style="color:var(--t3)">No roster requests.</p>';
  };

  function boot() {
    ensureCaseStudents();
    const users = document.getElementById('v-admu');
    if (users && !document.getElementById('rosterQueue')) {
      const card = document.createElement('div');
      card.className = 'card';
      card.style.marginTop = '16px';
      card.innerHTML = '<h3>Roster changes</h3><p style="font-size:13px;color:var(--t3)">Broad roster changes wait for the Headmaster. ' + NOTE + '</p><label class="lab" for="rosterName">New student name</label><input class="inp" id="rosterName"><button class="btn btn-a" style="margin-top:8px" onclick="proposeRosterChange()">Submit for approval</button><div id="rosterQueue"></div>';
      users.appendChild(card);
    }
    renderRosterQueue();
    const dash = document.getElementById('v-stad');
    if (dash && !document.getElementById('annTitle')) {
      const card = document.createElement('div');
      card.className = 'card';
      card.style.marginTop = '16px';
      card.innerHTML = '<h3>Announcement</h3><p style="font-size:13px;color:var(--t3)">Teachers may post only to an assigned class. ' + NOTE + '</p><label class="lab" for="annTitle">Title</label><input class="inp" id="annTitle"><label class="lab" for="annBody">Message</label><textarea class="txa" id="annBody"></textarea><label class="lab" for="annAudience">Audience</label><select class="sel" id="annAudience"><option value="S5 Stream 1">S5 Stream 1</option><option value="school">Whole school (admin only)</option></select><button class="btn btn-a" style="margin-top:8px" onclick="publishAnnouncement()">Publish in this demo</button>';
      dash.appendChild(card);
    }
    const ann = document.getElementById('v-san');
    if (ann) ann.innerHTML = '<div class="card"><h3>Announcements</h3><p style="font-size:13px;color:var(--t3)">One feed. ' + NOTE + '</p><div id="studentAnnouncements"></div></div>';
    renderAnnouncements();
  }
  window.renderAnnouncements = function () {
    const box = document.getElementById('studentAnnouncements');
    if (!box) return;
    const items = JSON.parse(localStorage.getItem('ldk-announcements') || '[]');
    const student = window.schoolData.students.find(s => s.id === CURRENT_STUDENT.id);
    const visible = items.filter(item => item.audience === 'school' || !student || item.audience === student.class);
    box.innerHTML = visible.map(item => '<article style="padding:10px 0;border-top:1px solid var(--b)"><strong>' + escapeHTML(item.title) + '</strong><div style="font-size:13px;color:var(--t3)">' + escapeHTML(item.author) + ' · ' + escapeHTML(item.date) + ' · ' + escapeHTML(item.audience) + '</div><p>' + escapeHTML(item.body) + '</p></article>').join('') || '<p>No announcements for this class yet.</p>';
  };
  window.publishAnnouncement = function () {
    const title = document.getElementById('annTitle').value.trim();
    const body = document.getElementById('annBody').value.trim();
    const audience = document.getElementById('annAudience').value;
    if (!title || !body) { toast('Add a title and a message.'); return; }
    if (window.staffKind === 'academic' && audience === 'school') { toast('Teachers can announce only to an assigned class.'); return; }
    const items = JSON.parse(localStorage.getItem('ldk-announcements') || '[]');
    items.unshift({ title, body, audience, author: window.staffKind === 'academic' ? 'Academic Staff demo' : 'Admin demo', date: new Date().toLocaleDateString() });
    localStorage.setItem('ldk-announcements', JSON.stringify(items));
    toast('Announcement saved in this browser only.');
    renderAnnouncements();
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();


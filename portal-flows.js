/* Demo-only portal flows. Nothing here is shared with other users or devices. */
(function () {
  const NOTE = 'Demo only. This stays on this browser and is not sent to the school.';

  function clearedMap() {
    try { return JSON.parse(localStorage.getItem('ldk-cleared-flags') || '{}'); } catch (e) { return {}; }
  }
  function saveCleared(map) { localStorage.setItem('ldk-cleared-flags', JSON.stringify(map)); }
  function flagId(studentId, cat) { return studentId + ':' + cat; }
  function activeFlags(student) {
    const cleared = clearedMap();
    const flags = [];
    if (numberOrNull(student.academicScore) !== null && Number(student.academicScore) < 50 && !cleared[flagId(student.id, 'academic')]) flags.push('Academic under 50%');
    if (numberOrNull(student.disciplinePoints) !== null && Number(student.disciplinePoints) < 20 && !cleared[flagId(student.id, 'discipline')]) flags.push('Discipline under 20/40');
    if (Number(student.absences || 0) > 5 && !cleared[flagId(student.id, 'attendance')]) flags.push('More than 5 main absences');
    return flags;
  }
  window.clearAttentionFlag = function (studentId, cat) {
    const role = window.previewRole || 'headmaster';
    if (role !== 'headmaster' && role !== 'discipline') { toast('Only an Admin or Discipline Officer can clear a flag in this preview.'); return; }
    const map = clearedMap();
    map[flagId(studentId, cat)] = { at: new Date().toLocaleString(), by: role };
    saveCleared(map);
    renderNeedsAttention();
    toast('Flag cleared for this demo. It will not come back until the underlying figure changes in a future import.');
  };

  function competition(items, scoreOf) {
    const rows = items.map(item => ({ item, score: scoreOf(item) })).filter(row => row.score !== null && row.score !== undefined && !Number.isNaN(row.score));
    rows.sort((a, b) => b.score - a.score);
    let last = null;
    let place = 0;
    return rows.map((row, index) => {
      if (row.score !== last) { place = index + 1; last = row.score; }
      return { item: row.item, score: row.score, place };
    });
  }
  function rankHtml(rows, label) {
    if (!rows.length) return '<p style="color:var(--t3)">No complete scores to rank. Missing scores are not treated as zero.</p>';
    return rows.slice(0, 30).map(row => '<div class="rank-row"><div class="rank-num">' + row.place + '</div><div class="rank-info"><div class="rank-name">' + escapeHTML(row.item.name || row.item.class || '') + '</div><div class="rank-meta">' + escapeHTML(row.item.class || row.item.level || '') + '</div></div><div class="rank-score">' + label(row) + '</div></div>').join('');
  }

  window.getNeedsAttention = function () {
    return (window.schoolData.students || []).filter(s => s.status !== 'Archived' && activeFlags(s).length);
  };
  window.renderNeedsAttention = function () {
    const container = document.getElementById('needsAttentionList');
    if (!container) return;
    const list = getNeedsAttention();
    const history = Object.entries(clearedMap());
    const active = list.length ? list.map(s => {
      const flags = activeFlags(s);
      const buttons = ['academic', 'discipline', 'attendance'].map(cat => {
        const label = cat === 'academic' ? 'Academic under 50%' : cat === 'discipline' ? 'Discipline under 20/40' : 'More than 5 main absences';
        if (!flags.includes(label)) return '';
        return '<button class="btn btn-g btn-sm" onclick="clearAttentionFlag(\'' + s.id + '\',\'' + cat + '\')">Clear ' + cat + '</button>';
      }).join(' ');
      return '<div class="rank-row"><div class="rank-info"><div class="rank-name">' + escapeHTML(s.name) + '</div><div class="rank-meta">' + escapeHTML(s.class) + ' · ' + escapeHTML(flags.join(' · ')) + '</div></div><div style="display:flex;gap:6px;flex-wrap:wrap">' + buttons + '</div></div>';
    }).join('') : '<p style="color:var(--t3)">No active flags.</p>';
    const past = history.length ? '<h4 style="margin:16px 0 8px">Cleared in this demo</h4>' + history.map(([key, info]) => '<div style="font-size:13px;color:var(--t3)">' + escapeHTML(key) + ' · ' + escapeHTML(info.by || '') + ' · ' + escapeHTML(info.at || '') + '</div>').join('') : '';
    container.innerHTML = '<p style="font-size:12px;color:var(--t3);margin-bottom:8px">' + NOTE + '</p>' + active + past;
  };
  window.renderTop30Overall = function () {
    const container = document.getElementById('top30Overall');
    if (!container || !window.schoolData) return;
    const rows = competition(window.schoolData.students.filter(s => s.status !== 'Archived'), s => numberOrNull(s.academicScore));
    container.innerHTML = rankHtml(rows, row => row.score + '%');
  };
  window.renderTop30Discipline = function () {
    const container = document.getElementById('top30Discipline');
    if (!container || !window.schoolData) return;
    const rows = competition(window.schoolData.students.filter(s => s.status !== 'Archived'), s => numberOrNull(s.disciplinePoints));
    container.innerHTML = rankHtml(rows, row => row.score + '/40');
  };
  window.getClassLeaders = function () {
    return [];
  };
  window.renderClassLeaders = function () {
    const container = document.getElementById('classLeadersList');
    if (!container || !window.schoolData) return;
    const classes = {};
    window.schoolData.students.filter(s => s.status !== 'Archived').forEach(s => {
      classes[s.class] = classes[s.class] || [];
      classes[s.class].push(s);
    });
    container.innerHTML = Object.keys(classes).map(name => {
      const academic = competition(classes[name], s => numberOrNull(s.academicScore))[0];
      const discipline = competition(classes[name], s => numberOrNull(s.disciplinePoints))[0];
      return '<div class="rank-row"><div class="rank-info"><div class="rank-name">' + escapeHTML(name) + '</div><div class="rank-meta">Academic: ' + (academic ? escapeHTML(academic.item.name) + ' (' + academic.score + '%)' : 'No score') + ' · Discipline: ' + (discipline ? escapeHTML(discipline.item.name) + ' (' + discipline.score + '/40)' : 'No official total') + '</div></div></div>';
    }).join('') || '<p style="color:var(--t3)">No classes yet.</p>';
  };

  function threads() {
    try { return JSON.parse(localStorage.getItem('ldk-parent-threads') || '[]'); } catch (e) { return []; }
  }
  function saveThreads(list) { localStorage.setItem('ldk-parent-threads', JSON.stringify(list.slice(0, 40))); }
  window.selectParentChild = function (id) {
    localStorage.setItem('ldk-parent-child', id);
    renderParentOverview();
    renderParentStudentInfo();
    if (typeof renderParentResults === 'function') renderParentResults();
    if (typeof renderParentAttendance === 'function') renderParentAttendance();
  };
  const origParentChild = window.parentChild;
  window.parentChild = function () {
    const list = parentChildren();
    const chosen = localStorage.getItem('ldk-parent-child');
    return list.find(s => s.id === chosen) || list[0] || (origParentChild ? origParentChild() : null);
  };
  function parentChildren() {
    const students = (window.schoolData && window.schoolData.students) || [];
    const first = students.find(s => s.id === 'LDK-2023-001');
    const second = students.find(s => s.id === 'LDK-2023-045');
    if (first) first.guardianName = first.guardianName || 'Mrs. Mukamana';
    if (second && first) second.guardianName = first.guardianName;
    const name = (first && first.guardianName) || 'Mrs. Mukamana';
    return students.filter(s => s.guardianName === name);
  }
  function fillChildSelect() {
    const select = document.getElementById('parentChildSelect');
    if (!select) return;
    const kids = parentChildren();
    select.innerHTML = kids.map(s => '<option value="' + s.id + '">' + escapeHTML(s.name) + ' · ' + escapeHTML(s.class || '') + '</option>').join('');
    const chosen = localStorage.getItem('ldk-parent-child') || (kids[0] && kids[0].id);
    if (chosen) select.value = chosen;
  }
  window.renderParentMessages = function () {
    const box = document.getElementById('parentThread');
    if (!box) return;
    const child = parentChild();
    const mine = threads().filter(t => !child || t.childId === child.id);
    box.innerHTML = '<p style="font-size:12px;color:var(--t3)">' + NOTE + '</p>' + (mine.length ? mine.map(t => '<article style="border-top:1px solid var(--b);padding:10px 0"><strong>' + escapeHTML(t.subject) + '</strong> <span class="tag">' + escapeHTML(t.status) + '</span>' + t.messages.map(m => '<p style="font-size:14px;margin-top:6px"><strong>' + (m.from === 'school' ? 'School (demo reply)' : 'You') + ':</strong> ' + escapeHTML(m.text) + '</p>').join('') + '</article>').join('') : '<p style="color:var(--t3)">No conversation yet.</p>');
  };
  window.sendParentMessage = function () {
    const subject = document.getElementById('parentMsgSubject').value.trim();
    const body = document.getElementById('parentMsgBody').value.trim();
    if (!subject || !body) { toast('Write a subject and a message'); return; }
    const child = parentChild();
    const list = threads();
    list.unshift({ id: String(Date.now()), childId: child && child.id, childName: child && child.name, subject, status: 'Awaiting response', messages: [{ from: 'parent', text: body, at: new Date().toLocaleString() }] });
    saveThreads(list);
    document.getElementById('parentMsgSubject').value = '';
    document.getElementById('parentMsgBody').value = '';
    renderParentMessages();
    toast('Saved in this demo. It is not delivered to staff.');
  };
  window.renderAdminInbox = function () {
    const box = document.getElementById('adminParentInbox');
    if (!box) return;
    const list = threads();
    box.innerHTML = '<h3 style="margin-bottom:8px">Parent inbox</h3><p style="font-size:13px;color:var(--t3);margin-bottom:12px">' + NOTE + ' A reply here is only a preview.</p>' + (list.length ? list.map(t => '<article style="border-top:1px solid var(--b);padding:12px 0"><strong>' + escapeHTML(t.childName || 'Child') + '</strong> · ' + escapeHTML(t.subject) + ' · ' + escapeHTML(t.status) + t.messages.map(m => '<p style="font-size:14px;margin-top:6px">' + escapeHTML(m.from) + ': ' + escapeHTML(m.text) + '</p>').join('') + '<label class="lab" for="reply-' + t.id + '">Demo reply</label><textarea class="txa" id="reply-' + t.id + '"></textarea><button class="btn btn-a" onclick="replyParentThread(\'' + t.id + '\')">Save reply</button></article>').join('') : '<p>No parent messages in this browser yet.</p>');
  };
  window.replyParentThread = function (id) {
    const input = document.getElementById('reply-' + id);
    const text = input && input.value.trim();
    if (!text) { toast('Write a reply first'); return; }
    const list = threads();
    const thread = list.find(item => item.id === id);
    if (!thread) return;
    thread.messages.push({ from: 'school', text, at: new Date().toLocaleString() });
    thread.status = 'Answered';
    saveThreads(list);
    renderAdminInbox();
    toast('Demo reply saved on this browser only.');
  };

  window.renderDemoReports = function () {
    const body = document.getElementById('demoReportBody');
    const classSelect = document.getElementById('reportClass');
    if (!body || !window.schoolData) return;
    if (classSelect && classSelect.options.length < 2) {
      classSelect.innerHTML = '<option value="">All classes</option>' + [...new Set(window.schoolData.students.map(s => s.class).filter(Boolean))].map(name => '<option>' + escapeHTML(name) + '</option>').join('');
    }
    const domain = document.getElementById('reportDomain').value;
    const cls = classSelect.value;
    const students = window.schoolData.students.filter(s => s.status !== 'Archived' && (!cls || s.class === cls));
    if (domain === 'attendance') {
      const withRate = students.filter(s => numberOrNull(s.attendanceRate) !== null);
      const missing = students.length - withRate.length;
      const avg = withRate.length ? Math.round(withRate.reduce((sum, s) => sum + Number(s.attendanceRate), 0) / withRate.length) : null;
      body.innerHTML = '<p>Main attendance average: <strong>' + (avg === null ? 'Not enough data' : avg + '%') + '</strong></p><p style="color:var(--t3)">' + missing + ' students have no main-attendance rate. That is shown as missing, not zero.</p>';
    } else if (domain === 'followup') {
      const rows = (window.schoolData.attendanceRecords || []).filter(r => (r.period || '').toLowerCase().includes('follow-up') && (!cls || r.className === cls));
      body.innerHTML = '<p>' + rows.length + ' follow-up lesson rows. These are excluded from the official attendance rate.</p>';
    } else if (domain === 'academic') {
      const ready = students.filter(s => numberOrNull(s.academicScore) !== null);
      body.innerHTML = ready.length ? '<p>' + ready.length + ' students have an academic score. ' + (students.length - ready.length) + ' are missing a score.</p>' : '<p>No academic scores for this filter.</p>';
    } else {
      const ready = students.filter(s => numberOrNull(s.disciplinePoints) !== null);
      body.innerHTML = '<p>Official discipline totals on file: ' + ready.length + '. Missing totals: ' + (students.length - ready.length) + '.</p>';
    }
  };

  function paintStudentExtras() {
    const student = window.schoolData && window.schoolData.students.find(s => s.id === CURRENT_STUDENT.id);
    const results = document.getElementById('studentResultsCard');
    const attendance = document.getElementById('studentAttendanceCard');
    const timetable = document.getElementById('studentTimetable');
    if (!student) return;
    if (results) {
      const mates = window.schoolData.students.filter(s => s.class === student.class && s.status !== 'Archived');
      const academic = competition(mates, s => numberOrNull(s.academicScore)).find(row => row.item.id === student.id);
      const discipline = competition(mates, s => numberOrNull(s.disciplinePoints)).find(row => row.item.id === student.id);
      results.innerHTML = '<h3 style="margin-bottom:8px">Academic results</h3><p>Score: <strong>' + (numberOrNull(student.academicScore) === null ? 'Not recorded' : student.academicScore + '%') + '</strong></p><p>Academic class place: <strong>' + (academic ? academic.place : 'Not ranked') + '</strong></p><p>Official discipline total: <strong>' + (numberOrNull(student.disciplinePoints) === null ? 'Not recorded' : student.disciplinePoints + '/40') + '</strong></p><p>Discipline class place: <strong>' + (discipline ? discipline.place : 'Not ranked') + '</strong></p><p style="font-size:12px;color:var(--t3);margin-top:8px">' + NOTE + '</p>';
    }
    if (attendance) {
      const records = (window.schoolData.attendanceRecords || []).filter(r => r.studentId === student.id);
      const main = records.filter(r => !(r.period || '').toLowerCase().includes('follow-up'));
      const follow = records.filter(r => (r.period || '').toLowerCase().includes('follow-up'));
      const line = r => '<div style="padding:8px 0;border-top:1px solid var(--b)">' + escapeHTML(r.date || '') + ' · ' + escapeHTML(r.status || '') + (r.middayReturn ? ' · Present for the day, excused midday return: ' + escapeHTML(r.middayNote || 'Returned and was marked present.') : '') + '</div>';
      attendance.innerHTML = '<h3>Main daily attendance</h3>' + (main.length ? main.map(line).join('') : '<p style="color:var(--t3)">No main attendance rows yet.</p>') + '<h3 style="margin-top:16px">Follow-up lessons</h3><p style="font-size:13px;color:var(--t3)">These do not change the official attendance rate.</p>' + (follow.length ? follow.map(line).join('') : '<p style="color:var(--t3)">No follow-up lessons recorded.</p>');
    }
    if (timetable) {
      timetable.innerHTML = student.class === 'S5 Stream 1'
        ? '<p style="font-size:12px;color:var(--t3);margin-bottom:8px">Demo timetable for S5 Stream 1. Not a live calendar.</p><table class="tbl"><tr><th>Day</th><th>Morning</th><th>Afternoon</th></tr><tr><td>Monday</td><td>Mathematics</td><td>Physics</td></tr><tr><td>Tuesday</td><td>Chemistry</td><td>English</td></tr><tr><td>Wednesday</td><td>Biology</td><td>History</td></tr></table>'
        : '<p style="color:var(--t3)">No timetable has been published for this class yet.</p>';
    }
  }

  const origRenderStudent = window.renderStudentPortal;
  window.renderStudentPortal = function () {
    if (origRenderStudent) origRenderStudent();
    paintStudentExtras();
    const student = window.schoolData && window.schoolData.students.find(s => s.id === CURRENT_STUDENT.id);
    if (!student) return;
    const mates = window.schoolData.students.filter(s => s.class === student.class && s.status !== 'Archived');
    const academic = competition(mates, s => numberOrNull(s.academicScore)).find(row => row.item.id === student.id);
    const el = document.getElementById('studentClassRank');
    if (el) el.textContent = academic ? '#' + academic.place + ' academic' : 'Not ranked';
    const school = document.getElementById('studentSchoolRank');
    const discipline = competition(mates, s => numberOrNull(s.disciplinePoints)).find(row => row.item.id === student.id);
    if (school) school.textContent = discipline ? 'Discipline place #' + discipline.place : 'Discipline not ranked';
  };

  const origSetup = window.setupAdmin;
  window.setupAdmin = function (role) {
    window.previewRole = role;
    if (origSetup) origSetup(role);
    document.querySelectorAll('#admNav [data-roles]').forEach(link => {
      const li = link.closest('li');
      if (li) li.style.display = link.dataset.roles.split(' ').includes(role) ? '' : 'none';
    });
    const banner = document.getElementById('adtp');
    if (banner) banner.textContent = 'Previewing ' + (role === 'dean' ? 'Dean of Studies' : role === 'discipline' ? 'Discipline Officer' : 'Headmaster') + '. This is not real access control. ' + NOTE;
  };

  const origAdm = window.admTab;
  window.admTab = function (t) {
    if (origAdm) origAdm(t);
    if (t === 'admmail') renderAdminInbox();
    if (t === 'admatt') paintAdminAttendance('main');
    if (t === 'admfu') paintAdminAttendance('follow');
    if (t === 'admret') paintReturns();
    if (t === 'admr') renderDemoReports();
  };
  let registerDate = '';
  let onlyMissing = false;
  function paintAdminAttendance(kind) {
    const box = document.getElementById(kind === 'main' ? 'adminMainAtt' : 'adminFollowAtt');
    if (!box || !window.schoolData) return;
    const all = window.schoolData.attendanceRecords || [];
    const main = r => !(r.period || '').toLowerCase().includes('follow-up');
    if (kind !== 'main') { box.textContent = all.filter(r => !main(r)).length + ' follow-up records; excluded from official totals.'; return; }
    registerDate = registerDate || getLocalDateString();
    box.innerHTML = '<h3>Daily class attendance</h3><p>Demo: records on this browser only. Missing registers are not student absences.</p><label for="registerDate">Date</label><input id="registerDate" class="inp" type="date"><label><input id="missingOnly" type="checkbox"> Show only classes not submitted</label><div id="registerList"></div><div id="registerDetail"></div>';
    const date = document.getElementById('registerDate'); date.value = registerDate;
    date.onchange = () => { if (date.value) registerDate = date.value; paintAdminAttendance('main'); };
    const filter = document.getElementById('missingOnly'); filter.checked = onlyMissing;
    filter.onchange = () => { onlyMissing = filter.checked; paintAdminAttendance('main'); };
    const list = document.getElementById('registerList');
    const classes = window.schoolData.classes || [];
    const groups = classes.map(c => ({name:c.name, rows:all.filter(r => main(r) && r.className === c.name && r.date === registerDate)}));
    const summary = document.createElement('p');
    summary.textContent = groups.filter(g => g.rows.length).length + ' of ' + classes.length + ' classes submitted'; list.appendChild(summary);
    groups.forEach(group => {
      if (onlyMissing && group.rows.length) return;
      const card = document.createElement('div'); card.style.cssText = 'padding:16px 0;border-bottom:1px solid var(--b)';
      const label = document.createElement('p'); label.textContent = group.name + ' — ' + (group.rows.length ? 'Submitted' : 'Not submitted'); card.appendChild(label);
      if (group.rows.length) {
        const row = group.rows[0]; const meta = document.createElement('p');
        meta.textContent = 'By ' + (row.submittedBy || 'Unknown (older demo)') + ' · ' + (row.createdAt || 'Submission time unavailable') + ' · ' + group.rows.filter(r => r.status === 'absent').length + ' absent / ' + group.rows.length + ' recorded'; card.appendChild(meta);
        const open = document.createElement('button'); open.className = 'btn btn-o'; open.textContent = 'View register'; open.onclick = () => showRegister(group); card.appendChild(open);
      }
      list.appendChild(card);
    });
  }
  function showRegister(group) {
    const box = document.getElementById('registerDetail'); box.replaceChildren();
    const title = document.createElement('h3'); title.textContent = group.name + ' · ' + registerDate; box.appendChild(title);
    group.rows.forEach(record => {
      const student = window.schoolData.students.find(s => s.id === record.studentId);
      const card = document.createElement('div'); card.style.cssText = 'padding:16px 0;border-bottom:1px solid var(--b)';
      const name = document.createElement('p'); name.textContent = (student ? student.name : record.studentId) + ' · ' + record.status; card.appendChild(name);
      if (window.previewRole === 'discipline') {
        const select = document.createElement('select'); select.className = 'inp'; select.setAttribute('aria-label','Attendance for ' + record.studentId);
        ['present','absent','late','excused'].forEach(status => { const o = document.createElement('option'); o.value = status; o.textContent = status; select.appendChild(o); }); select.value = record.status;
        const reason = document.createElement('input'); reason.className = 'inp'; reason.maxLength = 500; reason.placeholder = 'Reason for correction (required)'; reason.setAttribute('aria-label',reason.placeholder);
        const save = document.createElement('button'); save.className = 'btn btn-a'; save.textContent = 'Save correction';
        save.onclick = () => {
          if (window.previewRole !== 'discipline') { toast('Only Discipline Officers can correct attendance.'); return; }
          if (!reason.value.trim()) { toast('Enter a reason for this correction.'); return; }
          if (select.value === record.status) { toast('Choose a different status.'); return; }
          const change = {before:record.status,after:select.value,reason:reason.value.trim(),editor:'Discipline Officer (demo)',changedAt:new Date().toISOString()};
          record.corrections = [...(record.corrections || []),change]; record.status = change.after; record.updatedAt = change.changedAt;
          if (student) recalculateAttendanceStats(student);
          computeClassStats(); saveStudents(); saveSchoolRecords();
          recordAuditEvent(change.editor,'Attendance corrected',record.studentId,record.date + ': ' + change.before + ' → ' + change.after + '. ' + change.reason);
          paintAdminAttendance('main'); showRegister(group); toast('Correction saved on this browser.');
        };
        card.append(select,reason,save);
      }
      (record.corrections || []).forEach(change => { const line = document.createElement('p'); line.textContent = change.before + ' → ' + change.after + ' · ' + change.reason + ' · ' + change.editor + ' · ' + change.changedAt; card.appendChild(line); });
      box.appendChild(card);
    });
  }
  function paintReturns() {
    const box = document.getElementById('adminReturns');
    if (!box || !window.schoolData) return;
    const rows = (window.schoolData.attendanceRecords || []).filter(r => r.middayReturn);
    box.innerHTML = '<h3>Midday returns</h3><p style="font-size:13px;color:var(--t3)">A returned student stays present for the main day, with the excuse shown beside the mark.</p>' + (rows.length ? rows.map(r => '<div style="padding:8px 0;border-top:1px solid var(--b)">' + escapeHTML(r.studentId) + ' · ' + escapeHTML(r.date) + ' · ' + escapeHTML(r.middayNote || '') + '</div>').join('') : '<p>No midday returns recorded.</p>') + '<div class="fg"><label class="lab" for="returnStudent">Student ID</label><input class="inp" id="returnStudent" value="LDK-2023-001"></div><div class="fg"><label class="lab" for="returnNote">Excuse</label><input class="inp" id="returnNote" placeholder="Arrived after a clinic visit"></div><button class="btn btn-a" onclick="recordMiddayReturn()">Record return as present</button>';
  }
  window.recordMiddayReturn = function () {
    if (window.previewRole !== 'discipline') { toast('Only Discipline Officers can correct attendance.'); return; }
    toast('Open the main register and correct the student to Late or Present with the arrival explanation.');
    window.admTab('admatt');
  };

  document.querySelectorAll('#staP #ntjs, #staP #ntadm').forEach(link => { if (link.parentElement) link.parentElement.style.display = 'none'; });
  const classSelect = document.getElementById('atclass');
  if (classSelect) {
    const lock = () => { if ([...classSelect.options].some(o => o.value === 'S5 Stream 1')) classSelect.value = 'S5 Stream 1'; };
    lock();
    classSelect.addEventListener('change', () => { lock(); toast('This teacher preview is limited to the assigned class, S5 Stream 1.'); });
  }

  const origParentOverview = window.renderParentOverview;
  window.renderParentOverview = function () {
    fillChildSelect();
    if (origParentOverview) origParentOverview();
  };
  document.addEventListener('DOMContentLoaded', fillChildSelect);
  if (document.readyState !== 'loading') fillChildSelect();
})();


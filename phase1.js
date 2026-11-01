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
        : 'Discipline Staff (patron or matron). Day-to-day lookup and attendance only. You cannot send announcements or change official discipline totals. ' + NOTE;
    }
    const ann = document.getElementById('annTitle');
    if (ann && ann.closest('.card')) ann.closest('.card').style.display = window.staffKind === 'academic' ? '' : 'none';
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
    const rows = window.schoolData.students.filter(s => s.status !== 'Archived').map(s => {
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

  function notebookKey(slot) {
    const who = slot === 'admin' ? (window.previewRole || 'admin') : (window.staffKind || 'academic');
    return 'ldk-notes-v2-' + slot + '-' + who;
  }
  function readNotes(slot) {
    try { return JSON.parse(localStorage.getItem(notebookKey(slot)) || '[]'); } catch (e) { return []; }
  }
  function writeNotes(slot, notes) {
    localStorage.setItem(notebookKey(slot), JSON.stringify(notes));
  }
  window.renderNotebook = function (elementId, slot) {
    const box = document.getElementById(elementId);
    if (!box) return;
    box.dataset.slot = slot;
    const notes = readNotes(slot);
    const openId = box.dataset.open || '';
    const open = notes.find(n => n.id === openId);
    const list = notes.length ? notes.map(n => '<button class="btn btn-g" style="width:100%;justify-content:space-between;margin-bottom:8px" onclick="openNote(\'' + slot + '\',\'' + elementId + '\',\'' + n.id + '\')"><span>' + escapeHTML(n.title || (n.kind === 'check' ? 'Checklist' : 'Note')) + '</span><span style="font-size:12px;color:var(--t3)">' + (n.kind === 'check' ? 'Checklist' : 'Note') + '</span></button>').join('') : '<p style="color:var(--t3)">No notes yet. Use the plus button to add a simple note or a checklist.</p>';
    const editor = open ? (open.kind === 'check'
      ? '<label class="lab" for="noteTitle">Title</label><input class="inp" id="noteTitle" value="' + escapeHTML(open.title || '') + '"><div id="checkLines">' + (open.items || []).map((item, i) => '<div style="display:flex;gap:8px;align-items:center;margin:8px 0"><input type="checkbox" data-i="' + i + '" ' + (item.done ? 'checked' : '') + '><input class="inp" data-text="' + i + '" value="' + escapeHTML(item.text) + '"><button class="btn btn-d btn-sm" onclick="deleteCheckLine(\'' + slot + '\',\'' + elementId + '\',' + i + ')">Delete</button></div>').join('') + '</div><button class="btn btn-g" onclick="addCheckLine(\'' + slot + '\',\'' + elementId + '\')">Add item</button>'
      : '<label class="lab" for="noteTitle">Title</label><input class="inp" id="noteTitle" value="' + escapeHTML(open.title || '') + '"><label class="lab" for="noteBody">Note</label><textarea class="txa" id="noteBody">' + escapeHTML(open.body || '') + '</textarea>') + '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"><button class="btn btn-a" onclick="saveOpenNote(\'' + slot + '\',\'' + elementId + '\')">Save on this device</button><button class="btn btn-d" onclick="deleteOpenNote(\'' + slot + '\',\'' + elementId + '\')">Delete</button><button class="btn btn-g" onclick="closeNote(\'' + elementId + '\',\'' + slot + '\')">Back</button></div>' : '';
    box.innerHTML = '<div style="display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:12px"><div><h3>Notebook</h3><p style="font-size:13px;color:var(--t3)">' + NOTE + '</p></div><button class="btn btn-a" aria-label="Add note or checklist" onclick="startNote(\'' + slot + '\',\'' + elementId + '\')">+</button></div><div id="noteChooser" class="hidden" style="display:flex;gap:8px;margin-bottom:12px"><button class="btn btn-g" onclick="createNote(\'' + slot + '\',\'' + elementId + '\',\'note\')">Simple note</button><button class="btn btn-g" onclick="createNote(\'' + slot + '\',\'' + elementId + '\',\'check\')">Checklist</button></div>' + (open ? editor : list);
    if (box.dataset.choosing === '1' && !open) { const c = document.getElementById('noteChooser'); if (c) c.classList.remove('hidden'); }
  };
  window.startNote = function (slot, elementId) {
    const box = document.getElementById(elementId);
    if (box) box.dataset.choosing = '1';
    renderNotebook(elementId, slot);
  };
  window.createNote = function (slot, elementId, kind) {
    const notes = readNotes(slot);
    const id = String(Date.now());
    notes.unshift({ id, kind, title: kind === 'check' ? 'Checklist' : 'Note', body: '', items: kind === 'check' ? [{ text: '', done: false }] : [] });
    writeNotes(slot, notes);
    const box = document.getElementById(elementId);
    if (box) { box.dataset.open = id; box.dataset.choosing = ''; }
    renderNotebook(elementId, slot);
    toast('Saved in this browser demo.');
  };
  window.openNote = function (slot, elementId, id) {
    const box = document.getElementById(elementId);
    if (box) box.dataset.open = id;
    renderNotebook(elementId, slot);
  };
  window.closeNote = function (elementId, slot) {
    const box = document.getElementById(elementId);
    if (box) box.dataset.open = '';
    renderNotebook(elementId, slot);
  };
  window.saveOpenNote = function (slot, elementId) {
    const box = document.getElementById(elementId);
    const notes = readNotes(slot);
    const note = notes.find(n => n.id === (box && box.dataset.open));
    if (!note) return;
    note.title = document.getElementById('noteTitle').value.trim() || note.title;
    if (note.kind === 'check') {
      note.items = [...document.querySelectorAll('#checkLines [data-text]')].map(input => ({ text: input.value, done: !!document.querySelector('#checkLines [data-i="' + input.dataset.text + '"]').checked }));
    } else note.body = document.getElementById('noteBody').value;
    try { writeNotes(slot, notes); toast('Saved in this browser demo. Not synced.'); }
    catch (e) { toast('This browser could not store the notebook.'); }
  };
  window.deleteOpenNote = function (slot, elementId) {
    const box = document.getElementById(elementId);
    writeNotes(slot, readNotes(slot).filter(n => n.id !== box.dataset.open));
    box.dataset.open = '';
    renderNotebook(elementId, slot);
    toast('Deleted on this device.');
  };
  window.addCheckLine = function (slot, elementId) {
    window.saveOpenNote(slot, elementId);
    const box = document.getElementById(elementId);
    const notes = readNotes(slot);
    const note = notes.find(n => n.id === box.dataset.open);
    if (!note) return;
    note.items.push({ text: '', done: false });
    writeNotes(slot, notes);
    renderNotebook(elementId, slot);
  };
  window.deleteCheckLine = function (slot, elementId, index) {
    window.saveOpenNote(slot, elementId);
    const box = document.getElementById(elementId);
    const notes = readNotes(slot);
    const note = notes.find(n => n.id === box.dataset.open);
    if (!note) return;
    note.items.splice(index, 1);
    writeNotes(slot, notes);
    renderNotebook(elementId, slot);
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

  function placeOf(list, student, scoreOf) {
    const rows = list.map(s => ({ s, score: scoreOf(s) })).filter(r => r.score !== null);
    rows.sort((a, b) => b.score - a.score);
    let last = null, place = 0;
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].score !== last) { place = i + 1; last = rows[i].score; }
      if (rows[i].s.id === student.id) return place + ' of ' + rows.length;
    }
    return 'Not ranked — score missing';
  }
  function rankLine(student, label, pool, key) {
    return '<div style="padding:8px 0;border-top:1px solid var(--b)"><strong>' + label + '</strong><div>Academic: ' + placeOf(pool, student, s => numberOrNull(s.academicScore)) + '</div><div>Discipline: ' + placeOf(pool, student, s => numberOrNull(s.disciplinePoints)) + '</div></div>';
  }
  const priorStudent = window.renderStudentPortal;
  window.renderStudentPortal = function () {
    if (priorStudent) priorStudent();
    const card = document.getElementById('studentResultsCard');
    const student = window.schoolData && window.schoolData.students.find(s => s.id === CURRENT_STUDENT.id);
    if (!card || !student) return;
    const active = window.schoolData.students.filter(s => s.status !== 'Archived');
    card.insertAdjacentHTML('beforeend', '<h3 style="margin-top:16px">Demo ranks</h3><p style="font-size:12px;color:var(--t3)">Academic and discipline are separate. Ties share a place. Missing scores are not zero. ' + NOTE + '</p>' + rankLine(student, 'Class · ' + (student.class || '')) + rankLine(student, 'Level · ' + (student.level || 'Unknown'), active.filter(s => s.level === student.level)) + rankLine(student, 'School', active));
  };

  function reportStore() { try { return JSON.parse(localStorage.getItem('ldk-demo-reports') || '[]'); } catch (e) { return []; } }
  function saveReports(list) { localStorage.setItem('ldk-demo-reports', JSON.stringify(list)); }
  window.queueDemoReport = function () {
    const category = document.getElementById('repCat').value;
    const to = document.getElementById('repTo').value;
    const title = document.getElementById('repTitle').value.trim();
    const body = document.getElementById('repBody').value.trim();
    const file = document.getElementById('repFile').files[0];
    if (!title || !body) { toast('Add a title and a short description.'); return; }
    const preview = document.getElementById('repPreview');
    preview.hidden = false;
    preview.innerHTML = '<p><strong>Check before saving</strong></p><p>' + escapeHTML(category) + ' report for ' + escapeHTML(to) + '</p><p>' + escapeHTML(title) + '</p><p>' + escapeHTML(body) + '</p><p>File: ' + escapeHTML(file ? file.name : 'none') + '</p><button class="btn btn-a" onclick="confirmDemoReport()">Save in this browser demo</button>';
    window._pendingReport = { category, to, title, body, fileName: file ? file.name : '' };
  };
  window.confirmDemoReport = function () {
    const pending = window._pendingReport;
    if (!pending) return;
    const sender = window.previewRole || (window.staffKind === 'discipline' ? 'discipline-staff' : 'academic-staff');
    const list = reportStore();
    list.unshift({ id: String(Date.now()), ...pending, sender, read: false, date: new Date().toLocaleString() });
    saveReports(list);
    window._pendingReport = null;
    document.getElementById('repPreview').hidden = true;
    toast('Saved in this browser demo. Nobody else has been notified.');
    renderReportInbox();
  };
  window.renderReportInbox = function () {
    const box = document.getElementById('hmInbox');
    if (!box) return;
    const who = window.previewRole || 'headmaster';
    const mine = reportStore().filter(r => r.to === who || (who === 'headmaster' && r.to === 'headmaster'));
    const unread = mine.filter(r => !r.read);
    const byCat = {};
    unread.forEach(r => { const key = r.category + ' from ' + r.sender; byCat[key] = (byCat[key] || 0) + 1; });
    box.innerHTML = '<h3>Report inbox</h3><p style="font-size:13px;color:var(--t3)">' + NOTE + '</p><p>Unread: ' + unread.length + (Object.keys(byCat).length ? ' · ' + Object.entries(byCat).map(([k, n]) => n + ' ' + k).join(', ') : '') + '</p>' +
      (mine.length ? mine.map(r => '<article style="padding:10px 0;border-top:1px solid var(--b)"><strong>' + escapeHTML(r.title) + '</strong> <span class="tag">' + (r.read ? 'Read' : 'Unread') + '</span><div style="font-size:13px;color:var(--t3)">' + escapeHTML(r.sender) + ' · ' + escapeHTML(r.category) + ' · ' + escapeHTML(r.date) + '</div><p>' + escapeHTML(r.body) + '</p>' + (r.fileName ? '<p>Attachment name: ' + escapeHTML(r.fileName) + ' (kept as a name only in this demo)</p>' : '') + '<button class="btn btn-g btn-sm" onclick="markReport(\'' + r.id + '\')">Open</button></article>').join('') : '<p>No reports in this browser yet.</p>');
  };
  window.markReport = function (id) {
    const list = reportStore();
    const row = list.find(r => r.id === id);
    if (row) row.read = true;
    saveReports(list);
    renderReportInbox();
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
    if (window.staffKind === 'discipline') { toast('Discipline Staff cannot send announcements.'); return; }
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

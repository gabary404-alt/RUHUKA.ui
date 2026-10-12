/* RUHUKA attendance, authentication and import foundation.
 * Uses only the Supabase publishable key; permissions are enforced by RLS.
 * Demo students remain clearly flagged and can be removed by the headmaster.
 */
(function () {
  'use strict';

  const SUPABASE_URL = 'https://jsqiqxflgokfdooogcst.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_CUCKjIg3vkVLk2qKQsjcKQ_Bs0MlfSf';
  let db = null;
  let pendingRows = [];
  let pendingType = '';
  let activeProfile = null;
  let activeUser = null;

  function client() {
    if (!db) {
      if (!window.supabase || typeof window.supabase.createClient !== 'function') {
        throw new Error('The database library did not load. Refresh the page and try again.');
      }
      db = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
      });
    }
    return db;
  }

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }

  function say(message) {
    if (typeof window.toast === 'function') window.toast(message);
    else window.alert(message);
  }

  function roleName(role) {
    return ({ headmaster: 'Headmaster', dean: 'Dean of Studies', discipline: 'Discipline Officer',
      teacher: 'Teacher', staff: 'Staff', student: 'Student', parent: 'Parent' })[role] || role;
  }

  function setPortal(role, profile) {
    document.querySelectorAll('.port').forEach(function (p) { p.classList.remove('on'); });
    document.getElementById('land').classList.add('hidden');
    activeProfile = profile;
    window.ruhukaSession = { user: activeUser, profile: profile, client: client() };

    if (role === 'student') {
      document.getElementById('stuP').classList.add('on');
      CURRENT_STUDENT = null;
      client().from('students').select('id,school_id,full_name,class_name,gender,discipline_points')
        .eq('auth_user_id', activeUser.id).maybeSingle().then(function (result) {
          if (!result.error && result.data) {
            CURRENT_STUDENT = {
              dbId: result.data.id, id: result.data.school_id, name: result.data.full_name,
              class: result.data.class_name, disciplinePoints: result.data.discipline_points || 0
            };
          }
        });
    } else if (role === 'headmaster') {
      document.getElementById('admP').classList.add('on');
      if (typeof window.setupAdmin === 'function') window.setupAdmin('headmaster');
      if (typeof window.renderUserTable === 'function') window.renderUserTable();
      if (typeof window.updateDashboardStats === 'function') window.updateDashboardStats();
      if (typeof window.renderAllClassRankings === 'function') window.renderAllClassRankings();
      if (typeof window.renderAllAcademicRankings === 'function') window.renderAllAcademicRankings();
      if (typeof window.renderTop30Overall === 'function') window.renderTop30Overall();
      if (typeof window.renderTop30Discipline === 'function') window.renderTop30Discipline();
      if (typeof window.renderNeedsAttention === 'function') window.renderNeedsAttention();
      if (typeof window.renderClassesBelowTarget === 'function') window.renderClassesBelowTarget();
      if (typeof window.renderClassLeaders === 'function') window.renderClassLeaders();
    } else {
      document.getElementById('staP').classList.add('on');
      const staffName = document.getElementById('stn');
      if (staffName) staffName.textContent = profile.full_name || activeUser.email || 'Staff';
      const adminName = document.getElementById('adn');
      if (adminName) adminName.textContent = profile.full_name || activeUser.email || roleName(role);
      const roleEl = document.getElementById('adrole');
      if (roleEl) roleEl.textContent = roleName(role);
    }
    closeL();
    if (role === 'headmaster') {
      ensureDemoStudentsSynced().then(function () {
        refreshClassOptions().then(function () { loadAtt(); refreshAttendanceStats(); });
      }).catch(function (err) { console.error(err); say('Signed in, but demo roster sync needs attention: ' + err.message); });
    } else if (role !== 'student') {
      refreshClassOptions().then(loadAtt);
    }
    if (typeof window.checkAIVisibility === 'function') window.checkAIVisibility();
    say('Signed in successfully.');
  }

  window.doL = async function () {
    const email = document.getElementById('lid').value.trim();
    const password = document.getElementById('lpw').value;
    if (!email || !password) { say('Enter your school email and password.'); return; }
    try {
      const auth = client();
      const result = await auth.auth.signInWithPassword({ email: email, password: password });
      if (result.error) throw result.error;
      activeUser = result.data.user;
      const profileResult = await auth.from('profiles')
        .select('id,full_name,role,is_active').eq('id', activeUser.id).maybeSingle();
      if (profileResult.error) throw profileResult.error;
      const profile = profileResult.data;
      if (!profile || !profile.is_active) {
        await auth.auth.signOut();
        activeUser = null;
        throw new Error('This account has no active school profile. Ask the headmaster to set it up.');
      }
      const chosen = document.getElementById('t-stu').classList.contains('on') ? 'student'
        : document.getElementById('t-sta').classList.contains('on') ? 'staff' : 'admin';
      if (chosen === 'student' && profile.role !== 'student') throw new Error('This account is not registered as a student.');
      if (chosen === 'staff' && !['teacher', 'staff', 'dean', 'discipline'].includes(profile.role)) throw new Error('This account is not registered as staff.');
      if (chosen === 'admin' && profile.role !== 'headmaster') throw new Error('Only the headmaster account can open the admin portal.');
      setPortal(profile.role, profile);
    } catch (error) {
      console.error('RUHUKA sign-in error:', error);
      say(error.message || 'Sign-in failed. Check your connection and credentials.');
    }
  };

  window.logout = async function () {
    try { if (db) await db.auth.signOut(); } catch (e) { console.error(e); }
    activeUser = null;
    activeProfile = null;
    window.ruhukaSession = null;
    document.querySelectorAll('.port').forEach(function (p) { p.classList.remove('on'); });
    document.getElementById('land').classList.remove('hidden');
    window.scrollTo(0, 0);
    if (typeof window.checkAIVisibility === 'function') window.checkAIVisibility();
    say('Logged out successfully.');
  };

  async function ensureDemoStudentsSynced() {
    const localStudents = (window.schoolData && window.schoolData.students || []).filter(function (s) { return s.isDemo === true; });
    if (!localStudents.length) return;
    const payload = localStudents.map(function (s) {
      return {
        school_id: String(s.id),
        full_name: String(s.name),
        gender: s.gender === 'F' || s.gender === 'female' ? 'female' : s.gender === 'M' || s.gender === 'male' ? 'male' : 'other',
        class_name: String(s.class || 'Unassigned'),
        stream: (String(s.class || '').match(/Stream\s*\d+/i) || [null])[0],
        boarding_status: 'unknown',
        is_active: true,
        discipline_points: Math.max(0, Math.min(40, Number(s.disciplinePoints) || 40)),
        is_demo: true
      };
    });
    const uniquePayload = Array.from(new Map(payload.map(function (student) { return [student.school_id, student]; })).values());
    for (let i = 0; i < uniquePayload.length; i += 100) {
      const result = await client().from('students').upsert(uniquePayload.slice(i, i + 100), {
        onConflict: 'school_id', ignoreDuplicates: true
      });
      if (result.error) throw result.error;
    }
  }

  async function refreshClassOptions() {
    if (!activeUser || !activeProfile || activeProfile.role === 'student') return;
    const result = await client().from('students').select('class_name').eq('is_active', true);
    if (result.error) throw result.error;
    const classes = Array.from(new Set((result.data || []).map(function (s) { return s.class_name; }).filter(Boolean))).sort();
    const select = document.getElementById('atclass');
    if (!select || !classes.length) return;
    const previous = select.value;
    select.innerHTML = '';
    classes.forEach(function (name) {
      const option = document.createElement('option');
      option.value = name;
      option.textContent = name;
      select.appendChild(option);
    });
    select.value = classes.includes(previous) ? previous : classes.includes('S5 Stream 1') ? 'S5 Stream 1' : classes[0];
  }

  function selectedPeriod() {
    const el = document.getElementById('atperiod');
    const value = el ? el.value : 'full_day';
    return value === 'morning' || value === 'afternoon' ? value : 'full_day';
  }

  window.loadAtt = async function () {
    const list = document.getElementById('atlist');
    const classSelect = document.getElementById('atclass');
    if (!list || !classSelect || !activeUser) return;
    const cls = classSelect.value;
    const dateInput = document.getElementById('atdate');
    if (dateInput && !dateInput.value) dateInput.value = new Date().toISOString().slice(0, 10);
    const date = dateInput ? dateInput.value : new Date().toISOString().slice(0, 10);
    const period = selectedPeriod();
    document.getElementById('atcname').textContent = cls;
    list.innerHTML = '<div style="padding:18px;color:var(--t3)">Loading students and saved attendance…</div>';
    try {
      const studentsResult = await client().from('students')
        .select('id,school_id,full_name,class_name,gender,is_demo')
        .eq('is_active', true).eq('class_name', cls).order('full_name');
      if (studentsResult.error) throw studentsResult.error;
      const students = studentsResult.data || [];
      window._currentAttStudents = students.map(function (s) {
        return { dbId: s.id, id: s.school_id, name: s.full_name, class: s.class_name, gender: s.gender, isDemo: s.is_demo };
      });
      list.innerHTML = '';
      if (!students.length) {
        list.innerHTML = '<div style="padding:20px;text-align:center;color:var(--t3)">No students found in this class. Check the class selection or import student records.</div>';
        return;
      }
      const ids = students.map(function (s) { return s.id; });
      const savedResult = await client().from('attendance_records')
        .select('student_id,status').in('student_id', ids).eq('attendance_date', date).eq('period', period);
      if (savedResult.error) throw savedResult.error;
      const saved = new Map((savedResult.data || []).map(function (r) { return [r.student_id, r.status]; }));
      students.forEach(function (student) {
        const row = document.createElement('div');
        row.className = 'at-r';
        row.dataset.studentId = student.id;
        const info = document.createElement('div');
        info.className = 'at-i';
        const avatar = document.createElement('div');
        avatar.className = 'at-a';
        avatar.style.background = typeof window.getAvatarColor === 'function' ? window.getAvatarColor(student.full_name) : 'var(--a)';
        avatar.textContent = typeof window.getInitials === 'function' ? window.getInitials(student.full_name) : student.full_name.slice(0, 2);
        const nameWrap = document.createElement('div');
        const name = document.createElement('div');
        name.style.cssText = 'font-size:14px;font-weight:600';
        name.textContent = student.full_name;
        const id = document.createElement('div');
        id.style.cssText = 'font-size:12px;color:var(--t3)';
        id.textContent = student.school_id;
        nameWrap.append(name, id);
        info.append(avatar, nameWrap);
        const toggles = document.createElement('div');
        toggles.className = 'tog';
        const present = document.createElement('button');
        present.className = 'tog-btn';
        present.textContent = 'Present';
        present.type = 'button';
        present.onclick = function () { window.toggleAtt(present, true); };
        const absent = document.createElement('button');
        absent.className = 'tog-btn';
        absent.textContent = 'Absent';
        absent.type = 'button';
        absent.onclick = function () { window.toggleAtt(absent, false); };
        const isPresent = !saved.has(student.id) || saved.get(student.id) !== 'absent';
        present.classList.toggle('on-p', isPresent);
        absent.classList.toggle('on-a', !isPresent);
        toggles.append(present, absent);
        row.append(info, toggles);
        list.appendChild(row);
      });
      window._currentAttStudents = students.map(function (s) {
        return { dbId: s.id, id: s.school_id, name: s.full_name, class: s.class_name, gender: s.gender, isDemo: s.is_demo };
      });
    } catch (error) {
      console.error('Attendance load failed:', error);
      list.innerHTML = '<div style="padding:20px;color:var(--r)">Could not load attendance: ' + esc(error.message) + '</div>';
    }
  };

  window.subAtt = async function () {
    if (!activeUser) { say('Please sign in first.'); return; }
    const rows = Array.from(document.querySelectorAll('#atlist .at-r'));
    if (!rows.length) { say('There are no students to save for this class.'); return; }
    const date = document.getElementById('atdate').value || new Date().toISOString().slice(0, 10);
    const period = selectedPeriod();
    const records = rows.map(function (row) {
      const buttons = row.querySelectorAll('.tog-btn');
      const present = buttons[0].classList.contains('on-p');
      return { student_id: row.dataset.studentId, attendance_date: date, period: period,
        status: present ? 'present' : 'absent', marked_by: activeUser.id };
    });
    try {
      for (let i = 0; i < records.length; i += 100) {
        const result = await client().from('attendance_records').upsert(records.slice(i, i + 100), {
          onConflict: 'student_id,attendance_date,period'
        });
        if (result.error) throw result.error;
      }
      localStorage.removeItem(typeof window.attDraftKey === 'function' ? window.attDraftKey() : '');
      if (typeof window.logActivity === 'function') {
        const absent = records.filter(function (r) { return r.status === 'absent'; }).length;
        window.logActivity('attendance', 'Attendance saved — ' + document.getElementById('atclass').value,
          roleName(activeProfile.role), absent + ' absent, ' + (records.length - absent) + ' present');
      }
      await refreshAttendanceStats();
      say('Attendance saved to the school database.');
    } catch (error) {
      console.error('Attendance save failed:', error);
      say('Attendance was not saved: ' + error.message);
    }
  };

  async function refreshAttendanceStats() {
    if (!activeUser) return;
    const today = new Date().toISOString().slice(0, 10);
    const [studentsResult, attendanceResult] = await Promise.all([
      client().from('students').select('id', { count: 'exact', head: true }).eq('is_active', true),
      client().from('attendance_records').select('status').eq('attendance_date', today)
    ]);
    if (studentsResult.error || attendanceResult.error) {
      console.warn('Attendance statistics are not available yet.');
      return;
    }
    const total = studentsResult.count || 0;
    const records = attendanceResult.data || [];
    const present = records.filter(function (r) { return r.status !== 'absent'; }).length;
    const absent = records.filter(function (r) { return r.status === 'absent'; }).length;
    const pct = records.length ? Math.round(present * 100 / records.length) : 0;
    const setText = function (id, value) { const el = document.getElementById(id); if (el) el.textContent = value; };
    setText('dashTotalStudents', total.toLocaleString());
    setText('dashAttendanceToday', records.length ? pct + '%' : '—');
    setText('staffPresentCount', present.toLocaleString());
    setText('staffAbsentCount', absent.toLocaleString());
    setText('staffPresentPct', records.length ? pct + '% of marked records today' : 'No records marked today');
    setText('staffAbsentPct', records.length ? Math.round(absent * 100 / records.length) + '% of marked records today' : 'No records marked today');
  }

  function parseCSV(text) {
    const rows = [];
    let row = [], field = '', quoted = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (quoted) {
        if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
        else if (ch === '"') quoted = false;
        else field += ch;
      } else if (ch === '"' && field === '') quoted = true;
      else if (ch === ',') { row.push(field.trim()); field = ''; }
      else if (ch === '\n') { row.push(field.trim()); if (row.some(function (v) { return v !== ''; })) rows.push(row); row = []; field = ''; }
      else if (ch !== '\r') field += ch;
    }
    row.push(field.trim());
    if (row.some(function (v) { return v !== ''; })) rows.push(row);
    if (rows.length < 2) throw new Error('Add a header row and at least one data row.');
    const headers = rows.shift().map(function (h) { return h.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''); });
    return rows.map(function (values, i) {
      const item = {};
      headers.forEach(function (header, index) { item[header] = (values[index] || '').trim(); });
      item._row = i + 2;
      return item;
    });
  }

  function field(row, names) {
    for (const name of names) if (row[name] != null && row[name] !== '') return row[name];
    return '';
  }

  function simpleHash(value) {
    let hash = 2166136261;
    for (let i = 0; i < value.length; i++) { hash ^= value.charCodeAt(i); hash = Math.imul(hash, 16777619); }
    return (hash >>> 0).toString(16);
  }

  function prepareImportRows(type, rows) {
    const errors = [];
    const prepared = [];
    rows.forEach(function (row) {
      const line = row._row;
      if (type === 'students') {
        const schoolId = field(row, ['school_id', 'student_id', 'id']);
        const name = field(row, ['full_name', 'name', 'student_name']);
        const cls = field(row, ['class_name', 'class']);
        const genderRaw = field(row, ['gender']).toLowerCase();
        if (!schoolId || !name || !cls) { errors.push('Row ' + line + ': school_id, full_name and class_name are required.'); return; }
        if (genderRaw && !['m', 'f', 'male', 'female', 'other'].includes(genderRaw)) { errors.push('Row ' + line + ': gender must be M, F or other.'); return; }
        prepared.push({ school_id: schoolId, full_name: name,
          gender: genderRaw === 'm' ? 'male' : genderRaw === 'f' ? 'female' : genderRaw || 'other',
          class_name: cls, stream: field(row, ['stream']) || ((cls.match(/stream\s*\d+/i) || [])[0] || null),
          boarding_status: field(row, ['boarding_status']) || 'unknown',
          date_of_birth: field(row, ['date_of_birth']) || null,
          parent_phone: field(row, ['parent_phone']) || null, is_active: true, is_demo: false });
      } else if (type === 'discipline') {
        const schoolId = field(row, ['school_id', 'student_id', 'id']);
        const points = Number(field(row, ['points_change', 'points', 'mark']));
        const note = field(row, ['note', 'reason', 'details']);
        if (!schoolId || !Number.isFinite(points) || points === 0 || points < -120 || points > 120 || !note) {
          errors.push('Row ' + line + ': school_id, a non-zero points_change (-120 to 120), and note are required.'); return;
        }
        const disciplineRow = { school_id: schoolId, points_change: points, note: note,
          term: field(row, ['term']) || null, academic_year: field(row, ['academic_year', 'year']) || null,
          category: field(row, ['category']) || null };
        disciplineRow.source_key = 'csv-' + simpleHash(JSON.stringify({ row: line, data: disciplineRow }));
        prepared.push(disciplineRow);
      } else if (type === 'academic') {
        const schoolId = field(row, ['school_id', 'student_id', 'id']);
        const subject = field(row, ['subject']);
        const assessment = field(row, ['assessment', 'assessment_name']) || 'Term result';
        const obtained = Number(field(row, ['marks_obtained', 'marks', 'score']));
        const possible = Number(field(row, ['marks_possible', 'out_of', 'maximum_marks']));
        const term = field(row, ['term']);
        const year = field(row, ['academic_year', 'year']);
        if (!schoolId || !subject || !Number.isFinite(obtained) || !Number.isFinite(possible) ||
            obtained < 0 || possible <= 0 || obtained > possible || !term || !year) {
          errors.push('Row ' + line + ': school_id, subject, valid marks_obtained/marks_possible, term and academic_year are required.'); return;
        }
        prepared.push({ school_id: schoolId, subject: subject, assessment: assessment,
          marks_obtained: obtained, marks_possible: possible, term: term, academic_year: year });
      }
    });
    return { rows: prepared, errors: errors };
  }

  window.setImportType = function () {
    const type = document.getElementById('bulkImportType').value;
    const area = document.getElementById('bulkImportArea');
    const examples = {
      students: 'school_id,full_name,gender,class_name,stream,boarding_status,date_of_birth,parent_phone\nLDK-TEST-001,Sample Student,F,S5 Stream 1,Stream 1,boarding,2008-03-12,+2507...',
      discipline: 'school_id,points_change,note,term,academic_year,category\nLDK-TEST-001,-2,Late to class,Term 1,2026,Behaviour',
      academic: 'school_id,subject,assessment,marks_obtained,marks_possible,term,academic_year\nLDK-TEST-001,Mathematics,Term exam,78,100,Term 1,2026'
    };
    area.placeholder = examples[type] || '';
    document.getElementById('importPreviewSection').classList.add('hidden');
    pendingRows = []; pendingType = '';
  };

  window.downloadImportTemplate = function () {
    const type = document.getElementById('bulkImportType').value;
    const templates = {
      students: 'school_id,full_name,gender,class_name,stream,boarding_status,date_of_birth,parent_phone\nLDK-TEST-001,Sample Student,F,S5 Stream 1,Stream 1,boarding,2008-03-12,+250700000000\n',
      discipline: 'school_id,points_change,note,term,academic_year,category\nLDK-TEST-001,-2,Late to class,Term 1,2026,Behaviour\n',
      academic: 'school_id,subject,assessment,marks_obtained,marks_possible,term,academic_year\nLDK-TEST-001,Mathematics,Term exam,78,100,Term 1,2026\n'
    };
    const blob = new Blob([templates[type]], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'ruhuka-' + type + '-template.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  window.previewImport = async function () {
    try {
      const type = document.getElementById('bulkImportType').value;
      const source = document.getElementById('bulkImportArea').value.trim();
      if (!source) { say('Choose a CSV file or paste CSV rows first.'); return; }
      const raw = parseCSV(source);
      const result = prepareImportRows(type, raw);
      if (result.errors.length) {
        pendingRows = []; pendingType = '';
        document.getElementById('importPreviewSection').classList.remove('hidden');
        document.getElementById('importStats').textContent = result.errors.length + ' issue(s) found';
        document.getElementById('importPreviewTable').innerHTML = '<div style="padding:16px;color:var(--r)">' +
          result.errors.slice(0, 20).map(esc).join('<br>') + '</div>';
        say('Please fix the highlighted import issues before continuing.');
        return;
      }
      if (!result.rows.length) throw new Error('No valid rows were found.');
      pendingRows = result.rows;
      pendingType = type;
      document.getElementById('importPreviewSection').classList.remove('hidden');
      document.getElementById('importStats').textContent = result.rows.length + ' valid row(s)';
      const columns = type === 'students' ? ['school_id', 'full_name', 'gender', 'class_name']
        : type === 'discipline' ? ['school_id', 'points_change', 'note', 'term']
        : ['school_id', 'subject', 'marks_obtained', 'marks_possible', 'term', 'academic_year'];
      let table = '<div class="data-table-wrap"><table class="tbl"><thead><tr>' +
        columns.map(function (c) { return '<th>' + esc(c.replace(/_/g, ' ')) + '</th>'; }).join('') +
        '</tr></thead><tbody>';
      result.rows.slice(0, 100).forEach(function (row) {
        table += '<tr>' + columns.map(function (c) { return '<td>' + esc(row[c]) + '</td>'; }).join('') + '</tr>';
      });
      table += '</tbody></table></div>';
      if (result.rows.length > 100) table += '<p style="padding:12px;color:var(--t3)">Preview shows first 100 rows; all ' + result.rows.length + ' rows will be imported.</p>';
      document.getElementById('importPreviewTable').innerHTML = table;
    } catch (error) { say(error.message); }
  };

  window.confirmImport = async function () {
    if (!activeUser || !activeProfile || activeProfile.role !== 'headmaster') {
      say('Only the signed-in headmaster can import school records.'); return;
    }
    if (!pendingRows.length || !pendingType) { say('Preview and validate the file first.'); return; }
    const button = document.querySelector('#importPreviewSection button[onclick="confirmImport()"]');
    if (button) { button.disabled = true; button.textContent = 'Importing…'; }
    try {
      if (pendingType === 'students') {
        const rows = pendingRows.map(function (row) {
          const copy = Object.assign({}, row);
          delete copy.school_id;
          return Object.assign({ school_id: row.school_id }, copy);
        });
        for (let i = 0; i < rows.length; i += 100) {
          const result = await client().from('students').upsert(rows.slice(i, i + 100), { onConflict: 'school_id' });
          if (result.error) throw result.error;
        }
        const mapped = pendingRows.map(function (row) {
          return { id: row.school_id, name: row.full_name, gender: row.gender === 'female' ? 'F' : row.gender === 'male' ? 'M' : row.gender,
            class: row.class_name, level: /^S[123]/i.test(row.class_name) ? 'O-Level' : 'A-Level',
            disciplinePoints: 40, academicScore: 0, attendanceRate: 0, absences: 0, status: 'Active', photo: null, isDemo: false };
        });
        const existing = new Set((window.schoolData.students || []).map(function (s) { return s.id; }));
        mapped.forEach(function (student) {
          if (existing.has(student.id)) window.schoolData.students = window.schoolData.students.map(function (s) { return s.id === student.id ? Object.assign({}, s, student) : s; });
          else window.schoolData.students.push(student);
        });
        if (typeof window.saveStudents === 'function') window.saveStudents();
        if (typeof window.computeClassStats === 'function') window.computeClassStats();
      } else {
        const ids = Array.from(new Set(pendingRows.map(function (r) { return r.school_id; })));
        const found = [];
        for (let i = 0; i < ids.length; i += 100) {
          const result = await client().from('students').select('id,school_id').in('school_id', ids.slice(i, i + 100));
          if (result.error) throw result.error;
          found.push.apply(found, result.data || []);
        }
        const bySchoolId = new Map(found.map(function (s) { return [s.school_id, s.id]; }));
        const missing = ids.filter(function (id) { return !bySchoolId.has(id); });
        if (missing.length) throw new Error('These student IDs do not exist yet: ' + missing.slice(0, 10).join(', ') + (missing.length > 10 ? '…' : '') + '. Import students first.');
        if (pendingType === 'discipline') {
          const records = pendingRows.map(function (r) { return {
            student_id: bySchoolId.get(r.school_id), points_change: r.points_change, note: r.note,
            term: r.term, academic_year: r.academic_year, category: r.category, source_key: r.source_key, created_by: activeUser.id
          }; });
          for (let i = 0; i < records.length; i += 100) {
            const result = await client().from('discipline_records').upsert(records.slice(i, i + 100), {
              onConflict: 'student_id,source_key', ignoreDuplicates: true
            });
            if (result.error) throw result.error;
          }
        } else {
          const records = pendingRows.map(function (r) { return {
            student_id: bySchoolId.get(r.school_id), subject: r.subject, assessment: r.assessment,
            marks_obtained: r.marks_obtained, marks_possible: r.marks_possible, term: r.term,
            academic_year: r.academic_year, imported_by: activeUser.id
          }; });
          for (let i = 0; i < records.length; i += 100) {
            const result = await client().from('academic_results').upsert(records.slice(i, i + 100), {
              onConflict: 'student_id,subject,assessment,term,academic_year'
            });
            if (result.error) throw result.error;
          }
          const academicRows = [];
          for (let i = 0; i < found.length; i += 100) {
            const result = await client().from('academic_results').select('student_id,marks_obtained,marks_possible')
              .in('student_id', found.slice(i, i + 100).map(function (s) { return s.id; }));
            if (result.error) throw result.error;
            academicRows.push.apply(academicRows, result.data || []);
          }
          const totals = new Map();
          academicRows.forEach(function (r) {
            const total = totals.get(r.student_id) || { obtained: 0, possible: 0 };
            total.obtained += Number(r.marks_obtained); total.possible += Number(r.marks_possible);
            totals.set(r.student_id, total);
          });
          const scoresBySchoolId = new Map();
          found.forEach(function (student) {
            const total = totals.get(student.id);
            if (total && total.possible > 0) scoresBySchoolId.set(student.school_id, Math.round(total.obtained * 100 / total.possible));
          });
          window.schoolData.students = (window.schoolData.students || []).map(function (student) {
            return scoresBySchoolId.has(student.id) ? Object.assign({}, student, { academicScore: scoresBySchoolId.get(student.id) }) : student;
          });
          if (typeof window.saveStudents === 'function') window.saveStudents();
          if (typeof window.computeClassStats === 'function') window.computeClassStats();
        }
      }
      pendingRows = []; pendingType = '';
      document.getElementById('bulkImportArea').value = '';
      document.getElementById('importPreviewSection').classList.add('hidden');
      await refreshClassOptions();
      await refreshAttendanceStats();
      say('Import completed successfully.');
    } catch (error) {
      console.error('Bulk import failed:', error);
      say('Import failed: ' + error.message);
    } finally {
      if (button) { button.disabled = false; button.textContent = 'Confirm Import'; }
    }
  };

  window.clearImport = function () {
    document.getElementById('bulkImportArea').value = '';
    const file = document.getElementById('bulkImportFile');
    if (file) file.value = '';
    document.getElementById('importPreviewSection').classList.add('hidden');
    pendingRows = []; pendingType = '';
  };

  window.deleteDemoStudents = async function () {
    if (!activeUser || !activeProfile || activeProfile.role !== 'headmaster') {
      say('Only the signed-in headmaster can remove demo students.'); return;
    }
    const ok = window.confirm('Delete all students marked as DEMO and their attendance, discipline and academic test records? Real student records will not be selected. This cannot be undone.');
    if (!ok) return;
    try {
      const selected = await client().from('students').select('id,school_id').eq('is_demo', true);
      if (selected.error) throw selected.error;
      const ids = (selected.data || []).map(function (s) { return s.id; });
      if (ids.length) {
        for (let i = 0; i < ids.length; i += 100) {
          const batch = ids.slice(i, i + 100);
          for (const table of ['attendance_records', 'discipline_records', 'academic_results']) {
            const deleted = await client().from(table).delete().in('student_id', batch);
            if (deleted.error) throw deleted.error;
          }
          const removed = await client().from('students').delete().in('id', batch).eq('is_demo', true);
          if (removed.error) throw removed.error;
        }
      }
      window.schoolData.students = (window.schoolData.students || []).filter(function (s) { return s.isDemo !== true; });
      if (typeof window.saveStudents === 'function') window.saveStudents();
      if (typeof window.computeClassStats === 'function') window.computeClassStats();
      await refreshClassOptions();
      await loadAtt();
      await refreshAttendanceStats();
      say('Removed ' + ids.length + ' demo student record(s). Real student records were left untouched.');
    } catch (error) {
      console.error('Demo cleanup failed:', error);
      say('Demo cleanup did not finish: ' + error.message);
    }
  };

  document.addEventListener('DOMContentLoaded', function () {
    const file = document.getElementById('bulkImportFile');
    if (file) file.addEventListener('change', function () {
      const selected = file.files && file.files[0];
      if (!selected) return;
      if (!/\.csv$/i.test(selected.name)) { say('For now, please use a CSV file exported from Excel or Google Sheets.'); file.value = ''; return; }
      const reader = new FileReader();
      reader.onload = function () { document.getElementById('bulkImportArea').value = String(reader.result || ''); };
      reader.onerror = function () { say('Could not read that file. Try saving it as CSV first.'); };
      reader.readAsText(selected);
    });
    const period = document.getElementById('atperiod');
    const date = document.getElementById('atdate');
    const today = new Date().toISOString().slice(0, 10);
    if (date && !date.value) date.value = today;
    if (period) period.addEventListener('change', function () { loadAtt(); });
    if (date) date.addEventListener('change', function () { loadAtt(); });
    const type = document.getElementById('bulkImportType');
    if (type) setImportType();
  });
})();

(function(root){
'use strict';
function mountToday(host,api,roles,current,navigate,day){
 let stopped=false,busy=false,generation=0,lastScan=0,activeCategory=null,history=false;
 const valid=()=>!stopped&&current();
 const has=(...wanted)=>roles.some(r=>wanted.includes(r));
 const el=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
 const button=(text,fn)=>{const b=el('button',text);b.type='button';b.onclick=fn;return b;};
 const rpc=(name,args={})=>api('/rest/v1/rpc/'+name,{method:'POST',body:JSON.stringify(args)});
 const title=el('h2','Today'),status=el('p'),cards=el('div'),detail=el('section');
 const illustration=el('img');illustration.src='../assets/school-day.svg';illustration.alt='';illustration.width=180;illustration.height=150;illustration.className='today-illustration';
 status.setAttribute('role','status');cards.className='today-grid';detail.hidden=true;
 host.replaceChildren();host.append(illustration,title,el('p','What needs attention, from the school records. Open concerns stay listed until reviewed. No marks, points or promotion decisions are changed here.'),status);
 const refreshButton=button('Refresh Today',()=>refresh(true));host.append(refreshButton,cards,detail);
 const say=text=>{if(valid())status.textContent=text;};
 const focusDetail=()=>{detail.hidden=false;detail.tabIndex=-1;detail.focus?.();detail.scrollIntoView?.({block:'start'});};
 function evidenceText(c){
  const e=c.evidence;
  if(c.category==='attendance')return e.absent_days+' consecutive recorded main absences · '+e.first_day+' to '+e.last_day+'. Unsubmitted days are unknown.';
  if(c.category==='academic')return Number(e.percentage).toLocaleString(undefined,{maximumFractionDigits:4})+'% · '+e.term+' · Recorded '+e.recorded_on+' · Review threshold: below 50%.';
  return e.official_total+'/40 official discipline total · Snapshot '+e.snapshot_date+' · Review threshold: below 20/40.';
 }
 async function showConcerns(category,moveFocus=true){
  const version=++generation;activeCategory=category;
  try{
   const cases=await rpc('school_followup_details',{category_filter:category,include_closed:history});
   if(!valid()||version!==generation)return;
   detail.replaceChildren();detail.append(el('h3',category.charAt(0).toUpperCase()+category.slice(1)+' follow-ups'));
   const toggle=el('label'),check=el('input');check.type='checkbox';check.checked=history;
   check.onchange=()=>{history=check.checked;showConcerns(category,false);};toggle.append(check,el('span','Include reviewed cases'));toggle.className='inline-choice';detail.append(toggle,el('p','Showing up to 200 cases. Numbers are read-only and remain tied to the recorded source.'));
   if(!cases.length)detail.append(el('p','No follow-ups in this view.'));
   cases.forEach(c=>{
    const row=el('article');row.className='row';row.append(el('h4',c.full_name+' · '+c.student_id),el('p',c.class_name+' · '+(c.status==='open'?'Needs review':'Reviewed')),el('p',evidenceText(c)));
    row.append(el('small',c.evidence.rule));
    const sources=el('details'),summary=el('summary','View source references');sources.append(summary);
    if(c.category==='attendance')c.evidence.sources.forEach(s=>sources.append(el('p',s.date+' · Attendance record '+s.record_id)));
    else {sources.append(el('p','Source batch: '+c.evidence.batch_id));if(c.category==='academic')c.evidence.sources.forEach(id=>sources.append(el('p','Subject record: '+id)));}
    row.append(sources);
    const historyBox=el('div');row.append(button('View review history',async()=>{
     if(!valid())return;try{const events=await rpc('school_concern_history',{concern_id:c.id});if(!valid()||version!==generation)return;
      historyBox.replaceChildren();historyBox.append(el('h4','Review history (latest 100)'));
      events.forEach(e=>historyBox.append(el('p',new Date(e.created_at).toLocaleString()+' · '+({concern_detected:'Detected',concern_reviewed:'Reviewed',concern_reopened:'Reopened'}[e.action]||e.action)+' · Account '+e.actor_user_id+(e.details.review_note?' · '+e.details.review_note:'')+(e.details.reason?' · '+e.details.reason:''))));
      if(!events.length)historyBox.append(el('p','No review history yet.'));
     }catch(error){say(error.message);}
    }),historyBox);
    if(c.status==='closed')row.append(el('p','Reviewed '+new Date(c.reviewed_at).toLocaleString()+' · Account '+c.reviewed_by+' · '+c.review_note));
    const canReview=c.category==='academic'?has('dean'):has('discipline_officer');
    if(c.status==='open'&&canReview){
     const form=el('form'),label=el('label','What did you review or arrange?'),note=el('textarea');note.required=true;note.maxLength=1000;label.append(note);
     const save=el('button','Mark reviewed');save.type='submit';form.append(label,save);
     form.onsubmit=async event=>{event.preventDefault();if(!valid()||save.disabled)return;save.disabled=true;try{
      await rpc('review_school_concern',{concern_id:c.id,expected_revision:c.revision,note:note.value});if(!valid())return;
      await showConcerns(category,false);await refresh(false);say('Review saved. An attendance case can reopen if another main absence is recorded before the student returns.');
     }catch(error){say(error.message);}finally{save.disabled=false;}};row.append(form);
    }else if(c.status==='open')row.append(el('p',c.category==='academic'?'The Dean of Studies reviews this case.':'A Discipline Officer reviews this case.'));
    detail.append(row);
   });if(moveFocus)focusDetail();
  }catch(error){say(error.message);}
 }
 async function showUploads(kind){
  const version=++generation;activeCategory=null;
  try{const batches=await rpc('school_upload_issues',{kind});if(!valid()||version!==generation)return;
   detail.replaceChildren();detail.append(el('h3','Uploads needing attention'),el('p','Up to 100 source batches. This view shows the recorded status; the connected import correction workflow is still being built.'));
   if(!batches.length)detail.append(el('p','No uploads need attention.'));
   batches.forEach(b=>{const row=el('article');row.className='row';row.append(el('h4',b.source_filename||'Unnamed source'),el('p',b.status+' · '+b.row_count+' rows · '+new Date(b.created_at).toLocaleString()),el('small','Batch '+b.id));detail.append(row);});focusDetail();
  }catch(error){say(error.message);}
 }
 async function openTask(task){
  if(!valid())return;
  if(task.action==='concerns')return showConcerns(task.category);
  if(task.action==='uploads')return showUploads(task.import_type);
  try{await navigate(task);}catch(error){say(error.message);}
 }
 async function refresh(scan=false){
  if(!valid()||busy)return;busy=true;refreshButton.disabled=true;const selectedDay=day();
  try{
   if(scan&&has('headmaster','dean','discipline_officer')){await rpc('refresh_school_concerns');lastScan=Date.now();}
   const data=await rpc('school_today',{day:selectedDay});if(!valid()||selectedDay!==day())return;
   cards.replaceChildren();
   data.tasks.forEach(task=>{const card=el('article');card.className='today-card';card.append(el('h3',task.title),el('p',String(task.count)+(task.kind==='missing_attendance'?' class':' pending')),
    button(({attendance:'Open attendance',explanations:'Review explanations',roster:'Review corrections',notices:'Open notifications',concerns:'Open follow-ups',uploads:'View upload details'})[task.action]||'Open',()=>openTask(task)));cards.append(card);});
   if(!data.tasks.length)cards.append(el('p',has('student')?'No pending tasks here. School announcements are available in the School desk.':'No pending tasks were found in the recorded data. Missing school data is not proof that everything has been completed.'));
   say('Attendance date: '+data.day+' · Open follow-ups: current · Checked '+new Date(data.checked_at).toLocaleTimeString());
  }catch(error){say('Could not refresh Today. The previous view may be out of date. '+error.message);}finally{busy=false;if(valid())refreshButton.disabled=false;}
 }
 const timer=setInterval(()=>{if(valid()&&!document.hidden)refresh(Date.now()-lastScan>=30000);},5000);
 const visibility=()=>{if(!document.hidden)refresh(true);};document.addEventListener?.('visibilitychange',visibility);
 refresh(true);
 return {refresh:()=>refresh(true),dispose(){stopped=true;generation++;clearInterval(timer);document.removeEventListener?.('visibilitychange',visibility);host.replaceChildren();}};
}
if(typeof module!=='undefined'&&module.exports)module.exports={mountToday};else root.mountToday=mountToday;
})(typeof window!=='undefined'?window:globalThis);

(function(root){
function mountStudentRecords(host,api,current){
 let stopped=false,busy=false;const valid=()=>!stopped&&current();
 const el=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
 const heading=el('h2','My records'),status=el('p'),content=el('div'),refresh=el('button','Refresh my records');refresh.type='button';status.setAttribute('role','status');
 host.replaceChildren();host.append(heading,el('p','Only your linked school record is shown. Missing information means Not recorded, not zero.'),refresh,status,content);
 async function load(){if(!valid()||busy)return;busy=true;refresh.disabled=true;try{
  const data=await api('/rest/v1/rpc/my_student_records',{method:'POST',body:'{}'});if(!valid())return;content.replaceChildren();
  if(!data.student){content.append(el('p','Your account is not linked to a student record yet. Ask the school administrator.'));return;}
  content.append(el('h3',data.student.full_name),el('p',data.student.student_id+' · '+(data.student.class_name||'Class not recorded')));
  content.append(el('h3','Academic results'),el('p','Latest 200 recorded subject rows. Full named result releases and rankings are still being connected.'));
  if(!data.academic.length)content.append(el('p','Not recorded.'));
  data.academic.forEach(r=>{const row=el('article');row.className='row';row.append(el('strong',r.term+' · '+r.subject),el('p',r.score===null?'Not recorded':r.score+' / '+r.maximum_score),el('small',r.recorded_on));content.append(row);});
  content.append(el('h3','Official discipline total'),el('p',data.discipline?data.discipline.official_total+' / 40 · '+data.discipline.snapshot_date:'Not recorded.'));
  data.discipline_events.forEach(r=>content.append(el('p',r.event_date+' · '+r.reason+(r.source_recorded_by?' · '+r.source_recorded_by:''))));
  content.append(el('h3','Main attendance'),el('p','Latest 100 recorded main marks. Follow-up lessons are excluded.'));
  if(!data.attendance.length)content.append(el('p','Not recorded.'));
  data.attendance.forEach(r=>content.append(el('p',r.attendance_date+' · '+({present:'Present',late:'Late (counts as attended)',absent:'Absent',excused:'Excused'})[r.status])));
  status.textContent='School records refreshed.';
 }catch(error){if(valid())status.textContent='Could not load your records. '+error.message;}finally{busy=false;if(valid())refresh.disabled=false;}}
 refresh.onclick=load;const ready=load();return{ready,dispose(){stopped=true;host.replaceChildren();}};
}
if(typeof module!=='undefined'&&module.exports)module.exports={mountStudentRecords};else root.mountStudentRecords=mountStudentRecords;
})(typeof window!=='undefined'?window:globalThis);

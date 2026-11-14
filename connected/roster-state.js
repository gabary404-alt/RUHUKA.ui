(function(root){
'use strict';
function reconcileRoster(previous,latest,marks){const fingerprint=rows=>JSON.stringify(rows.map(r=>[r.student_id,r.full_name]).sort((a,b)=>a[0].localeCompare(b[0])));return{changed:fingerprint(previous)!==fingerprint(latest),marks:latest.map(r=>({student_id:r.student_id,status:marks.find(m=>m.student_id===r.student_id)?.status||''})),added:latest.filter(r=>!previous.some(p=>p.student_id===r.student_id)).length,removed:previous.filter(p=>!latest.some(r=>r.student_id===p.student_id)).length};}
if(typeof module!=='undefined'&&module.exports)module.exports={reconcileRoster};else root.rosterState={reconcileRoster};
})(typeof window!=='undefined'?window:globalThis);

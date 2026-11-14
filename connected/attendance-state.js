(function(root){
function reviewMarks(marks){const counts={present:0,absent:0,late:0,excused:0};const ids=new Set();for(const mark of marks){if(!mark.student_id||ids.has(mark.student_id)||!Object.hasOwn(counts,mark.status))throw Error('Mark every student exactly once before reviewing.');ids.add(mark.student_id);counts[mark.status]++;}if(!marks.length)throw Error('No students loaded.');return {counts,total:marks.length,signature:JSON.stringify(marks)};}
async function existingRegister(api,cls,day){const rows=await api('/rest/v1/attendance_sessions?select=id,submitted_at&class_name=eq.'+encodeURIComponent(cls)+'&attendance_date=eq.'+encodeURIComponent(day)+'&attendance_type=eq.main&status=eq.submitted&limit=1');return rows[0]||null;}
const functions={reviewMarks,existingRegister};if(typeof module!=='undefined'&&module.exports)module.exports=functions;else root.attendanceState=functions;
})(typeof window!=='undefined'?window:globalThis);

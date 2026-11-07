(function(root){
'use strict';
function createAttendanceDrafts(storage){
 const key=(user,cls,day)=>'ruhuka-attendance-draft-v1:'+JSON.stringify([user,cls,day]);
 function validate(rows){if(!Array.isArray(rows)||rows.some(r=>!r||typeof r.student_id!=='string'||!['','present','absent','late','excused'].includes(r.status)))throw Error('The saved draft could not be read.');return rows;}
 return Object.freeze({
  load(user,cls,day){const raw=storage.getItem(key(user,cls,day));if(!raw)return [];const data=JSON.parse(raw);return validate(data.marks);},
  save(user,cls,day,marks){validate(marks);storage.setItem(key(user,cls,day),JSON.stringify({marks,updatedAt:new Date().toISOString()}));},
  remove(user,cls,day){storage.removeItem(key(user,cls,day));}
 });
}
if(typeof module!=='undefined'&&module.exports)module.exports={createAttendanceDrafts};else root.createAttendanceDrafts=createAttendanceDrafts;
})(typeof window!=='undefined'?window:globalThis);

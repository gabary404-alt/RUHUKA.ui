const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../script.js'),'utf8');
function setup(records){
 const messages=[]; const context={window:{schoolData:{attendanceRecords:records}},toast:x=>messages.push(x),document:{getElementById:id=>({value:{atclass:'S1',atdate:'2026-11-02',atperiod:'Main daily attendance'}[id]}),querySelectorAll:()=>[{dataset:{studentId:'1',status:'present'}}]}};
 vm.createContext(context);
 vm.runInContext(source.slice(source.indexOf('function subAtt()'),source.indexOf('let dmVal =')),context);
 return {context,messages};
}
test('follow-up absences never change official totals',()=>{
 const {context}=setup([{studentId:'1',period:'Main daily attendance',status:'present'},{studentId:'1',period:'Follow-up lesson',status:'absent'}]);
 const student={id:'1',absences:0};context.recalculateAttendanceStats(student);
 assert.equal(student.absences,0);assert.equal(student.attendanceRate,100);
});
test('duplicate main submission stops before any records change',()=>{
 const records=[{studentId:'1',className:'S1',date:'2026-11-02',period:'Morning',status:'absent'}];
 const before=JSON.stringify(records);const {context,messages}=setup(records);context.subAtt();
 assert.match(messages[0],/already been submitted/);assert.equal(JSON.stringify(records),before);
});
test('recalculation discards stale cached demo totals and unknown rate',()=>{const {context}=setup([{studentId:'1',period:'Main daily attendance',status:'excused'},{studentId:'1',period:'Follow-up lesson',status:'absent'}]);const student={id:'1',absences:99,attendanceBaseAbsences:99,attendanceRate:95};context.recalculateAttendanceStats(student);assert.equal(student.absences,0);assert.equal(student.attendanceRate,null);});

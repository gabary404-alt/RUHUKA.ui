const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const r={id:'release',release_name:'Tests',class_name:'S1',academic_year:'2026',recorded_on:'2026-11-07',subjects:[{name:'Math',maximum:40},{name:'English',maximum:60}],marks:{Math:0,English:null},overall:50,calculated:null,rank:2};
test('student print rows use each recorded maximum, preserving missing and zero marks',()=>{const {reportRows}=require('../connected/student-report');assert.deepEqual(reportRows(r),[{subject:'Math',maximum:40,mark:0,percentage:0},{subject:'English',maximum:60,mark:null,percentage:null}]);});
test('student print is one release, saved rank and honest unofficial status without invented annual marks or QR',()=>{const n=(tag,text)=>({tag,textContent:text,children:[],append(...x){this.children.push(...x)}});const c={module:{exports:{}},document:{createElement:n},Date};vm.createContext(c);vm.runInContext(fs.readFileSync('connected/student-report.js','utf8'),c);const paper=c.module.exports.createStudentReport({student_id:'001',full_name:'Synthetic student'},r);const walk=n=>[n,...n.children.flatMap(walk)];const text=walk(paper).map(n=>n.textContent).join(' ');assert.match(text,/not the school’s official annual report/);assert.match(text,/Class position when published: 2/);assert.match(text,/Not recorded/);assert.match(text,/Overall supplied by the school: 50%/);assert.ok(!text.includes('signature'));assert.equal(paper.className,'report-print student-report-print');});

test('failed print removes the temporary student copy immediately',()=>{let removed=0;const make=()=>({children:[],append(...x){this.children.push(...x)},remove(){removed++}});const c={module:{exports:{}},document:{createElement:make,getElementById(){return null},body:{append(){}}},Date,window:{print(){throw Error('blocked')}}};vm.createContext(c);vm.runInContext(fs.readFileSync('connected/student-report.js','utf8'),c);assert.throws(()=>c.module.exports.printStudentReport({full_name:'Synthetic',student_id:'test'},r),/Printing could not open/);assert.equal(removed,1);});

test('student print handles omitted subject marks and excludes staff review text',()=>{
 const {reportRows,createStudentReport}=require('../connected/student-report');
 const release={...r,marks:{Math:0},warnings:[{}],override_reason:'Private review note'};
 assert.equal(reportRows(release)[1].mark,null);
 const original=global.document;
 global.document={createElement:tag=>({tag,children:[],append(...nodes){this.children.push(...nodes)}})};
 try{
  const paper=createStudentReport({student_id:'001',full_name:'Synthetic student'},release);
  const walk=n=>[n,...n.children.flatMap(walk)];
  const text=walk(paper).map(n=>n.textContent).join(' ');
  assert.doesNotMatch(text,/Private review note/);
  assert.match(text,/Subject marks/);
 }finally{global.document=original;}
});

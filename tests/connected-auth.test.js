const {test}=require('node:test');const assert=require('node:assert/strict');const vm=require('node:vm');const fs=require('node:fs');const path=require('node:path');
function setup(replies){
 const nodes={};const create=()=>({value:'',hidden:false,disabled:false,textContent:'',children:[],classList:{toggle(){}},append(x){this.children.push(x)},replaceChildren(){this.children=[]},setAttribute(){},querySelectorAll(){return []}});
 const document={hidden:false,getElementById(id){return nodes[id]||(nodes[id]=create())},createElement:create};const calls=[];
 const context={localStorage:{getItem(){return null},setItem(){},removeItem(){}},document,window:{createAttendanceDrafts:require('../connected/drafts.js').createAttendanceDrafts,RUHUKA_CONFIG:{url:'https://test.invalid',key:'publishable'}},Intl,Date,AbortSignal,setInterval(){},fetch:async(url,options)=>{calls.push({url,options});const r=replies.shift();if(!r)throw Error('Unexpected request');return {ok:r.ok!==false,status:r.status||200,json:async()=>r.data}}};
 vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(__dirname,'../connected/attendance.js'),'utf8'),context);document.getElementById('email').value='staff@example.test';document.getElementById('password').value='test-password';return {nodes,calls};
}
test('failed login keeps real workspace closed and clears password',async()=>{
 const {nodes,calls}=setup([{ok:false,status:400,data:{msg:'Invalid login credentials'}}]);const button={};await nodes['login-form'].onsubmit({preventDefault(){},submitter:button});assert.equal(nodes.workspace.hidden,true);assert.equal(nodes.password.value,'');assert.match(nodes.notice.textContent,/Invalid login/);assert.equal(calls.length,1);assert.equal(button.disabled,false);
});
test('account with no active staff role is rejected before school data loads',async()=>{
 const {nodes,calls}=setup([{data:{access_token:'session',user:{id:'u'}}},{data:[{is_active:true,display_name:'Test'}]},{data:[{role:'student'}]}]);await nodes['login-form'].onsubmit({preventDefault(){},submitter:{}});assert.equal(nodes.workspace.hidden,true);assert.match(nodes.notice.textContent,/no active school staff access/);assert.equal(calls.length,3);
});
test('officer login uses database roles and loads shared overview',async()=>{
 const {nodes,calls}=setup([{data:{access_token:'session',user:{id:'u'}}},{data:[{is_active:true,display_name:'Test Officer'}]},{data:[{role:'discipline_officer'}]},{data:[]},{data:[{class_name:'S1',session_id:null}]}]);await nodes['login-form'].onsubmit({preventDefault(){},submitter:{}});assert.equal(nodes.workspace.hidden,false);assert.equal(nodes['submit-panel'].hidden,true);assert.match(nodes.identity.textContent,/Test Officer/);assert.match(nodes.overview.children[0].children[0].textContent,/Not submitted/);assert.ok(calls.at(-1).url.endsWith('/rpc/main_attendance_overview'));
});
test('expired access token renews once and retries overview using new token',async()=>{
 const {nodes,calls}=setup([{data:{access_token:'old',refresh_token:'refresh-secret',user:{id:'u'}}},{data:[{is_active:true}]},{data:[{role:'discipline_officer'}]},{data:[]},{ok:false,status:401,data:{message:'expired'}},{data:{access_token:'new',refresh_token:'next'}},{data:[]}]);await nodes['login-form'].onsubmit({preventDefault(){},submitter:{}});assert.equal(nodes.workspace.hidden,false);const renewal=calls.find(c=>c.url.endsWith('grant_type=refresh_token'));assert.ok(renewal);assert.equal(JSON.parse(renewal.options.body).refresh_token,'refresh-secret');assert.equal(calls.at(-1).options.headers.Authorization,'Bearer new');
});
test('rejected renewal returns to sign-in and preserves a visible draft reminder',async()=>{
 const {nodes}=setup([{data:{access_token:'old',refresh_token:'refresh-secret',user:{id:'u'}}},{data:[{is_active:true}]},{data:[{role:'discipline_officer'}]},{data:[]},{ok:false,status:401,data:{message:'expired'}},{ok:false,status:400,data:{message:'refresh rejected'}}]);await nodes['login-form'].onsubmit({preventDefault(){},submitter:{}});assert.equal(nodes.workspace.hidden,true);assert.match(nodes.notice.textContent,/session expired.*saved draft/s);
});

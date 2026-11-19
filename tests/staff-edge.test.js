const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
function setup(responses,enabled=true,origin='https://ruhukaui.vercel.app',backend='https://jsqiqxflgokfdooogcst.supabase.co'){let handler;const calls=[];const c={Deno:{env:{get:k=>({SUPABASE_URL:backend,SUPABASE_ANON_KEY:'public',SUPABASE_SERVICE_ROLE_KEY:'server-secret',RUHUKA_STAFF_INVITES_ENABLED:enabled?'true':'false'})[k]},serve:fn=>handler=fn},Request,Response,AbortSignal,fetch:async(url,options)=>{calls.push({url,options});const r=responses.shift();if(!r)throw Error('Unexpected request');return new Response(JSON.stringify(Object.hasOwn(r,'body')?r.body:{}),{status:r.status||200});}};vm.createContext(c);vm.runInContext(fs.readFileSync('supabase/functions/staff-accounts/index.ts','utf8'),c);return{calls,send:(data,auth=true)=>handler(new Request('https://test.invalid/functions/v1/staff-accounts',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',...(auth?{Authorization:'Bearer user-token'}:{})},body:JSON.stringify(data)}))};}
const input={action:'invite',email:'staff@example.test',display_name:'Test teacher',roles:['teacher']};
test('staff invitation rejects missing authentication and non-Headmaster before admin call',async()=>{const a=setup([]);assert.equal((await a.send(input,false)).status,401);assert.equal(a.calls.length,0);const b=setup([{body:{id:'u'}},{status:403}]);assert.equal((await b.send(input)).status,403);assert.ok(b.calls.every(c=>c.options.headers.Authorization!=='Bearer server-secret'));});
test('staff invitation rejects privilege injection and existing accounts without sending',async()=>{const a=setup([{},{}]);assert.equal((await a.send({...input,roles:['headmaster']})).status,400);assert.equal(a.calls.length,2);const b=setup([{},{},{body:'existing'}]);assert.equal((await b.send(input)).status,409);assert.equal(b.calls.length,3);});
test('successful invite uses admin key only for Auth invite and user permission for role grant',async()=>{const a=setup([{},{},{body:null},{body:{id:'new-user'}},{body:{saved:true}}]);const r=await a.send(input);assert.equal(r.status,200);assert.equal(a.calls.filter(c=>c.options.headers.Authorization==='Bearer server-secret').length,1);assert.ok(a.calls[3].url.includes('/auth/v1/invite?redirect_to='));assert.ok(!a.calls[3].url.includes('staff@example'));assert.equal(a.calls[4].options.headers.Authorization,'Bearer user-token');assert.deepEqual(JSON.parse(a.calls[4].options.body),{target_user:'new-user',display_name:'Test teacher',staff_roles:['teacher'],enabled:true});assert.ok(!(await r.text()).includes('server-secret'));});
test('partial account setup says invite was sent rather than claiming full success',async()=>{const a=setup([{},{},{body:null},{body:{id:'new-user'}},{status:403}]);const r=await a.send(input);assert.equal(r.status,409);assert.match((await r.json()).message,/invitation was sent.*access was not granted/i);});

test('live invite gate prevents email until setup delivery is accepted',async()=>{const a=setup([{},{}],false);const r=await a.send(input);assert.equal(r.status,503);assert.equal(a.calls.length,2);assert.ok(a.calls.every(c=>!c.url.includes('/invite')));});

test('Headmaster can generate a private link without SMTP or sending email',async()=>{
 const origin='https://ruhuka-test-izere-osees-projects.vercel.app';
 const a=setup([{},{},{body:null},{body:{id:'new-user',hashed_token:'example_token_123456789'}},{}],false,origin,'https://utbgxbweuustxmacpcuj.supabase.co');
 const response=await a.send({...input,action:'invite_link'});
 assert.equal(response.status,200);
 assert.equal((await response.json()).setup_url,origin+'/connected/account.html#type=invite&token_hash=example_token_123456789');
 assert.match(a.calls[3].url,/\/auth\/v1\/admin\/generate_link/);
 assert.equal(JSON.parse(a.calls[3].options.body).type,'invite');
 assert.equal(a.calls[4].options.headers.Authorization,'Bearer user-token');
 assert.ok(a.calls.every(c=>!c.url.includes('/auth/v1/invite')));
});
test('private links require a Headmaster and matching workspace, and withhold tokens when role assignment fails',async()=>{
 const link={...input,action:'invite_link'};
 const nonHead=setup([{},{status:403}],false);
 assert.equal((await nonHead.send(link)).status,403);
 assert.equal(nonHead.calls.length,2);
 const wrongWorkspace=setup([{},{}],false,'https://ruhuka-test-izere-osees-projects.vercel.app');
 assert.equal((await wrongWorkspace.send(link)).status,403);
 assert.equal(wrongWorkspace.calls.length,2);
 const failed=setup([{},{},{body:null},{body:{id:'new-user',hashed_token:'example_token_123456789'}},{status:403}],false);
 const response=await failed.send(link);
 assert.equal(response.status,409);
 assert.ok(!(await response.text()).includes('example_token'));
});

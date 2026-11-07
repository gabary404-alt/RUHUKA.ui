// No third-party dependencies. Admin credentials stay inside the Edge Function.
Deno.serve(async(req)=>{
 const origin=req.headers.get('Origin')||'';
 const allowed=origin==='https://ruhukaui.vercel.app'||/^https:\/\/ruhuka-[a-z0-9-]+\.vercel\.app$/.test(origin);
 const headers={'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin',...(allowed?{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'authorization,apikey,content-type','Access-Control-Allow-Methods':'POST, OPTIONS'}:{})};
 const reply=(status,data)=>new Response(JSON.stringify(data),{status,headers});
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(req.method!=='POST')return reply(405,{message:'Use POST.'});
 const authorization=req.headers.get('Authorization');if(!authorization?.startsWith('Bearer '))return reply(401,{message:'Sign in again.'});
 if(Number(req.headers.get('content-length')||0)>8192)return reply(413,{message:'Request is too large.'});
 try{
 const url=Deno.env.get('SUPABASE_URL'),key=Deno.env.get('SUPABASE_ANON_KEY'),admin=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
 const userHeaders={apikey:key,Authorization:authorization,'Content-Type':'application/json'};
 const call=async(path,body,privileged=false)=>{const r=await fetch(url+path,{method:'POST',signal:AbortSignal.timeout(20000),headers:privileged?{apikey:admin,Authorization:'Bearer '+admin,'Content-Type':'application/json'}:userHeaders,body:JSON.stringify(body)});let data;try{data=await r.json()}catch{data=null}return{ok:r.ok,status:r.status,data}};
 // Validates the live auth session, not just the signature of a cached JWT.
 const identity=await fetch(url+'/auth/v1/user',{headers:userHeaders,signal:AbortSignal.timeout(10000)});if(!identity.ok)return reply(401,{message:'Sign in again.'});
 const directory=await call('/rest/v1/rpc/staff_directory',{});if(!directory.ok)return reply(403,{message:'Headmaster access required.'});
 const raw=await req.text();if(raw.length>8192)return reply(413,{message:'Request is too large.'});const input=JSON.parse(raw);
 if(input.action!=='invite'||Object.keys(input).some(k=>!['action','email','display_name','roles'].includes(k)))return reply(400,{message:'Invalid staff invitation.'});
 const email=typeof input.email==='string'?input.email.trim().toLowerCase():'';const name=typeof input.display_name==='string'?input.display_name.trim():'';const roles=input.roles;
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254||name.length<1||name.length>160||!Array.isArray(roles)||roles.length<1||roles.length>4||new Set(roles).size!==roles.length||roles.some(r=>!['teacher','discipline_staff','discipline_officer','dean'].includes(r)))return reply(400,{message:'Provide a name, email and valid staff role.'});
 const lookup=await call('/rest/v1/rpc/staff_email_lookup',{email_address:email});if(!lookup.ok)return reply(403,{message:'Account access changed. Sign in again.'});
 // Existing accounts must be reviewed explicitly; invitation retry never changes roles.
 if(lookup.data)return reply(409,{message:'An account already uses this email. Review it in staff accounts; no invitation or role change was made.'});
 const invited=await call('/auth/v1/invite?redirect_to='+encodeURIComponent('https://ruhukaui.vercel.app/connected/account.html'),{email,data:{display_name:name}},true);
 if(!invited.ok)return reply(400,{message:'Invitation could not be sent. Check school email delivery settings and try again.'});
 const id=invited.data?.id;if(!id)return reply(502,{message:'Invitation result could not be confirmed. Ask the administrator to review the account before retrying.'});
 const saved=await call('/rest/v1/rpc/staff_account_save',{target_user:id,display_name:name,staff_roles:roles,enabled:true});
 if(!saved.ok)return reply(409,{message:'The invitation was sent, but school access was not granted. Ask the administrator to review this account. Do not send another invitation.'});
 return reply(200,{saved:true,message:'Invitation sent. The staff member chooses their own password.'});
 }catch{return reply(400,{message:'The request could not be completed. Refresh staff accounts before retrying; do not assume an invitation was not sent.'});}
});

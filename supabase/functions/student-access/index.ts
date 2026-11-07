// Public password/code authentication. Privileged RPCs are service-role only.
// Do not log requests, passwords, setup codes, sessions, private aliases or upstream bodies.
Deno.serve(async req=>{
 const origin=req.headers.get('Origin')||'';
 const allowed=origin==='https://ruhukaui.vercel.app'||/^https:\/\/ruhuka-[a-z0-9-]+-izere-osees-projects\.vercel\.app$/.test(origin);
 const headers={'Content-Type':'application/json','Cache-Control':'no-store','Referrer-Policy':'no-referrer','Vary':'Origin',...(allowed?{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'apikey,content-type','Access-Control-Allow-Methods':'POST, OPTIONS'}:{})};
 const reply=(status,data)=>new Response(JSON.stringify(data),{status,headers});
 if(origin&&!allowed)return reply(403,{message:'Use the school sign-in page.'});
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(req.method!=='POST')return reply(405,{message:'Use POST.'});
 const failed='Student ID, password or school code could not be verified. Check the details or ask the school for help.';
 if(Number(req.headers.get('content-length')||0)>4096)return reply(413,{message:'Request is too large.'});
 try{
  const raw=await req.text();if(raw.length>4096)return reply(413,{message:'Request is too large.'});const data=JSON.parse(raw);
  if(!data||typeof data!=='object'||Array.isArray(data)||Object.keys(data).some(k=>!['action','student_id','password','code'].includes(k))||!['login','redeem'].includes(data.action)||typeof data.student_id!=='string'||!data.student_id.trim()||data.student_id.trim().length>60||typeof data.password!=='string'||data.password.length>128||data.password.length<1)return reply(400,{message:failed});
  const id=data.student_id.trim();const url=Deno.env.get('SUPABASE_URL'),admin=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),key=Deno.env.get('SUPABASE_ANON_KEY');
  if(!url||!admin||!key)return reply(503,{message:'School sign-in is unavailable. Try again later.'});
  const call=async(path,body,method='POST',privileged=true)=>{const r=await fetch(url+path,{method,signal:AbortSignal.timeout(15000),headers:{apikey:privileged?admin:key,...(privileged?{Authorization:'Bearer '+admin}:{}),'Content-Type':'application/json'},body:JSON.stringify(body)});let result;try{result=await r.json()}catch{result=null}return{ok:r.ok,status:r.status,data:result};};
  const rpc=(name,body)=>call('/rest/v1/rpc/'+name,body);
  const rate=await rpc('student_access_rate',{target_student:id});if(!rate.ok)return reply(503,{message:'School sign-in is unavailable. Try again later.'});if(rate.data!==true)return reply(429,{message:'Too many attempts. Wait five minutes, then try again.'});
  if(data.action==='login'){
   const target=await rpc('student_login_target',{target_student:id});if(!target.ok)return reply(503,{message:'School sign-in is unavailable. Try again later.'});
   const auth=await call('/auth/v1/token?grant_type=password',{email:target.data?.email||'invalid-login@students.ruhuka.invalid',password:data.password},'POST',false);
   if(!target.data||!auth.ok||auth.data?.user?.id!==target.data.user_id)return reply(401,{message:failed});
   const fresh=await rpc('student_login_target',{target_student:id});if(!fresh.ok||fresh.data?.user_id!==target.data.user_id)return reply(401,{message:failed});
   return reply(200,{access_token:auth.data.access_token,refresh_token:auth.data.refresh_token,expires_in:auth.data.expires_in,token_type:'bearer',user:{id:auth.data.user.id}});
  }
  const code=typeof data.code==='string'?data.code.replace(/[\s-]/g,'').toUpperCase():'';
  if(!/^[A-F0-9]{32}$/.test(code)||data.password.length<12)return reply(400,{message:'Use the school code and a new password of 12–128 characters.'});
  const claim=await rpc('student_code_consume',{target_student:id,secret:code});if(!claim.ok||!claim.data)return reply(401,{message:failed});
  const c=claim.data;let uid=c.user_id;
  // The code is consumed before Auth changes. An uncertain/failed attempt needs a fresh school code.
  if(uid){const updated=await call('/auth/v1/admin/users/'+encodeURIComponent(uid),{password:data.password,email_confirm:true},'PUT');if(!updated.ok)return reply(409,{message:'The code was used, but the password result could not be confirmed. Try signing in; if it fails, ask the school for a fresh code.'});}
  else{const created=await call('/auth/v1/admin/users',{email:c.alias,password:data.password,email_confirm:true,user_metadata:{display_name:c.full_name}});uid=created.data?.id;if(!created.ok||!uid)return reply(409,{message:'The code was used, but account setup could not finish. Ask the school for a fresh code after five minutes.'});}
  const finished=await rpc('student_code_finish',{code_id:c.code_id,target_user:uid});if(!finished.ok)return reply(409,{message:'The password step finished, but school access could not be confirmed. Ask the Headmaster to review setup; do not assume sign-in is ready.'});
  return reply(200,{saved:true,message:'Your password is set. Sign in with your student ID and new password.'});
 }catch{return reply(503,{message:'The result could not be confirmed. If you used a school code, try signing in before asking for a fresh code. Otherwise try again later.'});}
});

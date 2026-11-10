'use strict';
const {handleChat}=require('./chat-policy.js');

const publicUrl='https://jsqiqxflgokfdooogcst.supabase.co/rest/v1/rpc/';
function services(env,fetchImpl=fetch){
 const key=env.RUHUKA_PUBLIC_SUPABASE_KEY;
 const call=async (name,body)=>{
  if(!key)throw Error('Public API configuration unavailable');
  const response=await fetchImpl(publicUrl+name,{
   method:'POST',
   headers:{apikey:key,'Content-Type':'application/json'},
   body:JSON.stringify(body),
   signal:AbortSignal.timeout(3500),
   cache:'no-store'
  });
  if(!response.ok)throw Error('School API unavailable');
  return response.json();
 };
 return {
  publicInfo:()=>call('school_public_content',{}),
  reserve:async ()=>{
   if(!env.RUHUKA_CHAT_BUDGET_SECRET)throw Error('Chat budget configuration unavailable');
   const allowed=await call('reserve_chat_request',{server_key:env.RUHUKA_CHAT_BUDGET_SECRET});
   if(typeof allowed!=='boolean')throw Error('Invalid budget response');
   return allowed;
  }
 };
}

async function handleConfiguredChat(method,body,env,fetchImpl=fetch){
 return handleChat(method,body,env.LDK_AI_API_KEY,fetchImpl,services(env,fetchImpl));
}

function diagnostic(result,reference,write){
 if(!result.diagnostic)return result.body;
 write(JSON.stringify({event:'ruhuka_chat',reason:result.diagnostic,status:result.status,reference}));
 return {...result.body,reference};
}
module.exports={handleConfiguredChat,diagnostic,services};

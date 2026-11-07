// Wrangler bundles the CommonJS policy into this optional Worker build.
import chatPolicy from './server/chat-policy.js';
export default {
 async fetch(request,env){
  if(new URL(request.url).pathname!=='/api/chat')return env.ASSETS.fetch(request);
  const result=await chatPolicy.handleChat(request.method,request.method==='POST'?await request.text():null,env.LDK_AI_API_KEY);
  return Response.json(result.body,{status:result.status,headers:{'Cache-Control':'no-store',...(result.status===405?{Allow:'POST'}:{})}});
 }
};

// Wrangler bundles the CommonJS policy into this optional Worker build.
import chatServices from './server/chat-services.js';
export default {
 async fetch(request,env){
  if(new URL(request.url).pathname!=='/api/chat')return env.ASSETS.fetch(request);
  const result=await chatServices.handleConfiguredChat(request.method,request.method==='POST'?await request.text():null,env);
  return Response.json(chatServices.diagnostic(result,crypto.randomUUID(),line=>console.warn(line)),{status:result.status,headers:{'Cache-Control':'no-store',...(result.status===405?{Allow:'POST'}:{})}});
 }
};

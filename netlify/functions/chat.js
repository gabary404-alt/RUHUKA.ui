const {handleConfiguredChat,diagnostic}=require('../../server/chat-services.js');
exports.handler=async event=>{
 const result=await handleConfiguredChat(event.httpMethod,event.body,process.env);
 return {statusCode:result.status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...(result.status===405?{Allow:'POST'}:{})},body:JSON.stringify(diagnostic(result,require('node:crypto').randomUUID(),line=>console.warn(line)))};
};

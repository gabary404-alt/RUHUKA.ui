const {handleChat}=require('../../server/chat-policy.js');
exports.handler=async event=>{
 const result=await handleChat(event.httpMethod,event.body,process.env.LDK_AI_API_KEY);
 return {statusCode:result.status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...(result.status===405?{Allow:'POST'}:{})},body:JSON.stringify(result.body)};
};

const {handleChat}=require('../server/chat-policy.js');
module.exports=async function handler(req,res){
 res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST')res.setHeader('Allow','POST');
 const result=await handleChat(req.method,req.body,process.env.LDK_AI_API_KEY);
 return res.status(result.status).json(result.body);
};

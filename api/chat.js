const {randomUUID}=require('node:crypto');
const {handleConfiguredChat,diagnostic}=require('../server/chat-services.js');
module.exports=async function handler(req,res){
 res.setHeader('Content-Type','application/json; charset=utf-8');
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST')res.setHeader('Allow','POST');
 const result=await handleConfiguredChat(req.method,req.body,process.env);
 return res.status(result.status).json(diagnostic(result,randomUUID(),line=>console.warn(line)));
};

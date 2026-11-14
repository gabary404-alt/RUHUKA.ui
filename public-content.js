/* Optional approved public text. Failure leaves the lightweight HTML usable. */
(function(root){
'use strict';
function applyPublicText(document,data){
 if(!data||!Number.isInteger(data.revision)||data.revision<1||!data.content)return false;
 const ids={introduction:'public-introduction',academics:'public-academics',activities:'public-activities',news:'public-news',contact:'public-contact'};
 let updated=false;
 for(const [key,id] of Object.entries(ids)){
  const text=data.content[key],node=document.getElementById(id);
  if(typeof text!=='string'||!text.trim()||text.length>4000||!node)continue;
  node.textContent=text;
  if(key==='news'){
   const section=node.closest?.('[data-public-update]');
   if(section)section.hidden=false;
  }
  document.querySelectorAll?.('[data-public-fallback="'+key+'"]').forEach(fallback=>{fallback.hidden=true;});
  updated=true;
 }
 return updated;
}
async function load(){const config=root.RUHUKA_CONFIG;if(!config||typeof root.fetch!=='function')return;try{const response=await root.fetch(config.url+'/rest/v1/rpc/school_public_content',{method:'POST',headers:{apikey:config.key,'Content-Type':'application/json'},body:'{}',signal:AbortSignal.timeout(4000),cache:'no-store'});if(response.ok)applyPublicText(document,await response.json());}catch{/* Published facts are optional to rendering/navigation; no private data or raw error is logged. */}}
if(typeof module!=='undefined'&&module.exports)module.exports={applyPublicText};else load();
})(typeof window!=='undefined'?window:globalThis);

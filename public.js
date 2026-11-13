/* Public-page behaviour only. School records and portal code load after sign-in. */
(function(){
'use strict';
const root=document.documentElement,themeButton=document.getElementById('themeBtn');
function applyTheme(value){root.dataset.theme=value;themeButton?.setAttribute('aria-label',value==='dark'?'Use light theme':'Use dark theme');}
try{applyTheme(localStorage.getItem('ldk-theme')==='dark'?'dark':'light');}catch{applyTheme('light');}
themeButton?.addEventListener('click',()=>{const value=root.dataset.theme==='dark'?'light':'dark';applyTheme(value);try{localStorage.setItem('ldk-theme',value);}catch{}});
const menu=document.getElementById('site-menu'),menuButton=document.getElementById('menu-button');
function closeMenu(){menu.hidden=true;menuButton.setAttribute('aria-expanded','false');menuButton.setAttribute('aria-label','Open navigation');}
menuButton?.addEventListener('click',()=>{menu.hidden=!menu.hidden;menuButton.setAttribute('aria-expanded',String(!menu.hidden));menuButton.setAttribute('aria-label',menu.hidden?'Open navigation':'Close navigation');});
menu?.addEventListener('click',e=>{if(e.target.closest('a'))closeMenu();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!menu.hidden){closeMenu();menuButton.focus();}});
window.RUHUKA_CONFIG_PUBLIC=true;
window.AI_CONFIG={USE_API:true,API_URL:'/api/chat'};
let loading=null;
window.openAssistant=async function(){
 const button=document.getElementById('ai-fab'),status=document.getElementById('public-status');if(button.disabled)return;button.disabled=true;
 try{
  if(typeof window.toggleAI!=='function'){
   if(!loading)loading=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='chat.js';script.onload=resolve;script.onerror=()=>{script.remove();reject(Error('Could not load the assistant.'));};document.body.append(script);}).catch(error=>{loading=null;throw error;});
   await loading;
  }
  status.textContent='';window.toggleAI();
 }catch{status.textContent='The assistant could not load. Check your connection and try again.';}finally{button.disabled=false;}
};
})();

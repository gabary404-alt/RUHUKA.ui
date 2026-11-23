/* Public-page behaviour only. School records and portal code load after sign-in. */
(function(){
'use strict';
const root=document.documentElement,themeButton=document.getElementById('themeBtn');
function applyTheme(value){root.dataset.theme=value;themeButton?.setAttribute('aria-label',value==='dark'?'Use light theme':'Use dark theme');}
try{applyTheme(localStorage.getItem('ldk-theme')==='dark'?'dark':'light');}catch{applyTheme('light');}
themeButton?.addEventListener('click',()=>{root.classList.add('theme-ready');const value=root.dataset.theme==='dark'?'light':'dark';applyTheme(value);try{localStorage.setItem('ldk-theme',value);}catch{}});
const menu=document.getElementById('site-menu'),menuButton=document.getElementById('menu-button');
function closeMenu(){menu.hidden=true;menuButton.setAttribute('aria-expanded','false');menuButton.setAttribute('aria-label','Open navigation');}
menuButton?.addEventListener('click',()=>{menu.hidden=!menu.hidden;menuButton.setAttribute('aria-expanded',String(!menu.hidden));menuButton.setAttribute('aria-label',menu.hidden?'Open navigation':'Close navigation');});
menu?.addEventListener('click',e=>{if(e.target.closest('a'))closeMenu();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!menu.hidden){closeMenu();menuButton.focus();}});
window.RUHUKA_CONFIG_PUBLIC=true;
})();

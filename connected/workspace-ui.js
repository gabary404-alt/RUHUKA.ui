/* Display guidance only. Authorisation remains in the existing portal and database. */
(function(){
'use strict';
const root=document.documentElement,button=document.getElementById('workspace-theme');
function theme(value){root.dataset.theme=value;button.textContent=value==='dark'?'Light theme':'Dark theme';button.setAttribute('aria-label',value==='dark'?'Use light theme':'Use dark theme');}
try{theme(localStorage.getItem('ldk-theme')==='dark'?'dark':'light');}catch{theme('light');}
button.addEventListener('click',()=>{root.classList.add('theme-ready');const value=root.dataset.theme==='dark'?'light':'dark';theme(value);try{localStorage.setItem('ldk-theme',value);}catch{}});
const tools={
 'open-today':['Today','See missing attendance, recent updates and work needing attention.'],
 'open-attendance':['Attendance','Record attendance or check submitted class registers. Open a register to see who submitted it and any corrections.'],
 'open-school':['School setup & notices','Create classes, set dates, manage student details and read school notices. Open only the task you need.'],
 'open-my-records':['My records','See your own results, attendance and discipline records. Ask staff to correct missing or wrong information.'],
 'open-accounts':['Staff access','Manage staff roles and access. Changing a role changes what that person can see and do.'],
 'open-roster-import':['Import students','Add or update many students from one file. Download the template, fill it in, check the preview, then save.'],
 'open-academics':['Marks & results','Upload a named set of marks, check missing values, then publish results. A blank mark means not recorded; zero is a real mark.'],
 'open-discipline':['Discipline records','Record an incident or import official discipline totals. Keep incidents and official totals separate.'],
 'open-reports':['View & print reports','Choose the class and dates or results release. Load the report before printing or downloading it.'],
 'open-letters':['Class summaries','Prepare a written class summary from recorded attendance, results and discipline. Review the wording before saving.']
};
const intro=document.getElementById('workspace-intro'),nav=document.querySelector('.workspace-nav');
for(const [id,[label,description]] of Object.entries(tools)){const b=document.getElementById(id);b.textContent=label;b.title=description;}
function guide(){const selected=Object.keys(tools).find(id=>document.getElementById(id).getAttribute('aria-current')==='page');intro.replaceChildren();if(!selected)return;const heading=document.createElement('h2'),copy=document.createElement('p');[heading.textContent,copy.textContent]=tools[selected];intro.append(heading,copy);}
new MutationObserver(guide).observe(nav,{subtree:true,attributes:true,attributeFilter:['aria-current']});guide();
})();

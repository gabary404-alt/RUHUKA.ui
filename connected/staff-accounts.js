(function(root){
'use strict';
const labels={teacher:'Teacher',discipline_staff:'Patron / matron',discipline_officer:'Discipline Officer',dean:'Dean of Studies',headmaster:'Headmaster'};
function mountStaffAccounts(host,api,current){let stopped=false;const valid=()=>!stopped&&current();const el=(tag,text)=>{const e=document.createElement(tag);if(text)e.textContent=text;return e};const say=t=>{if(valid())status.textContent=t};const status=el('p');status.setAttribute('role','status');host.append(el('h2','Staff accounts'),el('p','Only the Headmaster manages staff access. Staff choose their own passwords; no password is shown here.'),status);
 const invite=el('details'),summary=el('summary','Invite a staff member'),form=el('form');invite.open=true;invite.append(summary,form);const fields={};for(const [key,label,type]of [['display_name','Full name','text'],['email','Staff email','email']]){const l=el('label',label),i=el('input');i.type=type;i.required=true;i.maxLength=key==='email'?254:160;l.append(i);form.append(l);fields[key]=i;}const roleLabel=el('label','Role'),role=el('select');for(const r of Object.keys(labels).filter(r=>r!=='headmaster')){const o=el('option',labels[r]);o.value=r;role.append(o)}roleLabel.append(role);form.append(roleLabel);const review=el('p'),send=el('button','Review invitation');
 const result=el('div'),setupLabel=el('label','Private setup link'),setupLink=el('input'),emailDraft=el('a','Send invite by email');
 emailDraft.className='button primary';
 result.hidden=true;
 setupLink.readOnly=true;
 setupLabel.append(setupLink);
 result.append(el('p','Send the invitation from your email app, or copy the private setup link for the intended staff member.'),setupLabel,emailDraft);
 const manual=el('button','Create link manually');
 manual.type='button';
 manual.hidden=true;
 form.append(review,send,manual,result);
 if(root.RUHUKA_CONFIG?.staffInvitesEnabled!==true){
  send.disabled=true;
  form.append(el('p','Staff invitations are unavailable in this workspace.'));
 }
 host.append(invite);
 const list=el('div'),refresh=el('button','Refresh staff accounts');
 refresh.type='button';
 refresh.onclick=load;
 host.append(refresh,list);
 let directoryRequest=0;

 function staffDeleteControls(person,card){
  const controls=el('div');
  const open=el('button','Delete account');
  const review=el('div');
  const confirm=el('button','Confirm delete');
  const cancel=el('button','Cancel');
  open.type=confirm.type=cancel.type='button';
  open.setAttribute('aria-label','Delete account for '+(person.display_name||person.email||'this staff member'));
  review.hidden=true;
  review.append(el('p','Delete '+(person.display_name||'this account')+(person.email?' ('+person.email+')':'')+'? This ends school access and removes the account from Staff access. Past school records stay. This cannot be undone here, and the email stays reserved.'),cancel,confirm);
  open.onclick=()=>{open.hidden=true;review.hidden=false;cancel.focus();};
  cancel.onclick=()=>{review.hidden=true;open.hidden=false;open.focus();};
  confirm.onclick=async()=>{
   if(!valid()||confirm.disabled)return;
   cancel.disabled=confirm.disabled=true;
   try{
    const result=await api('/rest/v1/rpc/staff_account_delete',{method:'POST',body:JSON.stringify({target_user:person.id})});
    if(!valid())return;
    if(result?.deleted!==true)throw new Error('Deletion could not be confirmed. Refresh staff accounts before trying again.');
    card.remove();
    refresh.focus();
    say('Staff account deleted. Past school records were kept.');
    await load();
   }catch(e){say(e.message)}finally{cancel.disabled=confirm.disabled=false;}
  };
  controls.append(open,review);
  return controls;
 }

 let reviewed=null;
 function clearLink(){
  result.hidden=true;
  setupLink.value='';
  emailDraft.removeAttribute('href');
 }
 function inviteDetails(){
  return {email:fields.email.value.trim(),display_name:fields.display_name.value.trim(),roles:[role.value]};
 }
 form.oninput=()=>{
  reviewed=null;
  review.textContent='';
  send.textContent='Review invitation';
  manual.hidden=true;
  clearLink();
 };
 form.onsubmit=async event=>{
  event.preventDefault();
  if(root.RUHUKA_CONFIG?.staffInvitesEnabled!==true||send.disabled)return;
  const data=inviteDetails();
  const signature=JSON.stringify(data);
  if(reviewed!==signature){
   clearLink();
   reviewed=signature;
   review.textContent='Email a setup link to '+data.display_name+' ('+data.email+') as '+labels[role.value]+'? This role determines which school records they can access.';
   send.textContent='Send setup link';
   return;
  }
  await submitInvitation(data,'invite');
 };
 manual.onclick=async()=>{
  const data=inviteDetails();
  if(!manual.hidden&&!manual.disabled&&reviewed===JSON.stringify(data))await submitInvitation(data,'invite_link');
 };
 async function submitInvitation(data,action){
  send.disabled=manual.disabled=fields.email.disabled=fields.display_name.disabled=role.disabled=true;
  try{
   const response=await api('/functions/v1/staff-accounts',{method:'POST',body:JSON.stringify({action,...data})});
   if(!valid())return;
   if(response?.saved!==true)throw Error('The invitation could not be confirmed. Refresh staff accounts before trying again.');
   if(action==='invite_link')showManualLink(response.setup_url,data);
   say(action==='invite'?'Setup link sent to '+data.email+'.':response.message);
   manual.hidden=true;
   reviewed=null;
   send.textContent='Review invitation';
   fields.email.value='';
   fields.display_name.value='';
   review.textContent='';
   if(action==='invite'){fields.display_name.focus();}else{setupLink.focus();setupLink.select();}
   await load();
  }catch(error){
   if(!valid())return;
   if(action==='invite'&&(error.code==='staff_email_unavailable'||/^Automatic invitation emails are not enabled/.test(error.message))){
    manual.hidden=false;
    say('Automatic email is not set up for this workspace. You can create a link and send it manually.');
    manual.focus();
   }else say(error.message);
  }finally{send.disabled=manual.disabled=fields.email.disabled=fields.display_name.disabled=role.disabled=false;}
 }
 function showManualLink(value,data){
  const url=new URL(value);
  if(url.origin!==root.location.origin||url.pathname!=='/connected/account.html'||!url.hash.startsWith('#type=invite&token_hash=')){
   throw Error('Could not verify the setup link. Ask the administrator to review the account.');
  }
  setupLink.value=url.href;
  const body='Hello '+data.display_name+',\n\nYou’ve been invited to the Lycée de Kigali staff portal as '+labels[data.roles[0]]+'. Open this private link to choose your password:\n\n'+url.href+'\n\nIf the link has expired, contact the school.';
  emailDraft.href='mailto:'+encodeURIComponent(data.email)+'?subject='+encodeURIComponent('Lycée de Kigali staff invitation')+'&body='+encodeURIComponent(body);
  result.hidden=false;
 }
 async function load(){const request=++directoryRequest;try{const people=await api('/rest/v1/rpc/staff_directory',{method:'POST',body:'{}'});if(!valid()||request!==directoryRequest)return;list.replaceChildren();for(const p of people){const card=el('article');card.className='row';card.append(el('h3',p.display_name||'Unnamed account'),el('p',(p.email||'Email unavailable')+' · '+(p.is_active?'Active':'Disabled')),el('p',p.roles.map(r=>labels[r]||r).join(', ')));if(p.roles.includes('headmaster')){card.append(el('p','Headmaster ownership is managed separately.'));list.append(card);continue;}if(p.is_active&&p.roles.includes('discipline_officer')){const permission=el('p',p.roster_import_permission?'One roster import allowed until '+new Date(p.roster_import_permission.expires_at).toLocaleString():'Bulk roster imports require your permission. Adding one student does not require this grant.');const grant=el('button',p.roster_import_permission?'Revoke roster import permission':'Allow one roster import');grant.type='button';let confirmed=false;grant.onclick=async()=>{if(!confirmed){confirmed=true;grant.textContent=p.roster_import_permission?'Confirm revocation':'Confirm one import within 24 hours';return;}grant.disabled=true;try{await api('/rest/v1/rpc/roster_grant_save',{method:'POST',body:JSON.stringify({beneficiary:p.id,allow_import:!p.roster_import_permission})});say('Roster import permission updated. It turns off after one successful import; validation errors do not use it.');await load()}catch(e){say(e.message)}finally{grant.disabled=false}};card.append(permission,grant);}const f=el('form'),nameLabel=el('label','Full name'),name=el('input');name.value=p.display_name||'';name.required=true;name.maxLength=160;nameLabel.append(name);f.append(nameLabel);const choices=[];for(const r of Object.keys(labels).filter(r=>r!=='headmaster')){const l=el('label',labels[r]),i=el('input');l.className='inline-choice';i.type='checkbox';i.checked=p.roles.includes(r);l.append(i);f.append(l);choices.push({r,i})}const activeLabel=el('label','Account enabled'),active=el('input');active.type='checkbox';active.checked=p.is_active;activeLabel.className='inline-choice';activeLabel.append(active);f.append(activeLabel);const confirm=el('p'),save=el('button','Review access change');f.append(confirm,save);let pending=null;f.oninput=()=>{pending=null;confirm.textContent='';save.textContent='Review access change'};f.onsubmit=async event=>{event.preventDefault();const data={target_user:p.id,display_name:name.value.trim(),staff_roles:choices.filter(x=>x.i.checked).map(x=>x.r),enabled:active.checked};if(!data.staff_roles.length){say('Choose at least one staff role.');return;}const signature=JSON.stringify(data);if(pending!==signature){pending=signature;confirm.textContent='Save '+(data.enabled?'enabled':'disabled')+' access as '+data.staff_roles.map(r=>labels[r]).join(', ')+'? Disabled accounts lose access and must sign in again after re-enabling.';save.textContent='Confirm access change';return;}save.disabled=true;try{await api('/rest/v1/rpc/staff_account_save',{method:'POST',body:signature});say('Staff access saved with history.');await load()}catch(e){say(e.message)}finally{save.disabled=false}};card.append(f);if(p.can_delete===true)card.append(staffDeleteControls(p,card));list.append(card)}}catch(e){if(request===directoryRequest)say(e.message)}}
 const ready=load();return{ready,dispose(){stopped=true;host.replaceChildren()}};
}
if(typeof module!=='undefined'&&module.exports)module.exports={mountStaffAccounts};else root.mountStaffAccounts=mountStaffAccounts;
})(typeof window!=='undefined'?window:globalThis);

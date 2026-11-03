/* Account-scoped connected notebook. The caller owns authentication/session lifecycle. */
(function(root){
function mountCloudNotebook(host,api,isCurrent,userId){
 let notebook=null,note=null,revision=null,dirty=false,saving=null,timer=null,stopped=false,sequence=0;
 const valid=()=>!stopped&&isCurrent();
 const el=(tag,text)=>{const n=document.createElement(tag);if(text)n.textContent=text;return n;};
 function button(text,fn){const b=el('button',text);b.type='button';b.onclick=fn;return b;}
 function field(label,tag,value){const l=el('label',label),input=el(tag);input.value=value||'';l.append(input);return {l,input};}
 let status;
 const say=text=>{if(valid()&&status)status.textContent=text;};
 function shell(title){host.replaceChildren();host.append(el('h2',title));status=el('p');status.setAttribute('role','status');host.append(status);}
 function backupKey(){return 'ruhuka-private-note-recovery:'+JSON.stringify([userId,note.id]);}
 function changed(){dirty=true;say('Saving…');try{localStorage.setItem(backupKey(),JSON.stringify({title:note.title,body:note.body,checklist:note.checklist,revision}));}catch{say('Device recovery unavailable. Keep this page open until the school save succeeds.');}clearTimeout(timer);timer=setTimeout(()=>save(),500);}
 async function save(){
  clearTimeout(timer);if(saving){const ok=await saving;return ok?save():false;}if(!dirty||!note||!valid())return !dirty;
  const snapshot={title:note.title,body:note.body,checklist:JSON.parse(JSON.stringify(note.checklist))};const id=note.id;dirty=false;
  saving=(async()=>{try{
   const rows=await api('/rest/v1/rpc/save_personal_note',{method:'POST',body:JSON.stringify({note_id:id,expected_revision:revision,note_title:snapshot.title,note_body:snapshot.body,note_checklist:snapshot.checklist})});
   if(!valid())return false;const saved=Array.isArray(rows)?rows[0]:rows;revision=saved.revision;note.updated_at=saved.updated_at;
   if(!dirty){try{localStorage.removeItem(backupKey());}catch{}say('Saved to your private account · '+new Date(saved.updated_at).toLocaleString());}return true;
  }catch(error){if(valid()){dirty=true;say(error.code==='40001'?'Not saved: this note changed on another device. Copy your changes, then reopen the note.':('Not saved: '+error.message+'. Keep this page open and retry.'));}return false;}finally{saving=null;}})();
  const ok=await saving;if(ok&&dirty&&valid())return save();return ok;
 }
 async function list(){if(!(await save())||!valid())return;const version=++sequence;note=null;notebook=null;shell('Your notebooks');say('Loading private notebooks…');
  try{const books=await api('/rest/v1/personal_notebooks?select=id,name&order=created_at');if(!valid()||version!==sequence)return;say('Private to your account. Synced notes are available after signing in on another device.');
   const form=el('form'),name=field('New notebook name','input','');name.input.required=true;name.input.maxLength=80;const create=el('button','+ Create notebook');form.append(name.l,create);form.onsubmit=async e=>{e.preventDefault();create.disabled=true;try{const rows=await api('/rest/v1/personal_notebooks',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({name:name.input.value.trim()})});if(valid())await openNotebook(rows[0]);}catch(error){say(error.message);}finally{create.disabled=false;}};host.append(form);
   if(!books.length)host.append(el('p','No notebooks yet. Create your first notebook above.'));books.forEach(book=>host.append(button(book.name,()=>openNotebook(book))));
  }catch(error){say(error.message);}
 }
 async function openNotebook(book){if(!(await save())||!valid())return;notebook=book;note=null;const version=++sequence;shell(book.name);host.append(button('All notebooks',list));const search=field('Search this notebook','input','');search.input.type='search';host.append(search.l);const results=el('div');host.append(results);
  let searchTimer,queryVersion=0;
  async function load(){const q=++queryVersion;try{let path='/rest/v1/personal_notes?select=id,title,body,updated_at&notebook_id=eq.'+book.id+'&order=updated_at.desc&limit=200';const rows=await api(path);if(!valid()||version!==sequence||q!==queryVersion)return;results.replaceChildren();const query=search.input.value.toLowerCase();const matches=rows.filter(n=>(n.title+' '+n.body).toLowerCase().includes(query));say(rows.length===200?'Showing/searching the 200 most recently updated notes.':'Saved notes in this notebook');if(!matches.length)results.append(el('p',query?'No matching notes.':'No notes yet.'));matches.forEach(n=>{const box=el('div');box.className='row';box.append(button(n.title||'Untitled note',()=>openNote(n.id)),el('p',n.body.slice(0,120)),el('small','Updated '+new Date(n.updated_at).toLocaleString()));results.append(box);});}catch(error){say(error.message);}}
  search.input.oninput=()=>{clearTimeout(searchTimer);searchTimer=setTimeout(load,250);};
  host.append(button('New note',async()=>{try{const rows=await api('/rest/v1/personal_notes',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({notebook_id:book.id})});if(valid()&&version===sequence)await openNote(rows[0].id);}catch(error){say(error.message);}}));await load();
 }
 async function openNote(id){if(!(await save())||!valid())return;const version=++sequence;try{const rows=await api('/rest/v1/personal_notes?select=*&id=eq.'+id);if(!valid()||version!==sequence)return;if(!rows[0])throw Error('Note no longer available.');note=rows[0];revision=note.revision;dirty=false;shell('Edit note');host.append(button('Back to notes',()=>openNotebook(notebook)));say('Saved to your private account');
  const title=field('Note title','input',note.title);title.input.maxLength=100;const body=field('Note text','textarea',note.body);body.input.maxLength=100000;title.input.oninput=()=>{note.title=title.input.value;changed();};body.input.oninput=()=>{note.body=body.input.value;changed();};host.append(title.l,body.l);
  try{const raw=localStorage.getItem(backupKey());if(raw){const recovery=JSON.parse(raw);const restore=button('Restore unsaved device copy',()=>{note.title=recovery.title;note.body=recovery.body;note.checklist=recovery.checklist;title.input.value=note.title;body.input.value=note.body;paint();restore.disabled=true;dirty=true;say('Recovered copy loaded. Review it, then press Save recovered copy.');});host.append(el('p','An unsaved copy remains on this device. Restoring it loads a recovery copy for review. Press Save recovered copy when ready.'),restore,button('Save recovered copy',()=>changed()));}}catch{say('Device recovery could not be read.');}
  const items=el('div');host.append(items);
  function paint(){items.replaceChildren();note.checklist.forEach((item,i)=>{const row=el('div');row.className='cloud-check';const check=el('input');check.type='checkbox';check.checked=item.done;check.setAttribute('aria-label','Complete '+item.text);check.onchange=()=>{item.done=check.checked;changed();};const text=el('input');text.value=item.text;text.maxLength=1000;text.setAttribute('aria-label','Checklist item');text.oninput=()=>{item.text=text.value;changed();};row.append(check,text,button('Remove',()=>{note.checklist.splice(i,1);paint();changed();}));items.append(row);});}paint();
  const add=el('form'),input=field('New checklist item','input','');input.input.maxLength=1000;input.input.required=true;const submit=el('button','Add item');add.append(input.l,submit);add.onsubmit=e=>{e.preventDefault();if(note.checklist.length>=200){say('This note has reached 200 checklist items.');return;}note.checklist.push({text:input.input.value.trim(),done:false});input.input.value='';paint();changed();};host.append(add,button('Retry save',save));
  const confirm=el('div');confirm.hidden=true;confirm.append(el('p','Delete this note permanently?'),button('Cancel',()=>{confirm.hidden=true;}),button('Delete note',async()=>{if(!(await save()))return;try{await api('/rest/v1/personal_notes?id=eq.'+note.id,{method:'DELETE'});if(!valid())return;try{localStorage.removeItem(backupKey());}catch{}note=null;dirty=false;await openNotebook(notebook);}catch(error){say(error.message);}}));host.append(button('Delete note…',()=>{confirm.hidden=false;}),confirm);
 }catch(error){say(error.message);}}
 list();
 return {dispose(){stopped=true;sequence++;clearTimeout(timer);host.replaceChildren();},flush:save};
}
if(typeof module!=='undefined'&&module.exports)module.exports={mountCloudNotebook};else root.mountCloudNotebook=mountCloudNotebook;
})(typeof window!=='undefined'?window:globalThis);

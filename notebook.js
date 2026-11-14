/* Device-only adapter. Replace load/save with user-scoped backend storage later. */
(function () {
  const sessions = new Map();
  const adapter = {
    load(key) { const raw = localStorage.getItem(key); if (!raw) return []; const data = JSON.parse(raw); if (!Array.isArray(data) || data.some(n=>!n || typeof n.id!=='string' || typeof n.title!=='string' || typeof n.text!=='string' || !Array.isArray(n.items) || n.items.some(i=>!i || typeof i.text!=='string' || typeof i.done!=='boolean'))) throw Error('Invalid notebook'); return data; },
    save(key, notes) { localStorage.setItem(key, JSON.stringify(notes)); }
  };
  window.renderNotebook = function (elementId, slot) {
    const host = document.getElementById(elementId); if (!host) return;
    const role = slot === 'admin' ? window.previewRole || 'demo' : window.staffKind || 'demo';
    const key = 'ruhuka-notes-v2-' + slot + '-' + role;
    if (!sessions.has(key)) {
      try {
        let notes=adapter.load(key);
        if(localStorage.getItem(key) === null) {
          const legacyKey='ldk-notebook-'+slot+'-'+(window.staffKind || window.previewRole || 'demo');
          const raw=localStorage.getItem(legacyKey);
          if(raw) { const old=JSON.parse(raw); notes=[{id:crypto.randomUUID(),title:'Imported notebook',text:old.notes || '',items:old.items || [],updatedAt:new Date().toISOString()}]; adapter.save(key,notes); }
        }
        sessions.set(key, {notes,error:'',blocked:false});
      }
      catch { sessions.set(key, {notes:[],error:'Could not read saved notes. Reload to retry. Existing storage has not been overwritten.',blocked:true}); }
    }
    const state = sessions.get(key); let selected = null; let query = ''; let updatedLine=null;
    const collectionKey = key + '-collections';
    let collections = [{id:'default',name:'My notebook'}];
    let activeCollection = 'default';
    try { const raw = localStorage.getItem(collectionKey); if(raw) { const parsed=JSON.parse(raw); if(!Array.isArray(parsed) || !parsed.length || parsed.some(c=>!c.id || !c.name)) throw Error(); collections=parsed; } }
    catch { state.error='Could not read notebook names. Reload to retry; saved notes have not been changed.';state.blocked=true; }

    host.classList.add('notebook');
    function el(tag, text, cls) { const n = document.createElement(tag); if (text) n.textContent = text; if (cls) n.className = cls; return n; }
    function button(text, action, cls) { const n = el('button',text,cls || 'btn btn-o'); n.type='button'; n.onclick=action; return n; }
    function field(tag, label, value, change) { const wrap=el('label',label,'nb-field'); const input=el(tag); input.value=value; input.oninput=()=>change(input.value); wrap.append(input); return {wrap,input}; }
    let status;
    function save(note) {
      if (note) {note.updatedAt = new Date().toISOString();if(updatedLine)updatedLine.textContent='Last updated '+new Date(note.updatedAt).toLocaleString();}
      status.textContent='Saving…';
      try { if(state.blocked) throw Error(); adapter.save(key,state.notes); state.error=''; status.textContent='Saved on this device'; }
      catch { state.error='Not saved. Browser storage is unavailable or full. Keep this page open and copy your changes before leaving.'; status.textContent=state.error; }
    }
    function shell() {
      host.replaceChildren();updatedLine=null;
      const top=el('div',null,'nb-top'); top.append(el('h2','Notebook')); host.append(top);
      host.append(el('p','Device-only demo. Notes do not sync between devices or accounts. These role previews are not private signed-in accounts.','nb-hint'));
      status=el('p',state.error || 'Saved on this device','nb-status'); status.setAttribute('role','status'); host.append(status);
      if(state.error && !state.blocked) host.append(button('Retry saving',()=>save()));
      return top;
    }
    function list() {
      selected=null; const top=shell();
      const chooser=el('label','Choose notebook','nb-field');const select=el('select');
      collections.forEach(c=>{const option=el('option',c.name);option.value=c.id;select.append(option);});select.value=activeCollection;
      select.onchange=()=>{activeCollection=select.value;query='';list();};chooser.append(select);host.append(chooser);
      const form=el('form',null,'nb-add');form.hidden=true;
      const name=el('input');name.placeholder='Notebook name';name.maxLength=80;name.setAttribute('aria-label','Notebook name');
      const submit=el('button','Create notebook','btn btn-a');submit.type='submit';form.append(name,submit,button('Cancel',()=>{form.hidden=true;}));
      const plus=button('+ New notebook',()=>{form.hidden=false;name.focus();});plus.disabled=state.blocked;host.append(plus,form);
      form.onsubmit=e=>{e.preventDefault();if(!name.value.trim())return;const next={id:crypto.randomUUID(),name:name.value.trim()};
        try {localStorage.setItem(collectionKey,JSON.stringify([...collections,next]));collections.push(next);activeCollection=next.id;query='';list();}
        catch {status.textContent='Notebook not created. Browser storage is unavailable or full. Your existing notebooks are unchanged.';}
      };

      const create=button('New note',()=>{const n={id:crypto.randomUUID(),notebookId:activeCollection,title:'',text:'',items:[],updatedAt:new Date().toISOString()}; state.notes.unshift(n);save(n);editor(n);},'btn btn-a'); create.disabled=state.blocked;top.append(create);
      const search=field('input','Search notes',query,value=>{query=value;paint();}); search.input.type='search'; host.append(search.wrap);
      const cards=el('div',null,'nb-list');host.append(cards);
      function paint(){cards.replaceChildren();const matches=state.notes.filter(n=>(n.notebookId || 'default') === activeCollection).filter(n=>(n.title+' '+n.text).toLowerCase().includes(query.toLowerCase()));
        if(!matches.length) cards.append(el('p',query?'No matching notes.':'Your notebook is empty. Create a note for a reminder, useful information, or a small checklist.','nb-empty'));
        matches.forEach(n=>{const card=button('',()=>editor(n),'nb-note');card.append(el('strong',n.title || 'Untitled note'),el('p',(n.text || 'Checklist: '+n.items.length+' items').slice(0,140)),el('small','Updated '+new Date(n.updatedAt).toLocaleString()));cards.append(card);});
      } paint();
    }
    function editor(note) {
      selected=note;const top=shell();top.append(button('Back to notes',list));
      const title=field('input','Note title',note.title,value=>{note.title=value;save(note);});title.input.maxLength=100;
      const body=field('textarea','Note text',note.text,value=>{note.text=value;save(note);});body.input.rows=10;
      host.append(title.wrap,body.wrap);
      updatedLine=el('p','Last updated '+new Date(note.updatedAt).toLocaleString(),'nb-hint');host.append(updatedLine);
      host.append(el('h3','Checklist'));const items=el('div');host.append(items);
      function paintItems(){items.replaceChildren();note.items.forEach((item,index)=>{
        const row=el('div',null,'nb-item');const check=el('input');check.type='checkbox';check.checked=item.done;check.setAttribute('aria-label','Complete '+item.text);check.onchange=()=>{item.done=check.checked;save(note);};
        const text=el('input');text.value=item.text;text.setAttribute('aria-label','Checklist item text');text.oninput=()=>{item.text=text.value;check.setAttribute('aria-label','Complete '+item.text);save(note);};
        row.append(check,text,button('Remove',()=>{note.items.splice(index,1);save(note);paintItems();}));items.append(row);
      });}paintItems();
      const add=el('form',null,'nb-add');const input=el('input');input.placeholder='New checklist item';input.setAttribute('aria-label','New checklist item');const submit=el('button','Add item','btn btn-o');submit.type='submit';add.append(input,submit);add.onsubmit=e=>{e.preventDefault();if(!input.value.trim())return;note.items.push({text:input.value.trim(),done:false});input.value='';save(note);paintItems();input.focus();};host.append(add);
      const confirmation=el('div',null,'nb-confirm');confirmation.hidden=true;confirmation.append(el('p','Delete this note? This cannot be undone.'),button('Cancel',()=>{confirmation.hidden=true;}),button('Delete note',()=>{state.notes=state.notes.filter(n=>n.id!==note.id);save();list();},'btn btn-o'));
      host.append(button('Delete note…',()=>{confirmation.hidden=false;}),confirmation);
    }
    list();
  };
})();

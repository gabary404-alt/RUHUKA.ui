const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');
function setup(){const nodes=new Map(),scripts=[];const make=()=>({hidden:false,disabled:false,attrs:{},listeners:{},textContent:'',setAttribute(k,v){this.attrs[k]=v},addEventListener(k,v){this.listeners[k]=v},focus(){},remove(){this.removed=true}});const get=id=>{if(!nodes.has(id))nodes.set(id,make());return nodes.get(id)};get('site-menu').hidden=true;
 const c={document:{documentElement:{dataset:{}},getElementById:get,addEventListener(){},createElement:make,body:{append(n){scripts.push(n)}}},localStorage:{getItem(key){assert.equal(key,'ldk-theme');return null},setItem(key){assert.equal(key,'ldk-theme')}},Error,Promise};c.window=c;Object.defineProperty(c,'schoolData',{get(){throw Error('Private/demo records touched')}});vm.createContext(c);vm.runInContext(fs.readFileSync('public.js','utf8'),c);return{c,get,scripts};}
test('opening the public page does not load portal/chat scripts or read school records',()=>{const s=setup();assert.equal(s.scripts.length,0);const html=fs.readFileSync('index.html','utf8');assert.deepEqual([...html.matchAll(/<script[^>]*src="([^"]+)"/g)].map(m=>m[1]),['connected/config.js','public-content.js','public.js','chat-launcher.js']);assert.ok(html.includes('href="connected/"'));assert.ok(!html.includes('setR('));assert.ok(!html.includes('notebook.js'));});
test('assistant lazy-loads once, retries a failed download, and resolves assets from nested pages', async()=>{
 const {c,get,scripts}=setup();
 c.URL=URL;
 c.document.currentScript={src:'https://example.test/chat-launcher.js'};
 c.document.getElementById=id=>id==='ai-assistant'?null:get(id);
 c.document.body.classList={add(){}};
 c.document.body.insertAdjacentHTML=(_,html)=>assert.match(html,/https:\/\/example\.test\/assets\/ldk-crest\.png/);
 vm.runInContext(fs.readFileSync('chat-launcher.js','utf8'),c);
 const open=get('ai-fab').listeners.click;
 const first=open();
 assert.equal(scripts[0].src,'https://example.test/chat.js');
 scripts[0].onerror();
 await first;
 assert.match(get('ai-load-status').textContent,/could not load/);
 assert.equal(get('ai-fab').disabled,false);
 const retry=open();
 let opened=0;
 c.toggleAI=()=>opened++;
 scripts[1].onload();
 await retry;
 await open();
 assert.equal(scripts.length,2);
 assert.equal(opened,2);
});
test('phone navigation opens and closes with matching accessible state',()=>{const s=setup(),button=s.get('menu-button');button.listeners.click();assert.equal(s.get('site-menu').hidden,false);assert.equal(button.attrs['aria-expanded'],'true');assert.equal(button.attrs['aria-label'],'Close navigation');s.get('site-menu').listeners.click({target:{closest:()=>true}});assert.equal(s.get('site-menu').hidden,true);assert.equal(button.attrs['aria-expanded'],'false');});
test('active workspace has no notebook or online absence submission controls',()=>{const html=fs.readFileSync('connected/index.html','utf8'),app=fs.readFileSync('connected/attendance.js','utf8');assert.ok(!/open-notebook|cloud-notebook|notebook\.js|explanation-list/.test(html));assert.ok(!/submit_absence_explanation|mountCloudNotebook|localStorage\.clear/.test(app));assert.ok(app.includes('correct_main_attendance'));assert.ok(html.includes('open-attendance'));assert.ok(html.includes('open-my-records'));});

test('public rendering has no decorative animation loop or canvas',()=>{assert.ok(!/requestAnimationFrame|setInterval|canvas/.test(fs.readFileSync('public.js','utf8')));assert.ok(!/<canvas|shooting-star/.test(fs.readFileSync('index.html','utf8')));});

test('approved public text stays plain, reveals news and supersedes older contact links',()=>{
 const {applyPublicText}=require('../public-content');
 const news={hidden:true},oldContact={hidden:false};
 const nodes={'public-introduction':{textContent:'School introduction'},'public-news':{closest:()=>news},'public-contact':{textContent:'School office'}};
 const doc={getElementById:id=>nodes[id],querySelectorAll:selector=>selector.includes('"contact"')?[oldContact]:[]};
 assert.equal(applyPublicText(doc,{revision:0,content:{}}),false);
 assert.equal(news.hidden,true);
 assert.equal(oldContact.hidden,false);
 assert.equal(applyPublicText(doc,{revision:1,content:{introduction:'<img src=x onerror=bad()>',news:'New notice',contact:'School office update'}}),true);
 assert.equal(nodes['public-introduction'].textContent,'<img src=x onerror=bad()>');
 assert.equal(nodes['public-news'].textContent,'New notice');
 assert.equal(news.hidden,false);
 assert.equal(oldContact.hidden,true);
});

test('visitor navigation opens distinct detail pages in the same tab',()=>{
 const home=fs.readFileSync('index.html','utf8');
 for(const [section,page] of [['about','our-school'],['academics','academics'],['school-life','school-life'],['contact','contact']]){
  assert.ok(home.includes('id="'+section+'"'));
  assert.ok(home.includes('href="'+page+'.html"'));
  assert.ok(!home.includes('target="_blank"'));
  const detail=fs.readFileSync(page+'.html','utf8');
  assert.ok(detail.includes('href="index.html#'+section+'"'));
  assert.ok(detail.includes('href="connected/"'));
 }
});

test('every published HTML page loads the shared chat launcher and stylesheet',()=>{
 const release=fs.readFileSync('scripts/build-public-site.cjs','utf8');
 const pages=[...release.matchAll(/'([^']+\.html)'/g)].map(m=>m[1]);
 const portalStart=pages.lastIndexOf('index.html');
 assert.ok(portalStart>0);
 for(const [i,page] of pages.entries()){
  const folder=i>=portalStart?'connected/':'';
  const prefix=folder?'../':'';
  const html=fs.readFileSync(folder+page,'utf8');
  assert.ok(html.includes('src="'+prefix+'chat-launcher.js" defer'),folder+page);
  assert.ok(html.includes('href="'+prefix+'chat.css"'),folder+page);
  assert.ok(!html.includes('src="'+prefix+'chat.js"'),folder+page);
 }
});

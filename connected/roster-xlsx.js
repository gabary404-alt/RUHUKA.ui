(function(root){
'use strict';
const MAX_FILE=500000;
const MAX_XML=1500000;
const decode=new TextDecoder('utf-8',{fatal:true});
const bad=()=>Error('This is not a supported Excel workbook. Save one worksheet as .xlsx or CSV.');
function directory(bytes){
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
 let end=bytes.length-22;
 while(end>=Math.max(0,bytes.length-65557)){
  if(view.getUint32(end,true)===0x06054b50&&end+22+view.getUint16(end+20,true)===bytes.length)break;
  end--;
 }
 if(end<Math.max(0,bytes.length-65557))throw bad();
 const count=view.getUint16(end+10,true), size=view.getUint32(end+12,true);
 let offset=view.getUint32(end+16,true);
 if(view.getUint16(end+4,true)||view.getUint16(end+6,true)||view.getUint16(end+8,true)!==count||count>128||offset+size!==end)throw bad();
 const files=new Map();
 while(files.size<count){
  if(offset+46>end||view.getUint32(offset,true)!==0x02014b50)throw bad();
  const nameLength=view.getUint16(offset+28,true), extraLength=view.getUint16(offset+30,true), commentLength=view.getUint16(offset+32,true);
  const next=offset+46+nameLength+extraLength+commentLength;
  if(next>end)throw bad();
  const name=decode.decode(bytes.subarray(offset+46,offset+46+nameLength));
  if(files.has(name)||view.getUint16(offset+34,true))throw bad();
  files.set(name,{
   flags:view.getUint16(offset+8,true),
   method:view.getUint16(offset+10,true),
   packed:view.getUint32(offset+20,true),
   size:view.getUint32(offset+24,true),
   start:view.getUint32(offset+42,true)
  });
  offset=next;
 }
 if(offset!==end)throw bad();
 return {files,view};
}
async function xmlEntry(bytes,archive,name,optional=false){
 const file=archive.files.get(name);
 if(!file&&optional)return null;
 if(!file||file.flags&1||file.size>MAX_XML||file.start+30>bytes.length)throw bad();
 const view=archive.view;
 if(view.getUint32(file.start,true)!==0x04034b50||view.getUint16(file.start+8,true)!==file.method)throw bad();
 const start=file.start+30+view.getUint16(file.start+26,true)+view.getUint16(file.start+28,true);
 if(start+file.packed>bytes.length)throw bad();
 const data=bytes.subarray(start,start+file.packed);
 let unpacked=data;
 if(file.method===8){
  if(typeof root.DecompressionStream!=='function')throw Error('This browser cannot open Excel files. Use the CSV template instead.');
  let decompressor;
  try{decompressor=new root.DecompressionStream('deflate-raw');}
  catch{throw Error('This browser cannot open Excel files. Use the CSV template instead.');}
  const reader=new Blob([data]).stream().pipeThrough(decompressor).getReader();
  const result=new Uint8Array(file.size);
  let length=0;
  try{
   while(true){
    const chunk=await reader.read();
    if(chunk.done)break;
    if(length+chunk.value.length>result.length){await reader.cancel();throw bad();}
    result.set(chunk.value,length);
    length+=chunk.value.length;
   }
  }finally{reader.releaseLock();}
  if(length!==file.size)throw bad();
  unpacked=result;
 }else if(file.method!==0||file.packed!==file.size)throw bad();
 const xml=decode.decode(unpacked);
 if(/<!\s*(DOCTYPE|ENTITY)/i.test(xml))throw bad();
 const doc=new root.DOMParser().parseFromString(xml,'application/xml');
 if(doc.getElementsByTagNameNS('*','parsererror').length)throw bad();
 return doc;
}
const find=(doc,name)=>[...doc.getElementsByTagNameNS('*',name)];
const textRuns=node=>find(node,'t').map(t=>t.textContent).join('');
async function readRosterWorkbook(file){
 if(file.size>MAX_FILE)throw Error('Choose an Excel file smaller than 500 KB.');
 const bytes=new Uint8Array(await file.arrayBuffer());
 if(bytes.length<22||bytes.length>MAX_FILE)throw bad();
 const archive=directory(bytes);
 const workbook=await xmlEntry(bytes,archive,'xl/workbook.xml');
 const sheets=find(workbook,'sheet');
 if(sheets.length!==1||!['','visible'].includes(sheets[0].getAttribute('state')||''))throw Error('Use one visible worksheet for the roster.');
 const id=sheets[0].getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships','id');
 const relations=await xmlEntry(bytes,archive,'xl/_rels/workbook.xml.rels');
 const rel=find(relations,'Relationship').find(r=>r.getAttribute('Id')===id);
 const target=rel?.getAttribute('Target')?.replace(/^\/?(?:xl\/)?/,'');
 if(!rel||rel.getAttribute('TargetMode')==='External'||!rel.getAttribute('Type')?.endsWith('/worksheet')||!/^worksheets\/[A-Za-z0-9_-]+\.xml$/.test(target))throw bad();
 const sheet=await xmlEntry(bytes,archive,'xl/'+target);
 const stringsDoc=await xmlEntry(bytes,archive,'xl/sharedStrings.xml',true);
 const strings=stringsDoc?find(stringsDoc,'si').map(textRuns):[];
 const entries=find(sheet,'row');
 if(entries.length>1001)throw Error('Use at most 1000 students per file.');
 const rows=[];
 for(const [index,entry] of entries.entries()){
  const row=[],rowNumber=Number(entry.getAttribute('r')||index+1);
  if(!Number.isInteger(rowNumber)||rowNumber<1||rowNumber>1001)throw bad();
  for(const cell of find(entry,'c')){
   if(find(cell,'f').length)throw Error('Row '+rowNumber+': replace formulas with values before importing.');
   const type=cell.getAttribute('t'),raw=find(cell,'v')[0]?.textContent;
   let value='';
   if(type==='inlineStr')value=textRuns(cell);
   else if(type==='s'&&raw!==undefined){
    if(!/^\d+$/.test(raw)||strings[Number(raw)]===undefined)throw bad();
    value=strings[Number(raw)];
   }else if(type==='str')value=raw??'';
   else if(raw!==undefined&&raw!=='')throw Error('Row '+rowNumber+': format student IDs and other roster fields as text.');
   if(!value.trim())continue;
   const position=/^([A-D])([1-9]\d*)$/.exec(cell.getAttribute('r')||'');
   if(!position||Number(position[2])!==rowNumber)throw Error('Row '+rowNumber+': use only the four roster columns.');
   const column=position[1].charCodeAt(0)-65;
   if(row[column]!==undefined)throw bad();
   row[column]=value;
  }
  if(row.length)rows.push(row);
 }
 if(!rows.length)throw Error('The worksheet has no roster rows.');
 const width=rows[0].length;
 const quote=value=>'"'+(value||'').replaceAll('"','""')+'"';
 return rows.map(row=>Array.from({length:Math.max(width,row.length)},(_,index)=>quote(row[index])).join(',')).join('\n');
}
if(typeof module!=='undefined'&&module.exports)module.exports={readRosterWorkbook};
else root.readRosterWorkbook=readRosterWorkbook;
})(typeof window!=='undefined'?window:globalThis);

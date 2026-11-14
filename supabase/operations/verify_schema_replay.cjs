// Run this against a generated replay file with PGlite installed separately.
'use strict';
const fs=require('node:fs');
const {createHash}=require('node:crypto');
const {PGlite}=require('@electric-sql/pglite');

async function main(){
 const input=process.argv[2];
 if(!input)throw Error('Pass the SQL file emitted by build_schema_replay.py.');
 let sql=fs.readFileSync(input,'utf8');
 const marker=sql.indexOf('with inventory as (');
 if(marker<0||!sql.startsWith('begin;'))throw Error('Expected a generated schema replay file.');
 sql=sql.slice(0,marker).replace('create extension if not exists pgcrypto;','');
 const db=new PGlite();
 try{
  await db.exec('create role anon;create role authenticated;create role service_role;');
  await db.exec(sql);
  const columns=await db.query(`select replace(table_schema,'ruhuka_replay_','') as table_schema,
   table_name,column_name,is_nullable,data_type,udt_name,character_maximum_length,numeric_precision,numeric_scale
   from information_schema.columns where table_schema in ('ruhuka_replay_public','ruhuka_replay_private') order by 1,2,3`);
  const functions=await db.query(`select count(*)::int as total from pg_proc p join pg_namespace n on n.oid=p.pronamespace
   where n.nspname in ('ruhuka_replay_public','ruhuka_replay_private')`);
  const columnHash=createHash('sha256')
   .update(columns.rows.map(row=>Object.values(row).map(value=>value??'').join('|')).join('\n')).digest('hex');
  console.log(JSON.stringify({columns:columns.rows.length,columnHash,functions:functions.rows[0].total}));
 }finally{await db.close();}
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});

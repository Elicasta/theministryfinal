// Explicit, single-process development/LAN storage. Never enabled implicitly on Vercel.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
let tables;
function load(){
  if(tables)return;
  const file=process.env.MINISTRY_LOCAL_DB;
  tables=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):{game_sessions:[],game_players:[],game_submissions:[],game_events:[]};
}
function persist(){const file=process.env.MINISTRY_LOCAL_DB;fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file+'.tmp',JSON.stringify(tables),{mode:0o600});fs.renameSync(file+'.tmp',file)}
export function localDb(url,options={}){
  load();const [table,query='']=url.split('?'),params=new URLSearchParams(query),method=options.method||'GET';
  if(!tables[table])return {ok:false,status:404,text:'Unknown table',json:null};
  const matches=row=>[...params].every(([k,v])=>['select','limit','order','on_conflict'].includes(k)||String(k.includes('->>')?row[k.split('->>')[0]]?.[k.split('->>')[1]]:row[k])===v.replace(/^eq\./,''));
  let rows=tables[table].filter(matches);
  if(method==='POST'){
    const body=JSON.parse(options.body||'{}'),keys=(params.get('on_conflict')||'').split(',').filter(Boolean);
    const existing=keys.length?tables[table].find(r=>keys.every(k=>r[k]===body[k])):null;
    if(table==='game_sessions'&&tables[table].some(r=>r.game_code===body.game_code))return {ok:false,status:409,text:'Code exists',json:null};
    const stamp=new Date().toISOString();
    const row=existing?Object.assign(existing,body):{id:crypto.randomUUID(),version:1,created_at:stamp,joined_at:stamp,...body};
    if(!existing)tables[table].push(row);rows=[row];persist();
  }else if(method==='PATCH'){
    const body=JSON.parse(options.body||'{}');
    for(const row of rows){Object.assign(row,body);if(table==='game_sessions'){row.version++;row.updated_at=new Date().toISOString()}}
    persist();
  }else if(method!=='GET')return {ok:false,status:405,text:'Unsupported method',json:null};
  const order=params.get('order');if(order){const [key,dir]=order.split('.');rows.sort((a,b)=>String(a[key]).localeCompare(String(b[key]))*(dir==='desc'?-1:1))}
  if(params.has('limit'))rows=rows.slice(0,Number(params.get('limit')));
  return {ok:true,status:200,text:'',json:structuredClone(rows)};
}

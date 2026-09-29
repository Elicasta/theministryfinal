import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
process.env.MINISTRY_LOCAL_DB ||= path.join(root,'.local','games.json');
const port=Number(process.env.PORT)||4173;
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.jpeg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2'};
const server=http.createServer(async(req,res)=>{
  const url=new URL(req.url,'http://localhost');
  res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
  res.status=code=>{res.statusCode=code;return res};res.json=data=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify(data))};
  try{
    if(url.pathname==='/api/config'){const lan=Object.values(os.networkInterfaces()).flat().find(ip=>ip?.family==='IPv4'&&!ip.internal);return res.json({ok:true,local:true,realtimeConfigured:false,shareOrigin:lan?'http://'+lan.address+':'+port:null})}
    if(/^\/api\/game\/[a-z-]+$/.test(url.pathname)){
      let body='';for await(const chunk of req){body+=chunk;if(body.length>100000)return res.status(413).json({error:'Request too large'})}
      req.body=body?JSON.parse(body):{};req.query=Object.fromEntries(url.searchParams);
      const name=url.pathname.split('/').pop();
      if(!['create','state','join','action','health','current','pack','generate','voice','live-session'].includes(name))return res.status(404).json({error:'Not found'});
      const {default:handler}=await import(path.join(root,'api/game',name+'.js'));return await handler(req,res);
    }
    const route=/^\/games?(\/(host|play|join|display|projector))?\/?$/.test(url.pathname)||url.pathname==='/';
    const relative=route?'games/index.html':decodeURIComponent(url.pathname).replace(/^\//,'');
    // Only browser assets are served: answer packs, local state, and credentials stay private.
    if(!route&&!/^(games\/(game\.js|game\.css|battle\.css|questions\.js|assets\/[\w.-]+)|assets\/[\w.-]+)$/.test(relative))return res.status(404).end('Not found');
    const file=path.join(root,relative);
    if(!fs.existsSync(file))return res.status(404).end('Not found');
    res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);
  }catch(error){console.error(error.message);if(!res.headersSent)res.status(500).json({error:'The game request failed. Please retry.'})}
});
server.listen(port,'0.0.0.0',()=>{
  console.log(`Bible Battle: http://localhost:${port}/games`);
  for(const entries of Object.values(os.networkInterfaces()))for(const ip of entries||[])if(ip.family==='IPv4'&&!ip.internal)console.log(`Phones on this Wi-Fi: http://${ip.address}:${port}/games/play`);
});

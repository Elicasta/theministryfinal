import {verifyPlayer} from './game-db.js';
const cookieName=code=>'ministry_player_'+String(code).replace(/[^A-Z0-9]/g,'');
export function playerCredentials(req,body,code){
  const entry=String(req.headers?.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith(cookieName(code)+'='));
  if(entry){
    try{const c=JSON.parse(Buffer.from(entry.slice(entry.indexOf('=')+1),'base64url').toString());
      if(!c.playerId||!c.playerToken)throw new Error();
      if(body.playerId&&body.playerId!==c.playerId)return {invalid:true};
      return {...c,cookie:true};
    }catch{return {invalid:true}}
  }
  return {playerId:body.playerId,playerToken:body.playerToken};
}
export async function authenticatedPlayer(req,body,code){
  const c=playerCredentials(req,body,code);
  if(c.invalid||!await verifyPlayer(code,c.playerId,c.playerToken))return null;
  return c;
}
export function setPlayerCookie(res,code,credentials){
  const value=Buffer.from(JSON.stringify({playerId:credentials.playerId,playerToken:credentials.playerToken})).toString('base64url');
  res.setHeader('Set-Cookie',cookieName(code)+'='+value+'; Path=/api/game; HttpOnly; SameSite=Lax; Max-Age=2592000'+(process.env.MINISTRY_LOCAL_DB?'':'; Secure'));
}

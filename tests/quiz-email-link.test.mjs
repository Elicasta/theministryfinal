import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeEmail,linkExistingVerifiedEmail} from '../lib/quiz-email-link.js';

test('normalizes a submitted verified email for matching',()=>{
 assert.equal(normalizeEmail('  Member@Example.COM '),'member@example.com');
 assert.equal(normalizeEmail('not-an-email'),null);
});

test('does not link a profile from an unverified email input',async()=>{
 let lookupCount=0;
 const out=await linkExistingVerifiedEmail({
   principal:{id:'auth1',email:'person@example.com',emailVerified:false},
   gameCode:'ABC123',playerId:'p1',findProfilesByEmail:async()=>{lookupCount++;return [{id:'profile1'}]},
   getLinkedIdentity:async()=>null,linkIdentity:async()=>{}
 });
 assert.equal(out.status,'verification_required');
 assert.equal(lookupCount,0);
});

test('links once to an existing email profile and is idempotent',async()=>{
 let existing=null,linkCount=0;
 const ctx={principal:{id:'auth1',email:' MEMBER@example.com ',emailVerified:true},
   gameCode:'ABC123',playerId:'p1',findProfilesByEmail:async email=>{
     assert.equal(email,'member@example.com');return [{id:'registered1'}];
   },getLinkedIdentity:async()=>existing,
   linkIdentity:async payload=>{linkCount++;existing=payload}
 };
 assert.equal((await linkExistingVerifiedEmail(ctx)).status,'linked');
 assert.equal((await linkExistingVerifiedEmail(ctx)).status,'already_linked');
 assert.equal(linkCount,1);
});

test('rejects conflicting or ambiguous profiles without a link',async()=>{
 const base={principal:{id:'auth1',email:'member@example.com',emailVerified:true},gameCode:'ABC123',playerId:'p1'};
 let writes=0;
 const ambiguous=await linkExistingVerifiedEmail({...base,
   findProfilesByEmail:async()=>[{id:'a'},{id:'b'}],
   getLinkedIdentity:async()=>null,linkIdentity:async()=>{writes++}});
 assert.equal(ambiguous.status,'ambiguous_email');
 const conflict=await linkExistingVerifiedEmail({...base,
   findProfilesByEmail:async()=>[{id:'a'}],
   getLinkedIdentity:async()=>({profileId:'b'}),linkIdentity:async()=>{writes++}});
 assert.equal(conflict.status,'already_linked_to_another_profile');
 assert.equal(writes,0);
});
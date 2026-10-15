/**
 * Safe email-to-existing-profile matching adapter.
 *
 * The caller MUST resolve the logged-in principal using the existing site's
 * server-verified session or completed email verification, not an untrusted
 * email supplied in the request body.
 *
 * This module deliberately never creates a second profile or trusts an email
 * input as proof of identity. Database interfaces are injected because the
 * Ministry app's existing email identity table must remain the authority.
 */
export function normalizeEmail(email) {
  const value=String(email??'').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || value.length>254)
    return null;
  return value;
}

/**
 * @param {object} context
 * @param {object} context.principal The verified server-side login identity
 * @param {string} context.principal.id Stable login principal ID
 * @param {string} context.principal.email Verified email in existing account
 * @param {boolean} context.principal.emailVerified Verification result from auth provider
 * @param {string} context.gameCode Game code, validated by the calling endpoint
 * @param {string} context.playerId Authenticated game player ID
 * @param {function} context.findProfilesByEmail Must query existing system, no new accounts
 * @param {function} context.getLinkedIdentity Must query an existing player identity link
 * @param {function} context.linkIdentity Must atomically upsert the identity link
 */
export async function linkExistingVerifiedEmail(context) {
  const {principal,gameCode,playerId,findProfilesByEmail,getLinkedIdentity,linkIdentity}=context||{};
  if (!principal?.id || principal.emailVerified !== true)
    return {status:'verification_required',linked:false};
  const email=normalizeEmail(principal.email);
  if (!email) return {status:'verification_required',linked:false};
  if (!gameCode || !playerId || !findProfilesByEmail || !getLinkedIdentity || !linkIdentity)
    throw new Error('Quiz email-link integration is incomplete');

  const profiles=await findProfilesByEmail(email);
  if (!Array.isArray(profiles)) throw new Error('Email profile lookup failed');
  if (!profiles.length)return {status:'no_existing_profile',linked:false};
  // Avoid silently picking a profile when duplicate email records exist.
  if (profiles.length>1)return {status:'ambiguous_email',linked:false};
  const profile=profiles[0];
  if (!profile?.id) throw new Error('Existing email profile lacks stable ID');
  const existing=await getLinkedIdentity({gameCode,playerId});
  if (existing && existing.profileId !== profile.id)
    return {status:'already_linked_to_another_profile',linked:false};
  if (existing?.profileId===profile.id)
    return {status:'already_linked',linked:true,profileId:profile.id};
  await linkIdentity({gameCode,playerId,profileId:profile.id,verifiedPrincipalId:principal.id});
  // No email address in the return payload sent to players or projectors.
  return {status:'linked',linked:true,profileId:profile.id};
}
/**
 * 🛡️ PARTNER VIEW — the single answer to "what may this connection show?"
 *
 * ── WHY THIS FILE EXISTS ─────────────────────────────────────────────────────
 * Before this, "can person A see person B's profile?" was decided
 * independently by every screen that displayed a name. Twenty-two inline sites
 * read `user.name` or `user.photos[0]` directly, and four server paths embedded
 * real names in payloads and push titles. There was no rule to break and no
 * single place to change — which is why a promise of "your profile is hidden"
 * could not be kept, and why it could not be tested.
 *
 * This module is that rule. It is deliberately boring: one lookup, one
 * fallback chain, no clever branching. Every surface that shows a partner
 * eventually calls `displayNameFor` instead of reading a field itself, which
 * is what makes the promise auditable.
 *
 * ── THE INVARIANT ────────────────────────────────────────────────────────────
 *   NO GRANT MEANS NO ACCESS. Not "unless it is a deck connection", not "unless
 *   the field is missing". Absence is denial.
 *
 * That is the whole design. It fails closed because there is no branch that
 * could decide otherwise — the only way to grant access is to write a grant.
 *
 * ── NOT CALLED ANYTHING YET ──────────────────────────────────────────────────
 * Stage 1 defines and tests the contract. Wiring it into Chat, the Requests
 * list, search, typing events and push notifications is Stage 8, and the
 * acceptance gate for that stage is that all thirteen of those surfaces call
 * these functions. Until then no screen changes behaviour, which is precisely
 * why this can be merged without regression risk.
 *
 * Design source: ambitions/roulette.md §4
 */

import Alignment from '../models/Alignment.js';

/**
 * Placeholder shown when nothing authorises a real identity.
 *
 * ⚠️ Never derive this from the user's name, college, ObjectId or an avatar.
 * The whole point is that a partner learns nothing. This string is the same
 * for everyone so it also leaks nothing by comparison — two strangers looking
 * at each other see identical text.
 */
export const ANONYMOUS_LABEL = 'Stranger';

/**
 * Resolve the OTHER user in a connection.
 *
 * @param {{ users?: Array }} connection  an Alignment document or plain object
 * @param {string|import('mongoose').Types.ObjectId} viewerId
 * @returns {string|null} the partner's id, or null if viewerId is not a member
 */
export const partnerIdFor = (connection, viewerId) => {
  const users = Array.isArray(connection?.users) ? connection.users : [];
  if (users.length !== 2) return null;
  const viewer = String(viewerId);
  const partner = users.find((u) => String(u) !== viewer);
  return partner ? String(partner) : null;
};

/**
 * The authorisation question, answered directly from the document.
 *
 * Pure: takes an already-loaded connection, hits no database. `canViewProfile`
 * below is the loading variant.
 *
 * @param {{ profileGrants?: Array }} connection
 * @param {string} viewerId
 * @param {string} subjectId
 * @returns {boolean} true ONLY if an explicit grant exists
 */
export const hasGrant = (connection, viewerId, subjectId) => {
  const grants = Array.isArray(connection?.profileGrants) ? connection.profileGrants : [];
  const viewer = String(viewerId);
  const subject = String(subjectId);
  // An empty list is the common case for a hidden connection, so bail before
  // doing any string comparison work.
  if (grants.length === 0) return false;
  return grants.some((g) => String(g?.viewerId) === viewer && String(g?.subjectId) === subject);
};

/**
 * May `viewerId` see `subjectId`'s public profile through this connection?
 *
 * @param {object} connection  a loaded Alignment
 * @param {string} viewerId
 * @param {string} [subjectId]  defaults to "whoever else is in it"
 * @returns {boolean}
 */
export const canViewProfileIn = (connection, viewerId, subjectId) => {
  // A connection is two people by definition, and Alignment.js:53-63 enforces
  // that on save. Refusing anything else here is defence in depth for a
  // function whose entire job is to be un-grantable: a malformed document
  // naming extra members must not become a way to hand out access, even if
  // it happens to contain a matching grant.
  const users = Array.isArray(connection?.users) ? connection.users : [];
  if (users.length !== 2) return false;

  const subject = subjectId ? String(subjectId) : partnerIdFor(connection, viewerId);
  if (!subject || !viewerId) return false;
  if (String(viewerId) === subject) return false;
  return hasGrant(connection, viewerId, subject);
};

/**
 * The nickname this connection records for the partner, if any.
 *
 * @param {object} connection
 * @param {string} partnerId
 * @returns {string|null}
 */
export const aliasFor = (connection, partnerId) => {
  const aliases = Array.isArray(connection?.conversationAliases)
    ? connection.conversationAliases
    : [];
  const partner = String(partnerId);
  const found = aliases.find((a) => String(a?.userId) === partner);
  const alias = found?.alias;
  return typeof alias === 'string' && alias.trim() ? alias.trim() : null;
};

/**
 * The display name for a partner, in a fixed order of preference.
 *
 * 1. A nickname recorded for this connection  → use it
 * 2. A grant authorises their real name       → use their real name
 * 3. Otherwise                                → ANONYMOUS_LABEL
 *
 * Order matters and is not interchangeable. The alias wins even after a
 * mutual reveal, which is deliberate (spec §8.2): the conversation keeps the
 * name people chose for each other, and the real name is still available
 * through `canViewProfile` for the profile sheet. A user who has seen
 * "Moonwalker" for a week should not have that silently replaced mid-chat
 * because they later agreed to share profiles.
 *
 * ⚠️ Callers that want to display a real name must ALSO check
 * `canViewProfileIn` — this function is for labels, not for authorisation.
 * They coincide today by construction, and will drift the moment anyone adds
 * a UI that renders one without the other.
 *
 * @param {object} connection
 * @param {string} viewerId
 * @param {{ name?: string }} [partnerUser]  the partner's user doc, for the real name
 * @returns {string}
 */
export const displayNameIn = (connection, viewerId, partnerUser) => {
  const partnerId = partnerIdFor(connection, viewerId);
  if (!partnerId) return ANONYMOUS_LABEL;

  const alias = aliasFor(connection, partnerId);
  if (alias) return alias;

  if (canViewProfileIn(connection, viewerId, partnerId)) {
    const real = partnerUser?.name;
    if (typeof real === 'string' && real.trim()) return real.trim();
  }

  return ANONYMOUS_LABEL;
};

/* ═══════════════════════════════════════════════════════════════════════════
 * DATABASE-BACKED VARIANTS
 *
 * The pure functions above are what the tests exercise and what every call
 * site should prefer. These exist so a route does not have to hand-roll the
 * same two queries.
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Load a connection and answer the authorisation question.
 *
 * @param {string} alignmentId
 * @param {string} viewerId
 * @returns {Promise<{ connection: object|null, partnerId: string|null, canView: boolean }>}
 */
export const canViewProfile = async (alignmentId, viewerId) => {
  const connection = await Alignment.findById(alignmentId).lean();
  if (!connection) return { connection: null, partnerId: null, canView: false };

  const partnerId = partnerIdFor(connection, viewerId);
  // A non-member gets the same answer as a stranger: false. Never throw and
  // never distinguish "not a member" from "not allowed" — that difference is
  // an oracle for probing whether a connection exists.
  const canView = partnerId ? canViewProfileIn(connection, viewerId, partnerId) : false;
  return { connection, partnerId, canView };
};

/**
 * Load a connection and resolve a partner's display name.
 *
 * @param {string} alignmentId
 * @param {string} viewerId
 * @param {string} [partnerId]  avoids a lookup when the caller already has it
 * @param {{ name?: string }} [partnerUser]  avoids a lookup when already loaded
 * @returns {Promise<string>}
 */
export const displayNameFor = async (alignmentId, viewerId, partnerId, partnerUser) => {
  const connection = await Alignment.findById(alignmentId).lean();
  if (!connection) return ANONYMOUS_LABEL;

  const partner = partnerId ? String(partnerId) : partnerIdFor(connection, viewerId);
  if (!partner) return ANONYMOUS_LABEL;

  const alias = aliasFor(connection, partner);
  if (alias) return alias;

  if (canViewProfileIn(connection, viewerId, partner)) {
    const name = partnerUser?.name;
    if (typeof name === 'string' && name.trim()) return name.trim();
  }

  return ANONYMOUS_LABEL;
};

/**
 * Build the grant rows a brand-new connection starts with.
 *
 * The asymmetry is the feature. Entering Roulette with "show my profile" ON
 * grants your partner access to YOUR profile and grants nobody access to
 * theirs — visibility is something you give, not something you receive.
 *
 * @param {{ _id: string }} viewer   the person creating the connection
 * @param {string} partnerId
 * @param {boolean} viewerShowsProfile
 * @returns {Array<object>} zero or one grant
 */
export const grantsForNewConnection = (viewer, partnerId, viewerShowsProfile) => {
  if (!viewerShowsProfile) return [];
  return [
    {
      viewerId: String(partnerId),
      subjectId: String(viewer._id),
      source: 'roulette_visible',
      grantedAt: new Date(),
    },
  ];
};

/**
 * The grants to write when both parties consent to share profiles.
 *
 * Always exactly two, in both directions — a mutual reveal that only
 * unhid one person would be a bug, not a partial success.
 *
 * @param {string} a
 * @param {string} b
 * @returns {Array<object>}
 */
export const grantsForMutualReveal = (a, b) => {
  const now = new Date();
  return [
    { viewerId: String(a), subjectId: String(b), source: 'roulette_reveal', grantedAt: now },
    { viewerId: String(b), subjectId: String(a), source: 'roulette_reveal', grantedAt: now },
  ];
};

/**
 * 🧪 PARTNER VIEW — the privacy contract, proven.
 *
 * These cover the pure functions, so the whole file runs with NO database and
 * NO server. That is deliberate: the rule is "no grant means no access", and a
 * rule that can only be tested against a live database is a rule that will not
 * get tested.
 *
 *   node --test server/tests/unit/
 *
 * Design source: ambitions/roulette.md §4, §16.3
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ANONYMOUS_LABEL,
  partnerIdFor,
  hasGrant,
  canViewProfileIn,
  aliasFor,
  displayNameIn,
  grantsForNewConnection,
  grantsForMutualReveal,
} from '../../utils/partnerView.js';

/* Fixtures use ids that read like real ObjectIds but are plain strings — the
 * functions compare with String(), so shape is all that matters here. */
const A = 'aaaaaaaaaaaaaaaaaaaaaaaa';
const B = 'bbbbbbbbbbbbbbbbbbbbbbbb';

const grant = (viewerId, subjectId, source = 'roulette_reveal') => ({
  viewerId,
  subjectId,
  source,
  grantedAt: new Date(0),
});

/** A legacy connection as the backfill migration would leave it. */
const legacyConnection = () => ({
  users: [A, B],
  source: 'deck',
  profileGrants: [grant(B, A, 'legacy'), grant(A, B, 'legacy')],
});

/** A hidden Roulette connection: names recorded, no access granted. */
const hiddenConnection = () => ({
  users: [A, B],
  source: 'roulette',
  profileGrants: [],
  conversationAliases: [{ userId: A, alias: 'Moonwalker' }, { userId: B, alias: 'Kite' }],
});

/* ═══════════════════════════════════════════════════════════════════════════
 * THE INVARIANT
 * ═══════════════════════════════════════════════════════════════════════════ */

test('no grants means no access, in both directions', () => {
  const c = hiddenConnection();
  assert.equal(canViewProfileIn(c, A, B), false);
  assert.equal(canViewProfileIn(c, B, A), false);
});

test('an empty profileGrants array grants nothing', () => {
  assert.equal(canViewProfileIn({ users: [A, B], profileGrants: [] }, A, B), false);
});

test('a missing profileGrants field grants nothing', () => {
  assert.equal(canViewProfileIn({ users: [A, B] }, A, B), false);
});

test('a malformed profileGrants value grants nothing rather than throwing', () => {
  for (const bad of [null, undefined, 'nope', 42, {}, [null], [undefined], [{}]]) {
    const c = { users: [A, B], profileGrants: bad };
    assert.equal(
      canViewProfileIn(c, A, B),
      false,
      `profileGrants=${JSON.stringify(bad)} must not grant access`,
    );
  }
});

test('a grant naming only half the pair does not grant the other direction', () => {
  const c = { users: [A, B], profileGrants: [grant(B, A, 'roulette_visible')] };
  assert.equal(canViewProfileIn(c, B, A), true, 'B may see A');
  assert.equal(canViewProfileIn(c, A, B), false, 'A may NOT see B');
});

/* ═══════════════════════════════════════════════════════════════════════════
 * EXISTING DECK CONNECTIONS MUST NOT REGRESS
 * ═══════════════════════════════════════════════════════════════════════════ */

test('backfilled deck connection still shows real names both ways', () => {
  const c = legacyConnection();
  assert.equal(canViewProfileIn(c, A, B), true);
  assert.equal(canViewProfileIn(c, B, A), true);
  assert.equal(displayNameIn(c, A, { name: 'Priya' }), 'Priya');
  assert.equal(displayNameIn(c, B, { name: 'Arjun' }), 'Arjun');
});

test('a deck connection with no aliases falls through to the real name', () => {
  const c = legacyConnection();
  assert.equal(aliasFor(c, B), null);
  assert.equal(displayNameIn(c, A, { name: 'Priya' }), 'Priya');
});

/* ═══════════════════════════════════════════════════════════════════════════
 * THE ASYMMETRIC MATRIX
 * ═══════════════════════════════════════════════════════════════════════════ */

test('visible + hidden grants exactly one direction', () => {
  // A entered Roulette with "show my profile" ON; B did not.
  const c = {
    users: [A, B],
    source: 'roulette',
    profileGrants: [grant(B, A, 'roulette_visible')],
    conversationAliases: [{ userId: A, alias: 'Open Book' }, { userId: B, alias: 'Quiet' }],
  };
  assert.equal(canViewProfileIn(c, B, A), true, 'hidden B may view visible A');
  assert.equal(canViewProfileIn(c, A, B), false, 'visible A may NOT view hidden B');
  assert.equal(displayNameIn(c, B, { name: 'Priya' }), 'Open Book');
});

test('mutual reveal opens both directions and writes exactly two grants', () => {
  const grants = grantsForMutualReveal(A, B);
  assert.equal(grants.length, 2, 'exactly two — one per direction');
  assert.equal(canViewProfileIn({ users: [A, B], profileGrants: grants }, A, B), true);
  assert.equal(canViewProfileIn({ users: [A, B], profileGrants: grants }, B, A), true);

  const toA = grants.filter((g) => g.subjectId === A);
  const toB = grants.filter((g) => g.subjectId === B);
  assert.equal(toA.length, 1);
  assert.equal(toB.length, 1);
  for (const g of grants) assert.equal(g.source, 'roulette_reveal');
});

test('grantsForNewConnection returns nothing when the user hides their profile', () => {
  assert.deepEqual(grantsForNewConnection({ _id: A }, B, false), []);
});

test('grantsForNewConnection gives the partner access, never the creator', () => {
  const grants = grantsForNewConnection({ _id: A }, B, true);
  assert.equal(grants.length, 1);
  assert.equal(grants[0].subjectId, A, 'the creator is the one exposed');
  assert.equal(grants[0].viewerId, B);
});

/* ═══════════════════════════════════════════════════════════════════════════
 * DISPLAY NAMES
 * ═══════════════════════════════════════════════════════════════════════════ */

test('hidden connection shows the alias, never the real name', () => {
  const c = hiddenConnection();
  // conversationAliases records "this user is called this BY THE OTHER PARTY",
  // so A's alias is what B sees, and B's alias is what A sees.
  assert.equal(displayNameIn(c, A, { name: 'Priya' }), 'Kite', 'A sees B as Kite');
  assert.equal(displayNameIn(c, B, { name: 'Arjun' }), 'Moonwalker', 'B sees A as Moonwalker');
});

test('the real name is never returned when access is not granted', () => {
  const c = hiddenConnection();
  for (const [viewer, partner, realName] of [
    [A, B, 'Priya'],
    [B, A, 'Arjun'],
  ]) {
    const shown = displayNameIn(c, viewer, { name: realName });
    assert.notEqual(shown, realName, `${realName} must not appear for an unauthorised viewer`);
  }
});

test('alias wins over the real name even after a mutual reveal', () => {
  const c = { ...hiddenConnection(), profileGrants: grantsForMutualReveal(A, B) };
  assert.equal(displayNameIn(c, A, { name: 'Priya' }), 'Kite', 'list keeps the chosen name');
  assert.equal(canViewProfileIn(c, A, B), true, 'but the real profile is now reachable');
});

test('no alias and no grant yields the anonymous label', () => {
  const c = { users: [A, B], source: 'roulette', profileGrants: [] };
  assert.equal(displayNameIn(c, A, { name: 'Priya' }), ANONYMOUS_LABEL);
});

test('a granted user with no loaded user doc still does not leak', () => {
  const c = legacyConnection();
  assert.equal(displayNameIn(c, A, undefined), ANONYMOUS_LABEL);
  assert.equal(displayNameIn(c, A, null), ANONYMOUS_LABEL);
  assert.equal(displayNameIn(c, A, {}), ANONYMOUS_LABEL);
});

test('a blank or whitespace name is treated as absent', () => {
  const c = legacyConnection();
  for (const blank of ['', '   ', '\t\n']) {
    assert.equal(displayNameIn(c, A, { name: blank }), ANONYMOUS_LABEL);
  }
});

test('a blank alias is ignored and the chain continues', () => {
  const c = {
    users: [A, B],
    profileGrants: grantsForMutualReveal(A, B),
    conversationAliases: [{ userId: B, alias: '   ' }],
  };
  assert.equal(aliasFor(c, B), null);
  assert.equal(displayNameIn(c, A, { name: 'Priya' }), 'Priya');
});

/* ═══════════════════════════════════════════════════════════════════════════
 * DEGENERATE AND HOSTILE INPUT
 * ═══════════════════════════════════════════════════════════════════════════ */

test('a non-member viewer is denied rather than told they are not a member', () => {
  const c = legacyConnection();
  const outsider = 'zzzzzzzzzzzzzzzzzzzzzzzz';
  assert.equal(canViewProfileIn(c, outsider, A), false);
  assert.equal(displayNameIn(c, outsider, { name: 'Priya' }), ANONYMOUS_LABEL);
});

test('a one-sided or three-sided connection is denied, not guessed', () => {
  const outsider = 'zzzzzzzzzzzzzzzzzzzzzzzz';
  for (const users of [[A], [A, B, outsider], []]) {
    const c = { users, profileGrants: grantsForMutualReveal(A, B) };
    assert.equal(canViewProfileIn(c, A, B), false);
    assert.equal(displayNameIn(c, A, { name: 'Priya' }), ANONYMOUS_LABEL);
  }
});

test('a user cannot be granted their own profile', () => {
  const c = { users: [A, B], profileGrants: [grant(A, A)] };
  assert.equal(canViewProfileIn(c, A, B), false, 'self-subject resolves to the partner');
  assert.equal(hasGrant(c, A, A), true, 'the raw grant does exist — the guard is at the pair level');
});

test('object-id instances and strings compare equal', () => {
  const objectIdLike = { toString: () => A, toHexString: () => A };
  const c = legacyConnection();
  assert.equal(canViewProfileIn(c, objectIdLike, B), true);
});

test('grant entries missing viewer or subject do not throw or match', () => {
  const c = { users: [A, B], profileGrants: [{}, { source: 'legacy' }, grant(undefined, A)] };
  assert.equal(canViewProfileIn(c, B, A), false);
  assert.doesNotThrow(() => displayNameIn(c, A, { name: 'Priya' }));
});

/* ═══════════════════════════════════════════════════════════════════════════
 * SCOPE — the resolver is about CONNECTIONS, not global reach
 * ═══════════════════════════════════════════════════════════════════════════ */

test('a deck grant does not imply roulette access', () => {
  // Same two people, connected via the Deck, now meet in Roulette. The grant
  // from the deck connection stands on THAT connection only — a new hidden
  // roulette connection starts with nothing.
  const deck = legacyConnection();
  const roulette = { users: [A, B], source: 'roulette', profileGrants: [] };

  assert.equal(canViewProfileIn(deck, A, B), true, 'deck connection unchanged');
  assert.equal(canViewProfileIn(roulette, A, B), false, 'roulette connection still hidden');
  assert.equal(roulette.source, 'roulette', 'the newer flow does not rewrite provenance');
});

test('source alone never authorises anything', () => {
  for (const source of ['deck', 'roulette']) {
    const c = { users: [A, B], source, profileGrants: [] };
    assert.equal(
      canViewProfileIn(c, A, B),
      false,
      `source:'${source}' with no grants must not grant access`,
    );
  }
});

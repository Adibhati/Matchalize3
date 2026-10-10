/**
 * 🔒 COLLEGE DOMAIN MATCHING — the whole verification boundary.
 *
 * An email is "college X's address" only when the domain after the @ is either
 * EXACTLY one of X's registered domains, or a subdomain of one (separated by a
 * real dot, so every IIT Bombay department address works from a single entry).
 *
 * ⚠️ WHY THIS FILE IS DELICATE
 *
 * A naive `endsWith` check accepts `attacker@iitb.ac.in.evil.com`, because
 * that string DOES end with "iitb.ac.in". The attacker owns `evil.com`, catches
 * the OTP, and is now a verified student. The dot-boundary requirement in
 * `domainMatches` is the only thing standing between that and a breach.
 *
 * Previously this lived as string-slicing in routes/auth.js — "take the label
 * immediately before .ac.in" — which was both wrong for any non-.ac.in domain
 * and forgeable. It is gone.
 */

/**
 * Strip an email down to its bare domain, or null if it isn't parseable.
 *
 * Deliberately strict: exactly one "@", something either side, no spaces. A
 * loose parser here is a security hole.
 *
 * @param {string} email
 * @returns {string|null} lowercased domain without a leading @
 */
export function extractDomain(email) {
  if (typeof email !== 'string') return null;
  const trimmed = email.trim().toLowerCase();
  const parts = trimmed.split('@');
  if (parts.length !== 2) return null;

  const [local, domain] = parts;
  if (!local || !domain) return null;
  if (/\s/.test(trimmed)) return null;
  // A domain needs at least one dot and no empty labels. Rejects "a@b" and
  // "x@iitb.ac.in@" style inputs that a lenient parser would wave through.
  if (!domain.includes('.')) return null;
  if (domain.startsWith('.') || domain.endsWith('.') || domain.includes('..')) return null;
  if (!/^[a-z0-9.-]+$/.test(domain)) return null;

  return domain;
}

/**
 * Does `domain` belong to `approved`?
 *
 * Exact match, or a subdomain of it. "Subdomain" means the remainder sits
 * behind a dot, which is the entire security property:
 *
 *   iitb.ac.in              === iitb.ac.in              → true
 *   cse.iitb.ac.in          endsWith .iitb.ac.in       → true
 *   notiitb.ac.in           endsWith .iitb.ac.in? NO   → false
 *   iitb.ac.in.evil.com     endsWith .iitb.ac.in? NO   → false
 *
 * @param {string} domain   already extracted, lowercased
 * @param {string} approved registered domain, lowercased, no @
 * @returns {boolean}
 */
export function domainMatches(domain, approved) {
  if (!domain || !approved) return false;
  const d = domain.toLowerCase();
  const a = approved.toLowerCase().replace(/^@/, '').trim();
  if (!a) return false;
  if (d === a) return true;
  return d.endsWith(`.${a}`);
}

/**
 * Full check: does this email address match ANY of these approved domains?
 *
 * @param {string} email
 * @param {string[]} approvedDomains
 * @returns {boolean}
 */
export function emailMatchesCollege(email, approvedDomains) {
  const domain = extractDomain(email);
  if (!domain || !Array.isArray(approvedDomains) || approvedDomains.length === 0) return false;
  return approvedDomains.some((d) => domainMatches(domain, d));
}

/**
 * The best (longest) matching domain, for storing a sensible `collegeCode`
 * hint on an OTP record. Longest wins so `cse.iitb.ac.in` beats `iitb.ac.in`
 * when a college registers both.
 *
 * @param {string} email
 * @param {string[]} approvedDomains
 * @returns {string|null}
 */
export function matchDomain(email, approvedDomains) {
  const domain = extractDomain(email);
  if (!domain || !Array.isArray(approvedDomains)) return null;
  const hits = approvedDomains
    .map((a) => ({ a: a.toLowerCase().replace(/^@/, '').trim(), ok: domainMatches(domain, a) }))
    .filter((x) => x.ok)
    .sort((x, y) => y.a.length - x.a.length);
  return hits.length ? hits[0].a : null;
}

/**
 * Normalise a domain for storage: lowercase, no @, no leading/trailing dot.
 * Returns null for anything that can't be a domain, so callers can reject it.
 *
 * @param {string} raw
 * @returns {string|null}
 */
export function normaliseDomain(raw) {
  if (typeof raw !== 'string') return null;
  const d = raw.trim().toLowerCase().replace(/^@/, '').replace(/^\.+|\.+$/g, '');
  if (!d || !d.includes('.') || /[^a-z0-9.-]/.test(d) || d.includes('..')) return null;
  return d;
}
import mongoose from 'mongoose';
import College from '../models/College.js';
import { getAllowedColleges } from './campusGate.js';

/**
 * 🏫 BOOT-TIME CAMPUS SEED.
 *
 * Why this exists: on a free Render plan there is no shell, so there is no way
 * to run a script against the database the first time. That collides with the
 * app's own design — the college picker reads from the `colleges` collection,
 * so an empty database means an empty picker, which means no signup, which
 * means there is no account that could ever reach /admin to add the first
 * college. The two halves each need the other to exist first.
 *
 * Seeding at boot breaks that cycle: the service comes up with a usable campus
 * already present, and /admin becomes reachable the moment an operator logs in.
 *
 * ── WHAT IT DELIBERATELY DOES NOT DO ────────────────────────────────────────
 * It inserts MISSING colleges only. It never updates or overwrites an existing
 * row, because an existing row means an operator has already seen it and may
 * have corrected its name, domains or coordinates from /admin. A boot seed that
 * "ensured" its own values would silently undo that edit on every deploy — and
 * it would do it silently, which is the worst time for it to happen.
 *
 * ── WHY IT IS TIED TO ALLOWED_COLLEGES ──────────────────────────────────────
 * The catalogue below is a fixed list of real campuses, but seeding them all
 * would repopulate a picker that is meant to show one campus during the pilot.
 * Reading the gate means the set of campuses that exists and the set that can
 * sign up can never drift apart: open a campus by adding its code to
 * ALLOWED_COLLEGES, and it exists. Nothing else to remember.
 */

/**
 * Known campuses, keyed by `College.code`.
 *
 * Domains are the whole verification mechanism, so they must be the real
 * institutional domains — `iitb.ac.in` covers every department address via
 * exact-or-subdomain matching (see utils/collegeDomain.js), so no per-department
 * list is needed.
 *
 * latLng is the campus location, not a student's: it is a building's published
 * coordinates and carries none of the privacy weight of User.currentLatLng.
 * Optional in the schema — without it, students at that campus simply rank as
 * "unknown location" rather than being guessed at.
 */
const CATALOGUE = {
  iitb: {
    name: 'Indian Institute of Technology Bombay',
    domains: ['iitb.ac.in'],
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    latLng: [19.124, 72.914],
  },
  iitd: {
    name: 'Indian Institute of Technology Delhi',
    domains: ['iitd.ac.in'],
    city: 'New Delhi',
    state: 'Delhi',
    country: 'India',
    latLng: [28.545, 77.192],
  },
  iitk: {
    name: 'Indian Institute of Technology Kanpur',
    domains: ['iitk.ac.in'],
    city: 'Kanpur',
    state: 'Uttar Pradesh',
    country: 'India',
    latLng: [26.487, 80.331],
  },
  iitkgp: {
    name: 'Indian Institute of Technology Kharagpur',
    domains: ['iitkgp.ac.in'],
    city: 'Kharagpur',
    state: 'West Bengal',
    country: 'India',
    latLng: [22.256, 87.232],
  },
  iitm: {
    name: 'Indian Institute of Technology Madras',
    domains: ['iitm.ac.in'],
    city: 'Chennai',
    state: 'Tamil Nadu',
    country: 'India',
    latLng: [12.991, 80.235],
  },
  iitr: {
    name: 'Indian Institute of Technology Roorkee',
    domains: ['iitr.ac.in'],
    city: 'Roorkee',
    state: 'Uttarakhand',
    country: 'India',
    latLng: [29.869, 80.312],
  },
  iitg: {
    name: 'Indian Institute of Technology Guwahati',
    domains: ['iitg.ac.in'],
    city: 'Guwahati',
    state: 'Assam',
    country: 'India',
    latLng: [26.144, 91.736],
  },
  iith: {
    name: 'Indian Institute of Technology Hyderabad',
    domains: ['iith.ac.in'],
    city: 'Hyderabad',
    state: 'Telangana',
    country: 'India',
    latLng: [17.593, 78.271],
  },
  iitbhu: {
    name: 'Indian Institute of Technology (BHU) Varanasi',
    domains: ['iitbhu.ac.in'],
    city: 'Varanasi',
    state: 'Uttar Pradesh',
    country: 'India',
    latLng: [25.135, 83.0],
  },
  iitism: {
    name: 'Indian Institute of Technology (ISM) Dhanbad',
    domains: ['iitism.ac.in'],
    city: 'Dhanbad',
    state: 'Jharkhand',
    country: 'India',
    latLng: [23.815, 86.436],
  },
};

/**
 * Insert any gated campus that is missing.
 *
 * Never throws. A seed that prevents the server from booting would be strictly
 * worse than an empty picker: the app is a social network, and it still works
 * for every already-registered campus if this quietly does nothing. It logs what
 * it did and returns what it created.
 *
 * @returns {Promise<{created: string[], skipped: string[]}>}
 */
export const seedGatedColleges = async () => {
  const result = { created: [], skipped: [] };

  const allowed = getAllowedColleges();
  if (allowed === null) {
    // No gate configured — the pre-pilot behaviour is every active college can
    // sign up, and seeding the whole catalogue would quietly pre-load ten
    // campuses nobody asked for. Nothing to do.
    return result;
  }

  for (const code of allowed) {
    const record = CATALOGUE[code];
    if (!record) {
      // A gated code with no catalogue entry is an operator error worth
      // shouting about: the campus is allowed to sign up but nothing can tell
      // the picker what it is called or which domains to verify against.
      console.error(
        `⚠️  ALLOWED_COLLEGES includes "${code}", which is not in the campus catalogue. ` +
        `Add it to CATALOGUE in server/utils/campusSeed.js, or add the campus from /admin.`,
      );
      continue;
    }

    try {
      // insertOne would throw E11000 on the unique code index if a concurrent
      // instance seeded first — which is exactly what happens on a rolling
      // deploy with two instances briefly running. updateOne with upsert is
      // idempotent and needs no error handling.
      const res = await College.updateOne(
        { code },
        { $setOnInsert: { code, ...record, active: true } },
        { upsert: true },
      );

      if (res.upsertedCount > 0) {
        result.created.push(code);
        console.log(`🏫 Seeded campus "${record.name}" (${code}) from ALLOWED_COLLEGES.`);
      } else {
        result.skipped.push(code);
      }
    } catch (err) {
      console.error(`⚠️  Could not seed campus "${code}": ${err.message}`);
    }
  }

  if (result.created.length > 0) {
    console.log(
      `🏫 Boot seed created ${result.created.length} campus(es): ${result.created.join(', ')}. ` +
      `Sign up at / with an email on that domain, then open /admin.`,
    );
  }

  return result;
};

export default seedGatedColleges;
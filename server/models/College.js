import mongoose from 'mongoose';

/**
 * 🏫 COLLEGE — a campus that students can be verified against.
 *
 * Lives in the database, not in source code: an operator adds a campus from
 * /admin without a deploy. The frontend never hardcodes a college.
 *
 * The `domains` array is the entire verification mechanism. A college with no
 * domain cannot be saved (see the route-level validation) because a college
 * without a domain would have nothing to check an email against — and would
 * therefore accept anyone.
 */
const collegeSchema = new mongoose.Schema(
  {
    // Short internal key stored on every user (`User.collegeCode`). NOT shown
    // to users — they search the full `name`. Never editable once users exist:
    // renaming the key would split one campus into two in the user data.
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 2,
      maxlength: 30,
      match: [/^[a-z0-9-]+$/, 'Code must be lowercase letters, numbers and dashes only'],
    },

    // Full official name — this is what users type to search ("Indian
    // Institute of Technology Bombay"). Not a short/abbreviated name, so a
    // typed official name always matches.
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    // One or more official mail domains. Stored WITHOUT a leading @ and
    // lowercased. Matching is exact-or-subdomain (see utils/collegeDomain.js),
    // so `cse.iitb.ac.in` validates against `iitb.ac.in` without every
    // department domain having to be listed here.
    domains: {
      type: [String],
      required: true,
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: 'A college needs at least one email domain, otherwise anyone could verify as a student there',
      },
    },

    // Search helpers only. Displayed on the card when present, but they exist
    // so someone who knows "Delhi" can still find their campus.
    city: { type: String, trim: true, default: '', maxlength: 100 },
    state: { type: String, trim: true, default: '', maxlength: 100 },
    country: { type: String, trim: true, default: '', maxlength: 100 },

    // 📍 Where this campus actually is, as [latitude, longitude].
    //
    // OPTIONAL by design. Without it a college still works completely — it just
    // has no position, so distance banding treats anyone at it as "unknown
    // location" and sorts them last rather than guessing. That is the honest
    // failure, and it means adding campuses to the picker never blocks on this
    // field being filled in.
    //
    // This is campus data, not user data: it is a building's location, published
    // information, and carries none of the privacy weight of a person's own
    // coordinates. That asymmetry is the reason distance ranking is viable at
    // all — see models/User.js `currentLatLng`.
    latLng: {
      type: [Number],
      default: undefined,
      validate: {
        validator: (v) => v === undefined || v === null
          || (Array.isArray(v)
            && v.length === 2
            && v.every((n) => Number.isFinite(n))
            && v[0] >= -90 && v[0] <= 90
            && v[1] >= -180 && v[1] <= 180),
        message: 'latLng must be [latitude, longitude] with latitude in -90..90 and longitude in -180..180',
      },
    },

    // Hiding a college blocks NEW signups and hides it from the picker, but
    // never touches students already verified through it. Deactivation is a
    // data-correction tool, not a punishment — see routes/colleges.js.
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Case-insensitive search across the fields a student is likely to know.
collegeSchema.index({ name: 1 });
collegeSchema.index({ city: 1 });
collegeSchema.index({ state: 1 });

export default mongoose.model('College', collegeSchema);
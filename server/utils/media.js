/**
 * 🔐 MEDIA OWNERSHIP
 *
 * Every upload this app makes is traceable back to the user who uploaded it:
 *
 *   Cloudinary → matchalize/photos/<userId>/<file>   (prod)
 *                matchalize/audio/<userId>/<file>
 *   Local disk  → /uploads/<userId>-<timestamp>.<ext> (dev fallback)
 *
 * Both layouts put the uploader's id in the path, so ownership can be proven
 * from the URL alone. That matters because a URL is user-supplied data: any
 * authenticated user can POST someone else's photo URL into their own profile.
 * Without this check, saving/swapping/deleting a profile would tell the delete
 * helper to destroy a file belonging to somebody else.
 *
 * Cloudinary holds every user's media in ONE account with ONE API secret, so
 * "I have the secret" is not ownership. The folder is the only real proof.
 */

/**
 * A Cloudinary delivery URL is laid out as:
 *
 *   .../<resource_type>/upload/<transformations>/v<version>/<public_id>.<ext>
 *                                          └──────┬──────┘
 *                          everything after this marker is the public_id path,
 *                          i.e. FOLDERS — and is never guessable
 *
 * The bug this guards against: `f_images` is shaped exactly like a
 * transformation parameter (`f` + `_` + `images`), so a naive "delete anything
 * that looks like a transform" filter cannot tell a real folder from a
 * formatting instruction and will eat the folder. That yields a mangled
 * public_id, which then fails isCloudinaryFileOwnedBy() below, so the delete is
 * refused rather than wrongly performed — but the file is then never cleaned up.
 *
 * The invariant that makes this safe: transformation segments only ever appear
 * BEFORE the version marker, never after. So strip transformations only in that
 * position and leave everything after it untouched.
 *
 * Note this is a strict tightening — it strips strictly less than a naive
 * filter would, so a parse failure can only cause a *refused* delete (safe
 * leak), never destruction of someone else's file. That direction matters:
 * this function backs the ownership guard in config/cloudinary.js.
 *
 * ⚠️ This is the single source of truth for ownership. Weaken it and the guard
 * in config/cloudinary.js weakens with it. If you're ever tempted to make this
 * more permissive to fix a "cleanup didn't work" bug, the correct fix is to
 * store public_id at upload time and stop parsing URLs entirely.
 */
export const extractCloudinaryPublicId = (url) => {
  if (!url || typeof url !== 'string' || !url.includes('cloudinary.com')) return null;
  try {
    const uploadIdx = url.indexOf('/upload/');
    if (uploadIdx === -1) return null;
    const segments = url.slice(uploadIdx + '/upload/'.length).split('/');

    // Transformations only ever appear before the version marker, so anything at
    // or after that marker is public_id path — folders included — and is kept.
    //
    // If there is no version marker at all the URL isn't in the shape we can
    // parse safely. Rather than rejecting it (which would break a user's own
    // legitimate photo) strip nothing: the ownership check downstream will then
    // simply refuse to act on it, which is a safe outcome. Upload responses
    // from Cloudinary always include a version, so this is a fallback, not the
    // normal path.
    const versionIdx = segments.findIndex((seg) => /^v\d+$/.test(seg));

    const publicSegments = segments.filter((seg, i) => {
      if (i === versionIdx) return false; // version marker, never part of the id
      if (versionIdx !== -1 && i < versionIdx && /^[a-z]{1,4}_[a-z0-9.:]+(,[a-z]{1,4}_[a-z0-9.:]+)*$/i.test(seg)) {
        return false;
      }
      return true;
    });

    const publicId = publicSegments.join('/').replace(/\.[a-z]+$/i, '');
    return publicId || null;
  } catch {
    return null;
  }
};

/** True when this Cloudinary file sits in the given user's own folder. */
export const isCloudinaryFileOwnedBy = (url, userId) => {
  if (!userId) return false;
  const publicId = extractCloudinaryPublicId(url);
  if (!publicId) return false;
  return publicId.startsWith(`matchalize/photos/${userId}/`) ||
         publicId.startsWith(`matchalize/audio/${userId}/`);
};

/** True when this is a local dev-fallback upload made by the given user. */
export const isLocalFileOwnedBy = (url, userId) => {
  if (!userId || !url || typeof url !== 'string') return false;
  try {
    const { pathname } = new URL(url);
    const match = pathname.match(/^\/uploads\/([a-f0-9]{24})-[^/]+$/i);
    return !!match && match[1] === userId.toString();
  } catch {
    return false;
  }
};

/**
 * Is this media URL provably this user's own upload?
 * Local disk and per-user Cloudinary folders both qualify. Unsplash placeholders
 * are intentionally NOT "owned" — they live on someone else's CDN and this app
 * can never delete them, so ownership is meaningless for them.
 */
export const isOwnedMediaUrl = (url, userId) => {
  if (!userId || !url || typeof url !== 'string') return false;
  return isCloudinaryFileOwnedBy(url, userId) || isLocalFileOwnedBy(url, userId);
};

/**
 * External placeholder images (seed/demo profiles). Allowed in profiles because
 * they are read-only stock photos, but never treated as deletable assets.
 */
export const isExternalPlaceholderUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  try {
    const { hostname } = new URL(url);
    return hostname === 'images.unsplash.com';
  } catch {
    return false;
  }
};

/**
 * A profile/chat media URL is acceptable if it is the user's own upload or a
 * known external placeholder. Anything else — notably another user's file — is
 * rejected so it can never reach a delete call.
 */
export const isAcceptableMediaUrl = (url, userId) =>
  isOwnedMediaUrl(url, userId) || isExternalPlaceholderUrl(url);

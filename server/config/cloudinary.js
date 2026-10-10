import { v2 as cloudinary } from 'cloudinary';
import { extractCloudinaryPublicId, isCloudinaryFileOwnedBy } from '../utils/media.js';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * 🧹 CLOUDINARY CLEANUP HELPER
 *
 * Destroys a Cloudinary file. URLs reach this function from user-supplied data
 * (profile photos, bio photo, prompt images), so a caller can hand us a URL
 * that belongs to somebody else. Since every user's media lives in one Cloudinary
 * account under one API secret, the secret proves nothing — so ownership is
 * checked against the per-user upload folder, and a file that is not the
 * caller's is refused.
 *
 * @param url       the Cloudinary URL to destroy
 * @param userId    the user the file must belong to. Required unless `force`.
 * @param opts.force set only for server-trusted cleanup (e.g. the signed
 *                  moderation webhook), where the URL came from Cloudinary
 *                  itself rather than a client.
 */
export const deleteCloudinaryFile = async (url, userId, opts = {}) => {
  if (!url || typeof url !== 'string' || !url.includes('cloudinary.com')) return;

  if (!opts.force && !isCloudinaryFileOwnedBy(url, userId)) {
    console.warn(`[Cloudinary Cleanup] REFUSED to destroy a file not owned by ${userId}: ${extractCloudinaryPublicId(url)}`);
    return;
  }

  try {
    const publicId = extractCloudinaryPublicId(url);
    if (!publicId) return;
    const isAudioOrVideo = /\.(webm|mp3|wav|mp4|m4a|ogg)$/i.test(url);

    await cloudinary.uploader.destroy(publicId, {
      resource_type: isAudioOrVideo ? 'video' : 'image',
    });
    console.log(`[Cloudinary Cleanup] Destroyed orphaned artifact: ${publicId}`);
  } catch (err) {
    console.error('[Cloudinary Cleanup Error]:', err.message || err);
  }
};

export default cloudinary;

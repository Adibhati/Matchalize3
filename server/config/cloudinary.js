import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * 🧹 CLOUDINARY CLEANUP HELPER
 * Extracts the public_id from a Cloudinary URL and permanently destroys the file from cloud storage.
 */
export const deleteCloudinaryFile = async (url) => {
  if (!url || typeof url !== 'string' || !url.includes('cloudinary.com')) return;
  try {
    // Matches path after /upload/(v12345/)? up to the file extension
    const match = url.match(/\/upload\/(?:v\d+\/)?([^\.]+)/);
    if (match && match[1]) {
      const publicId = match[1];
      const isAudioOrVideo = /\.(webm|mp3|wav|mp4|m4a)$/i.test(url);
      
      await cloudinary.uploader.destroy(publicId, {
        resource_type: isAudioOrVideo ? 'video' : 'image',
      });
      console.log(`[Cloudinary Cleanup] Destroyed orphaned artifact: ${publicId}`);
    }
  } catch (err) {
    console.error('[Cloudinary Cleanup Error]:', err.message || err);
  }
};

export default cloudinary;

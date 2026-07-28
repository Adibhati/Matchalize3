import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { protect } from '../middleware/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isCloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET;

let upload;

if (isCloudinaryConfigured) {
  const { v2: cloudinary } = await import('cloudinary');
  const { CloudinaryStorage } = await import('multer-storage-cloudinary');

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  const storage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
      const isAudio = file.mimetype.startsWith('audio/');
      return {
        folder: isAudio ? 'matchalize/audio' : 'matchalize/photos',
        allowed_formats: isAudio
          ? ['mp3', 'mp4', 'm4a', 'webm', 'ogg']
          : ['jpg', 'jpeg', 'png', 'webp'],
        ...(isAudio ? {} : {
          transformation: [{ width: 800, height: 800, crop: 'limit', quality: 'auto' }],
          moderation: 'aws_rek',
        }),
      };
    },
  });

  upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });
} else {
  const storage = multer.diskStorage({
    destination: path.join(__dirname, '..', 'uploads'),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${req.user._id}-${Date.now()}${ext}`);
    },
  });

  upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });
}

const router = express.Router();

router.post('/', protect, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // CHECK: If Cloudinary AI rejected the photo
    if (req.file.moderation && req.file.moderation[0]?.status === 'rejected') {
      return res.status(403).json({ message: 'Photo rejected due to inappropriate content.' });
    }

    const url = isCloudinaryConfigured
      ? req.file.path
      : `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    res.json({ url });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Upload failed' });
  }
});

export default router;

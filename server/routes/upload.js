import crypto from 'crypto';
import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { protect } from '../middleware/auth.js';
import { deleteCloudinaryFile } from '../config/cloudinary.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isCloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET;

const ALLOWED_MIME = /^image\/(jpeg|png|webp)$|^audio\/(mpeg|mp4|webm|ogg|x-m4a)$/;
const ALLOWED_EXT = /\.(jpe?g|png|webp|mp3|m4a|mp4|webm|ogg)$/i;
const fileFilter = (req, file, cb) => {
  if (ALLOWED_EXT.test(file.originalname) && ALLOWED_MIME.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type. Only jpg/png/webp images and mp3/m4a/webm/ogg audio are allowed.'), false);
  }
};

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
      // Per-user folder: the URL is the only durable proof of who owns a file
      // (one Cloudinary account holds everyone's media), so the uploader's id
      // must be part of the path. See utils/media.js.
      return {
        folder: isAudio
          ? `matchalize/audio/${req.user._id}`
          : `matchalize/photos/${req.user._id}`,
        allowed_formats: isAudio
          ? ['mp3', 'mp4', 'm4a', 'webm', 'ogg']
          : ['jpg', 'jpeg', 'png', 'webp'],
        ...(isAudio ? {} : {
          transformation: [{ width: 800, height: 800, crop: 'limit', quality: 'auto' }],
        }),
      };
    },
  });

  upload = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } });
} else {
  const storage = multer.diskStorage({
    destination: path.join(__dirname, '..', 'uploads'),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${req.user._id}-${Date.now()}${ext}`);
    },
  });

  upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });
}

const router = express.Router();

router.post('/', protect, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
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

/**
 * 🔐 CLOUDINARY MODERATION WEBHOOK
 *
 * Cloudinary POSTs here whenever an uploaded asset's moderation status is
 * decided. If it was REJECTED, the asset is destroyed immediately — the whole
 * point is that flagged content never sits in your bucket.
 *
 * AUTHENTICATION: Cloudinary signs each request with
 *   SHA1(rawBody + x-cld-timestamp + CLOUDINARY_API_SECRET)
 * so an attacker cannot forge one without your API secret, which makes the
 * `{ force: true }` destroy below safe. (Force exists because there is no user
 * to check folder ownership against — the URL came from Cloudinary, not a
 * client.)
 *
 * ⚠️ The signature covers the RAW bytes, so this route needs an unparsed body.
 * The `express.raw()` registration lives in index.js, ABOVE the global
 * express.json(), because body-parser refuses to re-parse a request it has
 * already consumed. See the note there — getting that order wrong made this
 * endpoint return 401 for every request and the cleanup never ran once.
 *
 * Rejection is always answered 200 (never 4xx): a non-2xx makes Cloudinary
 * retry, and a retry re-runs the destroy. Only a malformed request gets 400.
 */
router.post('/moderation-status', async (req, res) => {
  const timestamp = req.headers['x-cld-timestamp'];
  const signature = req.headers['x-cld-signature'];
  if (!timestamp || !signature) return res.status(401).json({ message: 'Missing signature' });

  // Defensive: if the raw parser above were ever removed or reordered, req.body
  // would be a parsed object and the digest below would silently never match.
  // Fail loudly instead of quietly 401-ing forever.
  if (!Buffer.isBuffer(req.body)) {
    console.error(
      '[moderation-status] req.body is not a Buffer — the express.raw() registration in index.js must come BEFORE express.json()'
    );
    return res.status(500).json({ message: 'Webhook body was not received raw' });
  }
  const body = req.body.toString();

  // Replay guard: the signature is valid forever without this, so an observed
  // request could be replayed indefinitely. Cloudinary's own docs recommend
  // rejecting stale timestamps. Retries are seconds apart, so a 1h window is
  // generous while still bounding exposure.
  const ts = Number(timestamp);
  const ageMs = Date.now() - ts * 1000;
  if (!Number.isFinite(ts) || ageMs > 3600_000) {
    return res.status(401).json({ message: 'Stale signature' });
  }

  const expected = crypto
    .createHash('sha1')
    .update(body + timestamp + process.env.CLOUDINARY_API_SECRET)
    .digest('hex');

  // Constant-time compare: a plain !== leaks how many leading characters matched
  // through response timing. Cheap to do correctly, so do it.
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(String(signature), 'utf8');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return res.status(401).json({ message: 'Invalid signature' });
  }

  try {
    const payload = JSON.parse(body);
    const status = payload?.moderation?.[0]?.status;
    const url = payload?.secure_url || payload?.url;

    if (status === 'rejected' && url) {
      deleteCloudinaryFile(url, null, { force: true })
        .then(() => res.status(200).json({ received: true }))
        .catch((err) => {
          console.error('Moderation cleanup failed:', err);
          res.status(200).json({ received: true });
        });
      return;
    }
    res.status(200).json({ received: true });
  } catch {
    res.status(400).json({ message: 'Bad payload' });
  }
});

export default router;

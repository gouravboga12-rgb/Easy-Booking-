import express from 'express';
import multer from 'multer';
import { uploadBufferToS3, uploadBase64ToS3 } from '../utils/s3.js';

const router = express.Router();

// Configure multer memory storage (stores file in memory buffer, up to 25MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB max
  },
});

// POST /api/upload - Multipart file upload to S3
router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const folder = req.body.folder || 'media';
    const originalname = req.file.originalname || 'upload.jpg';
    const mimeType = req.file.mimetype || 'image/jpeg';

    const s3Url = await uploadBufferToS3(req.file.buffer, originalname, mimeType, folder);

    return res.status(200).json({
      success: true,
      url: s3Url,
      filename: originalname,
      size: req.file.size,
      mimetype: mimeType,
    });
  } catch (error) {
    console.error('S3 Upload Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to upload file to S3', error: error.message });
  }
});

// POST /api/upload/base64 - Convert Base64 dataURI to S3 URL
router.post('/base64', async (req, res) => {
  try {
    const { base64, folder = 'media' } = req.body;
    if (!base64) {
      return res.status(400).json({ success: false, message: 'No base64 string provided' });
    }

    const s3Url = await uploadBase64ToS3(base64, folder);

    return res.status(200).json({
      success: true,
      url: s3Url,
    });
  } catch (error) {
    console.error('S3 Base64 Upload Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to upload base64 to S3', error: error.message });
  }
});

export default router;

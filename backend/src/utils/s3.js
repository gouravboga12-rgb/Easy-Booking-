import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config();

const region = process.env.AWS_REGION || 'ap-south-2';
const bucket = process.env.AWS_S3_BUCKET_NAME || 'parrowskills-media-bucket';

const s3 = new S3Client({
  region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * Upload a binary buffer to S3 and return the public URL
 */
export async function uploadBufferToS3(buffer, originalname = 'file.jpg', mimeType = 'image/jpeg', folder = 'media') {
  const ext = path.extname(originalname) || '.jpg';
  const randomId = crypto.randomBytes(8).toString('hex');
  const cleanFolder = folder.replace(/^\/+|\/+$/g, '');
  const key = `${cleanFolder}/${Date.now()}-${randomId}${ext}`;

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
  });

  await s3.send(command);

  // Return the public S3 URL
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

/**
 * Automatically detects Base64 strings and uploads them to S3.
 * If the string is already a URL or empty, returns it unchanged.
 */
export async function uploadBase64ToS3(input, folder = 'media') {
  if (!input || typeof input !== 'string') return input;
  
  // If it's already an HTTP/HTTPS URL, no need to re-upload
  if (input.startsWith('http://') || input.startsWith('https://')) {
    return input;
  }

  // Check for base64 data URI format: data:[<mediatype>];base64,<data>
  const match = input.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
  if (!match) {
    // Might be raw base64 string without data: prefix
    try {
      const buffer = Buffer.from(input, 'base64');
      if (buffer.length > 50) { // arbitrary threshold to avoid tiny strings
        return await uploadBufferToS3(buffer, 'image.jpg', 'image/jpeg', folder);
      }
    } catch {
      return input;
    }
    return input;
  }

  const mimeType = match[1];
  const base64Data = match[2];
  const buffer = Buffer.from(base64Data, 'base64');

  let ext = '.jpg';
  if (mimeType === 'image/png') ext = '.png';
  else if (mimeType === 'image/webp') ext = '.webp';
  else if (mimeType === 'image/gif') ext = '.gif';
  else if (mimeType === 'image/svg+xml') ext = '.svg';
  else if (mimeType === 'application/pdf') ext = '.pdf';

  return await uploadBufferToS3(buffer, `upload${ext}`, mimeType, folder);
}

export default s3;

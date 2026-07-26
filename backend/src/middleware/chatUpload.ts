import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { Request } from 'express';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';

const uploadRoot = path.resolve(process.cwd(), env.UPLOAD_DIR);

if (!fs.existsSync(uploadRoot)) {
  fs.mkdirSync(uploadRoot, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (
    _req: Request,
    _file: Express.Multer.File,
    cb: (error: Error | null, destination: string) => void,
  ) => {
    cb(null, uploadRoot);
  },
  filename: (
    _req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, filename: string) => void,
  ) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${unique}${ext}`);
  },
});

const allowedMimeTypes = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'audio/mpeg',
  'audio/mp4',
  'audio/m4a',
  'audio/aac',
  'audio/x-m4a',
  'audio/wav',
  'audio/x-wav',
  'audio/webm',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
];

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
    return;
  }

  const extension = path.extname(file.originalname).toLowerCase();
  const audioExtensions = ['.m4a', '.mp4', '.aac', '.mp3', '.wav', '.3gp', '.amr', '.webm'];
  if (
    file.mimetype === 'application/octet-stream' &&
    audioExtensions.includes(extension)
  ) {
    cb(null, true);
    return;
  }

  cb(
    ApiError.badRequest(
      'Unsupported file type. Allowed: images, PDF, documents, and audio.',
    ),
  );
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024,
  },
});

export const chatUpload = upload.single('attachment');

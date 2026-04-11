import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import { AppError } from './appError.js';

cloudinary.config({
  cloud_name: (process.env.CLOUDINARY_CLOUD_NAME || "").trim(),
  api_key: (process.env.CLOUDINARY_API_KEY || "").trim(),
  api_secret: (process.env.CLOUDINARY_API_SECRET || "").trim(),
});

const allowedFormats = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic', 'heif', 'jfif'];

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'life-on-land',
    allowed_formats: allowedFormats,
    transformation: [{ width: 500, height: 500, crop: 'limit' }],
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (!file?.mimetype || !file.mimetype.startsWith('image/')) {
      return cb(new AppError('Only image uploads are allowed', 400));
    }
    cb(null, true);
  },
});

export { cloudinary, upload };

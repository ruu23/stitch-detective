// Cloudinary configuration for Vercel serverless functions
// This file runs on the server (Vercel) - NOT in the browser

import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dijyk3fhr',
  api_key: process.env.CLOUDINARY_API_KEY || '633876457758628',
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;

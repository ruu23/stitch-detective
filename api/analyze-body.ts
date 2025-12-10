import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDatabase } from './_lib/mongodb';
import cloudinary from './_lib/cloudinary';
import { getAuth } from '@clerk/backend';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { frontImage, sideImage, faceImage, height, weight } = req.body;

    // Upload images to Cloudinary
    const uploadPromises = [];
    
    if (frontImage) {
      uploadPromises.push(
        cloudinary.uploader.upload(frontImage, {
          folder: 'body-scans',
          resource_type: 'auto',
        })
      );
    }
    
    if (sideImage) {
      uploadPromises.push(
        cloudinary.uploader.upload(sideImage, {
          folder: 'body-scans',
          resource_type: 'auto',
        })
      );
    }
    
    if (faceImage) {
      uploadPromises.push(
        cloudinary.uploader.upload(faceImage, {
          folder: 'body-scans',
          resource_type: 'auto',
        })
      );
    }

    const uploadResults = await Promise.all(uploadPromises);

    // Save body scan data to MongoDB
    const db = await getDatabase();
    const collection = db.collection('body_scans');

    const bodyScan = {
      userId,
      frontImageUrl: uploadResults[0]?.secure_url,
      sideImageUrl: uploadResults[1]?.secure_url,
      faceImageUrl: uploadResults[2]?.secure_url,
      height,
      weight,
      // Placeholder for AI analysis results
      bodyShape: 'analyzing',
      skinTone: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await collection.updateOne(
      { userId },
      { $set: bodyScan },
      { upsert: true }
    );

    return res.status(200).json({
      success: true,
      bodyScan,
    });
  } catch (error) {
    console.error('Body analysis error:', error);
    return res.status(500).json({ error: 'Body analysis failed' });
  }
}

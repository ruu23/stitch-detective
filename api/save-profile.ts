import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDatabase } from './_lib/mongodb';
import { getAuth } from '@clerk/backend';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST' && req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const profileData = req.body;

    const db = await getDatabase();
    const collection = db.collection('profiles');

    // Upsert profile
    const result = await collection.updateOne(
      { userId },
      {
        $set: {
          ...profileData,
          userId,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );

    return res.status(200).json({
      success: true,
      modified: result.modifiedCount > 0,
      upserted: result.upsertedCount > 0,
    });
  } catch (error) {
    console.error('Save profile error:', error);
    return res.status(500).json({ error: 'Failed to save profile' });
  }
}

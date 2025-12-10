import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDatabase } from './_lib/mongodb';
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

    const { imageUrl, category, name, color, brand, season, style } = req.body;

    if (!imageUrl || !category) {
      return res.status(400).json({ error: 'Image URL and category are required' });
    }

    const db = await getDatabase();
    const collection = db.collection('closet_items');

    // Save item to MongoDB
    const result = await collection.insertOne({
      userId,
      imageUrl,
      category,
      name: name || 'Untitled Item',
      color,
      brand,
      season,
      style,
      wearCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return res.status(200).json({
      success: true,
      itemId: result.insertedId,
    });
  } catch (error) {
    console.error('Save item error:', error);
    return res.status(500).json({ error: 'Failed to save item' });
  }
}

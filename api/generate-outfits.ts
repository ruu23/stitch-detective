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

    const { occasion, weather, preferences } = req.body;

    const db = await getDatabase();
    
    // Get user's closet items
    const items = await db
      .collection('closet_items')
      .find({ userId })
      .toArray();

    // Get user profile for styling preferences
    const profile = await db
      .collection('profiles')
      .findOne({ userId });

    if (items.length === 0) {
      return res.status(200).json({
        outfits: [],
        message: 'Add items to your closet to get outfit recommendations',
      });
    }

    // Group items by category
    const tops = items.filter(i => i.category === 'tops');
    const bottoms = items.filter(i => i.category === 'bottoms');
    const dresses = items.filter(i => i.category === 'dresses');
    const outerwear = items.filter(i => i.category === 'outerwear');
    const shoes = items.filter(i => i.category === 'shoes');
    const accessories = items.filter(i => i.category === 'accessories');

    // Generate basic outfit combinations
    const outfits = [];

    // Top + Bottom combinations
    for (const top of tops.slice(0, 3)) {
      for (const bottom of bottoms.slice(0, 2)) {
        outfits.push({
          id: `${top._id}-${bottom._id}`,
          name: `${top.name} with ${bottom.name}`,
          items: [top, bottom],
          occasion: occasion || 'casual',
        });
      }
    }

    // Dress outfits
    for (const dress of dresses.slice(0, 2)) {
      outfits.push({
        id: dress._id.toString(),
        name: dress.name,
        items: [dress],
        occasion: occasion || 'casual',
      });
    }

    return res.status(200).json({
      outfits: outfits.slice(0, 5),
      totalItems: items.length,
    });
  } catch (error) {
    console.error('Generate outfits error:', error);
    return res.status(500).json({ error: 'Failed to generate outfit recommendations' });
  }
}

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDatabase } from './_lib/mongodb';
import { getAuth } from '@clerk/backend';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const db = await getDatabase();
    const items = await db
      .collection('closet_items')
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray();

    return res.status(200).json({ items });
  } catch (error) {
    console.error('Fetch error:', error);
    return res.status(500).json({ error: 'Failed to fetch items' });
  }
}

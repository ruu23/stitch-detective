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
    const profile = await db
      .collection('profiles')
      .findOne({ userId });

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    return res.status(200).json({ profile });
  } catch (error) {
    console.error('Fetch profile error:', error);
    return res.status(500).json({ error: 'Failed to fetch profile' });
  }
}

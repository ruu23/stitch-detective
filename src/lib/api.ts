// Frontend API utilities for Vercel serverless functions

export async function uploadImage(imageBase64: string) {
  const response = await fetch('/api/upload-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: imageBase64 }),
  });

  if (!response.ok) throw new Error('Upload failed');
  return response.json();
}

export async function analyzeClosetItem(imageUrl: string, category: string) {
  const response = await fetch('/api/analyze-closet-item', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageUrl, category }),
  });

  if (!response.ok) throw new Error('Analysis failed');
  return response.json();
}

export async function getUserItems() {
  const response = await fetch('/api/get-items');
  if (!response.ok) throw new Error('Failed to fetch items');
  return response.json();
}

export async function generateOutfitRecommendations(data: {
  occasion?: string;
  weather?: string;
  preferences?: Record<string, any>;
}) {
  const response = await fetch('/api/generate-outfits', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) throw new Error('Failed to generate recommendations');
  return response.json();
}

export async function analyzeBodyShape(images: {
  frontImage: string;
  sideImage: string;
  faceImage: string;
}) {
  const response = await fetch('/api/analyze-body', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(images),
  });

  if (!response.ok) throw new Error('Body analysis failed');
  return response.json();
}

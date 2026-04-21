import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

// MongoDB connection
if (!process.env.MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

const uri = process.env.MONGODB_URI;
const options = {};

let client;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise!;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();

    const images = await db
      .collection('meetup_images')
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    // Generate XML sitemap with image information
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>https://mudasirtraders.com/app/meetups</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
    ${images
      .map(
        (img) => `
    <image:image>
      <image:loc>${img.url}</image:loc>
      <image:title>Community Meetup - Mudasir Traders</image:title>
      <image:caption>Community meetup event at Mudasir Traders battery shop in Dera Ghazi Khan</image:caption>
    </image:image>`
      )
      .join('')}
  </url>
</urlset>`;

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error) {
    console.error('Error generating image sitemap:', error);
    return new NextResponse('Error generating sitemap', { status: 500 });
  }
}

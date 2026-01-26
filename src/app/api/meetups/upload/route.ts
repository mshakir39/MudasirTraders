import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import crypto from 'crypto';

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

// Cloudinary signature generation
const generateSignature = (
  params: Record<string, string>,
  apiSecret: string
) => {
  // Sort parameters alphabetically
  const sortedParams = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&');

  // Combine with API secret
  const stringToSign = `${sortedParams}${apiSecret}`;

  // Generate signature
  const signature = crypto
    .createHash('sha1')
    .update(stringToSign)
    .digest('hex');

  return signature;
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('images') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    const uploadedUrls: string[] = [];
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error('Cloudinary configuration is missing');
    }

    // Get MongoDB connection
    const client = await clientPromise;
    const db = client.db();

    for (const file of files) {
      const publicId = `meetups/${Date.now()}-${file.name.split('.')[0]}`;
      const timestamp = Math.floor(Date.now() / 1000).toString();

      // Prepare parameters for signature
      const params = {
        timestamp,
        upload_preset: 'meetup_upload',
        public_id: publicId,
        folder: 'meetups',
      };

      // Generate signature with all parameters
      const signature = generateSignature(params, apiSecret);

      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('upload_preset', 'meetup_upload');
      uploadFormData.append('public_id', publicId);
      uploadFormData.append('api_key', apiKey);
      uploadFormData.append('timestamp', timestamp);
      uploadFormData.append('signature', signature);
      uploadFormData.append('folder', 'meetups');

      // Upload to Cloudinary
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: 'POST',
          body: uploadFormData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error('Cloudinary upload error:', data);
        throw new Error(data.error?.message || 'Upload failed');
      }

      if (data.secure_url) {
        // Save to MongoDB
        try {
          await db.collection('meetup_images').insertOne({
            url: data.secure_url,
            publicId: data.public_id,
            format: data.format,
            width: data.width,
            height: data.height,
            bytes: data.bytes,
            createdAt: new Date(),
          });
          console.log('Saved to MongoDB:', data.public_id);
        } catch (dbError) {
          console.error('Error saving to MongoDB:', dbError);
          // Continue even if MongoDB save fails
        }

        uploadedUrls.push(data.secure_url);
      } else {
        throw new Error('No secure URL returned from Cloudinary');
      }
    }

    return NextResponse.json({
      success: true,
      urls: uploadedUrls,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      {
        error: 'Failed to upload images',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
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

    return NextResponse.json(images);
  } catch (error) {
    console.error('Error fetching images:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch images',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

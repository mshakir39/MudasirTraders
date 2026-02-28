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
    const file = formData.get('image') as File;
    const type = formData.get('type') as string; // 'bill' or 'payment'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!type || !['bill', 'payment'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be "bill" or "payment"' },
        { status: 400 }
      );
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error('Cloudinary configuration is missing');
    }

    // Get MongoDB connection
    const client = await clientPromise;
    const db = client.db();

    // Generate unique public ID
    const folder = type === 'bill' ? 'dealer-bills' : 'dealer-payments';
    const publicId = `${folder}/${Date.now()}-${file.name.split('.')[0]}`;

    // Test with unsigned upload first
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);
    uploadFormData.append('upload_preset', 'dealer_upload'); // Use your created preset
    uploadFormData.append('public_id', publicId);
    uploadFormData.append('folder', folder);

    console.log('Uploading to Cloudinary with:', {
      cloudName,
      publicId,
      folder,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    });

    // Upload to Cloudinary
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: uploadFormData,
      }
    );

    const data = await response.json();
    console.log('Cloudinary response:', { status: response.status, data });

    if (!response.ok) {
      console.error('Cloudinary upload error:', data);
      throw new Error(data.error?.message || data.error || 'Upload failed');
    }

    if (data.secure_url) {
      // Save to MongoDB
      try {
        await db.collection('dealer_images').insertOne({
          url: data.secure_url,
          publicId: data.public_id,
          type: type, // 'bill' or 'payment'
          format: data.format,
          width: data.width,
          height: data.height,
          bytes: data.bytes,
          createdAt: new Date(),
        });
        console.log('Saved dealer image to MongoDB:', data.public_id);
      } catch (dbError) {
        console.error('Error saving to MongoDB:', dbError);
        // Continue even if MongoDB save fails
      }

      return NextResponse.json({
        success: true,
        url: data.secure_url,
        publicId: data.public_id,
      });
    } else {
      throw new Error('No secure URL returned from Cloudinary');
    }
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      {
        error: 'Failed to upload image',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'bill' or 'payment'

    const client = await clientPromise;
    const db = client.db();

    const query = type ? { type } : {};
    const images = await db
      .collection('dealer_images')
      .find(query)
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

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { publicId } = body;

    if (!publicId) {
      return NextResponse.json(
        { error: 'Public ID is required' },
        { status: 400 }
      );
    }

    // Delete from Cloudinary
    const cloudinaryResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/destroy`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${Buffer.from(`${process.env.CLOUDINARY_API_KEY}:${process.env.CLOUDINARY_API_SECRET}`).toString('base64')}`,
        },
        body: JSON.stringify({
          public_id: publicId,
          invalidate: true,
        }),
      }
    );

    if (!cloudinaryResponse.ok) {
      console.error(
        'Cloudinary delete failed:',
        await cloudinaryResponse.text()
      );
      return NextResponse.json(
        { error: 'Failed to delete image from Cloudinary' },
        { status: 500 }
      );
    }

    // Delete from MongoDB
    const client = await clientPromise;
    const db = client.db();
    const result = await db.collection('dealer_images').deleteOne({ publicId });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Image not found in database' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Image deleted successfully',
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error('Error deleting image:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete image',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

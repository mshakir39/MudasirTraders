import { NextRequest, NextResponse } from 'next/server';
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

export async function POST(request: NextRequest) {
  try {
    const { imageUrl } = await request.json();

    if (!imageUrl) {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 });
    }

    // Delete from MongoDB first
    const mongoClient = await clientPromise;
    const db = mongoClient.db();
    
    const deleteResult = await db.collection('meetup_images').deleteOne({
      url: imageUrl
    });

    if (deleteResult.deletedCount === 0) {
      console.log('Image not found in MongoDB:', imageUrl);
    } else {
      console.log('Deleted from MongoDB:', imageUrl);
    }

    // Extract public_id from Cloudinary URL for actual deletion
    console.log('Original imageUrl:', imageUrl);
    
    // Parse the URL to extract the public ID correctly
    // URL format: https://res.cloudinary.com/cloud_name/image/upload/version/folder1/folder2/filename.jpg
    const urlParts = imageUrl.split('/');
    
    // Find the index of 'upload' in the URL
    const uploadIndex = urlParts.indexOf('upload');
    if (uploadIndex === -1 || uploadIndex + 1 >= urlParts.length) {
      console.error('Invalid Cloudinary URL format');
      return NextResponse.json({ error: 'Invalid image URL format' }, { status: 400 });
    }
    
    // Extract everything after the version number (skip upload + version)
    const pathParts = urlParts.slice(uploadIndex + 2);
    const publicId = pathParts.join('/').replace(/\.[^/.]+$/, ''); // Remove file extension
    
    console.log('Extracted publicId:', publicId);

    // Get Cloudinary credentials
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    
    console.log('Cloudinary credentials check:', { 
      hasCloudName: !!cloudName, 
      hasApiKey: !!apiKey, 
      hasApiSecret: !!apiSecret 
    });

    if (cloudName && apiKey && apiSecret) {
      // Generate signature for deletion
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const stringToSign = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
      const signature = require('crypto')
        .createHash('sha1')
        .update(stringToSign)
        .digest('hex');

      // Delete from Cloudinary
      const deleteFormData = new FormData();
      deleteFormData.append('public_id', publicId);
      deleteFormData.append('api_key', apiKey);
      deleteFormData.append('timestamp', timestamp);
      deleteFormData.append('signature', signature);

      console.log('Cloudinary API request:', {
        url: `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
        publicId,
        timestamp,
        signature: signature.substring(0, 10) + '...'
      });

      const cloudinaryResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
        {
          method: 'POST',
          body: deleteFormData,
        }
      );

      const cloudinaryResult = await cloudinaryResponse.json();
      console.log('Cloudinary API response:', cloudinaryResult);
      
      if (cloudinaryResult.result === 'ok') {
        console.log('Deleted from Cloudinary:', publicId);
        return NextResponse.json({
          success: true,
          message: 'Image deleted successfully from both MongoDB and Cloudinary',
          publicId
        });
      } else {
        console.error('Failed to delete from Cloudinary:', cloudinaryResult);
        // Still return success since MongoDB deletion worked
        return NextResponse.json({
          success: true,
          message: 'Image deleted from MongoDB (Cloudinary deletion failed)',
          publicId,
          cloudinaryError: cloudinaryResult
        });
      }
    } else {
      console.log('Cloudinary credentials not found, only deleted from MongoDB');
      return NextResponse.json({
        success: true,
        message: 'Image deleted from MongoDB only (Cloudinary credentials missing)',
        publicId
      });
    }

  } catch (error) {
    console.error('Error deleting image:', error);
    return NextResponse.json(
      { error: 'Failed to delete image' },
      { status: 500 }
    );
  }
}

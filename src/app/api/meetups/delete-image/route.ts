import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';

const uri = process.env.MONGODB_URI!;
const client = new MongoClient(uri);

export async function POST(request: NextRequest) {
  try {
    const { imageIndex } = await request.json();

    if (typeof imageIndex !== 'number' || imageIndex < 0) {
      return NextResponse.json({ error: 'Invalid image index' }, { status: 400 });
    }

    // Find the most recent meetup and remove the image at the specified index
    await client.connect();
    const database = client.db('mudasirTraders');
    const meetups = database.collection('meetups');

    // Find the most recent meetup
    const latestMeetup = await meetups.findOne({}, { sort: { createdAt: -1 } });

    if (!latestMeetup) {
      return NextResponse.json({ error: 'No meetup found' }, { status: 404 });
    }

    const images = latestMeetup.images || [];
    
    if (imageIndex >= images.length) {
      return NextResponse.json({ error: 'Image index out of range' }, { status: 400 });
    }

    // Remove the image at the specified index
    const updatedImages = images.filter((_: any, index: number) => index !== imageIndex);

    // Update the meetup with the new images array
    const updateResult = await meetups.updateOne(
      { _id: latestMeetup._id },
      { 
        $set: { 
          images: updatedImages,
          updatedAt: new Date()
        }
      }
    );

    if (updateResult.matchedCount === 0) {
      return NextResponse.json({ error: 'Failed to update meetup' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Image deleted successfully',
      remainingImages: updatedImages.length
    });

  } catch (error) {
    console.error('Error deleting image:', error);
    return NextResponse.json({ error: 'Failed to delete image' }, { status: 500 });
  } finally {
    await client.close();
  }
}

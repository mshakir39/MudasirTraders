import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI!;
const client = new MongoClient(uri);

export async function GET() {
  try {
    await client.connect();
    const database = client.db('mudasirTraders');
    const meetups = database.collection('meetups');

    const meetupData = await meetups.find({}).sort({ createdAt: -1 }).toArray();

    return NextResponse.json(meetupData);
  } catch (error) {
    console.error('Error fetching meetups:', error);
    return NextResponse.json(
      { error: 'Failed to fetch meetups' },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    await client.connect();
    const database = client.db('mudasirTraders');
    const meetups = database.collection('meetups');

    const newMeetup = {
      ...body,
      createdAt: new Date(),
      images: [],
    };

    const result = await meetups.insertOne(newMeetup);

    return NextResponse.json({
      ...newMeetup,
      _id: result.insertedId.toString(),
    });
  } catch (error) {
    console.error('Error creating meetup:', error);
    return NextResponse.json(
      { error: 'Failed to create meetup' },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}

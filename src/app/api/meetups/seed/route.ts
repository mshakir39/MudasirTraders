import { NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';

const uri = process.env.MONGODB_URI!;
const client = new MongoClient(uri);

const sampleMeetups = [
  {
    title: 'Customer Appreciation Meetup',
    date: '2024-03-15',
    description:
      'Join us for our monthly customer meetup where we celebrate our loyal customers.',
    location: 'Mudasir Traders Shop, Dera Ghazi Khan',
    images: [],
    createdAt: new Date(),
  },
  {
    title: 'Battery Maintenance Workshop',
    date: '2024-04-08',
    description:
      "Learn essential battery maintenance tips from Mudasir Traders' technical team.",
    location: 'Main Showroom, Dera Ghazi Khan',
    images: [],
    createdAt: new Date(),
  },
  {
    title: 'Community Gathering',
    date: '2024-05-20',
    description:
      'Monthly community meetup where customers can share experiences and network.',
    location: 'General Bus Stand, Dera Ghazi Khan',
    images: [],
    createdAt: new Date(),
  },
  {
    title: 'Technical Training Session',
    date: '2024-06-10',
    description:
      'Hands-on technical training for automotive battery professionals.',
    location: 'Training Center, Dera Ghazi Khan',
    images: [],
    createdAt: new Date(),
  },
  {
    title: 'Customer Appreciation Day',
    date: '2024-03-25',
    description:
      'Special day to honor our valued customers with exclusive offers.',
    location: 'Mudasir Traders Main Shop',
    images: [],
    createdAt: new Date(),
  },
];

export async function POST() {
  try {
    await client.connect();
    const database = client.db('mudasirTraders');
    const meetups = database.collection('meetups');

    // Clear existing meetups
    await meetups.deleteMany({});

    // Insert sample meetups
    const result = await meetups.insertMany(sampleMeetups);

    return NextResponse.json({
      message: 'Sample meetups seeded successfully',
      count: result.insertedCount,
      meetups: sampleMeetups,
    });
  } catch (error) {
    console.error('Error seeding meetups:', error);
    return NextResponse.json(
      { error: 'Failed to seed meetups' },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}

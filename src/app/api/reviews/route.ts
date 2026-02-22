import { NextRequest, NextResponse } from 'next/server';
import { connectToMongoDB } from '@/app/libs/connectToMongoDB';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
  try {
    const db = await connectToMongoDB();

    if (!db) {
      throw new Error('Failed to connect to database');
    }

    const url = new URL(request.url);
    const isAdmin = url.searchParams.get('admin') === 'true';

    let reviews;

    if (isAdmin) {
      // For admin: fetch ALL reviews (both approved and pending)
      reviews = await db
        .collection('customer_reviews')
        .find({})
        .sort({ createdAt: -1 })
        .toArray();

      console.log('Admin fetched all reviews:', reviews.length);
    } else {
      // For public: fetch only approved reviews
      reviews = await db
        .collection('customer_reviews')
        .find({ approved: { $ne: false } }) // approved is not false (includes undefined/null)
        .sort({ createdAt: -1 })
        .toArray();

      console.log('Fetched approved reviews:', reviews, 'reviews');
    }

    // Convert MongoDB documents to our interface format
    const formattedReviews: Array<{
      id?: string;
      author_name: string;
      rating: number;
      text: string;
      createdAt: string;
      approved?: boolean;
      ip_address?: string;
      user_agent?: string;
    }> = reviews.map((review: any) => ({
      id: review._id.toString(),
      author_name: review.author_name,
      rating: review.rating,
      text: review.text,
      createdAt: review.createdAt.toISOString(),
      approved: review.approved,
      ip_address: review.ip_address,
      user_agent: review.user_agent,
    }));

    return NextResponse.json({
      reviews: formattedReviews,
      success: true,
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews', success: false },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = await connectToMongoDB();

    if (!db) {
      throw new Error('Failed to connect to database');
    }

    const body = await request.json();

    // Check if this is a review management action (approve/reject)
    const { action, reviewId } = body;

    if (action && reviewId) {
      // Handle review management (approve/reject)
      if (action === 'approve') {
        const result = await db.collection('customer_reviews').updateOne(
          { _id: new ObjectId(reviewId) },
          { $set: { approved: true } }
        );

        if (result.modifiedCount === 0) {
          return NextResponse.json(
            { error: 'Review not found or already approved', success: false },
            { status: 404 }
          );
        }

        return NextResponse.json({
          success: true,
          message: 'Review approved successfully',
        });
      } else if (action === 'reject') {
        const result = await db.collection('customer_reviews').deleteOne(
          { _id: new ObjectId(reviewId) }
        );

        if (result.deletedCount === 0) {
          return NextResponse.json(
            { error: 'Review not found', success: false },
            { status: 404 }
          );
        }

        return NextResponse.json({
          success: true,
          message: 'Review rejected and removed',
        });
      } else {
        return NextResponse.json(
          { error: 'Invalid action', success: false },
          { status: 400 }
        );
      }
    }

    // Handle review creation (original logic)
    const { author_name, rating, text } = body;

    if (!author_name || typeof author_name !== 'string' || author_name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Author name is required', success: false },
        { status: 400 }
      );
    }

    if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be a number between 1 and 5', success: false },
        { status: 400 }
      );
    }

    if (!text || typeof text !== 'string' || text.trim().length < 10) {
      return NextResponse.json(
        { error: 'Review text must be at least 10 characters long', success: false },
        { status: 400 }
      );
    }

    // Basic spam protection - check for excessive caps or repeated characters
    const upperCaseRatio = (text.match(/[A-Z]/g) || []).length / text.length;
    const hasRepeatedChars = /(.)\1{10,}/.test(text); // 10+ repeated characters

    if (upperCaseRatio > 0.8 || hasRepeatedChars) {
      return NextResponse.json(
        { error: 'Review appears to be spam. Please write a genuine review.', success: false },
        { status: 400 }
      );
    }

    // Create the review document
    const reviewDocument = {
      author_name: author_name.trim(),
      rating: Math.round(rating), // Ensure it's an integer
      text: text.trim(),
      createdAt: new Date(),
      approved: false, // Require admin approval before showing on landing page
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown',
    };

    // Insert the review
    const result = await db.collection('customer_reviews').insertOne(reviewDocument);

    console.log('Review saved:', {
      id: result.insertedId.toString(),
      author_name: reviewDocument.author_name,
      rating: reviewDocument.rating,
      approved: reviewDocument.approved,
    });

    return NextResponse.json({
      success: true,
      message: 'Review submitted successfully and is pending approval',
      reviewId: result.insertedId.toString(),
    });
  } catch (error) {
    console.error('Error submitting review:', error);
    return NextResponse.json(
      { error: 'Failed to submit review', success: false },
      { status: 500 }
    );
  }
}

'use client';

import React, { useEffect, useId, useState } from 'react';
import {
  Star,
  Quote,
  Plus,
  ArrowLeft,
  ArrowRight,
  MessageSquare,
} from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import type { Swiper as SwiperInstance } from 'swiper';
import { Autoplay, A11y } from 'swiper/modules';
import 'swiper/css';

import ReviewForm from './ReviewForm';

interface CustomerReview {
  id?: string;
  author_name: string;
  rating: number;
  text: string;
  createdAt: string;
  approved?: boolean;
}

interface CustomerReviewsProps {
  showAddReviewButton?: boolean;
  maxReviews?: number;
}

function Stars({ rating }: { rating: number }) {
  return (
    <div
      role="img"
      aria-label={`${rating} out of 5 stars`}
      className="flex gap-1"
    >
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          key={index}
          aria-hidden="true"
          className={`h-4 w-4 ${
            index < Math.round(rating)
              ? 'fill-amber-400 text-amber-400'
              : 'fill-slate-100 text-slate-200'
          }`}
        />
      ))}
    </div>
  );
}

function ReviewCard({ review }: { review: CustomerReview }) {
  const [expanded, setExpanded] = useState(false);
  const date = new Date(review.createdAt);
  const formattedDate = Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });

  return (
    <article className="flex h-full min-w-0 flex-col rounded-[24px] border border-slate-200 bg-white p-6 transition-colors hover:border-blue-300 sm:p-7">
      <div className="flex items-center justify-between gap-4">
        <Stars rating={review.rating} />
        <Quote
          aria-hidden="true"
          className="h-8 w-8 text-blue-100"
          strokeWidth={1.5}
        />
      </div>

      <div className="mb-7 mt-6 flex-1">
        <p
          className={`whitespace-pre-line break-words text-base leading-7 text-slate-700 ${
            expanded ? '' : 'line-clamp-4'
          }`}
        >
          &ldquo;{review.text}&rdquo;
        </p>

        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
          className="mt-3 rounded text-xs font-bold text-blue-700 hover:text-blue-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
        >
          {expanded ? 'Show less' : 'Read full review'}
        </button>
      </div>

      <div className="flex items-center gap-3 border-t border-slate-100 pt-5">
        <span
          aria-hidden="true"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-700"
        >
          {review.author_name.trim().charAt(0).toUpperCase() || '?'}
        </span>

        <div className="min-w-0">
          <p className="break-words text-sm font-bold text-slate-900">
            {review.author_name}
          </p>
          {formattedDate && (
            <p className="mt-1 text-xs text-slate-500">{formattedDate}</p>
          )}
        </div>

        <span className="ml-auto shrink-0 text-xs font-semibold tabular-nums text-slate-500">
          {review.rating}/5
        </span>
      </div>
    </article>
  );
}

export default function CustomerReviews({
  showAddReviewButton = true,
  maxReviews = 10,
}: CustomerReviewsProps) {
  const headingId = useId();
  const [reviews, setReviews] = useState<CustomerReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [swiper, setSwiper] = useState<SwiperInstance | null>(null);
  const [navigation, setNavigation] = useState({
    beginning: true,
    end: false,
    locked: true,
  });
  const [reducedMotion, setReducedMotion] = useState(true);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(query.matches);

    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchReviews() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/reviews', {
          signal: controller.signal,
        });

        if (!response.ok) throw new Error('Failed to fetch reviews');

        const data = await response.json();

        if (!controller.signal.aborted) {
          setReviews(
            Array.isArray(data.reviews)
              ? data.reviews
                  .filter(
                    (review: CustomerReview) => review.approved !== false,
                  )
                  .slice(0, maxReviews)
              : [],
          );
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error('Error fetching reviews:', err);
          setError('Unable to load reviews at this time.');
          setReviews([]);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void fetchReviews();
    return () => controller.abort();
  }, [maxReviews]);

  const averageRating = reviews.length
    ? reviews.reduce((sum, review) => sum + review.rating, 0) /
      reviews.length
    : 0;

  const updateNavigation = (instance: SwiperInstance) => {
    setNavigation({
      beginning: instance.isBeginning,
      end: instance.isEnd,
      locked: instance.isLocked,
    });
  };

  return (
    <section
      id="reviews-section"
      aria-labelledby={headingId}
      className="relative isolate overflow-hidden bg-[#f8faff] py-16 sm:py-24 lg:py-28"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(37,99,235,0.06),transparent_55%)]"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="mb-10 flex flex-col justify-between gap-6 sm:mb-12 lg:flex-row lg:items-end">
          <div>
            <div className="mb-5 flex items-center gap-3">
              <span aria-hidden="true" className="h-px w-8 bg-blue-600" />
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700">
                Customer experiences
              </span>
            </div>

            <h2
              id={headingId}
              className="text-4xl font-extrabold leading-[1.08] tracking-[-0.045em] text-slate-900 sm:text-5xl lg:text-6xl"
            >
              In their words.
              <br />
              <span className="text-blue-600">In your neighborhood.</span>
            </h2>

            <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">
              Discover what customers have to say about their experience
              with our battery shop in Dera Ghazi Khan.
            </p>
          </div>

          {showAddReviewButton && (
            <button
              type="button"
              onClick={() => setShowReviewForm(true)}
              className="inline-flex min-h-12 items-center justify-center gap-2 self-start rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 lg:self-auto"
            >
              <Plus aria-hidden="true" className="h-4 w-4" />
              Write a review
            </button>
          )}
        </header>

        {loading ? (
          <div role="status" aria-label="Loading customer reviews">
            <span className="sr-only">Loading customer reviews…</span>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }, (_, index) => (
                <div
                  key={index}
                  aria-hidden="true"
                  className="rounded-[24px] border border-slate-200 bg-white p-7 motion-safe:animate-pulse"
                >
                  <div className="h-4 w-28 rounded bg-slate-100" />
                  <div className="mt-8 space-y-3">
                    <div className="h-3 rounded bg-slate-100" />
                    <div className="h-3 rounded bg-slate-100" />
                    <div className="h-3 w-3/4 rounded bg-slate-100" />
                  </div>
                  <div className="mt-9 h-11 w-44 rounded-xl bg-slate-100" />
                </div>
              ))}
            </div>
          </div>
        ) : error || !reviews.length ? (
          <div
            role={error ? 'status' : undefined}
            className="rounded-[28px] border border-slate-200 bg-white px-6 py-14 text-center"
          >
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <MessageSquare aria-hidden="true" className="h-7 w-7" />
            </span>
            <h3 className="mt-5 text-xl font-bold text-slate-900">
              {error ? 'Reviews are temporarily unavailable' : 'Your story starts here'}
            </h3>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-600">
              {error
                ? 'Please check back later to read customer experiences.'
                : 'Be the first to share your experience and help others choose their next battery.'}
            </p>
          </div>
        ) : (
          <div className="grid min-w-0 gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
            <aside className="relative isolate flex flex-col overflow-hidden rounded-[24px] bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 p-7 text-white">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full border-[32px] border-white/[0.06]"
              />

              <p className="relative text-xs font-semibold uppercase tracking-[0.16em] text-blue-200">
                Customer rating
              </p>

              <div className="relative mt-6 flex items-baseline gap-2">
                <span className="text-6xl font-extrabold tracking-[-0.06em]">
                  {averageRating.toFixed(1)}
                </span>
                <span className="text-lg text-blue-200">/ 5</span>
              </div>

              <div className="relative mt-4">
                <Stars rating={averageRating} />
              </div>

              <p className="relative mt-4 text-sm leading-6 text-blue-100">
                Based on {reviews.length} displayed review
                {reviews.length !== 1 ? 's' : ''}.
              </p>

              <div className="relative mt-8 border-t border-white/20 pt-5 lg:mt-auto">
                <Quote
                  aria-hidden="true"
                  className="mb-3 h-6 w-6 text-blue-200"
                />
                <p className="text-sm font-medium leading-6">
                  Every experience helps us serve you better.
                </p>
              </div>
            </aside>

            <div
              className="min-w-0"
              onFocusCapture={() => swiper?.autoplay?.stop()}
              onBlurCapture={(event) => {
                if (
                  !event.currentTarget.contains(
                    event.relatedTarget as Node | null,
                  ) &&
                  !reducedMotion
                ) {
                  swiper?.autoplay?.start();
                }
              }}
            >
              <Swiper
                modules={[Autoplay, A11y]}
                onSwiper={(instance) => {
                  setSwiper(instance);
                  updateNavigation(instance);
                }}
                onSlideChange={updateNavigation}
                onResize={updateNavigation}
                onLock={updateNavigation}
                onUnlock={updateNavigation}
                watchOverflow
                spaceBetween={20}
                slidesPerView={1}
                speed={reducedMotion ? 0 : 500}
                autoplay={
                  reducedMotion
                    ? false
                    : {
                        delay: 6000,
                        disableOnInteraction: true,
                        pauseOnMouseEnter: true,
                      }
                }
                breakpoints={{
                  640: { slidesPerView: 2 },
                }}
                className="[&_.swiper-wrapper]:items-stretch [&_.swiper-slide]:!h-auto"
              >
                {reviews.map((review, index) => (
                  <SwiperSlide key={review.id || index}>
                    <ReviewCard review={review} />
                  </SwiperSlide>
                ))}
              </Swiper>

              {!navigation.locked && (
                <div className="mt-5 flex items-center justify-between gap-4">
                  <p className="text-xs text-slate-500">
                    Swipe or use the arrows to explore
                  </p>

                  <div className="flex gap-2">
                    {[
                      {
                        label: 'Previous reviews',
                        icon: ArrowLeft,
                        disabled: navigation.beginning,
                        action: () => swiper?.slidePrev(),
                      },
                      {
                        label: 'Next reviews',
                        icon: ArrowRight,
                        disabled: navigation.end,
                        action: () => swiper?.slideNext(),
                      },
                    ].map(({ label, icon: Icon, disabled, action }) => (
                      <button
                        key={label}
                        type="button"
                        aria-label={label}
                        disabled={disabled}
                        onClick={action}
                        className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition-colors hover:border-blue-300 hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:cursor-not-allowed disabled:opacity-35"
                      >
                        <Icon aria-hidden="true" className="h-4 w-4" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {showReviewForm && (
        <ReviewForm
          onClose={() => setShowReviewForm(false)}
          onSubmitSuccess={() => {
            setShowReviewForm(false);
            window.location.reload();
          }}
        />
      )}
    </section>
  );
}
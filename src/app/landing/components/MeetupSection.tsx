'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import type { Swiper as SwiperInstance } from 'swiper';
import { Autoplay, A11y } from 'swiper/modules';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Maximize2,
  Users,
  X,
} from 'lucide-react';
import 'swiper/css';

interface Meetup {
  id?: string | number;
  url: string;
  title?: string;
  date?: string;
  position?: string;
  customPosition?: {
    x: number;
    y: number;
  };
}

function getImagePosition(meetup: Meetup) {
  if (meetup.position === 'custom' && meetup.customPosition) {
    return `${meetup.customPosition.x}% ${meetup.customPosition.y}%`;
  }

  if (meetup.position === 'top') return 'center top';
  if (meetup.position === 'bottom') return 'center bottom';

  return 'center';
}

function ImagePreview({
  meetup,
  onClose,
}: {
  meetup: Meetup;
  onClose: () => void;
}) {
  const titleId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef(onClose);

  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeRef.current();
      }

      if (event.key === 'Tab') {
        event.preventDefault();
        closeButtonRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      previousFocus?.focus();
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 p-3 backdrop-blur-md sm:p-6"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-white/15 bg-slate-950 shadow-2xl sm:max-h-[calc(100dvh-3rem)] sm:rounded-3xl"
      >
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-white/10 px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <h3
              id={titleId}
              className="truncate text-sm font-semibold text-white sm:text-base"
            >
              {meetup.title || 'Community meetup'}
            </h3>

            {meetup.date && (
              <p className="mt-1 text-xs text-slate-400">
                {meetup.date}
              </p>
            )}
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            aria-label="Close image preview"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>

        <div className="relative h-[70dvh] min-h-0 w-full">
          <Image
            src={meetup.url}
            alt={
              meetup.title ||
              'Community event at Mudasir Traders in Dera Ghazi Khan'
            }
            fill
            sizes="(max-width: 1200px) 100vw, 1200px"
            className="object-contain"
          />
        </div>
      </div>
    </div>
  );
}

export default function MeetupSection() {
  const headingId = useId();
  const swiperRef = useRef<SwiperInstance | null>(null);

  // Track pointer movement so dragging never opens the preview.
  const gestureRef = useRef({
    pointerId: null as number | null,
    x: 0,
    y: 0,
    moved: false,
    suppressClickUntil: 0,
  });

  const [meetups, setMeetups] = useState<Meetup[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMeetup, setSelectedMeetup] = useState<Meetup | null>(null);
  const [reducedMotion, setReducedMotion] = useState(true);
  const [navigation, setNavigation] = useState({
    beginning: true,
    end: false,
    locked: true,
  });

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(query.matches);

    update();
    query.addEventListener('change', update);

    return () => query.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchImages() {
      try {
        const response = await fetch('/api/meetups/upload', {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error('Failed to fetch meetup images');
        }

        const data: unknown = await response.json();

        const normalized: Meetup[] = Array.isArray(data)
          ? data.flatMap((item: unknown) => {
              if (typeof item === 'string' && item.trim()) {
                return [{ url: item }];
              }

              if (
                item &&
                typeof item === 'object' &&
                'url' in item &&
                typeof item.url === 'string' &&
                item.url.trim()
              ) {
                return [item as Meetup];
              }

              return [];
            })
          : [];

        if (!controller.signal.aborted) {
          setMeetups(normalized);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error('Failed to fetch meetup images:', error);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void fetchImages();

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const swiper = swiperRef.current;

    if (!swiper || swiper.destroyed) return;

    if (selectedMeetup || reducedMotion) {
      swiper.autoplay?.stop();
    } else {
      swiper.autoplay?.start();
    }
  }, [selectedMeetup, reducedMotion]);

  const updateNavigation = (instance: SwiperInstance) => {
    setNavigation({
      beginning: instance.isBeginning,
      end: instance.isEnd,
      locked: instance.isLocked,
    });
  };

  const openPreview = (
    meetup: Meetup,
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    // Keyboard activation should always remain available.
    const keyboardActivation = event.detail === 0;

    if (
      !keyboardActivation &&
      (gestureRef.current.moved ||
        Date.now() < gestureRef.current.suppressClickUntil ||
        (swiperRef.current as any)?.allowClick === false)
    ) {
      event.preventDefault();
      return;
    }

    setSelectedMeetup(meetup);
  };

  if (!loading && meetups.length === 0) return null;

  return (
    <section
      id="meetups-section"
      aria-labelledby={headingId}
      className="relative isolate overflow-hidden bg-white py-16 sm:py-24 lg:py-28"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="mb-10 grid gap-6 lg:mb-12 lg:grid-cols-[1.15fr_1fr] lg:items-end lg:gap-20">
          <div>
            <div className="mb-5 flex items-center gap-3">
              <span
                aria-hidden="true"
                className="h-px w-8 bg-blue-600"
              />

              <span className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700">
                Community engagement
              </span>
            </div>

            <h2
              id={headingId}
              className="text-4xl font-extrabold leading-[1.08] tracking-[-0.045em] text-slate-900 sm:text-5xl lg:text-6xl"
            >
              Good people.
              <br />
              <span className="text-blue-600">
                Great connections.
              </span>
            </h2>
          </div>

          <div className="max-w-lg lg:pb-1">
            <p className="text-base leading-7 text-slate-600">
              A closer look at our community meetups. Connect with
              fellow customers through expert sessions, appreciation
              certificates, and shared experiences at Mudasir Traders.
            </p>

            <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-800">
              <Users
                aria-hidden="true"
                className="h-5 w-5 text-blue-600"
              />
              Bringing our community together
            </div>
          </div>
        </header>

        {loading ? (
          <div
            role="status"
            aria-label="Loading community meetup photos"
          >
            <span className="sr-only">
              Loading community meetup photos…
            </span>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }, (_, index) => (
                <div
                  key={index}
                  aria-hidden="true"
                  className="overflow-hidden rounded-[24px] border border-slate-200 bg-slate-50 motion-safe:animate-pulse"
                >
                  <div className="aspect-[4/3] bg-slate-100" />

                  <div className="space-y-3 p-6">
                    <div className="h-3 w-24 rounded bg-slate-100" />
                    <div className="h-4 w-3/4 rounded bg-slate-200" />
                    <div className="h-3 w-1/2 rounded bg-slate-100" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between gap-4 border-t border-slate-200 pt-6">
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500">
                  Moments from our meetups
                </p>

                <span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                  {meetups.length} photo
                  {meetups.length === 1 ? '' : 's'}
                </span>
              </div>

              {!navigation.locked && (
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    aria-label="Previous meetup photos"
                    disabled={navigation.beginning}
                    onClick={() => swiperRef.current?.slidePrev()}
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition-colors hover:border-blue-300 hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    <ArrowLeft
                      aria-hidden="true"
                      className="h-4 w-4"
                    />
                  </button>

                  <button
                    type="button"
                    aria-label="Next meetup photos"
                    disabled={navigation.end}
                    onClick={() => swiperRef.current?.slideNext()}
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition-colors hover:border-blue-300 hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    <ArrowRight
                      aria-hidden="true"
                      className="h-4 w-4"
                    />
                  </button>
                </div>
              )}
            </div>

            <div
              className="min-w-0"
              onPointerDownCapture={(event) => {
                gestureRef.current = {
                  pointerId: event.pointerId,
                  x: event.clientX,
                  y: event.clientY,
                  moved: false,
                  suppressClickUntil: 0,
                };
              }}
              onPointerMoveCapture={(event) => {
                const gesture = gestureRef.current;

                if (gesture.pointerId !== event.pointerId) return;

                if (
                  Math.hypot(
                    event.clientX - gesture.x,
                    event.clientY - gesture.y,
                  ) > 8
                ) {
                  gesture.moved = true;
                }
              }}
              onPointerUpCapture={(event) => {
                const gesture = gestureRef.current;

                if (gesture.pointerId !== event.pointerId) return;

                if (
                  Math.hypot(
                    event.clientX - gesture.x,
                    event.clientY - gesture.y,
                  ) > 8
                ) {
                  gesture.moved = true;
                }

                if (gesture.moved) {
                  gesture.suppressClickUntil = Date.now() + 400;
                }

                gesture.pointerId = null;
              }}
              onPointerCancelCapture={() => {
                gestureRef.current.moved = true;
                gestureRef.current.pointerId = null;
                gestureRef.current.suppressClickUntil =
                  Date.now() + 400;
              }}
              onFocusCapture={() =>
                swiperRef.current?.autoplay?.stop()
              }
              onBlurCapture={(event) => {
                if (
                  !event.currentTarget.contains(
                    event.relatedTarget as Node | null,
                  ) &&
                  !reducedMotion &&
                  !selectedMeetup
                ) {
                  swiperRef.current?.autoplay?.start();
                }
              }}
            >
              <Swiper
                modules={[Autoplay, A11y]}
                onSwiper={(instance) => {
                  swiperRef.current = instance;
                  updateNavigation(instance);
                }}
                onSlideChange={updateNavigation}
                onResize={updateNavigation}
                onLock={updateNavigation}
                onUnlock={updateNavigation}
                preventClicks
                preventClicksPropagation
                watchOverflow
                spaceBetween={20}
                slidesPerView={1}
                speed={reducedMotion ? 0 : 600}
                autoplay={
                  reducedMotion
                    ? false
                    : {
                        delay: 5000,
                        disableOnInteraction: true,
                        pauseOnMouseEnter: true,
                      }
                }
                breakpoints={{
                  640: {
                    slidesPerView: 2,
                    spaceBetween: 20,
                  },
                  1024: {
                    slidesPerView: 3,
                    spaceBetween: 24,
                  },
                }}
                className="[&_.swiper-wrapper]:items-stretch [&_.swiper-slide]:!h-auto"
              >
                {meetups.map((meetup, index) => (
                  <SwiperSlide
                    key={meetup.id ?? `${meetup.url}-${index}`}
                  >
                    <button
                      type="button"
                      onClick={(event) => openPreview(meetup, event)}
                      aria-label={`View photo: ${
                        meetup.title ||
                        `Community meetup ${index + 1}`
                      }`}
                      className="group flex h-full w-full min-w-0 flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-white text-left transition-colors duration-200 hover:border-blue-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600 motion-reduce:transition-none"
                    >
                      {/* No labels or icons cover the photo. */}
                      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
                        <Image
                          src={meetup.url}
                          alt={
                            meetup.title
                              ? `${meetup.title} at Mudasir Traders`
                              : 'Community meetup with customers and team at Mudasir Traders in Dera Ghazi Khan'
                          }
                          fill
                          draggable={false}
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className={
                            meetup.position === 'contain'
                              ? 'object-contain'
                              : 'object-cover'
                          }
                          style={{
                            objectPosition: getImagePosition(meetup),
                          }}
                        />
                      </div>

                      <div className="flex flex-1 flex-col p-5 sm:p-6">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-blue-600">
                            Community meetup
                          </p>

                          <Maximize2
                            aria-hidden="true"
                            className="h-4 w-4 shrink-0 text-slate-400 transition-colors group-hover:text-blue-600"
                          />
                        </div>

                        <div className="flex items-start justify-between gap-3">
                          <h3 className="min-w-0 break-words text-lg font-bold leading-6 tracking-tight text-slate-900">
                            {meetup.title ||
                              'A moment with our community'}
                          </h3>

                          <ArrowUpRight
                            aria-hidden="true"
                            className="mt-0.5 h-5 w-5 shrink-0 text-slate-400 transition-colors group-hover:text-blue-600"
                          />
                        </div>

                        <div className="mt-auto flex items-center justify-between gap-3 pt-5">
                          {meetup.date ? (
                            <span className="inline-flex items-center gap-2 text-xs font-medium text-slate-500">
                              <CalendarDays
                                aria-hidden="true"
                                className="h-3.5 w-3.5 shrink-0 text-blue-600"
                              />
                              {meetup.date}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-500">
                              Mudasir Traders · DG Khan
                            </span>
                          )}

                          <span
                            aria-hidden="true"
                            className="text-[10px] font-semibold tabular-nums text-slate-400"
                          >
                            {String(index + 1).padStart(2, '0')}
                          </span>
                        </div>
                      </div>
                    </button>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>

            <div className="mt-8 flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-600">
                Shared moments. Stronger connections.
              </p>

              <span className="inline-flex items-center gap-2 text-xs text-slate-500">
                <Maximize2
                  aria-hidden="true"
                  className="h-3.5 w-3.5 text-blue-600"
                />
                Select a photo to view it in full
              </span>
            </div>
          </>
        )}
      </div>

      {selectedMeetup && (
        <ImagePreview
          meetup={selectedMeetup}
          onClose={() => setSelectedMeetup(null)}
        />
      )}
    </section>
  );
}
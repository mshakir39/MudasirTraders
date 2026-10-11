'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
import {
  Star,
  X,
  MessageSquare,
  ArrowRight,
  LoaderCircle,
  AlertCircle,
} from 'lucide-react';

interface ReviewFormProps {
  onClose: () => void;
  onSubmitSuccess: () => void;
}

const ratingLabels = [
  'Poor',
  'Fair',
  'Good',
  'Very good',
  'Excellent',
];

export default function ReviewForm({
  onClose,
  onSubmitSuccess,
}: ReviewFormProps) {
  const id = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const submittingRef = useRef(false);
  const closeRef = useRef(onClose);

  const [formData, setFormData] = useState({
    author_name: '',
    rating: 5,
    text: '',
  });
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = 'hidden';
    nameRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        if (!submittingRef.current) closeRef.current();
      }

      if (event.key !== 'Tab') return;

      const elements = Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), input:not(:disabled), textarea:not(:disabled), [tabindex="0"]',
        ) || [],
      );

      const first = elements[0];
      const last = elements[elements.length - 1];

      if (!first) {
        event.preventDefault();
        dialogRef.current?.focus();
        return;
      }

      if (
        event.shiftKey &&
        (document.activeElement === first ||
          !dialogRef.current?.contains(document.activeElement))
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        (document.activeElement === last ||
          !dialogRef.current?.contains(document.activeElement))
      ) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      previousFocus?.focus();
    };
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submittingRef.current) return;

    setError(null);

    if (!formData.author_name.trim()) {
      setError('Please enter your name');
      nameRef.current?.focus();
      return;
    }

    if (!formData.text.trim()) {
      setError('Please enter your review');
      return;
    }

    if (formData.text.trim().length < 10) {
      setError('Please write at least 10 characters');
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);
    dialogRef.current?.focus();

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to submit review');

      onSubmitSuccess();
    } catch (err) {
      setError('Failed to submit review. Please try again.');
      console.error('Error submitting review:', err);
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const displayedRating = hoverRating || formData.rating;
  const characterCount = formData.text.trim().length;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-3 backdrop-blur-sm sm:p-6"
      onClick={(event) => {
        if (
          event.target === event.currentTarget &&
          !submittingRef.current
        ) {
          onClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        aria-describedby={`${id}-intro`}
        tabIndex={-1}
        className="relative max-h-[calc(100dvh-1.5rem)] w-full max-w-lg overflow-y-auto rounded-[24px] bg-white shadow-2xl outline-none sm:max-h-[calc(100dvh-3rem)] sm:rounded-[28px]"
      >
        <header className="relative isolate overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 px-6 py-7 text-white sm:px-8">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-20 h-60 w-60 rounded-full border-[32px] border-white/[0.06]"
          />

          <button
            type="button"
            aria-label="Close review form"
            onClick={onClose}
            disabled={isSubmitting}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-40"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>

          <span
            aria-hidden="true"
            className="relative mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-white/20 bg-white/10"
          >
            <MessageSquare className="h-5 w-5" />
          </span>

          <h2
            id={`${id}-title`}
            className="relative text-3xl font-bold tracking-tight"
          >
            Your experience matters.
          </h2>
          <p
            id={`${id}-intro`}
            className="relative mt-2 max-w-sm text-sm leading-6 text-blue-100"
          >
            Share your visit and help others find the right battery.
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          aria-busy={isSubmitting}
          className="p-6 sm:p-8"
        >
          <fieldset disabled={isSubmitting} className="space-y-6">
            <div>
              <label
                htmlFor={`${id}-name`}
                className="mb-2 block text-sm font-bold text-slate-800"
              >
                Your name <span className="text-blue-600">*</span>
              </label>
              <input
                ref={nameRef}
                id={`${id}-name`}
                type="text"
                autoComplete="name"
                required
                value={formData.author_name}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    author_name: event.target.value,
                  }))
                }
                placeholder="Enter your name"
                className="min-h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 disabled:opacity-60"
              />
            </div>

            <fieldset>
              <legend className="text-sm font-bold text-slate-800">
                Your rating <span className="text-blue-600">*</span>
              </legend>

              <div className="mt-3 rounded-2xl border border-slate-200 bg-[#f8faff] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div
                    className="flex gap-1"
                    onMouseLeave={() => setHoverRating(0)}
                  >
                    {Array.from({ length: 5 }, (_, index) => {
                      const value = index + 1;
                      const selected = value <= displayedRating;

                      return (
                        <label
                          key={value}
                          className={`relative flex h-10 w-10 items-center justify-center rounded-lg ${
                            isSubmitting
                              ? 'cursor-default'
                              : 'cursor-pointer'
                          }`}
                          onMouseEnter={() => setHoverRating(value)}
                        >
                          <input
                            type="radio"
                            name={`${id}-rating`}
                            value={value}
                            checked={formData.rating === value}
                            onChange={() =>
                              setFormData((prev) => ({
                                ...prev,
                                rating: value,
                              }))
                            }
                            aria-label={`${value} star${value !== 1 ? 's' : ''}: ${ratingLabels[index]}`}
                            className="peer sr-only"
                          />
                          <span className="flex h-10 w-10 items-center justify-center rounded-lg peer-focus-visible:ring-2 peer-focus-visible:ring-blue-600 peer-focus-visible:ring-offset-2">
                            <Star
                              aria-hidden="true"
                              className={`h-7 w-7 transition-colors ${
                                selected
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'fill-white text-slate-300'
                              }`}
                              strokeWidth={1.5}
                            />
                          </span>
                        </label>
                      );
                    })}
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">
                      {ratingLabels[displayedRating - 1]}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {displayedRating} out of 5
                    </p>
                  </div>
                </div>
              </div>
            </fieldset>

            <div>
              <label
                htmlFor={`${id}-review`}
                className="mb-2 block text-sm font-bold text-slate-800"
              >
                Your review <span className="text-blue-600">*</span>
              </label>
              <textarea
                id={`${id}-review`}
                required
                aria-describedby={`${id}-hint`}
                value={formData.text}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    text: event.target.value,
                  }))
                }
                placeholder="How was your experience with our products and service?"
                className="min-h-32 w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base leading-6 text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 disabled:opacity-60"
              />

              <div
                id={`${id}-hint`}
                className="mt-2 flex justify-between gap-3 text-xs text-slate-500"
              >
                <span>Minimum 10 characters</span>
                <span
                  className={
                    characterCount >= 10 ? 'text-blue-700' : ''
                  }
                >
                  {characterCount} characters
                </span>
              </div>
            </div>
          </fieldset>

          {error && (
            <div
              role="alert"
              className="mt-5 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700"
            >
              <AlertCircle
                aria-hidden="true"
                className="mt-0.5 h-5 w-5 shrink-0"
              />
              {error}
            </div>
          )}

          <div className="mt-7 flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-1"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60 sm:flex-[2]"
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle
                    aria-hidden="true"
                    className="h-4 w-4 animate-spin"
                  />
                  Submitting…
                </>
              ) : (
                <>
                  Submit review
                  <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
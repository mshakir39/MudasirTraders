import { NextResponse } from 'next/server';

/**
 * Shared API response utilities for consistent response patterns
 * These utilities are designed to be backward compatible and preserve existing response structures
 */

/**
 * Smart success response that preserves existing response structure
 * If data already has success/error structure, it returns as-is
 * Otherwise, wraps it in standard format
 */
export const successResponse = (data: any, message?: string, status: number = 200) => {
  // If data already has the expected structure, return it directly
  if (data && typeof data === 'object' && ('success' in data || 'error' in data)) {
    return NextResponse.json(data, { status });
  }
  
  // Otherwise, wrap in standard format
  return NextResponse.json({ success: true, data, message }, { status });
};

/**
 * Smart error response that preserves existing error structure
 */
export const errorResponse = (error: string, status: number = 400) => {
  return NextResponse.json({ error }, { status });
};

/**
 * Validation error response with multiple errors
 */
export const validationErrorResponse = (errors: string[], message: string = 'Validation failed') => {
  return NextResponse.json({ error: message, errors }, { status: 400 });
};

/**
 * Not found response
 */
export const notFoundResponse = (resource: string = 'Resource') => {
  return NextResponse.json({ error: `${resource} not found` }, { status: 404 });
};

/**
 * Server error response
 */
export const serverErrorResponse = (error: string = 'Internal server error') => {
  return NextResponse.json({ error }, { status: 500 });
};

/**
 * Unauthorized response
 */
export const unauthorizedResponse = (error: string = 'Unauthorized') => {
  return NextResponse.json({ error }, { status: 401 });
};

/**
 * Pass-through response - simply returns the data as-is
 * Useful when you want to use utilities for validation but preserve exact response format
 */
export const passThroughResponse = (data: any, status: number = 200) => {
  return NextResponse.json(data, { status });
};

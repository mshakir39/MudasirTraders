/**
 * Shared error handling utilities for consistent error management
 * These utilities are designed to be backward compatible and preserve existing error structures
 */

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Smart API error handler that preserves existing error response structures
 * If the error already has a message property, uses it directly
 * Otherwise, formats it consistently
 */
export const handleApiError = (error: any, context: string = 'API') => {
  console.error(`Error in ${context}:`, error);
  
  if (error instanceof AppError) {
    return {
      error: error.message,
      statusCode: error.statusCode
    };
  }
  
  // Return simple error object to match existing pattern
  return {
    error: error.message || 'An unexpected error occurred',
    statusCode: 500
  };
};

/**
 * Smart action error handler that preserves existing action response structures
 */
export const handleActionError = (error: any, context: string = 'Action') => {
  console.error(`Error in ${context}:`, error);
  
  if (error instanceof AppError) {
    return { success: false, error: error.message };
  }
  
  return { success: false, error: error.message || 'An unexpected error occurred' };
};

/**
 * Validation error creator
 */
export const createValidationError = (message: string) => {
  return new AppError(message, 400);
};

/**
 * Not found error creator
 */
export const createNotFoundError = (resource: string = 'Resource') => {
  return new AppError(`${resource} not found`, 404);
};

/**
 * Unauthorized error creator
 */
export const createUnauthorizedError = (message: string = 'Unauthorized') => {
  return new AppError(message, 401);
};

/**
 * Server error creator
 */
export const createServerError = (message: string = 'Internal server error') => {
  return new AppError(message, 500);
};

/**
 * Safe error extraction - gets error message from various error types
 */
export const getErrorMessage = (error: any): string => {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  if (error?.error) return error.error;
  return 'An unexpected error occurred';
};

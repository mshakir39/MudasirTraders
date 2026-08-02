import { createValidationError } from './errorHandler';

/**
 * Shared validation utilities for consistent data validation
 * These utilities are designed to be flexible and work with various data structures
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Flexible required field validation
 */
export const validateRequired = (value: any, fieldName: string): ValidationResult => {
  const errors: string[] = [];
  
  if (value === null || value === undefined || value === '') {
    errors.push(`${fieldName} is required`);
  }
  
  return { isValid: errors.length === 0, errors };
};

/**
 * Email validation with optional requirement
 */
export const validateEmail = (email: string, fieldName: string = 'Email', required: boolean = false): ValidationResult => {
  const errors: string[] = [];
  
  if (!email) {
    if (required) {
      errors.push(`${fieldName} is required`);
    }
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push(`${fieldName} is invalid`);
  }
  
  return { isValid: errors.length === 0, errors };
};

/**
 * Phone validation with flexible format support
 */
export const validatePhone = (phone: string, fieldName: string = 'Phone', required: boolean = true, digits: number = 11): ValidationResult => {
  const errors: string[] = [];
  
  if (!phone) {
    if (required) {
      errors.push(`${fieldName} is required`);
    }
  } else {
    const phoneRegex = new RegExp(`^[0-9]{${digits}}$`);
    if (!phoneRegex.test(phone)) {
      errors.push(`${fieldName} must be ${digits} digits`);
    }
  }
  
  return { isValid: errors.length === 0, errors };
};

/**
 * Number validation with range support
 */
export const validateNumber = (value: any, fieldName: string, min?: number, max?: number, required: boolean = true): ValidationResult => {
  const errors: string[] = [];
  
  if (value === null || value === undefined || value === '') {
    if (required) {
      errors.push(`${fieldName} is required`);
    }
  } else {
    const num = Number(value);
    if (isNaN(num)) {
      errors.push(`${fieldName} must be a number`);
    } else {
      if (min !== undefined && num < min) {
        errors.push(`${fieldName} must be at least ${min}`);
      }
      if (max !== undefined && num > max) {
        errors.push(`${fieldName} must be at most ${max}`);
      }
    }
  }
  
  return { isValid: errors.length === 0, errors };
};

/**
 * Length validation with flexible requirements
 */
export const validateLength = (value: string, fieldName: string, min?: number, max?: number, required: boolean = true): ValidationResult => {
  const errors: string[] = [];
  
  if (!value) {
    if (required) {
      errors.push(`${fieldName} is required`);
    }
  } else {
    if (min !== undefined && value.length < min) {
      errors.push(`${fieldName} must be at least ${min} characters`);
    }
    if (max !== undefined && value.length > max) {
      errors.push(`${fieldName} must be at most ${max} characters`);
    }
  }
  
  return { isValid: errors.length === 0, errors };
};

/**
 * Flexible customer data validation that works with different field naming conventions
 */
export const validateCustomerData = (data: any): ValidationResult => {
  const errors: string[] = [];
  
  // Support both 'name' and 'customerName' field names
  const name = data.name || data.customerName;
  const phone = data.phone || data.phoneNumber;
  const email = data.email;
  const address = data.address;
  
  // Name validation
  if (!name || name.trim().length < 2) {
    errors.push('Customer name must be at least 2 characters');
  }
  
  // Phone validation (required)
  if (!phone) {
    errors.push('Phone number is required');
  } else if (!/^[0-9]{11}$/.test(phone)) {
    errors.push('Phone number must be 11 digits');
  }
  
  // Email validation (optional)
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('Email is invalid');
  }
  
  // Address validation (optional)
  if (address && address.length < 5) {
    errors.push('Address must be at least 5 characters');
  }
  
  return { isValid: errors.length === 0, errors };
};

/**
 * Combine multiple validation results
 */
export const combineValidationResults = (...results: ValidationResult[]): ValidationResult => {
  const allErrors = results.flatMap(r => r.errors);
  return { isValid: allErrors.length === 0, errors: allErrors };
};

/**
 * Quick validation that returns first error or null
 * Useful for simple validation scenarios
 */
export const getFirstValidationError = (validation: ValidationResult): string | null => {
  return validation.isValid ? null : validation.errors[0] || null;
};

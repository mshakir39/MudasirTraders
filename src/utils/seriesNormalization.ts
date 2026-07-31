/**
 * Series normalization utilities for consistent matching across the application
 */

/**
 * Normalize series by replacing all symbols with spaces, then exact matching
 * This handles variations in series naming like "MF 70 R/L (Thin/Thick Pole)" vs "MF 70 R/L (ThinThick Pole)"
 */
export function normalizeSeriesForMatching(input: string): string {
  return String(input || '')
    .toLowerCase()
    .replace(/[\/\(\)\-\,\.\+]/g, ' ') // Replace symbols with spaces
    .replace(/([a-z])([0-9])/g, '$1 $2') // Add space between letters and numbers
    .replace(/([0-9])([a-z])/g, '$1 $2') // Add space between numbers and letters
    .replace(/([a-z])([A-Z])/g, '$1 $2') // Add space between lowercase and uppercase
    .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2') // Add space before capitalized words
    .replace(/(thin)(thick)/g, '$1 $2') // Split ThinThick
    .replace(/(thinthick)/g, 'thin thick') // Handle combined form
    .replace(/\s+/g, ' ') // Normalize multiple spaces to single space
    .trim();
}

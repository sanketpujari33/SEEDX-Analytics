/**
 * Date Utility Functions
 * 
 * Handles parsing of various date formats including PostgreSQL timestamps
 */

import { parseISO } from 'date-fns';

/**
 * Parses a date string that could be in ISO 8601 or PostgreSQL timestamp format
 * 
 * Supports:
 * - ISO 8601: "2026-04-30T17:29:29.269Z"
 * - PostgreSQL: "2026-04-30 17:29:29.269372+00"
 * 
 * @param dateStr - Date string to parse
 * @returns Date object (may be Invalid Date if parsing fails)
 */
export function parseFlexibleDate(dateStr: string): Date {
  // Handle null, undefined, or empty strings
  if (!dateStr || typeof dateStr !== 'string') {
    return new Date(NaN); // Return Invalid Date
  }
  
  // Quick validation: date strings should start with a year (4 digits)
  // This filters out JSON objects, hex strings, booleans, etc.
  if (!/^\d{4}/.test(dateStr)) {
    return new Date(NaN);
  }
  
  // Additional check: avoid parsing strings that look like JSON or hex
  if (dateStr.startsWith('{') || dateStr.startsWith('[') || 
      dateStr.startsWith('"') || dateStr.startsWith('0x') ||
      dateStr.includes(':true') || dateStr.includes(':false')) {
    return new Date(NaN);
  }
  
  try {
    // Check if it's PostgreSQL format (contains space and +00)
    if (dateStr.includes(' ') && (dateStr.includes('+') || dateStr.includes('-', 10))) {
      // Convert PostgreSQL timestamp to ISO format
      // "2026-04-30 17:29:29.269372+00" -> "2026-04-30T17:29:29.269372Z"
      const isoDate = dateStr
        .replace(' ', 'T')          // Replace space with T
        .replace('+00', 'Z')        // Replace +00 with Z
        .replace('+00:00', 'Z')     // Handle +00:00 format
        .replace('-00', 'Z')        // Handle -00 format
        .replace(/\.\d{6}/, (match) => match.substring(0, 4)); // Trim microseconds to milliseconds
      
      const parsed = parseISO(isoDate);
      
      // Validate the result
      if (!isValidDate(parsed)) {
        console.warn('[dateUtils] Invalid date after parsing:', dateStr.substring(0, 50));
      }
      
      return parsed;
    }
    
    // Try parsing as ISO 8601
    const parsed = parseISO(dateStr);
    
    // Validate the result
    if (!isValidDate(parsed)) {
      console.warn('[dateUtils] Invalid ISO date:', dateStr.substring(0, 50));
    }
    
    return parsed;
  } catch (error) {
    // Return Invalid Date instead of current date
    return new Date(NaN);
  }
}

/**
 * Validates if a date is valid
 * 
 * @param date - Date object to validate
 * @returns true if date is valid
 */
export function isValidDate(date: Date): boolean {
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Safely get timestamp from date string
 * 
 * @param dateStr - Date string to convert
 * @returns Unix timestamp in milliseconds
 */
export function getTimestamp(dateStr: string): number {
  return parseFlexibleDate(dateStr).getTime();
}

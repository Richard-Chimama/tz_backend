/**
 * Data Validation and Sanitization Utility
 * 
 * This module provides common validation and sanitization functions
 * to ensure data integrity and security across the application.
 */

/**
 * Validates if the string is a valid email address.
 * @param email The email string to validate
 * @returns boolean
 */
export const isEmail = (email: string): boolean => {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

/**
 * Validates if the string is a valid phone number (basic international format).
 * Allows +, spaces, hyphens, and digits.
 * @param phone The phone string to validate
 * @returns boolean
 */
export const isPhoneNumber = (phone: string): boolean => {
  if (!phone || typeof phone !== 'string') return false;
  // Basic validation: 7 to 15 digits, allowing +, -, space
  const phoneRegex = /^\+?[\d\s-]{7,15}$/;
  // Remove non-digits to check length of actual numbers
  const digits = phone.replace(/\D/g, '');
  return phoneRegex.test(phone) && digits.length >= 7 && digits.length <= 15;
};

/**
 * Validates if the string is a valid UUID (v4).
 * @param uuid The UUID string to validate
 * @returns boolean
 */
export const isUUID = (uuid: string): boolean => {
  if (!uuid || typeof uuid !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * Validates if a string has a length within the specified range.
 * @param str The string to check
 * @param min Minimum length
 * @param max Maximum length
 * @returns boolean
 */
export const hasLength = (str: string, min: number, max: number = Infinity): boolean => {
  if (typeof str !== 'string') return false;
  return str.length >= min && str.length <= max;
};

/**
 * Sanitizes a string by trimming whitespace and removing control characters.
 * @param str The string to sanitize
 * @returns string
 */
export const sanitizeString = (str: string): string => {
  if (typeof str !== 'string') return '';
  // Remove control characters (ASCII 0-31) except newlines/tabs if needed, 
  // but here we strictly remove non-printable control chars.
  // eslint-disable-next-line no-control-regex
  return str.replace(/[\x00-\x08\x0B-\x1F\x7F]/g, '').trim();
};

/**
 * Sanitizes an email address (lowercase, trim).
 * @param email The email to sanitize
 * @returns string
 */
export const sanitizeEmail = (email: string): string => {
  if (typeof email !== 'string') return '';
  return email.trim().toLowerCase();
};

/**
 * Basic HTML escape to prevent XSS (if manually handling HTML output).
 * @param str The string to escape
 * @returns string
 */
export const escapeHtml = (str: string): string => {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

/**
 * Checks if a value is defined and not null.
 * @param value The value to check
 * @returns boolean
 */
export const isDefined = <T>(value: T | undefined | null): value is T => {
  return value !== undefined && value !== null;
};

export default {
  isEmail,
  isPhoneNumber,
  isUUID,
  hasLength,
  sanitizeString,
  sanitizeEmail,
  escapeHtml,
  isDefined,
};

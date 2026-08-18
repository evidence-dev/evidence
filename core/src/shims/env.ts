/**
 * Environment shim - replaces $app/environment.
 * Provides browser detection and dev mode flag.
 */

export const browser = typeof window !== 'undefined';

// Check for common build tool dev indicators
export const dev =
	(typeof import.meta !== 'undefined' && import.meta.env?.DEV === true) ||
	(typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') ||
	false;

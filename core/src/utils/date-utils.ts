/**
 * Safely parse a date string as local midnight.
 *
 * When a date string like "2025-10-16" is passed to new Date(), JavaScript interprets it
 * as midnight UTC, which can cause timezone issues. This function ensures the date is
 * interpreted as local midnight by appending 'T00:00:00' for YYYY-MM-DD format strings.
 *
 * @param dateString - A date string in YYYY-MM-DD format or ISO format
 * @returns Date object representing local midnight for YYYY-MM-DD strings, or the parsed date for other formats
 */
export function parseDateStringAsLocalMidnight(dateString: string): Date {
	// If it's just a date string (YYYY-MM-DD), append time to make it local midnight
	if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
		return new Date(dateString + 'T00:00:00');
	}
	// Otherwise parse as-is (e.g., already has time component)
	return new Date(dateString);
}

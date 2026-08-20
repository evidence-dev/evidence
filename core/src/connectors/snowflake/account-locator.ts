// The SDK builds its host from this string, so a delimiter like `/` or `@` sends
// the driver — and the credentials — to another server.

export const ACCOUNT_LOCATOR_MESSAGE =
	'Account locator can only contain alphanumeric characters, hyphens, underscores, and periods.';

export function isValidAccountLocator(value: unknown): value is string {
	return typeof value === 'string' && /^[a-zA-Z0-9_.-]+$/.test(value);
}

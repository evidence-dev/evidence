/**
 * Logo URL shim for @evidence/core
 *
 * Provides logo.dev URL generation. Returns null if API key is not configured.
 *
 * Requires envPrefix: ['VITE_', 'PUBLIC_'] in the host app's vite.config.ts
 * so Vite exposes PUBLIC_* vars through import.meta.env.
 */

const apiKey: string = import.meta.env.PUBLIC_LOGO_DEV_PUBLISHABLE_KEY || '';

/**
 * Builds a logo.dev URL for a given domain.
 * Returns null if the API key is not configured.
 * @param domain - The domain to get the logo for (e.g., "acme.com")
 * @param theme - The theme variant ('light' or 'dark')
 * @param fallback - What to return if no logo is found: '404' returns a 404 error, 'monogram' returns a letter-based placeholder
 * @param grayscale - Whether to return a grayscale version of the logo
 */
export function getLogoUrl(
	domain: string,
	theme: 'light' | 'dark',
	fallback: '404' | 'monogram' = '404',
	grayscale: boolean = false
): string | null {
	if (!apiKey) return null;
	let url = `https://img.logo.dev/${domain}?token=${apiKey}&retina=true&fallback=${fallback}&theme=${theme}&format=png`;
	if (grayscale) {
		url += '&greyscale=true';
	}
	return url;
}

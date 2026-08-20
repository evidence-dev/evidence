import { describe, expect, it } from 'vitest';
import {
	isInternalLink,
	isSafeExternalUrl,
	sanitizeUrl,
	transformInternalLink
} from './transform-internal-link';

describe('URL safety', () => {
	it.each(['http://example.com', 'https://example.com', 'mailto:user@example.com', 'tel:+15551234567'])(
		'accepts the safe external URL %s',
		(href) => {
			expect(isSafeExternalUrl(href)).toBe(true);
			expect(sanitizeUrl(href)).toBe(href);
		}
	);

	it.each([
		'javascript:alert(1)',
		'data:text/html,<script>alert(1)</script>',
		'vbscript:msgbox(1)'
	])('rewrites the unsafe URL %s', (href) => {
		expect(isSafeExternalUrl(href)).toBe(false);
		expect(sanitizeUrl(href)).toBe('about:blank');
		expect(transformInternalLink(href, 'published', {})).toBe('about:blank');
	});

	it('preserves relative links for internal transformation', () => {
		const href = '/project/report';

		expect(isSafeExternalUrl(href)).toBe(false);
		expect(sanitizeUrl(href)).toBe(href);
		expect(isInternalLink(href)).toBe(true);
		expect(transformInternalLink(href, 'published', { organizationId: 'org' })).toBe(
			'/org/project/report'
		);
	});

	it('preserves an omitted optional URL', () => {
		expect(sanitizeUrl(undefined)).toBeUndefined();
	});
});

import type { Config, Node } from '@markdoc/markdoc';
import { describe, expect, it } from 'vitest';
import { isUrl } from './isUrl';

const config = {} as Config;

function validate(href: unknown) {
	const node = {
		attributes: { href },
		location: { start: { line: 1 }, end: { line: 1 } }
	} as unknown as Node;

	return isUrl('href')(node, config);
}

describe('isUrl', () => {
	it.each(['https://example.com', 'http://example.com', 'mailto:user@example.com', 'tel:+15551234567'])(
		'accepts the safe URL %s',
		(href) => {
			expect(validate(href)).toEqual([]);
		}
	);

	it.each([
		'javascript:alert(1)',
		'data:text/html,<script>alert(1)</script>',
		'vbscript:msgbox(1)',
		'not a URL'
	])('rejects the unsafe or invalid URL %s', (href) => {
		expect(validate(href)).toEqual([
			expect.objectContaining({
				id: 'invalid-url',
				level: 'error'
			})
		]);
	});

	// These parse fine and cannot execute — they are turned away by the allowlist, not by being
	// malformed, so the message has to say which schemes are allowed or the author is stuck.
	it.each(['ftp://files.example.com/report.csv', 'sms:+15551234567', 's3://bucket/key'])(
		'rejects the valid but non-allowlisted URL %s, and says why',
		(href) => {
			expect(validate(href)).toEqual([
				expect.objectContaining({
					id: 'invalid-url',
					message: '`href` must be an http, https, mailto, or tel URL'
				})
			]);
		}
	);

	it('skips non-string attributes', () => {
		expect(validate(undefined)).toEqual([]);
	});
});

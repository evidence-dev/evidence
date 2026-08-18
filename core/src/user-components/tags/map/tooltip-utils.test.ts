import { describe, expect, it } from 'vitest';
import { buildTooltipHTML } from './tooltip-utils';

const PAYLOAD = '<img src=x onerror=alert(1)>';
const ESCAPED = '&lt;img src=x onerror=alert(1)&gt;';

describe('buildTooltipHTML', () => {
	it('escapes a payload in every data-derived position', () => {
		const html = buildTooltipHTML({
			title: PAYLOAD,
			subtitle: PAYLOAD,
			valueFields: [{ label: PAYLOAD, value: PAYLOAD }]
		});

		expect(html).not.toContain(PAYLOAD);
		expect(html.match(/&lt;img src=x onerror=alert\(1\)&gt;/g)).toHaveLength(4);
	});

	it('keeps the surrounding markup intact', () => {
		const html = buildTooltipHTML({
			title: 'Portland',
			valueFields: [{ label: 'Revenue', value: 1234, format: 'usd' }]
		});

		expect(html).toContain('<div class="font-semibold text-sm">Portland</div>');
		expect(html).toContain('<span class="text-xs opacity-80">Revenue</span>');
		expect(html).toContain('$1,234');
	});

	it('escapes the ampersand before the angle brackets', () => {
		const html = buildTooltipHTML({ title: '&lt;b&gt;', valueFields: [] });

		expect(html).toContain('&amp;lt;b&amp;gt;');
	});

	// The callers read these off a GeoJSON property bag, so the declared
	// `string` type is not what always arrives.
	it('survives a non-string title and value', () => {
		const html = buildTooltipHTML({
			title: 2026 as unknown as string,
			valueFields: [{ label: 'Count', value: true }]
		});

		expect(html).toContain('>2026<');
		expect(html).toContain('>TRUE<');
	});

	it('renders nothing when there is nothing to show', () => {
		expect(buildTooltipHTML({ valueFields: [] })).toBe('');
	});
});

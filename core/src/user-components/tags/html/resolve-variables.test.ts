import { describe, it, expect } from 'vitest';
import { resolveVariables } from './resolve-variables';

describe('resolveVariables', () => {
	it('interpolates {{ }} string values via resolveText (initial render)', () => {
		const resolveText = (v: string) => v.replace('{{ region.value }}', 'north');
		expect(
			resolveVariables({ region: '{{ region.value }}', label: 'static', limit: 10 }, resolveText)
		).toEqual({ region: 'north', label: 'static', limit: 10 });
	});

	it('reflects a source-value change (resolveText returns a new value)', () => {
		// Same input object, different resolver output — mirrors a filter change
		// re-running the derivation. A regression that froze the first value or
		// stopped re-resolving would fail here.
		const raw = { region: '{{ region.value }}' };
		expect(resolveVariables(raw, (v) => v.replace('{{ region.value }}', 'north'))).toEqual({
			region: 'north'
		});
		expect(resolveVariables(raw, (v) => v.replace('{{ region.value }}', 'south'))).toEqual({
			region: 'south'
		});
	});

	it('falls back to the raw string when resolveText yields null/undefined', () => {
		expect(resolveVariables({ x: '{{ f }}' }, () => undefined)).toEqual({ x: '{{ f }}' });
		expect(resolveVariables({ x: '{{ f }}' }, () => null)).toEqual({ x: '{{ f }}' });
	});

	it('passes non-string primitives through and strips functions/objects/arrays', () => {
		expect(
			resolveVariables(
				{ n: 5, b: true, z: null, s: 'x', fn: () => 1, obj: { a: 1 }, arr: [1] },
				(v) => v
			)
		).toEqual({ n: 5, b: true, z: null, s: 'x' });
	});

	it('returns {} for non-object input', () => {
		expect(resolveVariables(undefined, (v) => v)).toEqual({});
		expect(resolveVariables(null, (v) => v)).toEqual({});
		expect(resolveVariables('nope', (v) => v)).toEqual({});
	});
});

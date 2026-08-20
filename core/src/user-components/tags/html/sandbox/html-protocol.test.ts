import { describe, it, expect } from 'vitest';
import {
	validateFilterSetMessage,
	validateFilterCreateMessage,
	validateModalOpenMessage,
	validateNavigateMessage,
	isSafeInternalPath
} from './html-protocol';

describe('validateFilterSetMessage', () => {
	it('accepts a well-formed filter-set with any value type', () => {
		expect(validateFilterSetMessage({ type: 'filter-set', id: 'region', value: 'EU' })).toEqual({
			type: 'filter-set',
			id: 'region',
			value: 'EU'
		});

		expect(validateFilterSetMessage({ type: 'filter-set', id: 'count', value: 42 })).toEqual({
			type: 'filter-set',
			id: 'count',
			value: 42
		});

		expect(validateFilterSetMessage({ type: 'filter-set', id: 'cleared', value: null })).toEqual({
			type: 'filter-set',
			id: 'cleared',
			value: null
		});

		expect(
			validateFilterSetMessage({
				type: 'filter-set',
				id: 'multi',
				value: ['a', 'b']
			})
		).toEqual({ type: 'filter-set', id: 'multi', value: ['a', 'b'] });
	});

	it('rejects empty / non-string ids', () => {
		expect(validateFilterSetMessage({ type: 'filter-set', id: '', value: 'x' })).toBeNull();
		expect(validateFilterSetMessage({ type: 'filter-set', id: 42, value: 'x' })).toBeNull();
		expect(validateFilterSetMessage({ type: 'filter-set', id: null, value: 'x' })).toBeNull();
		expect(
			validateFilterSetMessage({ type: 'filter-set', id: { evil: true }, value: 'x' })
		).toBeNull();
	});

	it('rejects wrong message type', () => {
		expect(validateFilterSetMessage({ type: 'filter-create', id: 'r', value: 'x' })).toBeNull();
		expect(validateFilterSetMessage({ id: 'r', value: 'x' })).toBeNull();
	});

	it('rejects non-object inputs without throwing', () => {
		expect(validateFilterSetMessage(null)).toBeNull();
		expect(validateFilterSetMessage(undefined)).toBeNull();
		expect(validateFilterSetMessage('filter-set')).toBeNull();
	});
});

describe('validateFilterCreateMessage', () => {
	it('accepts filter-create without a column', () => {
		expect(validateFilterCreateMessage({ type: 'filter-create', id: 'x', value: null })).toEqual({
			type: 'filter-create',
			id: 'x',
			value: null
		});
	});

	it('accepts filter-create with a bare SQL identifier column', () => {
		expect(
			validateFilterCreateMessage({
				type: 'filter-create',
				id: 'region',
				value: null,
				column: 'region_code'
			})
		).toEqual({
			type: 'filter-create',
			id: 'region',
			value: null,
			column: 'region_code'
		});
	});

	it('accepts dotted identifiers (schema.table.column)', () => {
		expect(
			validateFilterCreateMessage({
				type: 'filter-create',
				id: 'r',
				value: null,
				column: 'public.users.region_code'
			})
		).toEqual({
			type: 'filter-create',
			id: 'r',
			value: null,
			column: 'public.users.region_code'
		});
	});

	it('accepts $ and _ in identifier (real-world DBs allow them)', () => {
		expect(
			validateFilterCreateMessage({
				type: 'filter-create',
				id: 'r',
				value: null,
				column: '_internal$col'
			})
		).not.toBeNull();
	});

	// The injection-shape cases: each of these would, without validation,
	// flow into ExternalFilter.sql as ${column}='value' and produce SQL we
	// did not intend to emit.
	it.each([
		"region'; DROP TABLE users; --",
		'region; SELECT *',
		'region = 1 OR 1=1',
		'region\nSELECT *',
		'region`',
		'"My Column"',
		'region/*comment*/',
		"region';",
		'',
		' region',
		'1region',
		'.region',
		'region.',
		'region..col'
	])('rejects SQL-injection-shaped column %j', (badColumn) => {
		expect(
			validateFilterCreateMessage({
				type: 'filter-create',
				id: 'r',
				value: null,
				column: badColumn
			})
		).toBeNull();
	});

	it('rejects non-string column (object/number/null)', () => {
		expect(
			validateFilterCreateMessage({ type: 'filter-create', id: 'r', value: null, column: 42 })
		).toBeNull();
		expect(
			validateFilterCreateMessage({
				type: 'filter-create',
				id: 'r',
				value: null,
				column: null
			})
		).toBeNull();
		expect(
			validateFilterCreateMessage({
				type: 'filter-create',
				id: 'r',
				value: null,
				column: { name: 'region' }
			})
		).toBeNull();
	});

	it('rejects empty / non-string ids', () => {
		expect(validateFilterCreateMessage({ type: 'filter-create', id: '', value: null })).toBeNull();
		expect(validateFilterCreateMessage({ type: 'filter-create', id: 42, value: null })).toBeNull();
	});

	it('rejects wrong message type', () => {
		expect(validateFilterCreateMessage({ type: 'filter-set', id: 'r', value: null })).toBeNull();
	});

	it('does NOT include column on the validated message when it was omitted', () => {
		const validated = validateFilterCreateMessage({
			type: 'filter-create',
			id: 'r',
			value: null
		});
		expect(validated).not.toHaveProperty('column');
	});
});

describe('validateModalOpenMessage', () => {
	it('accepts a modal-open with title and html', () => {
		expect(
			validateModalOpenMessage({ type: 'modal-open', title: 'Japan', html: '<b>GDP +1.2%</b>' })
		).toEqual({ type: 'modal-open', title: 'Japan', html: '<b>GDP +1.2%</b>' });
	});

	it('accepts html without a title, and drops an empty/non-string title', () => {
		expect(validateModalOpenMessage({ type: 'modal-open', html: '<p>summary</p>' })).toEqual({
			type: 'modal-open',
			html: '<p>summary</p>'
		});
		expect(
			validateModalOpenMessage({ type: 'modal-open', title: '', html: '<p>x</p>' })
		).not.toHaveProperty('title');
		expect(
			validateModalOpenMessage({ type: 'modal-open', title: 42, html: '<p>x</p>' })
		).not.toHaveProperty('title');
	});

	it('rejects empty / non-string html', () => {
		expect(validateModalOpenMessage({ type: 'modal-open', html: '' })).toBeNull();
		expect(validateModalOpenMessage({ type: 'modal-open', html: 42 })).toBeNull();
		expect(validateModalOpenMessage({ type: 'modal-open' })).toBeNull();
	});

	it('rejects wrong message type and non-objects', () => {
		expect(validateModalOpenMessage({ type: 'modal-close', html: '<p>x</p>' })).toBeNull();
		expect(validateModalOpenMessage(null)).toBeNull();
		expect(validateModalOpenMessage('modal-open')).toBeNull();
	});
});

describe('isSafeInternalPath', () => {
	it('accepts internal absolute app paths', () => {
		expect(isSafeInternalPath('/')).toBe(true);
		expect(isSafeInternalPath('/reports/detail')).toBe(true);
		expect(isSafeInternalPath('/my-project/reports/detail?tab=1&x=2')).toBe(true);
	});

	it('rejects off-origin / scheme / protocol-relative targets', () => {
		expect(isSafeInternalPath('//evil.com')).toBe(false); // protocol-relative host
		expect(isSafeInternalPath('https://evil.com')).toBe(false);
		expect(isSafeInternalPath('http://evil.com')).toBe(false);
		expect(isSafeInternalPath('javascript:alert(1)')).toBe(false);
		expect(isSafeInternalPath('data:text/html,<script>')).toBe(false);
		expect(isSafeInternalPath('mailto:x@y.com')).toBe(false);
	});

	it('rejects relative paths, backslashes, spaces, control chars, and non-strings', () => {
		expect(isSafeInternalPath('reports/detail')).toBe(false); // no leading slash
		expect(isSafeInternalPath('')).toBe(false);
		expect(isSafeInternalPath('/a\\b')).toBe(false); // backslash (browsers fold to /)
		expect(isSafeInternalPath('/a b')).toBe(false); // literal space
		expect(isSafeInternalPath('/a\tb')).toBe(false); // control char
		expect(isSafeInternalPath(42)).toBe(false);
		expect(isSafeInternalPath(null)).toBe(false);
		expect(isSafeInternalPath(undefined)).toBe(false);
	});
});

describe('validateNavigateMessage', () => {
	it('accepts a navigate to a safe internal path', () => {
		expect(validateNavigateMessage({ type: 'navigate', path: '/reports/detail' })).toEqual({
			type: 'navigate',
			path: '/reports/detail'
		});
	});

	it('rejects an unsafe path (off-origin / scheme / protocol-relative)', () => {
		expect(validateNavigateMessage({ type: 'navigate', path: 'https://evil.com' })).toBeNull();
		expect(validateNavigateMessage({ type: 'navigate', path: '//evil.com' })).toBeNull();
		expect(validateNavigateMessage({ type: 'navigate', path: 'javascript:alert(1)' })).toBeNull();
		expect(validateNavigateMessage({ type: 'navigate', path: 'reports' })).toBeNull();
		expect(validateNavigateMessage({ type: 'navigate', path: 42 })).toBeNull();
	});

	it('rejects wrong message type and non-objects', () => {
		expect(validateNavigateMessage({ type: 'modal-open', path: '/x' })).toBeNull();
		expect(validateNavigateMessage(null)).toBeNull();
		expect(validateNavigateMessage('navigate')).toBeNull();
	});
});

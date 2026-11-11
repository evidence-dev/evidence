import { afterEach, describe, expect, it, vi } from 'vitest';
import { logger } from './logger';

describe('core logger shim console fallback', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('prints the message before its object', () => {
		const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});

		logger.warn({ table: 'orders' }, 'slow catalog');

		expect(consoleWarn.mock.calls).toStrictEqual([['slow catalog', { table: 'orders' }]]);
	});

	it('prints a plain string without a trailing undefined', () => {
		const consoleInfo = vi.spyOn(console, 'info').mockImplementation(() => {});

		logger.info('[PDF-TRACKER] NOT settling');

		expect(consoleInfo.mock.calls).toStrictEqual([['[PDF-TRACKER] NOT settling']]);
	});
});

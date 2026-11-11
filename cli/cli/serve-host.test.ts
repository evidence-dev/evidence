import { describe, expect, it } from 'vitest';
import { isAllowedServeRequestHost } from './serve-host';

describe('Loopback serve Host validation', () => {
	it('allows loopback Host headers on a loopback listener', () => {
		for (const hostname of ['127.0.0.1', 'localhost', '[::1]']) {
			expect(isAllowedServeRequestHost('127.0.0.1', `http://${hostname}:3000/api/query`)).toBe(
				true
			);
		}
	});

	it('rejects attacker-owned DNS names resolving to localhost', () => {
		expect(
			isAllowedServeRequestHost('127.0.0.1', 'http://evil.example:3000/api/query')
		).toBe(false);
		expect(
			isAllowedServeRequestHost('localhost', 'http://localhost.evil.example:3000/api/query')
		).toBe(false);
	});

	it('rejects invalid URLs on loopback', () => {
		expect(isAllowedServeRequestHost('127.0.0.1', 'not-a-url')).toBe(false);
	});

	it('does not interfere with non-loopback listeners protected by server auth', () => {
		expect(isAllowedServeRequestHost('0.0.0.0', 'https://report.example.com/api/query')).toBe(
			true
		);
	});
});

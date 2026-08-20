import { describe, it, expect } from 'vitest';
import { buildPostgresSsl } from './connection-options';

describe('buildPostgresSsl', () => {
	it('disables TLS for mode "disable"', () => {
		expect(buildPostgresSsl({ mode: 'disable' })).toBe(false);
		// Even with a CA present, disable means disable.
		expect(buildPostgresSsl({ mode: 'disable', ca: 'PEM' })).toBe(false);
	});

	it('encrypts without verifying for mode "require"', () => {
		const ssl = buildPostgresSsl({ mode: 'require' });
		expect(ssl).toEqual({ rejectUnauthorized: false });
	});

	it('verifies the chain but skips the hostname for mode "verify-ca"', () => {
		const ssl = buildPostgresSsl({ mode: 'verify-ca', ca: 'CA_PEM' });
		expect(ssl).not.toBe(false);
		if (ssl === false) throw new Error('unreachable');
		expect(ssl.rejectUnauthorized).toBe(true);
		expect(ssl.ca).toBe('CA_PEM');
		// A no-op checkServerIdentity is what skips the hostname check.
		expect(typeof ssl.checkServerIdentity).toBe('function');
		expect(ssl.checkServerIdentity?.()).toBeUndefined();
	});

	it('verifies chain and hostname for mode "verify-full"', () => {
		const ssl = buildPostgresSsl({ mode: 'verify-full', ca: 'CA_PEM' });
		if (ssl === false) throw new Error('unreachable');
		expect(ssl.rejectUnauthorized).toBe(true);
		expect(ssl.ca).toBe('CA_PEM');
		// No hostname-skip override on verify-full.
		expect(ssl.checkServerIdentity).toBeUndefined();
	});

	it('passes through client cert/key for mutual TLS', () => {
		const ssl = buildPostgresSsl({
			mode: 'verify-full',
			ca: 'CA',
			cert: 'CERT',
			key: 'KEY'
		});
		if (ssl === false) throw new Error('unreachable');
		expect(ssl.cert).toBe('CERT');
		expect(ssl.key).toBe('KEY');
	});
});

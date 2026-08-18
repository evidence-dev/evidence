import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import { decryptPemIfEncrypted } from './decrypt-pem';

function generateEncryptedKey(passphrase: string): string {
	const { privateKey } = crypto.generateKeyPairSync('rsa', {
		modulusLength: 2048,
		publicKeyEncoding: { type: 'spki', format: 'pem' },
		privateKeyEncoding: {
			type: 'pkcs8',
			format: 'pem',
			cipher: 'aes-256-cbc',
			passphrase
		}
	});
	return privateKey;
}

describe('decryptPemIfEncrypted', () => {
	it('returns an unencrypted PEM unchanged', () => {
		const pem = '-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----';
		expect(decryptPemIfEncrypted(pem, undefined)).toBe(pem);
		expect(decryptPemIfEncrypted(pem, 'ignored')).toBe(pem);
	});

	it('decrypts an encrypted PKCS#8 PEM into an unencrypted one', () => {
		const encrypted = generateEncryptedKey('topsecret');
		expect(encrypted).toContain('BEGIN ENCRYPTED PRIVATE KEY');

		const decrypted = decryptPemIfEncrypted(encrypted, 'topsecret');
		expect(decrypted).toContain('BEGIN PRIVATE KEY');
		expect(decrypted).not.toContain('ENCRYPTED');
	});

	it('throws when an encrypted key is provided without a passphrase', () => {
		const encrypted = generateEncryptedKey('topsecret');
		expect(() => decryptPemIfEncrypted(encrypted, undefined)).toThrow(/passphrase is required/);
		expect(() => decryptPemIfEncrypted(encrypted, '')).toThrow(/passphrase is required/);
	});

	it('throws when the passphrase is wrong', () => {
		const encrypted = generateEncryptedKey('topsecret');
		expect(() => decryptPemIfEncrypted(encrypted, 'wrong')).toThrow(/failed to decrypt/);
	});
});

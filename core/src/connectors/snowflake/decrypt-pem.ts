import crypto from 'crypto';

/**
 * The Snowflake SDK's `privateKey` option only accepts unencrypted PKCS#8 PEMs
 * — it rejects "BEGIN ENCRYPTED PRIVATE KEY" via its `isPrivateKey` check
 * before the supplied passphrase is ever consulted. Decrypt with node:crypto
 * so we can hand the SDK an unencrypted PKCS#8 PEM.
 *
 * No-op when the PEM is already unencrypted.
 */
export function decryptPemIfEncrypted(pem: string, passphrase: string | undefined): string {
	if (!pem.includes('BEGIN ENCRYPTED PRIVATE KEY')) return pem;
	if (passphrase === undefined || passphrase === '') {
		throw new Error('private key is encrypted; a passphrase is required');
	}
	try {
		const keyObject = crypto.createPrivateKey({ key: pem, format: 'pem', passphrase });
		return keyObject.export({ type: 'pkcs8', format: 'pem' }) as string;
	} catch (e) {
		throw new Error(
			`failed to decrypt private key (wrong passphrase?): ${(e as Error).message}`
		);
	}
}

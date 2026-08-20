import { timingSafeEqual } from 'node:crypto';

/**
 * Explicit auth opt-out for trusted private networks. Only the exact values
 * '1' and 'true' disable auth — anything else (including 'false' or '0') is
 * ignored, so a mis-set value fails closed.
 */
export function authDisabled(): boolean {
	const v = process.env.EVIDENCE_AUTH_DISABLED;
	return v === '1' || v === 'true';
}

/**
 * Constant-time check of an HTTP Basic `Authorization` header against the
 * configured env credentials. Shared by the SvelteKit hook (SSR/API traffic)
 * and the Bun static-file branch in cli/cli/server.ts, which returns before
 * SvelteKit ever sees the request. Lives in cli/cli/ because the evd-adapter
 * only copies that tree into the binary's compile dir.
 *
 * Returns true when auth is not configured (localhost-exempt installs — boot
 * validation is what enforces auth beyond localhost) or explicitly disabled
 * via EVIDENCE_AUTH_DISABLED.
 */
export function checkBasicAuth(header: string | null): boolean {
	if (authDisabled()) return true;
	const user = process.env.EVIDENCE_BASIC_USER;
	const password = process.env.EVIDENCE_BASIC_PASSWORD;
	if (!user || !password) return true;
	if (!header?.startsWith('Basic ')) return false;

	let decoded: string;
	try {
		decoded = Buffer.from(header.slice('Basic '.length), 'base64').toString('utf8');
	} catch {
		return false;
	}
	const sep = decoded.indexOf(':');
	if (sep === -1) return false;

	const eq = (a: string, b: string) => {
		const ab = Buffer.from(a);
		const bb = Buffer.from(b);
		return ab.length === bb.length && timingSafeEqual(ab, bb);
	};
	return eq(decoded.slice(0, sep), user) && eq(decoded.slice(sep + 1), password);
}

/** Headers applied to every response in serve mode. */
export const SERVE_HARDENED_HEADERS: Record<string, string> = {
	'X-Content-Type-Options': 'nosniff',
	'Referrer-Policy': 'no-referrer',
	'X-Frame-Options': 'DENY'
};

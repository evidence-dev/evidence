/**
 * Reject DNS-rebinding requests when the production server listens on loopback.
 *
 * Browsers can resolve attacker-controlled names to 127.0.0.1 and send a
 * same-origin POST to them. Restricting the HTTP Host is separate from the
 * SQL endpoint's Origin / Content-Type controls.
 */
const LOOPBACK_HOSTS = new Set(['127.0.0.1', 'localhost', '::1']);

function normalizeHostname(host: string): string {
	return host.replace(/^\[/, '').replace(/\]$/, '').toLowerCase();
}

export function isAllowedServeRequestHost(boundHost: string, requestUrl: string): boolean {
	if (!LOOPBACK_HOSTS.has(normalizeHostname(boundHost))) {
		// Non-loopback hosting must pass the existing authentication preflight.
		return true;
	}

	try {
		const hostname = normalizeHostname(new URL(requestUrl).hostname);
		return LOOPBACK_HOSTS.has(hostname);
	} catch {
		return false;
	}
}

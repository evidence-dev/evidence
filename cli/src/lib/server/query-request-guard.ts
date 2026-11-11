/**
 * Protect the SQL HTTP endpoint against cross-origin browser requests and
 * excessively large payloads. This is an HTTP boundary, not a SQL sandbox:
 * authenticated clients are still trusted to submit SQL.
 */
export const MAX_SQL_REQUEST_BYTES = 256 * 1024;

function rejection(status: number, message: string): Response {
	return Response.json({ error: message }, { status });
}

function isSameOrigin(request: Request): boolean {
	const origin = request.headers.get('origin');
	if (!origin) return true; // CLI/curl requests do not have an Origin header.
	try {
		return new URL(origin).origin === new URL(request.url).origin;
	} catch {
		return false;
	}
}

/**
 * Returns SQL on success or an HTTP error response on failure.
 * Read the body incrementally so a forged Content-Length cannot bypass limits.
 */
export async function parseSqlQueryRequest(request: Request): Promise<string | Response> {
	const site = request.headers.get('sec-fetch-site');
	if (!isSameOrigin(request) || (site && site !== 'same-origin' && site !== 'none')) {
		return rejection(403, 'Cross-origin SQL requests are forbidden');
	}

	const contentType = request.headers.get('content-type') ?? '';
	if (!/^application\/json\s*(?:;|$)/i.test(contentType)) {
		return rejection(415, 'Content-Type must be application/json');
	}

	const lengthHeader = request.headers.get('content-length');
	if (lengthHeader !== null) {
		if (!/^\d+$/.test(lengthHeader)) return rejection(400, 'Invalid Content-Length');
		if (Number(lengthHeader) > MAX_SQL_REQUEST_BYTES) {
			return rejection(413, 'SQL request body is too large');
		}
	}

	if (!request.body) return rejection(400, 'Missing request body');

	const reader = request.body.getReader();
	const chunks: Uint8Array[] = [];
	let size = 0;
	try {
		for (;;) {
			const { value, done } = await reader.read();
			if (done) break;
			size += value.byteLength;
			if (size > MAX_SQL_REQUEST_BYTES) {
				await reader.cancel();
				return rejection(413, 'SQL request body is too large');
			}
			chunks.push(value);
		}
	} catch {
		return rejection(400, 'Unable to read SQL request body');
	} finally {
		reader.releaseLock();
	}

	const buffer = new Uint8Array(size);
	let offset = 0;
	for (const chunk of chunks) {
		buffer.set(chunk, offset);
		offset += chunk.byteLength;
	}

	let payload: unknown;
	try {
		payload = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(buffer));
	} catch {
		return rejection(400, 'Invalid JSON request body');
	}

	if (
		typeof payload !== 'object' ||
		payload === null ||
		!('sql' in payload) ||
		typeof payload.sql !== 'string' ||
		!payload.sql.trim()
	) {
		return rejection(400, 'Missing sql parameter');
	}

	return payload.sql;
}

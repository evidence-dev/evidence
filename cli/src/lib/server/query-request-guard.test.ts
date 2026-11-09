import { describe, expect, it } from 'vitest';
import { MAX_SQL_REQUEST_BYTES, parseSqlQueryRequest } from './query-request-guard';

const endpoint = 'http://127.0.0.1:3000/api/query';
const sql = "SELECT 42 AS answer";

function request(
	body: string = JSON.stringify({ sql }),
	headers: Record<string, string> = {}
): Request {
	return new Request(endpoint, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', ...headers },
		body
	});
}

async function expectRejected(request: Request, status: number): Promise<void> {
	const result = await parseSqlQueryRequest(request);
	expect(result).toBeInstanceOf(Response);
	expect((result as Response).status).toBe(status);
}

describe('SQL HTTP request guard', () => {
	it('accepts same-origin JSON queries', async () => {
		expect(
			await parseSqlQueryRequest(
				request(JSON.stringify({ sql }), {
					Origin: 'http://127.0.0.1:3000',
					'Sec-Fetch-Site': 'same-origin'
				})
			)
		).toBe(sql);
	});

	it('accepts CLI clients without browser Origin headers', async () => {
		expect(await parseSqlQueryRequest(request())).toBe(sql);
	});

	it('rejects a cross-origin browser request', async () => {
		await expectRejected(
			request(JSON.stringify({ sql }), { Origin: 'https://attacker.example' }),
			403
		);
	});

	it('rejects opaque and malformed origins', async () => {
		await expectRejected(request(JSON.stringify({ sql }), { Origin: 'null' }), 403);
		await expectRejected(request(JSON.stringify({ sql }), { Origin: '%invalid' }), 403);
	});

	it('rejects cross-site fetch metadata even if Origin is absent', async () => {
		await expectRejected(
			request(JSON.stringify({ sql }), { 'Sec-Fetch-Site': 'cross-site' }),
			403
		);
	});

	it('rejects HTML-form-friendly content types', async () => {
		await expectRejected(
			request(JSON.stringify({ sql }), { 'Content-Type': 'text/plain' }),
			415
		);
	});

	it('allows JSON with a charset parameter', async () => {
		expect(
			await parseSqlQueryRequest(
				request(JSON.stringify({ sql }), { 'Content-Type': 'application/json; charset=utf-8' })
			)
		).toBe(sql);
	});

	it('rejects an oversized body without trusting Content-Length', async () => {
		await expectRejected(request(JSON.stringify({ sql: 'x'.repeat(MAX_SQL_REQUEST_BYTES) })), 413);
	});

	it('rejects an oversized advertised Content-Length', async () => {
		await expectRejected(
			request(JSON.stringify({ sql }), { 'Content-Length': String(MAX_SQL_REQUEST_BYTES + 1) }),
			413
		);
	});

	it('rejects invalid JSON and missing SQL without executing anything', async () => {
		await expectRejected(request('{not json'), 400);
		await expectRejected(request(JSON.stringify({ sql: '' })), 400);
		await expectRejected(request(JSON.stringify({ sql: 42 })), 400);
	});
});

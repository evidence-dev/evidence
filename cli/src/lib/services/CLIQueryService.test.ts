import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CLIQueryService } from './CLIQueryService';

const abortError = () => new DOMException('Aborted', 'AbortError');

// A fetch that stays pending until its signal aborts, like a slow query.
const pendingFetch = vi.fn(
	(_url: string, init: RequestInit) =>
		new Promise<Response>((_resolve, reject) => {
			if (init.signal?.aborted) return reject(abortError());
			init.signal?.addEventListener('abort', () => reject(abortError()));
		})
);

const settled = async (promise: Promise<unknown>) => {
	const pending = Symbol('pending');
	await new Promise((resolve) => setTimeout(resolve));
	return (await Promise.race([promise, Promise.resolve(pending)])) !== pending;
};

beforeEach(() => {
	pendingFetch.mockClear();
	vi.stubGlobal('fetch', pendingFetch);
});

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('CLIQueryService.abandon', () => {
	it('aborts in-flight requests and leaves their queries pending', async () => {
		const service = new CLIQueryService('org');
		const query = service.query('select 1');

		service.abandon();

		expect(pendingFetch.mock.calls[0][1].signal?.aborted).toBe(true);
		expect(await settled(query)).toBe(false);
	});

	it('aborts requests that were given their own signal', async () => {
		const service = new CLIQueryService('org');
		const query = service.query('select 1', { signal: new AbortController().signal });

		service.abandon();

		expect(pendingFetch.mock.calls[0][1].signal?.aborted).toBe(true);
		expect(await settled(query)).toBe(false);
	});

	it('leaves queries started afterwards pending', async () => {
		const service = new CLIQueryService('org');
		service.abandon();

		expect(await settled(service.query('select 1'))).toBe(false);
	});

	it('still resolves empty when only the caller aborts', async () => {
		const service = new CLIQueryService('org');
		const controller = new AbortController();
		const query = service.query('select 1', { signal: controller.signal });

		controller.abort();

		await expect(query).resolves.toEqual({ rows: [], columns: [], error: null });
	});
});

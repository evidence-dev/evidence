import { afterEach, describe, expect, it, vi } from 'vitest';
import { SandboxRpc } from './request-response';

/**
 * Unit tests for the correlated request/response primitive. The primitive is
 * transport-agnostic — it's handed a `post` and fed inbound messages via
 * `handleMessage` — so these drive it directly with a captured outbox rather
 * than a real MessageChannel (the channel mechanics are exercised end-to-end
 * in runtime-bootstrap.test). What matters here is the correlation contract:
 * a request resolves with ITS matching reply, rejects on error/timeout, and a
 * handler's return/throw becomes the reply the peer sees.
 */

afterEach(() => {
	vi.useRealTimers();
	vi.restoreAllMocks();
});

/** An RPC plus the list of messages it posted, for assertions. */
function makeRpc(opts?: { defaultTimeoutMs?: number }) {
	const outbox: Array<Record<string, unknown>> = [];
	let counter = 0;
	const rpc = new SandboxRpc({
		post: (m) => outbox.push(m),
		defaultTimeoutMs: opts?.defaultTimeoutMs,
		generateId: () => `id-${++counter}`
	});
	return { rpc, outbox };
}

describe('SandboxRpc requests (this end asks the peer)', () => {
	it('posts an rpc-request and resolves with the matching ok reply result', async () => {
		const { rpc, outbox } = makeRpc();
		const promise = rpc.request<number>('query', { name: 'orders' });

		expect(outbox).toEqual([
			{ type: 'rpc-request', requestId: 'id-1', kind: 'query', payload: { name: 'orders' } }
		]);

		const consumed = rpc.handleMessage({
			type: 'rpc-response',
			requestId: 'id-1',
			ok: true,
			result: 42
		});
		expect(consumed).toBe(true);
		await expect(promise).resolves.toBe(42);
	});

	it('rejects with the error message from a non-ok reply', async () => {
		const { rpc } = makeRpc();
		const promise = rpc.request('query', { name: 'nope' });
		rpc.handleMessage({
			type: 'rpc-response',
			requestId: 'id-1',
			ok: false,
			error: 'no such query'
		});
		await expect(promise).rejects.toThrow('no such query');
	});

	it('correlates concurrent requests independently (replies can arrive out of order)', async () => {
		const { rpc } = makeRpc();
		const first = rpc.request<string>('a');
		const second = rpc.request<string>('b');

		// Reply to the second request first — must still route correctly.
		rpc.handleMessage({ type: 'rpc-response', requestId: 'id-2', ok: true, result: 'B' });
		rpc.handleMessage({ type: 'rpc-response', requestId: 'id-1', ok: true, result: 'A' });

		await expect(first).resolves.toBe('A');
		await expect(second).resolves.toBe('B');
	});

	it('rejects with a timeout when no reply arrives in time', async () => {
		vi.useFakeTimers();
		const { rpc } = makeRpc();
		const promise = rpc.request('slow', undefined, { timeoutMs: 1000 });
		const assertion = expect(promise).rejects.toThrow(/timed out after 1000ms/);
		await vi.advanceTimersByTimeAsync(1000);
		await assertion;
	});

	it('ignores a late reply that arrives after the request timed out', async () => {
		vi.useFakeTimers();
		const { rpc } = makeRpc();
		const promise = rpc.request('slow', undefined, { timeoutMs: 500 });
		const assertion = expect(promise).rejects.toThrow(/timed out/);
		await vi.advanceTimersByTimeAsync(500);
		await assertion;

		// The stale reply must be a no-op, not throw or resolve anything.
		expect(() =>
			rpc.handleMessage({ type: 'rpc-response', requestId: 'id-1', ok: true, result: 'late' })
		).not.toThrow();
	});
});

describe('SandboxRpc handlers (the peer asks this end)', () => {
	it('runs the registered handler and replies ok with its result', async () => {
		const { rpc, outbox } = makeRpc();
		rpc.setHandler('capture-png', (payload) => {
			const px = (payload as { pixelRatio?: number }).pixelRatio;
			return `png@${px}`;
		});

		const consumed = rpc.handleMessage({
			type: 'rpc-request',
			requestId: 'r-1',
			kind: 'capture-png',
			payload: { pixelRatio: 2 }
		});
		expect(consumed).toBe(true);
		// Handler runs in a microtask; let it settle.
		await Promise.resolve();
		await Promise.resolve();

		expect(outbox).toEqual([{ type: 'rpc-response', requestId: 'r-1', ok: true, result: 'png@2' }]);
	});

	it('awaits an async handler before replying', async () => {
		const { rpc, outbox } = makeRpc();
		rpc.setHandler('query', async () => {
			await Promise.resolve();
			return [{ x: 1 }];
		});

		rpc.handleMessage({ type: 'rpc-request', requestId: 'r-2', kind: 'query', payload: undefined });
		await vi.waitFor(() => expect(outbox).toHaveLength(1));
		expect(outbox[0]).toMatchObject({
			type: 'rpc-response',
			requestId: 'r-2',
			ok: true,
			result: [{ x: 1 }]
		});
	});

	it('replies with an error when the handler throws', async () => {
		const { rpc, outbox } = makeRpc();
		rpc.setHandler('boom', () => {
			throw new Error('handler exploded');
		});

		rpc.handleMessage({ type: 'rpc-request', requestId: 'r-3', kind: 'boom' });
		await vi.waitFor(() => expect(outbox).toHaveLength(1));
		expect(outbox[0]).toMatchObject({
			type: 'rpc-response',
			requestId: 'r-3',
			ok: false,
			error: 'handler exploded'
		});
	});

	it('drops the reply (no post) if disposed while an async handler is in flight', async () => {
		// The parent can tear down the iframe (dispose() → port.close()) while a
		// requestHandlers callback is still awaiting. When it finally resolves,
		// posting on the closed MessagePort would throw and — because the handler
		// runs via `void` — become an unhandled rejection. The reply must be
		// silently dropped instead.
		const { rpc, outbox } = makeRpc();
		let release!: (value: string) => void;
		rpc.setHandler('slow', () => new Promise<string>((resolve) => (release = resolve)));

		rpc.handleMessage({ type: 'rpc-request', requestId: 'r-slow', kind: 'slow' });
		rpc.dispose(); // tear down before the handler resolves
		release('done');
		await Promise.resolve();
		await Promise.resolve();

		expect(outbox.filter((m) => m.type === 'rpc-response')).toHaveLength(0);
	});

	it('replies with an error when no handler is registered for the kind', async () => {
		const { rpc, outbox } = makeRpc();
		rpc.handleMessage({ type: 'rpc-request', requestId: 'r-4', kind: 'unknown' });
		await vi.waitFor(() => expect(outbox).toHaveLength(1));
		expect(outbox[0]).toMatchObject({
			type: 'rpc-response',
			requestId: 'r-4',
			ok: false,
			error: expect.stringContaining('No handler registered for request kind "unknown"')
		});
	});
});

describe('SandboxRpc routing + lifecycle', () => {
	it('does not consume non-rpc messages (returns false so the caller routes them)', () => {
		const { rpc } = makeRpc();
		expect(rpc.handleMessage({ type: 'rendered' })).toBe(false);
		expect(rpc.handleMessage({ type: 'height', contentHeight: 10 })).toBe(false);
		expect(rpc.handleMessage({})).toBe(false);
	});

	it('rejects in-flight requests and refuses new ones after dispose', async () => {
		const { rpc } = makeRpc();
		const inFlight = rpc.request('a');
		rpc.dispose();
		await expect(inFlight).rejects.toThrow('sandbox channel closed');
		await expect(rpc.request('b')).rejects.toThrow('sandbox channel closed');
	});

	it('two rpcs wired to each other complete a full round trip', async () => {
		// Loopback: a.post → b.handleMessage and vice versa, the way the parent
		// and iframe are wired across the real channel.
		let a!: SandboxRpc;
		let b!: SandboxRpc;
		a = new SandboxRpc({ post: (m) => b.handleMessage(m) });
		b = new SandboxRpc({ post: (m) => a.handleMessage(m) });
		b.setHandler('add', (payload) => {
			const { x, y } = payload as { x: number; y: number };
			return x + y;
		});

		await expect(a.request<number>('add', { x: 2, y: 3 })).resolves.toBe(5);
	});
});

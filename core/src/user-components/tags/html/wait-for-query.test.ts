import { describe, it, expect, vi } from 'vitest';
import { waitForInterpolatedQuery } from './wait-for-query';

describe('waitForInterpolatedQuery', () => {
	it('resolves immediately (no sleep) when the query is already registered', async () => {
		const sleep = vi.fn(async () => {});
		const resolve = vi.fn(() => '(SELECT 1) q');

		const result = await waitForInterpolatedQuery(resolve, 'orders', { sleep });

		expect(result).toBe('(SELECT 1) q');
		expect(resolve).toHaveBeenCalledTimes(1);
		expect(sleep).not.toHaveBeenCalled();
	});

	it('waits and resolves once the query appears (the add-then-register race)', async () => {
		const sleep = vi.fn(async () => {});
		// undefined twice (not registered yet), then the query shows up.
		const resolve = vi
			.fn<() => string | undefined>()
			.mockReturnValueOnce(undefined)
			.mockReturnValueOnce(undefined)
			.mockReturnValue('(SELECT 1) q');

		const result = await waitForInterpolatedQuery(resolve, 'orders', { sleep, pollMs: 10 });

		expect(result).toBe('(SELECT 1) q');
		expect(resolve).toHaveBeenCalledTimes(3);
		expect(sleep).toHaveBeenCalledTimes(2);
		expect(sleep).toHaveBeenCalledWith(10);
	});

	it('throws a missing-query error once the timeout elapses', async () => {
		const sleep = vi.fn(async () => {});
		// Advance the clock past the deadline on the second now() read.
		const now = vi
			.fn<() => number>()
			.mockReturnValueOnce(0) // deadline = 0 + 50
			.mockReturnValue(100); // subsequent checks are past the deadline
		const resolve = vi.fn(() => undefined);

		await expect(
			waitForInterpolatedQuery(resolve, 'typo', { sleep, now, timeoutMs: 50 })
		).rejects.toThrow(/No query named "typo"/);
	});

	it('propagates a template error from resolve() immediately (no retry)', async () => {
		const sleep = vi.fn(async () => {});
		const resolve = vi.fn(() => {
			throw new Error('Template errors: Unbalanced template brackets');
		});

		await expect(
			waitForInterpolatedQuery(resolve, 'orders', { sleep })
		).rejects.toThrow(/Unbalanced template brackets/);
		expect(sleep).not.toHaveBeenCalled();
	});

	it('bails when the block is disposed before the query resolves', async () => {
		const sleep = vi.fn(async () => {});
		const resolve = vi.fn(() => undefined);

		await expect(
			waitForInterpolatedQuery(resolve, 'orders', { sleep, isDisposed: () => true })
		).rejects.toThrow(/was cancelled/);
		expect(resolve).not.toHaveBeenCalled();
	});
});

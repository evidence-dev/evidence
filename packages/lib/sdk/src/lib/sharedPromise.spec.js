import { it, describe, vi, expect } from 'vitest';
import { sharedPromise } from './sharedPromise';

describe('sharedPromise', () => {
	it('should not call the state change hook if the promise has landed (resolve)', () => {
		const hook = vi.fn();
		const promise = sharedPromise(hook);

		promise.start();
		promise.resolve([]);
		promise.resolve([]);
		expect(hook).toHaveBeenCalledTimes(2);
	});
	it('should not call the state change hook if the promise has landed (reject)', () => {
		const hook = vi.fn();
		const promise = sharedPromise(hook);
		promise.promise.catch(() => {});
		promise.start();
		promise.reject(new Error());
		promise.reject(new Error());
		expect(hook).toHaveBeenCalledTimes(2);
	});
});

/**
 * @jest-environment jsdom
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { batchUp } from './batchUp.js';

describe('batchUp', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});
	afterEach(() => {
		vi.useRealTimers();
	});
	it('should not call the callback if the return function is never called', () => {
		const callback = vi.fn();
		batchUp(callback);
		vi.advanceTimersByTime(201);
		expect(callback).toHaveBeenCalledTimes(0);
	});
	it(
		'should debounce the callback',
		() => {
			// Currently skipped because debounce has been disabled
			const callback = vi.fn();
			const fn = batchUp(callback);
			fn();
			vi.advanceTimersByTime(199);
			expect(callback).not.toHaveBeenCalled();
			fn();
			vi.advanceTimersByTime(200);
			expect(callback).toHaveBeenCalledTimes(1);
		},
		{ skip: true }
	);
	it(
		'should pass any provided arguments to the callback',
		() => {
			// Currently skipped because debounce has been disabled
			const callback = vi.fn();
			const fn = batchUp(callback);
			fn(1);
			fn(2);
			fn(3);
			vi.advanceTimersByTime(200);
			expect(callback).toHaveBeenCalledWith([1, 2, 3]);
		},
		{ skip: true }
	);

	it('should be reusable', async () => {
		const callback = vi.fn();
		const fn = batchUp(callback);

		fn(1);
		await vi.advanceTimersByTimeAsync(200);
		expect(callback).toHaveBeenCalledTimes(1);
		expect(callback).toHaveBeenCalledWith([1]);

		fn(2);
		await vi.advanceTimersByTimeAsync(200);
		expect(callback).toHaveBeenCalledWith([2]);

		fn(3);
		await vi.advanceTimersByTimeAsync(200);
		expect(callback).toHaveBeenCalledTimes(3);
		expect(callback).toHaveBeenCalledWith([3]);
	});
});

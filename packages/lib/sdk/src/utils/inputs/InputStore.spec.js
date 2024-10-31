// @ts-check
import { InputStore } from './InputStore.js';
import { describe, expect, it, vi } from 'vitest';
describe('InputStore', () => {
	it('should be an object', () => {
		expect(InputStore.isInputStore(InputStore.create())).toBe(true);
	});

	it('should publish itself before it is first modified', () => {
		const store = InputStore.create();
		const sub = vi.fn();
		store.subscribe(sub)();
		expect(sub).not.toHaveBeenCalledWith(undefined);
	});

	describe('Dependency Tracking', () => {
		it('should track dependencies', () => {
			const store = InputStore.create();
			store.myInput.value = 5;
			const tx = store.listen();
			expect(`${store.myInput.value}`).toEqual('5');
			const result = store.unlisten(tx);
			expect(result).toEqual(['myInput']);
		});
		it('should track dependencies, while returning the results', () => {
			const store = InputStore.create();
			store.myInput = 5;
			const tx = store.listen();
			expect(store.myInput).toBe(5);
			const result = store.unlisten(tx);

			expect(result).toEqual(['myInput']);
			expect(store.myInput).toBe(5);
		});
	});
});

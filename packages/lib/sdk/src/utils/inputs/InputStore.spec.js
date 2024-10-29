// @ts-check
import { InputStore } from './InputStore.js';
import { describe, expect, it } from 'vitest';
describe('InputStore', () => {
	it('should be an object', () => {
		expect(InputStore.isInputStore(InputStore.create())).toBe(true);
	});

	describe('Dependency Tracking', () => {
		it('should track dependencies', () => {
			const store = InputStore.create();
			store.myInput = 5;
			store.listen();
			`${store.myInput}`;
			const result = store.unlisten();

			expect(result).toEqual(['myInput']);
		});
		it('should track dependencies, while returning the results', () => {
			const store = InputStore.create();
			store.myInput = 5;
			store.listen();
			expect(store.myInput).toBe(5);
			const result = store.unlisten();

			expect(result).toEqual(['myInput']);
			expect(store.myInput).toBe(5);
		});
	});
});

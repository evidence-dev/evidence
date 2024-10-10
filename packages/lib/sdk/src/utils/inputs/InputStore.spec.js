// @ts-check
import { RecursiveProxyPrimitive } from '../proxies/recursive-proxy/RecursiveProxyPrimitive.js';
import { InputStore, InputStore2 } from './InputStore.js';
import { describe, expect, it } from 'vitest';
describe('InputStore', () => {
	it('should be an object', () => {
		expect(InputStore.isInputStore(new InputStore())).toBe(true);
	});

	describe('Dependency Tracking', () => {
		it('should track dependencies', () => {
			const store = InputStore2.create();
			store.myInput = 5;
            const getResult = store.track();
            `${store.myInput}`;
            const result = getResult();

            expect(result).toEqual(["myInput"]);
		});
		it('should track dependencies, while returning the results', () => {
			const store = InputStore2.create();
			store.myInput = 5;
            const getResult = store.track();
            expect(store.myInput).toBe(5);
            const result = getResult();
			
            expect(result).toEqual(["myInput"]);
            expect(store.myInput).toBe(5);
		});
	});
});


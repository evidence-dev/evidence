import { describe, it, expect } from 'vitest';
import { ProxyStack } from '../proxyStack.js';

/**
 * @param {import("svelte/store").Readable<*> s}
 */
const getValue = (s) => {
	let out;
	s.subscribe((v) => (out = v))();
	return out;
};

describe('ProxyStack', () => {
	it('Should return a bare object when nothing has been added', () => {
		const { value } = ProxyStack();
		const content = getValue(value);
		expect(content).toEqual({});
	});
	it('Should return a matching object when one object has been added', () => {
		const { value, push } = ProxyStack();
		const entry = { x: 1 };
		push(entry);
		const content = getValue(value);
		expect(content.x).toEqual(1);
	});
	it('Should return the most recent value for a prop', () => {
		const { value, push } = ProxyStack();

		push({ x: 1 });
		push({ x: 2 });
		push({ x: 3 });
		const content = getValue(value);
		expect(content.x).toEqual(3);
	});
	it('Should return the most recent value for a prop, unless it has been deleted', () => {
		const stack = ProxyStack();

		stack.push({ x: 1 });
		stack.push({ x: 2 });
		const id = stack.push({ x: 3 });
		stack.rm(id);
		const content = getValue(stack.value);
		expect(content.x).toEqual(2);
	});
	it('Should JSON.stringify properly', () => {
		const stack = ProxyStack();
		const entry = { x: 1 };
		stack.push(entry);
		const content = getValue(stack.value);
		expect(content).toEqual(entry);
	});
});

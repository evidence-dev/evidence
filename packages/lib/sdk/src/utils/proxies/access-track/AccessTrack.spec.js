import { AccessTrack } from './AccessTrack.js';
import { describe, it, expect } from 'vitest';

class DemoClass {
	constructor() {
		return AccessTrack(this);
	}
}
describe.only('AccessTrack', () => {
	describe.each([
		{ type: 'class', factory: () => new DemoClass() },
		{ type: 'object', factory: () => AccessTrack({}) }
	])('Applied to a $type', ({ factory }) => {
		it("should add `listen` to the object's reported keys", () => {
			const t = factory();
			expect('listen' in t).toBeTruthy();
			expect(Object.keys(t)).includes('listen');
		});
		it('should be an object', () => {
			const value = factory();
			expect(value).toBeInstanceOf(Object);
		});
		it('should have a listen method', () => {
			const value = factory();
			expect(value.listen).toBeInstanceOf(Function);
		});

		it('should track direct children', () => {
			const t = factory();

			const tx = t.listen();
			t.someValue = 'someThing';
			`${t.someValue}`;
			const results = t.unlisten(tx);
			expect(results).toEqual(['someValue']);
		});
		it('should track nested children', () => {
			const t = factory();

			const tx = t.listen();
			t.someValue = { someThing: 'someThing' };
			`${t.someValue.someThing}`;
			const results = t.unlisten(tx);
			expect(results).toEqual(['someValue']);
		});
		it('should track multiple children', () => {
			const t = factory();

			const tx = t.listen();
			t.someOtherValue = 'someThing';
			t.someValue = { someThing: 'someThing' };
			`${t.someOtherValue} ${t.someValue.someThing}`;
			const results = t.unlisten(tx);
			expect(results).toEqual(['someOtherValue', 'someValue']);
		});
		it('should ignore duplicates', () => {
			const t = factory();

			const tx = t.listen();
			t.someValue = { someThing: 'someThing' };
			`${t.someValue} ${t.someValue.someThing}`;
			const results = t.unlisten(tx);
			expect(results).toEqual(['someValue']);
		});
		it('should ignore properties that exist but are not used', () => {
			const t = factory();

			const tx = t.listen();
			t.someOtherValue = 'someThing';
			t.someValue = 'someThing';
			`${t.someValue}`;
			const results = t.unlisten(tx);
			expect(results).toEqual(['someValue']);
		});
	});
});

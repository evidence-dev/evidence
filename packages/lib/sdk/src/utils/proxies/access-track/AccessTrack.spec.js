import { AccessTrack } from './AccessTrack.js';
import { describe, it, expect } from 'vitest';

class DemoClass {
	constructor() {
		return AccessTrack(this);
	}
}
describe('AccessTrack', () => {
	describe.each([
		{ type: 'class', factory: () => new DemoClass() },
		{ type: 'object', factory: () => AccessTrack({}) }
	])('Applied to a $type', ({ type, factory }) => {
		it("should add `track` to the object's reported keys", () => {
			const t = factory();
			expect('track' in t).toBeTruthy();
			expect(Object.keys(t)).includes('track');
		});
		it('should be an object', () => {
			const value = factory();
			expect(value).toBeInstanceOf(Object);
		});
		it('should have a track method', () => {
			const value = factory();
			expect(value.track).toBeInstanceOf(Function);
		});

		it('should track direct children', () => {
			const t = factory();

			const gather = t.track();
			t.someValue = 'someThing';
			const x = `${t.someValue}`;
			const results = gather();
			expect(results).toEqual(['someValue']);
		});
		it('should track nested children', () => {
			const t = factory();

			const gather = t.track();
			t.someValue = { someThing: 'someThing' };
			const x = `${t.someValue.someThing}`;
			const results = gather();
			expect(results).toEqual(['someValue']);
		});
		it('should track multiple children', () => {
			const t = factory();

			const gather = t.track();
			t.someOtherValue = 'someThing';
			t.someValue = { someThing: 'someThing' };
			const x = `${t.someOtherValue} ${t.someValue.someThing}`;
			const results = gather();
			expect(results).toEqual(['someOtherValue', 'someValue']);
		});
		it('should ignore duplicates', () => {
			const t = factory();

			const gather = t.track();
			t.someValue = { someThing: 'someThing' };
			const x = `${t.someValue} ${t.someValue.someThing}`;
			const results = gather();
			expect(results).toEqual(['someValue']);
		});
		it('should ignore properties that exist but are not used', () => {
			const t = factory();

			const gather = t.track();
			t.someOtherValue = 'someThing';
			t.someValue = 'someThing';
			const x = `${t.someValue}`;
			const results = gather();
			expect(results).toEqual(['someValue']);
		});
	});
});

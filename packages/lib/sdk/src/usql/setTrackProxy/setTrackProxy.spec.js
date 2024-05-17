import { describe, expect, it } from 'vitest';
import { IsSetTracked, Unset, hasUnsetValues, setTrackProxy } from './setTrackProxy.js';

describe('setTrackProxy', () => {
	describe('function emulation', () => {
		it('should be callable, even if a function is not assigned', () => {
			const v = setTrackProxy();
			expect(v()).toBeUndefined();
		});
	});
	describe('stringification', () => {
		it('should respect default stringification for set values', () => {
			// v is a bare object (e.g. nothing set on it)
			const v = setTrackProxy();
			// unset values should be represented as (select null where 0) to prevent duckdb syntax errors

			// It should not interfere with stringification of set values
			v.a.b.c = { x: 5 };
			expect(v.a.b.c.toString()).toEqual({}.toString());

			v.a.b.c.y = 'Hello World';
			expect(v.a.b.c.y.toString()).toEqual('Hello World');
		});

		it('should stringify to empty string when not provided with a map', () => {
			// v is a bare object (e.g. nothing set on it)
			const v = setTrackProxy();
			// unset values should be represented as (select null where 0) to prevent duckdb syntax errors
			expect(v.a.b.c.toString()).toEqual('');
		});

		it('should stringify to the values in the defaultStringMap when dealing with unsets', () => {
			const v = setTrackProxy({ value: '(select null where 0)', label: 'Hello World' });
			expect(v.a.b.c.toString()).toEqual('');
			expect(v.a.b.c.label.toString()).toEqual('Hello World');
			expect(v.a.b.c.value.toString()).toEqual('(select null where 0)');
		});

		it('should JSON serialize properly', () => {
			const v = setTrackProxy();
			v.abc = 'something';
			const foo = { abc: 'something' };
			expect(JSON.stringify(v)).toEqual(JSON.stringify(foo));
		});
	});

	it('should identify itself with the IsSetTracked symbol', () => {
		const v = setTrackProxy();
		expect(v[IsSetTracked]).toBeTruthy();
	});

	it('should let you retrieve arbitrarily deep values', () => {
		// v is a bare object (e.g. nothing set on it)
		const v = setTrackProxy();
		// users should be able to `.` on everything, this prevents syntax errors
		expect(v.a.b.c).toBeDefined();
	});

	it('should let you set values arbitrarily deep', () => {
		const v = setTrackProxy();
		// a and b have not been set, but we can modify a.b.c and retain that value
		v.a.b.c = 5;
		expect(v.a.b.c).toBe(5);
	});

	it('should tell you if a key has been modified', () => {
		const v = setTrackProxy();
		v.a.b.c = 5;

		// `c` was set
		expect(v.a.b.c[Unset]).toBeFalsy();
		// `e` was not set
		expect(v.a.b.e[Unset]).toBeTruthy();
	});

	it('should not think a key has been set if you have only accessed it', () => {
		const v = setTrackProxy();
		// Access b but don't mutate anything
		v.a.b;

		// we accessed b, so it may exist on the a object
		// but we never gave it a value, so it should remain
		// unset
		expect(v.a.b[Unset]).toBeTruthy();

		v.a.b = { x: 5 };
		// a was not directly modified, only b
		expect(v.a[Unset]).toBeTruthy();
		// b was directly modified, and is now set
		expect(v.a.b[Unset]).toBeFalsy();
	});

	it('should wrap any child objects in itself', () => {
		const v = setTrackProxy();
		v.a.b = { x: 1 };
		// b was directly modified
		expect(v.a.b[IsSetTracked]).toBeTruthy();
	});

	it('should mark any existing values as set when receving an object', () => {
		const v = setTrackProxy();
		v.a.b = { x: 1 };

		// b was set with a value at x, so we should consider it modified
		expect(v.a.b.x[Unset]).toBeFalsy();

		// x was set as a bare object, but should be made into this proxy
		// so that we can check if it's y property has been set
		expect(v.a.b.y[Unset]).toBeTruthy();
	});

	it('should not break when JSON serializing', () => {
		const v = setTrackProxy();
		expect(() => JSON.stringify(v)).not.toThrow();
		expect(() => v.toJSON()).not.toThrow();
	});
	it('should not break when primative serializing', () => {
		const v = setTrackProxy();

		expect(() => v.toPrimitive()).not.toThrow();
	});
});

describe('hasUnsetValues', () => {
	it('should return true for a string without interpolation', () => {
		expect(hasUnsetValues``).toBeFalsy();
	});
	it('should return true for a string without input interpolation', () => {
		expect(hasUnsetValues`${1}`).toBeFalsy();
	});
	describe('root props', () => {
		it('should return true for a string with input interpolation (set)', () => {
			const v = setTrackProxy();
			v.a = 1;
			expect(hasUnsetValues`${v.a}`).toBeFalsy();
		});
		it('should return false for a string with input interpolation (unset)', () => {
			const v = setTrackProxy();
			expect(hasUnsetValues`${v.a}`).toBeTruthy();
		});
		it('should return true for a string with input interpolation (unset -> set)', () => {
			const v = setTrackProxy();
			expect(hasUnsetValues`${v.a}`).toBeTruthy();
			v.a = 1;
			expect(hasUnsetValues`${v.a}`).toBeFalsy();
		});
	});

	describe('nested props', () => {
		it('should return true for a string with input interpolation (set)', () => {
			const v = setTrackProxy();
			v.a.b = 1;
			expect(hasUnsetValues`${v.a.b}`).toBeFalsy();
		});
		it('should return false for a string with input interpolation (unset)', () => {
			const v = setTrackProxy();
			expect(hasUnsetValues`${v.a.b}`).toBeTruthy();
		});
		it('should return true for a string with input interpolation (unset -> set)', () => {
			const v = setTrackProxy();
			expect(hasUnsetValues`${v.a.b}`).toBeTruthy();
			v.a.b = 1;
			expect(hasUnsetValues`${v.a.b}`).toBeFalsy();
		});
	});
});

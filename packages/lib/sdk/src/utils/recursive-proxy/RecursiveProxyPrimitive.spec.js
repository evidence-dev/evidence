import { describe, expect, it, vi } from 'vitest';
import { RecursiveProxyPrimitive, PrimitiveValue } from './RecursiveProxyPrimitive.js';

describe('RecursiveProxyPrimitive', () => {
	class BasicSubclass extends RecursiveProxyPrimitive {}
	it('should behave as an absract class', () => {
		expect(() => new RecursiveProxyPrimitive()).toThrow();
	});
	describe('primitive values', () => {
		it('should allow a primitive value', () => {
			const myInputValue = new BasicSubclass();
			myInputValue.setValue('Primitive Value');
			myInputValue.value = 'Primitive Value';
			expect(`${myInputValue}`).toBe('Primitive Value');
			expect(`${myInputValue.value}`).toBe('Primitive Value');
		});
		it('should throw when given a non-primitive value', () => {
			const myInputValue = new BasicSubclass();
			expect(() => myInputValue.setValue({})).toThrow();
		});
		it('should accept Date values', () => {
			const myInputValue = new BasicSubclass();
			expect(() => myInputValue.setValue(new Date())).not.toThrow();
		});
		it("should stringify to it's direct value", () => {
			const myInputValue = new BasicSubclass();
			myInputValue.setValue('Primitive Value');
			expect(myInputValue.toString()).toBe('Primitive Value');
		});
		it('should know if it has a value', () => {
			const myInputValue = new BasicSubclass();
			expect(myInputValue.hasValue).toBe(false);
			myInputValue.setValue('Primitive Value');
			expect(myInputValue.hasValue).toBe(true);
		});
		// it('should know if it has a nested value', () => {
		// 	const myInputValue = new BasicSubclass();
		// 	expect(myInputValue.hasValue).toBe(false);
		// 	myInputValue.x = 'Primitive Value';
		// 	expect(myInputValue.hasValue).toBe(true);
		// });
		// it('should know if it has a deeply nested value', () => {
		// 	const myInputValue = new BasicSubclass();
		// 	expect(myInputValue.hasValue).toBe(false);
		// 	expect(myInputValue.x.hasValue).toBe(false);
		// 	myInputValue.x.y = 'Primitive Value';
		// 	expect(myInputValue.hasValue).toBe(true);
		// 	expect(myInputValue.x.hasValue).toBe(true);
		// });
	});

	describe('recursive access', () => {
		it('should not throw when attempting to access unset values', () => {
			const myInputValue = new BasicSubclass();
			expect(() => myInputValue.value).not.toThrow();
		});
		it('should not throw when attempting to access nested unset values', () => {
			const myInputValue = new BasicSubclass();
			expect(() => myInputValue.some.made.up.path).not.toThrow();
		});
		it('should set primitive values', () => {
			const myInputValue = new BasicSubclass();
			myInputValue.nested = 'Hello World';
			expect(myInputValue.nested.toString()).toBe('Hello World');
			expect(myInputValue.nested).toBeInstanceOf(BasicSubclass);
		});
		it('should set primitive values deeply', () => {
			const myInputValue = new BasicSubclass();
			myInputValue.nested.double = 'Hello World';
			expect(myInputValue.nested.double.toString()).toBe('Hello World');
			expect(myInputValue.nested.double).toBeInstanceOf(BasicSubclass);
		});
		it('should unpack object values and transform them into proxies individually', () => {
			const myInputValue = new BasicSubclass();
			myInputValue.outer = {
				outerValue: 'Outer',
				inner: {
					innerValue: 'Inner'
				}
			};
			expect(myInputValue.outer.outerValue.toString()).toBe('Outer');
			expect(myInputValue.outer.inner.innerValue.toString()).toBe('Inner');
			expect(myInputValue.outer.inner.innerValue).toBeInstanceOf(BasicSubclass);
		});
		it('should know about its parents', () => {
			const myInputValue = new BasicSubclass();
			myInputValue.nested = 'Child';
			myInputValue.setValue('Parent');
			expect(`${myInputValue.nested.parent}`).toBe('Parent');
			expect(myInputValue.nested.parent).toBe(myInputValue);
		});
		it('should respond to Object.assign properly', () => {
			const myInputValue = new BasicSubclass();
			myInputValue.nested = 'Child';
			myInputValue.setValue('Parent');
			expect(myInputValue.nested.parent).toBe(myInputValue);
			Object.assign(myInputValue.nested, { a: 1 });
			expect(myInputValue.nested.a).toBeInstanceOf(BasicSubclass);
			expect(myInputValue.nested.a[PrimitiveValue]).toBe(1);
		});
	});

	describe('dynamic construction', () => {
		it('should create children using a given constructor', () => {
			class MyClass extends RecursiveProxyPrimitive {
				static __ChildConstructor = MyClass;
			}

			const myInputValue = new MyClass();
			myInputValue.nested = 'Hello World';
			expect(myInputValue.nested.toString()).toBe('Hello World');
			expect(myInputValue.nested).toBeInstanceOf(MyClass);
		});

		it("should disallow children that don't inherit from RecursiveProxyPrimitive", () => {
			class MyClass {}

			expect(() => new RecursiveProxyPrimitive(MyClass)).toThrow();
		});

		it('should function as expected when using a constructor', () => {
			class MyClass extends RecursiveProxyPrimitive {
				// static ChildConstructor = MyClass;
			}

			const myInputValue = new MyClass();
			myInputValue.nested = 'Hello World';
			expect(myInputValue.nested.toString()).toBe('Hello World');
			expect(myInputValue.nested).toBeInstanceOf(MyClass);
			myInputValue.someObj = { a: 1 };
			expect(myInputValue.someObj.a).toBeInstanceOf(MyClass);
			expect(`${myInputValue.someObj.a}`).toEqual('1');
		});

		it('should respect toString overrides', () => {
			class MyClass extends RecursiveProxyPrimitive {
				toString = () => {
					return 'Hello World';
				};
			}
			expect(new MyClass().toString()).toBe('Hello World');
			expect(new MyClass()[Symbol.toPrimitive]()).toBe('Hello World');
		});

		it('should allow subclasses to statically define a child constructor', () => {
			class MyClass extends RecursiveProxyPrimitive {
				static ChildConstructor = MyClass;
			}

			expect(MyClass.ChildConstructor).toBe(MyClass);
		});

		it('should respect defined properties of subclasses', () => {
			class MyClass extends RecursiveProxyPrimitive {
				myProp;
				constructor() {
					super();
					this.myProp = 5;
				}
			}

			expect(() => new MyClass()).not.toThrow();
			const instance = new MyClass();
			expect(instance.myProp).toBe(5);
		});
	});

	describe('get/set hooks', () => {
		it('should call pre set hooks with unwrapped values', () => {
			const fn = vi.fn();
			class MyClass extends RecursiveProxyPrimitive {
				constructor() {
					super({ hooks: { set: { pre: fn } } });
				}
			}
			const x = new MyClass();
			x.y = 1;
			expect(fn).toHaveBeenCalledOnce();
			expect(fn).toHaveBeenCalledWith('y', 1, x);
		});
		it('should call post set hooks with wrapped values', () => {
			const fn = vi.fn();
			class MyClass extends RecursiveProxyPrimitive {
				constructor() {
					super({ hooks: { set: { post: fn } } });
				}
			}
			const x = new MyClass();
			x.y = 1;
			expect(fn).toHaveBeenCalledOnce();
			// Reference the call directly because we don't have a good way to do that with vitest
			expect(fn.mock.calls[0][1]).toBeInstanceOf(MyClass);
			expect(`${fn.mock.calls[0][1]}`).toBe('1');
		});
		it('should not pass pre hooks to children when inheritPre is falsey', () => {
			const fn = vi.fn();
			class MyClass extends RecursiveProxyPrimitive {
				constructor(...args) {
					super(...args);
				}
			}
			const x = new MyClass({ hooks: { set: { pre: fn, inheritPre: false } } });
			x.y.z = 1;
			expect(fn).not.toHaveBeenCalled();
		});
		it('should pass pre hooks to children when inheritPre is set', () => {
			const fn = vi.fn();
			class MyClass extends RecursiveProxyPrimitive {
				id = Math.random().toString().slice(-3);
			}
			const x = new MyClass({ hooks: { set: { pre: fn, inheritPre: true } } });
			x.y.z = 1;
			console.log(fn.mock.calls);
			expect(fn).toHaveBeenCalledOnce();
			expect(fn).toHaveBeenCalledWith('z', 1, x.y);
		});
	});
});

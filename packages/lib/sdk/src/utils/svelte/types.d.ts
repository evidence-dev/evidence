import type { Input } from '../inputs/Input.js';

type UseSqlFactory = Symbol;

export type InputManager = {
	update: (value: any | UseSqlFactory, label?: string, other?: Record<string, any>) => void;
	__input: Input;
	subscribe: (fn: (value: any) => void) => () => void;
	/**
	 * When provided to `.update`, the value will be derived using the sql fragment factory, rather than being
	 * explicitly passed in.
	 */
	UseSqlFactory: UseSqlFactory;
};

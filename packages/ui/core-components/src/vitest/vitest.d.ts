import 'vitest';

interface CustomMatchers<R = unknown> {
	toEqualIgnoringResolved: (arg) => R;
}

declare module 'vitest' {
	interface Assertion<T = any> extends CustomMatchers<T> {}
	interface AsymmetricMatchersContaining extends CustomMatchers {}
}

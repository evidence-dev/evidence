export type SetTracked<T> = Record<string, { __unset: true }> & {
	[K in keyof T]: T[K] & { __unset: boolean };
};

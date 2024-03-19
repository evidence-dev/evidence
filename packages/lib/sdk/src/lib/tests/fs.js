import { vi } from 'vitest';
import { vol } from 'memfs';

vi.mock('fs', () => {
	return {
		default: vol,
		...vol
	};
});
vi.mock('fs/promises', () => {
	return {
		default: vol.promises,
		...vol.promises
	};
});

export const writeFs = vol.fromNestedJSON.bind(vol);

export const resetFs = () => {
	vol.reset();
};

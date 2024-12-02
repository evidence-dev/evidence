import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		include: ['components/**/*.{test,spec}.{js,ts}']
	}
});

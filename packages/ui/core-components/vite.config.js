import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import { configVirtual } from '@evidence-dev/sdk/build/vite';

export default defineConfig({
	plugins: [sveltekit(), configVirtual()],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	}
});

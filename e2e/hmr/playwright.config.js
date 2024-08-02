import { defineConfig } from '@playwright/test';
import { config } from '../playwright-config';

export default defineConfig({
	...config,

	// Since these tests are modifying local files to test HMR, we cannot run them in parallel
	fullyParallel: false,
	workers: 1
});

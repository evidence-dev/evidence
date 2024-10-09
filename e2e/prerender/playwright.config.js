import { defineConfig } from '@playwright/test';
import { config } from '../playwright-config';

/** @type {import('@playwright/test').PlaywrightTestConfig} */
export default defineConfig({
	...config,
	use: {
		...config.use,
		serviceWorkers: 'block'
	}
});

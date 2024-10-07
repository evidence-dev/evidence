import { defineConfig } from '@playwright/test';
import { config } from '../playwright-config';

/** @type {import('@playwright/test').PlaywrightTestConfig} */
export default {
	...defineConfig(config),
	webServer: {
		command: 'pnpm sources && pnpm build && pnpm preview',
		port: 3000,
		reuseExistingServer: true,
		timeout: 240_000
	}
};

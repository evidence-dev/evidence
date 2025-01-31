import { defineConfig, devices } from '@playwright/test';
import { config } from '../playwright-config';

export default defineConfig({
	...config,
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] }
		}
	],
	webServer: undefined
});

// export default defineConfig(config);

// @ts-check
import { devices } from '@playwright/test';

/** @type {import('@playwright/test').PlaywrightTestConfig} */
export const config = {
	testDir: './tests',
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	reporter: [
		[
			'html',
			{
				outputFolder: process.env.DEV ? './playwright-report/dev' : './playwright-report/preview'
			}
		]
	],
	timeout: process.platform === 'win32' ? 60_000 : 30_000,
	expect: {
		timeout: 15_000,
	},
	use: {
		colorScheme: 'dark',
		trace: 'retain-on-failure',
		video: 'retain-on-failure'
	},

	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] }
		},
		{
			name: 'firefox',
			use: { ...devices['Desktop Firefox'] }
		},
		// Only test webkit on macOS
		...(process.env.CI && process.env.__E2E_WORKFLOW_OS__ !== 'macOS'
			? []
			: [
					{
						name: 'webkit',
						use: { ...devices['Desktop Safari'] }
					}
				])
	],

	webServer: {
		command: process.env.DEV ? 'pnpm dev' : 'pnpm preview',
		port: 3000,
		reuseExistingServer: !process.env.CI,
		timeout: 120_000,
		stdout: 'pipe',
		stderr: 'pipe'
	}
};

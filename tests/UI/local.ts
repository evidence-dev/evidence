/**
 * Should match exactly the page.Goto options
 */
export type options = {
	referer?: string;
	timeout?: number;
	waitUntil?: 'load' | 'domcontentloaded' | 'networkidle' | 'commit';
};

/**
 * Support running the test in dev mode
 * where the page is constantly loading
 * @param options should match the Page.goto options
 * @returns modified options
 */
export function supportLocalDev(options?: options): options | undefined {
	if (options === undefined) {
		options = {};
	}
	options.waitUntil = process.env.CI ? 'load' : 'domcontentloaded';
	return options;
}

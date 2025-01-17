// import { beforeEach, describe, it, expect } from 'vitest';
import { test, expect } from '@playwright/test';
import child_process from 'child_process';
import fs from 'fs/promises';
import { waitForPageToLoad } from '../../test-utils';
let mod = 1;
if (process.env.GITHUB_ACTIONS) mod += 2;

// if we are on windows add another 1.5
if (process.platform === 'win32') mod += 1.5;

const targetServerStartDur = 3000 * mod;
const targetFirstRequestDur = 1000 * mod;
const targetInteractiveDur = 10000 * mod;
const targetAllowedDur = targetServerStartDur + targetFirstRequestDur + targetInteractiveDur;

if (process.env.GITHUB_ACTIONS) {
	console.log('Running on GitHub Actions');
}

test.describe.configure({ timeout: targetAllowedDur * 5, retries: 0 });
test('Should be timed appropriately', async ({ page }) => {
	await fs.rm(`./.evidence/template/.evidence-queries`, { recursive: true, force: true });
	await fs.rm(`./node_modules/.vite`, { recursive: true, force: true });
	await fs.rm(`test.log`, { force: true });

	const procStartTime = performance.now();
	const devServerProcess = child_process.spawn('npm', ['run', 'dev'], {
		stdio: 'pipe',
		shell: true,
		env: {
			...process.env,
			FORCE_COLOR: ''
		}
	});

	const exitCode = await new Promise((resolve, reject) => {
		let running = false;
		devServerProcess.on('exit', resolve);
		devServerProcess.on('error', reject);
		devServerProcess.stderr.on('data', async (data) => {
			await fs.appendFile(`test.log`, '[ERR]||' + data.toString());
			console.error(data.toString());
		});

		devServerProcess.stdout.on('data', async (data) => {
			let message = data.toString();
			console.log(message);
			if (running) return; // ignore everything once we have confirmed server start
			const procReadyTime = performance.now();
			await fs.appendFile(`test.log`, message);
			// remove any colors from message
			// eslint-disable-next-line no-control-regex
			const colorRegex = /\x1b\[[0-9;]*m/g;
			message = message.replace(colorRegex, '');

			const regex = /VITE v[0-9]+\.[0-9]+\.[0-9]+\s+ready in [\d]+ ms/g;
			const result = regex.exec(message);
			if (!result) {
				return;
			}
			const procStartupDur = procReadyTime - procStartTime;
			try {
				running = true;
				// When this timeout is inserted, the test passes and the request finishes in <500ms
				// What is different between our "ghost" request, and the test request?
				// await new Promise((r) => setTimeout(r, 20000));
				await fs.rm(`./.evidence/template/.evidence-queries`, { recursive: true, force: true });
				const reqStartTime = performance.now();
				await await fetch('http://localhost:3000?tag=the-real-request', {
					headers: {
						'User-Agent': 'Birds ARE real :)'
					}
				});
				const reqFinishTime = performance.now();

				const firstRequestDur = reqFinishTime - reqStartTime;

				const loadStartTime = performance.now();
				await page.goto('http://localhost:3000');
				await waitForPageToLoad(page);
				await expect(page.getByText('Magic Text 🪄')).toBeVisible();
				const lostFinishTime = performance.now();
				const pageLoadDur = lostFinishTime - loadStartTime;
				const totalStartupDur = lostFinishTime - procStartTime;
				console.table(
					[
						{
							title: 'Dev Server Startup Time',
							value: `${procStartupDur.toFixed(2)}ms`,
							limit: `${targetServerStartDur.toFixed(2)}ms`
						},
						{
							title: 'First Request Time',
							value: `${firstRequestDur.toFixed(2)}ms`,
							limit: `${targetFirstRequestDur.toFixed(2)}ms`
						},
						{
							title: 'Browser Request Time',
							value: `${pageLoadDur.toFixed(2)}ms`,
							limit: `${targetInteractiveDur.toFixed(2)}ms`
						},
						{
							title: 'Total Startup Time',
							value: `${totalStartupDur.toFixed(2)}ms`,
							limit: `${targetAllowedDur.toFixed(2)}ms`
						}
					],
					['title', 'value', 'limit']
				);
				expect.soft(procStartupDur, 'Dev server startup time').toBeLessThan(targetServerStartDur);
				// expect.soft(firstRequestDur, 'First request time').toBeLessThan(targetFirstRequestDur);
				expect.soft(pageLoadDur, 'Page load time').toBeLessThan(targetInteractiveDur);
				expect.soft(totalStartupDur, 'Total startup time').toBeLessThan(targetAllowedDur);
			} catch (e) {
				reject(e);
			} finally {
				devServerProcess.kill();
			}
		});
	});
	expect([0, null]).toContain(exitCode);
});

// import { beforeEach, describe, it, expect } from 'vitest';
import { test, expect } from '@playwright/test';
import child_process from 'child_process';
import fs from 'fs/promises';
import { waitForPageToLoad } from '../../test-utils';
const mod = process.env.GITHUB_ACTIONS ? 2 : 1;

const targetServerStartDur = 3000 * mod;
const targetFirstRequestDur = 1000 * mod;
const targetInteractiveDur = 6000 * mod;
const targetAllowedDur = targetServerStartDur + targetFirstRequestDur + targetInteractiveDur;

if (process.env.GITHUB_ACTIONS) {
	console.log('Running on GitHub Actions');
}

test('Should be timed appropriately', { timeout: targetAllowedDur * 5 }, async ({ page }) => {
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

		let procReadyTime = 0;
		devServerProcess.stdout.on('data', async (data) => {
			let message = data.toString();
			console.log(message);
			if (running) return; // ignore everything once we have confirmed server start
			procReadyTime = performance.now();
			await fs.appendFile(`test.log`, message);
			// remove any colors from message
			// @eslint-disable-next-line
			const colorRegex = /\x1b\[[0-9;]*m/g;
			message = message.replace(colorRegex, '');

			const regex = /VITE v[0-9]+\.[0-9]+\.[0-9]+\s+ready in [\d]+ ms/g;
			const result = regex.exec(message);
			if (!result) {
				procReadyTime = 0;
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
				expect.soft(firstRequestDur, 'First request time').toBeLessThan(targetFirstRequestDur);
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

// describe('Dev Server Startup', () => {
// 	it('Should start the dev server', { timeout: allowedTimeout }, async () => {
// 		const proc = child_process.spawn('npm', ['run', 'dev'], {
// 			stdio: 'pipe',
// 			shell: true,
// 			env: {
// 				...process.env,
// 				FORCE_COLOR: ''
// 			}
// 		});

// 		console.log('Starting dev server');

// 		const done = new Promise((resolve, reject) => {
// 			const cleanup = () => {
// 				proc.off('close', resolve);
// 				proc.off('exit', resolve);
// 				proc.stdout.off('data', onStdoutData);
// 				proc.off('error', onError);
// 				proc.kill();
// 			};

// 			const onStdoutData = (data) => {
// 				let message = data.toString();

// 				// remove any colors from message
// 				// @eslint-disable-next-line
// 				const colorRegex = /\x1b\[[0-9;]*m/g;
// 				message = message.replace(colorRegex, '');

// 				console.log(message);

// 				const regex = /VITE v[0-9]+\.[0-9]+\.[0-9]+\s+ready in ([\d]+) ms/g;
// 				const result = regex.exec(message);
// 				if (result) {
// 					const startupTime = parseInt(result[1]);
// 					proc.kill();
// 					try {
// 						expect(startupTime).toBeLessThan(goalStartupTime);
// 						resolve();
// 					} catch (e) {
// 						reject(e);
// 					} finally {
// 						cleanup();
// 					}
// 					console.log('End state reached');
// 				}
// 			};
// 			const onStderrData = (data) => {
// 				let message = data.toString();

// 				// remove any colors from message
// 				const colorRegex = /\x1b\[[0-9;]*m/g;
// 				message = message.replace(colorRegex, '');
// 				if (message.includes('error while starting dev server')) {
// 					cleanup();
// 					reject(new Error(message));
// 					return;
// 				}

// 				console.error(message);
// 			};
// 			const onError = (err) => {
// 				console.error(err);
// 				cleanup();
// 				reject(err);
// 			};

// 			proc.on('close', resolve);
// 			proc.on('exit', resolve);
// 			proc.on('error', onError);
// 			proc.stdout.on('data', onStdoutData);
// 			proc.stderr.on('data', onStderrData);
// 		});

// 		const exitCode = await done;
// 		if (typeof exitCode === 'number') {
// 			expect(exitCode).toBe(0);
// 		}

// 		// dev server should start within 5 seconds
// 	});
// 	it('Should start the dev server again', { timeout: allowedTimeout }, async () => {
// 		const proc = child_process.spawn('npm', ['run', 'dev'], {
// 			stdio: 'pipe',
// 			shell: true,
// 			env: {
// 				...process.env,
// 				FORCE_COLOR: ''
// 			}
// 		});

// 		console.log('Starting dev server');

// 		const done = new Promise((resolve, reject) => {
// 			const cleanup = () => {
// 				proc.off('close', resolve);
// 				proc.off('exit', resolve);
// 				proc.stdout.off('data', onStdoutData);
// 				proc.off('error', onError);
// 			};

// 			const onStdoutData = (data) => {
// 				let message = data.toString();

// 				// remove any colors from message
// 				// @eslint-disable-next-line
// 				const colorRegex = /\x1b\[[0-9;]*m/g;
// 				message = message.replace(colorRegex, '');

// 				console.log(message);

// 				const regex = /VITE v[0-9]+\.[0-9]+\.[0-9]+\s+ready in ([\d]+) ms/g;
// 				const result = regex.exec(message);
// 				if (result) {
// 					const startupTime = parseInt(result[1]);
// 					proc.kill();
// 					try {
// 						expect(startupTime).toBeLessThan(goalStartupTime);
// 						resolve();
// 					} catch (e) {
// 						reject(e);
// 					} finally {
// 						cleanup();
// 					}
// 					console.log('End state reached');
// 				}
// 			};
// 			const onStderrData = (data) => {
// 				let message = data.toString();

// 				// remove any colors from message
// 				const colorRegex = /\x1b\[[0-9;]*m/g;
// 				message = message.replace(colorRegex, '');
// 				if (message.includes('error while starting dev server')) {
// 					cleanup();
// 					reject(new Error(message));
// 					return;
// 				}

// 				console.error(message);
// 			};
// 			const onError = (err) => {
// 				console.error(err);
// 				cleanup();
// 				reject(err);
// 			};

// 			proc.on('close', resolve);
// 			proc.on('exit', resolve);
// 			proc.on('error', onError);
// 			proc.stdout.on('data', onStdoutData);
// 			proc.stderr.on('data', onStderrData);
// 		});

// 		const exitCode = await done;
// 		if (typeof exitCode === 'number') {
// 			expect(exitCode).toBe(0);
// 		}
// 		// dev server should start within 5 seconds
// 	});
// 	it('Should have a reasonable response time on the first request', { timeout: allowedTimeout }, async () => {
// 		const proc = child_process.spawn('npm', ['run', 'dev'], {
// 			stdio: 'pipe',
// 			shell: true,
// 			env: {
// 				...process.env,
// 				FORCE_COLOR: ''
// 			}
// 		});

// 		console.log('Starting dev server');

// 		const done = new Promise((resolve, reject) => {
// 			const cleanup = () => {
// 				proc.off('close', resolve);
// 				proc.off('exit', resolve);
// 				proc.stdout.off('data', onStdoutData);
// 				proc.off('error', onError);
// 			};

// 			const onStdoutData = async (data) => {
// 				let message = data.toString();

// 				// remove any colors from message
// 				// @eslint-disable-next-line
// 				const colorRegex = /\x1b\[[0-9;]*m/g;
// 				message = message.replace(colorRegex, '');

// 				console.log(message);

// 				const regex = /VITE v[0-9]+\.[0-9]+\.[0-9]+\s+ready in ([\d]+) ms/g;
// 				const result = regex.exec(message);
// 				if (result) {
// 					const before = performance.now();
// 					const res = await fetch("http://localhost:3000/").then(r => r.text());
// 					const after = performance.now();
// 					console.log(`Took ${after - before} ms`);
// 					console.log(res)
// 					try {
// 						expect(after - before).toBeLessThan(1000);
// 						resolve();
// 					} catch (e) {
// 						reject(e);
// 					} finally {
// 						proc.kill();
// 						cleanup();
// 					}

// 					console.log('End state reached');
// 				}
// 			};
// 			const onStderrData = (data) => {
// 				let message = data.toString();

// 				// remove any colors from message
// 				const colorRegex = /\x1b\[[0-9;]*m/g;
// 				message = message.replace(colorRegex, '');
// 				if (message.includes('error while starting dev server')) {
// 					cleanup();
// 					reject(new Error(message));
// 					return;
// 				}

// 				console.error(message);
// 			};
// 			const onError = (err) => {
// 				console.error(err);
// 				cleanup();
// 				reject(err);
// 			};

// 			proc.on('close', resolve);
// 			proc.on('exit', resolve);
// 			proc.on('error', onError);
// 			proc.stdout.on('data', onStdoutData);
// 			proc.stderr.on('data', onStderrData);
// 		});

// 		const exitCode = await done;
// 		if (typeof exitCode === 'number') {
// 			expect(exitCode).toBe(0);
// 		}
// 		// dev server should start within 5 seconds
// 	});

// 	// it(
// 	// 	'Should have a reasonable response time on the first request',
// 	// 	{ timeout: allowedTimeout },
// 	// 	async () => {
// 	// 		const proc = child_process.spawn('npm', ['run', 'dev'], {
// 	// 			stdio: 'pipe',
// 	// 			shell: true,
// 	// 			env: {
// 	// 				...process.env,
// 	// 				FORCE_COLOR: ''
// 	// 			}
// 	// 		});

// 	// 		const done = new Promise((resolve, reject) => {
// 	// 			const cleanup = () => {
// 	// 				proc.off('close', resolve);
// 	// 				proc.off('exit', resolve);
// 	// 				proc.stdout.off('data', onStdoutData);
// 	// 				proc.off('error', onError);
// 	// 			};

// 	// 			const onStdoutData = async (data) => {
// 	// 				let message = data.toString();

// 	// 				// remove any colors from message
// 	// 				// @eslint-disable-next-line
// 	// 				const colorRegex = /\x1b\[[0-9;]*m/g;
// 	// 				message = message.replace(colorRegex, '');
// 	// 				console.log(message);
// 	// 				const regex = /VITE v[0-9]+\.[0-9]+\.[0-9]+\s+ready in ([\d]+) ms/g;
// 	// 				const result = regex.exec(message);
// 	// 				if (result) {
// 	// 					try {
// 	// 						const before = performance.now();
// 	// 						await fetch('http://localhost:3000/');
// 	// 						const after = performance.now();
// 	// 						expect(after - before).toBeLessThan(1000);
// 	// 						resolve();
// 	// 					} catch (e) {
// 	// 						reject(e);
// 	// 					} finally {
// 	// 						cleanup();
// 	// 						proc.kill();
// 	// 					}
// 	// 					console.log('End state reached');
// 	// 				}
// 	// 			};
// 	// 		});

// 	// 		const exitCode = await done;
// 	// 		if (typeof exitCode === 'number') {
// 	// 			expect(exitCode).toBe(0);
// 	// 		}
// 	// 	}
// 	// );
// });

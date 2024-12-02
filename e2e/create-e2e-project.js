#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { readFile, writeFile, unlink, mkdir } from 'node:fs/promises';
import chalk from 'chalk';
import sade from 'sade';
import ora from 'ora';

/** @typedef {import('child_process').SpawnOptions} SpawnOptions */

// prettier-ignore
const playwrightConfig =
`import { defineConfig } from '@playwright/test';
import { config } from '../playwright-config';

export default defineConfig(config);`

// prettier-ignore
const defaultTestFile =
`// @ts-check
import { test, expect } from '@playwright/test';
import { waitForPageToLoad } from '../../test-utils';

test('has title', async ({ page }) => {
	await page.goto('/');
	await waitForPageToLoad(page);

	await expect(page).toHaveTitle(/Welcome to Evidence/);
});`

const testScripts = {
	test: undefined,
	'test:preview': 'playwright test',
	'test:dev': 'cross-env DEV=true playwright test',
	setup: 'pnpm sources'
};

/** @type {Partial<SpawnOptions>} */
const globalSpawnOpts = {
	shell: true
};

/**
 * @param {string} command
 * @param {SpawnOptions} options
 */
const spawnAsync = async (command, options) => {
	return new Promise((resolve, reject) => {
		const child = spawn(command, {
			...globalSpawnOpts,
			...options
		});

		child.on('exit', (code) => {
			if (code === 0) {
				resolve();
			} else {
				reject();
			}
		});
	});
};

/**
 *
 * @param {string} path
 * @param {(packageJson: any) => any} updater
 * @returns {Promise<void>}
 */
const updatePackageJson = async (path, updater) => {
	const rawPackageJson = await readFile(path, 'utf-8');
	const packageJson = JSON.parse(rawPackageJson);
	const modifiedPackageJson = updater(packageJson);
	await writeFile(path, JSON.stringify(modifiedPackageJson, null, '\t'));
};

/**
 * @param {string} name
 * @param {{ debug?: boolean }} options
 */
const run = async (name, options) => {
	const { debug } = options;

	const spinner = ora({ isEnabled: !debug });

	try {
		globalSpawnOpts.stdio = debug ? 'inherit' : 'ignore';

		spinner.start('Cloning template...');
		await spawnAsync(`npx degit https://github.com/evidence-dev/template ${name}`);
		spinner.stopAndPersist({ symbol: '✔ ', text: 'Cloned template' });

		spinner.start('Modifying package.json...');
		await updatePackageJson(`${name}/package.json`, (packageJson) => {
			const dependencies = packageJson.dependencies ?? {};
			Object.entries(dependencies).forEach(([name, version]) => {
				if (name.startsWith('@evidence-dev/')) {
					dependencies[name] = 'workspace:*';
				} else {
					dependencies[name] = version;
				}
			});
			return {
				...packageJson,
				name: `e2e-${name}`,
				private: true,
				dependencies,
				scripts: {
					...packageJson.scripts,
					...testScripts
				}
			};
		});
		spinner.stopAndPersist({ symbol: '✔ ', text: 'Modified package.json' });

		spinner.start('Installing dependencies...');
		await unlink(`${name}/package-lock.json`);
		await spawnAsync(`pnpm i -D cross-env --ignore-scripts`, { cwd: name });
		// TODO the bulk of the time running this command is spent running our postinstall script, which is unnecessary
		await spawnAsync(
			`pnpm create playwright@latest --lang=js --no-browsers --no-examples --quiet`,
			{ cwd: name }
		);
		spinner.stopAndPersist({ symbol: '✔ ', text: 'Installed dependencies' });

		spinner.start('Configuring playwright...');
		await writeFile(`${name}/playwright.config.js`, playwrightConfig);
		spinner.stopAndPersist({ symbol: '✔ ', text: 'Configured playwright' });

		spinner.start('Creating test file...');
		await mkdir(`${name}/tests`);
		await writeFile(`${name}/tests/tests.spec.js`, defaultTestFile);
		spinner.stopAndPersist({ symbol: '✔ ', text: 'Created test file' });

		spinner.start('Formatting files...');
		await spawnAsync(`pnpm format`, { cwd: '..' });
		spinner.stopAndPersist({ symbol: '✔ ', text: 'Formatted files' });

		console.log(chalk.green(`\nE2E Test Project '${name}' created successfully!`));
		console.log(chalk.dim(`Use test:dev and test:preview to run your tests`));
	} catch (e) {
		spinner.stopAndPersist({ symbol: '❌' });
		console.error(chalk.red('An error occurred while creating the project'));
		if (e) {
			console.error(e);
		}
	}
};

//////////////////////////////////////////

sade('create-e2e-project <name>')
	.describe('Create a new Evidence project from the template that is ready for E2E testing')
	.option('--debug', 'Enable debug mode')
	.example('my-tests')
	.action(run)
	.parse(process.argv);

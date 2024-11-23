#!/usr/bin/env node

import chalk from 'chalk';
import fs from 'fs-extra';
import { spawn } from 'child_process';
import * as chokidar from 'chokidar';
import path from 'path';
import { fileURLToPath } from 'url';
import sade from 'sade';
import { logQueryEvent } from '@evidence-dev/telemetry';
import { enableDebug } from '@evidence-dev/sdk/utils';
import { loadEnv } from 'vite';

const increaseNodeMemoryLimit = () => {
	// Don't override the memory limit if it's already set
	if (process.env.NODE_OPTIONS?.includes('--max-old-space-size')) return;
	process.env.NODE_OPTIONS = `${process.env.NODE_OPTIONS || ''} --max-old-space-size=4096`;
};

const loadEnvFile = () => {
	const envFile = loadEnv('', '.', ['EVIDENCE_', 'VITE_']);
	Object.assign(process.env, envFile);
};

const populateTemplate = function () {
	clearQueryCache();

	// Create the template project in .evidence/template
	const __filename = fileURLToPath(import.meta.url);
	const __dirname = path.dirname(__filename);

	fs.ensureDirSync('./.evidence/template/');

	// empty the template directory, except:
	// - local settings
	// - telemetry profile
	// - static folder (mainly to preserve the data directory)
	const keepers = new Set([
		'evidence.settings.json',
		'.profile.json',
		'static',
		'.evidence-queries'
	]);
	fs.readdirSync('./.evidence/template/').forEach((file) => {
		if (!keepers.has(file)) fs.removeSync(path.join('./.evidence/template/', file));
	});

	fs.copySync(path.join(__dirname, '/template'), './.evidence/template/');
};

const clearQueryCache = function () {
	fs.removeSync('.evidence/template/.evidence-queries/cache');
};

const runFileWatcher = function (watchPatterns) {
	const ignoredFiles = [
		'./pages/explore/**',
		'./pages/explore.+(*)',
		'./pages/settings/**',
		'./pages/settings.+(*)',
		'./pages/api/**',
		'./pages/api.+(*)'
	];

	var watchers = [];

	watchPatterns.forEach((pattern, item) => {
		watchers[item] = chokidar.watch(path.join(pattern.sourceRelative, pattern.filePattern), {
			ignored: ignoredFiles
		});

		const sourcePath = (p) => path.join('./', p);
		const targetPath = (p) =>
			path.join(pattern.targetRelative, path.relative(pattern.sourceRelative, p));
		const pagePath = (p) =>
			p.includes('pages')
				? p.endsWith('index.md')
					? p.replace('index.md', '+page.md')
					: p.replace('.md', '/+page.md')
				: p;

		const syncFile = (file) => {
			const source = sourcePath(file);
			const target = targetPath(source);
			const svelteKitPagePath = pagePath(target);
			fs.copySync(source, svelteKitPagePath);
		};

		const unlinkFile = (file) => {
			const source = sourcePath(file);
			const target = targetPath(source);
			const svelteKitPagePath = pagePath(target);
			fs.removeSync(svelteKitPagePath);
		};

		watchers[item]
			.on('add', syncFile)
			.on('change', syncFile)
			.on('unlink', unlinkFile)
			.on('addDir', (path) => {
				fs.ensureDirSync(targetPath(path));
			})
			.on('unlinkDir', (path) => fs.removeSync(targetPath(path)));
	});
	return watchers;
};

const flattenArguments = function (args) {
	if (args) {
		const result = [];
		const keys = Object.keys(args);
		keys.forEach((key) => {
			if (key !== '_' && args[key] !== undefined) {
				result.push(`--${key}`);
				if (args[key] && args[key] !== true) {
					result.push(args[key]);
				}
			}
		});
		return result;
	} else {
		return [];
	}
};

const watchPatterns = [
	{
		sourceRelative: './pages/',
		targetRelative: './.evidence/template/src/pages/',
		filePattern: '**'
	}, // markdown pages
	{
		sourceRelative: './static/',
		targetRelative: './.evidence/template/static/',
		filePattern: '**'
	}, // static files (eg images)
	{
		sourceRelative: './sources/',
		targetRelative: './.evidence/template/sources/',
		filePattern: '**'
	}, // source files (eg csv files)
	{
		sourceRelative: './queries',
		targetRelative: './.evidence/template/queries',
		filePattern: '**'
	},
	{
		sourceRelative: './components/',
		targetRelative: './.evidence/template/src/components/',
		filePattern: '**'
	}, // custom components
	{ sourceRelative: '.', targetRelative: './.evidence/template/src/', filePattern: 'app.css' }, // custom theme file
	{
		sourceRelative: './partials',
		targetRelative: './.evidence/template/partials',
		filePattern: '**'
	}
];

const strictMode = function () {
	process.env['VITE_BUILD_STRICT'] = true;
};
const buildHelper = function (command, args) {
	const watchers = runFileWatcher(watchPatterns);
	const flatArgs = flattenArguments(args);

	// Run svelte kit build in the hidden directory
	const child = spawn(command, flatArgs, {
		shell: true,
		cwd: '.evidence/template',
		stdio: 'inherit',
		env: {
			...process.env,
			// used for source query HMR
			EVIDENCE_DATA_URL_PREFIX: process.env.EVIDENCE_DATA_URL_PREFIX ?? 'static/data',
			EVIDENCE_DATA_DIR: process.env.EVIDENCE_DATA_DIR ?? './static/data'
		}
	});
	// Copy the outputs to the root of the project upon successful exit
	child.on('exit', function (code) {
		if (code === 0) {
			fs.copySync('./.evidence/template/build', './build');
			console.log(`Build complete --> ${process.env.EVIDENCE_BUILD_DIR ?? './build'} `);
		} else {
			console.error('Build failed');
		}
		child.kill();
		watchers.forEach((watcher) => watcher.close());
		if (code !== 0) {
			throw `Build process exited with code ${code}`;
		}
	});
};

const prog = sade('evidence');

prog
	.command('dev')
	.option('--debug', 'Enables verbose console logs')
	.option('--override-exec', 'Overrides the method of execution', 'npx')
	.describe('launch the local evidence development environment')
	.action((args) => {
		increaseNodeMemoryLimit();
		if (args.debug) {
			enableDebug();
			delete args.debug;
		}

		const executable = args['override-exec'] || 'npx'
		delete args['override-exec']

		loadEnvFile();

		const manifestExists = fs.lstatSync(
			path.join('.evidence', 'template', 'static', 'data', 'manifest.json'),
			{ throwIfNoEntry: false }
		);
		if (!manifestExists) {
			console.warn(
				chalk.yellow(
					`
${chalk.bold('[!] Unable to load source manifest')}
	This likely means you have no source data, and need to generate it.
	Running ${chalk.bold('npm run sources')} will generate the needed data. See ${chalk.bold(
		'npm run sources --help'
	)} for more usage information
	Documentation: https://docs.evidence.dev/core-concepts/data-sources/
		`.trim()
				)
			);
		}

		populateTemplate();

		const watchers = runFileWatcher(watchPatterns);
		const flatArgs = flattenArguments(args);

		logQueryEvent('dev-server-start', undefined, undefined, undefined, true);
		// Run svelte kit dev in the hidden directory
		const child = spawn(`${executable} vite dev --port 3000`, flatArgs, {
			shell: true,
			detached: false,
			cwd: '.evidence/template',
			stdio: 'inherit',
			env: {
				...process.env,
				// used for source query HMR
				EVIDENCE_DATA_URL_PREFIX: process.env.EVIDENCE_DATA_URL_PREFIX ?? 'static/data',
				EVIDENCE_DATA_DIR: process.env.EVIDENCE_DATA_DIR ?? './static/data'
			}
		});

		child.on('exit', function () {
			child.kill();
			watchers.forEach((watcher) => watcher.close());
		});
	});

prog
	.command('env-debug')
	.option('--include-values', 'Includes Environment Variable Values, this will show secrets!')
	.describe('Prints out Evidence variables from the environment and .env file')
	.action((args) => {
		increaseNodeMemoryLimit();
		const { 'include-values': includeValues } = args;
		loadEnvFile();
		const evidenceVars = Object.fromEntries(
			Object.entries(process.env).filter(([k]) => k.startsWith('EVIDENCE_'))
		);
		if (includeValues) {
			console.table(evidenceVars);
		} else {
			console.table(Object.keys(evidenceVars));
		}
	});

prog
	.command('build')
	.option('--debug', 'Enables verbose console logs')
	.option('--override-exec', 'Overrides the method of execution', 'npx')
	.describe('build production outputs')
	.action((args) => {
		increaseNodeMemoryLimit();
		if (args.debug) {
			enableDebug();
			delete args.debug;
		}

		const executable = args['override-exec'] || 'npx'
		delete args['override-exec']

		loadEnvFile();
		populateTemplate();

		logQueryEvent('build-start');
		buildHelper(`${executable} vite build`, args);
	});

prog
	.command('build:strict')
	.option('--debug', 'Enables verbose console logs')
	.option('--override-exec', 'Overrides the method of execution', 'npx')
	.describe('build production outputs and fails on error')
	.action((args) => {
		increaseNodeMemoryLimit();
		if (args.debug) {
			enableDebug();
			delete args.debug;
		}

		const executable = args['override-exec'] || 'npx'
		delete args['override-exec']

		loadEnvFile();
		populateTemplate();
		strictMode();

		logQueryEvent('build-strict-start');
		buildHelper(`${executable} vite build`, args);
	});

prog
	.command('sources')
	.alias('build:sources') // We don't want to break existing projects
	.describe('creates .parquet files from source queries')
	.option('--changed', 'only build sources whose queries have changed')
	.option('--sources', 'only build queries from the specified source directories')
	.option('--queries', 'only build the specified queries')
	.option('--debug', 'show debug output')
	.example('npx evidence sources --changed')
	.example('npx evidence sources --sources needful_things --queries orders,reviews')
	.example('npx evidence sources --queries needful_things.orders,needful_things.reviews')
	.example('npx evidence sources --sources needful_things,social_media')
	.action(async () => {
		if (process.argv.some((arg) => arg.includes('build:sources'))) {
			console.log(
				chalk.bold.red(
					'[!!] build:sources is deprecated and has been renamed to sources. Expect it to be removed in the future.'
				)
			);
			console.log(
				chalk.bold.red(
					'[!!] You can fix this in your package.json file ("evidence build:sources" becomes "evidence sources")\n'
				)
			);
		}
		if (!('EVIDENCE_DATA_DIR' in process.env)) {
			process.env.EVIDENCE_DATA_DIR = './.evidence/template/static/data';
		}
		if (!('EVIDENCE_DATA_URL_PREFIX' in process.env)) {
			process.env.EVIDENCE_DATA_URL_PREFIX = 'static/data';
		}
		loadEnvFile();

		// The data directory is defined at import time (because we aren't using getters, and it is set once)
		// So we need to import it here to give the opportunity to override it above
		const cli = await import('@evidence-dev/sdk/legacy-compat').then((m) => m.cli);
		logQueryEvent('build-sources-start');
		await cli(...process.argv);
		return;
	});

prog
	.command('preview')
	.describe('preview the production build')
	.option('--debug', 'Enables verbose console logs')
	.option('--override-exec', 'Overrides the method of execution', 'npx')
	.action((args) => {
		increaseNodeMemoryLimit();
		if (args.debug) {
			enableDebug();
			delete args.debug;
		}

		const executable = args['override-exec'] || 'npx'
		delete args['override-exec']

		loadEnvFile();
		const buildExists = fs.lstatSync(path.join('build'), {
			throwIfNoEntry: false
		});
		if (!buildExists) {
			console.error(chalk.bold.red('[!] No build directory found'));
			console.error(chalk.red(`Run ${chalk.bgRed('npm run build')} to create a build`));
			process.exit(1);
		}
		const flatArgs = flattenArguments(args);

		logQueryEvent('preview-server-start', undefined, undefined, undefined, true);

		let command = `${executable} serve build`;
		if (process.env.VITE_EVIDENCE_SPA === 'true') {
			command += ' -s';
		}

		const child = spawn(command, flatArgs, {
			shell: true,
			detached: false,
			stdio: 'inherit'
		});

		child.on('exit', function () {
			child.kill();
		});
	});

prog
	.command('upgrade')
	.describe('upgrade evidence to the latest version')
	.action(async () => {
		const cli = await import('@evidence-dev/sdk/legacy-compat').then((m) => m.cli);
		await cli(...process.argv);
		return;
	});

prog.parse(process.argv);

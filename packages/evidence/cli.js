#!/usr/bin/env node

import chalk from 'chalk';
import fs from 'fs-extra';
import { spawn } from 'child_process';
import * as chokidar from 'chokidar';
import path from 'path';
import { fileURLToPath } from 'url';
import sade from 'sade';
import { updateDatasourceOutputs } from '@evidence-dev/plugin-connector';

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
	console.log('Cleared query cache');
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
			if (key !== '_') {
				result.push(`--${key}`);
				if (args[key]) {
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
		stdio: 'inherit'
	});
	// Copy the outputs to the root of the project upon successful exit
	child.on('exit', function (code) {
		if (code === 0) {
			fs.copySync('./.evidence/template/build', './build');
			console.log('Build complete --> /build ');
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
	.describe('launch the local evidence development environment')
	.action((args) => {
		populateTemplate();
		const watchers = runFileWatcher(watchPatterns);
		const flatArgs = flattenArguments(args);

		// Run svelte kit dev in the hidden directory
		const child = spawn('npx vite dev --port 3000', flatArgs, {
			shell: true,
			detached: false,
			cwd: '.evidence/template',
			stdio: 'inherit'
		});

		child.on('exit', function () {
			child.kill();
			watchers.forEach((watcher) => watcher.close());
		});
	});

prog
	.command('build')
	.describe('build production outputs')
	.action((args) => {
		populateTemplate();
		buildHelper('npx vite build', args);
	});

prog
	.command('build:strict')
	.describe('build production outputs and fails on error')
	.action((args) => {
		populateTemplate();
		strictMode();
		buildHelper('npx vite build', args);
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
	.action(async (opts) => {
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
		// TODO: Need a debug flag of some sort
		if (!opts.debug)
			process.on('uncaughtException', (e) => {
				console.error(e.message);
				process.exit(1);
			});
		const sources = opts.sources?.split(',') ?? null;
		const queries = opts.queries?.split(',') ?? null;

		const isExampleProject = Boolean(process.env.__EXAMPLE_PROJECT);

		if (!isExampleProject) {
			const templatePath = path.join('.evidence', 'template');
			await fs.mkdir(templatePath, { recursive: true });
			process.chdir(templatePath);
		}

		await updateDatasourceOutputs('static/data', '.evidence-queries', {
			sources: sources ? new Set(sources) : sources,
			queries: queries ? new Set(queries) : queries,
			only_changed: opts.changed
		});
	});

prog.parse(process.argv);

const { readJSONSync } = require('fs-extra');
const chalk = require('chalk');
const logEvent = require('@evidence-dev/telemetry');
const readline = require('readline');
const strictBuild = process.env.VITE_BUILD_STRICT === 'true';

const getQueries = function (routeHash) {
	let routePath = `./.evidence-queries/extracted/${routeHash}`;
	let queryFile = `${routePath}/queries.json`;
	let queries = readJSONSync(queryFile, { throws: false });
	return { queries };
};

const testConnection = async function (dev) {
	let query = {
		id: 'Connection Test',
		compiledQueryString: 'select 100 as num'
	};
	let result;
	const settings = readJSONSync('./evidence.settings.json', { throws: false });

	const { default: runQuery } = await import('@evidence-dev/' + settings.database);

	try {
		process.stdout.write(chalk.grey('  ' + query.id + ' running...'));
		await runQuery(query.compiledQueryString, settings.credentials);
		readline.cursorTo(process.stdout, 0);
		process.stdout.write(chalk.greenBright('✓ ' + query.id) + chalk.grey(' from database \n'));
		result = 'Database Connected';
		logEvent('db-connection-success', dev, settings);
	} catch (err) {
		readline.cursorTo(process.stdout, 0);
		process.stdout.write(chalk.red('✗ ' + query.id) + ' ' + chalk.grey(err) + ' \n');
		result = err;
		logEvent('db-connection-error', dev, settings);
		// if build is strict and database connection fails, stop the build
		if (strictBuild) {
			throw err;
		}
	}
	return result;
};

module.exports = {
	getQueries,
	testConnection
};

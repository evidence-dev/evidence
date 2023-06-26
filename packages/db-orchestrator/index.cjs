const {
	readJSONSync,
	writeJSONSync,
	pathExistsSync,
	emptyDirSync,
	mkdirSync
} = require('fs-extra');
const md5 = require('blueimp-md5');
const chalk = require('chalk');
const logEvent = require('@evidence-dev/telemetry');
const readline = require('readline');
const strictBuild = process.env.VITE_BUILD_STRICT === 'true';
const cacheDirectory = './.evidence-queries/cache';
const { getEnv } = require('@evidence-dev/db-commons');

const getQueryCachePaths = (queryString, queryTime) => {
	let queryTimeMD5 = md5(queryTime);
	let queryStringMD5 = md5(queryString);
	let path = `${cacheDirectory}/${queryTimeMD5}`;
	return {
		cacheDirectory: path,
		resultsCacheFile: `${cacheDirectory}/${queryTimeMD5}/${queryStringMD5}.json`,
		columnTypeCacheFile: `${cacheDirectory}/${queryTimeMD5}/${queryStringMD5}-column-types.json`
	};
};

const updateCache = function (queryString, data, columnTypes, queryTime) {
	const { cacheDirectory, resultsCacheFile, columnTypeCacheFile } = getQueryCachePaths(
		queryString,
		queryTime
	);
	if (!pathExistsSync(cacheDirectory)) {
		emptyDirSync(cacheDirectory);
		mkdirSync(cacheDirectory, { recursive: true });
	}
	writeJSONSync(resultsCacheFile, data, { throws: false });
	if (columnTypes) {
		writeJSONSync(columnTypeCacheFile, columnTypes, { throws: false });
	}
};

const validateQuery = function (query) {
	if (query.id === 'untitled') {
		throw 'Queries require a title';
	}
	if (query.id === 'evidencemeta') {
		throw "Invalid query name: 'evidencemeta'";
	}
	if (query.compiledQueryString.length === 0) {
		throw 'Enter a query';
	}
	if (query.compileError) {
		throw query.compileError;
	}
};

const envMap = {
	databaseType: [
		{ key: 'DATABASE', deprecated: true },
		{ key: 'EVIDENCE_DATABASE', deprecated: false }
	]
};

const importDBAdapter = async function (settings) {
	try {
		const databaseType = settings ? settings.database : getEnv(envMap, 'databaseType');
		const { default: runQuery } = await import('@evidence-dev/' + databaseType);
		return runQuery;
	} catch {
		const runQuery = async function () {
			throw 'Missing database credentials';
		};
		return runQuery;
	}
};

/** adds columnTypes to metadata in the page `data` object */
const populateColumnTypeMetadata = (data, queryIndex, columnTypes) => {
	let queryMetaData = data.evidencemeta?.queries?.[queryIndex];
	if (queryMetaData && columnTypes) {
		queryMetaData.columnTypes = columnTypes;
	}
};

const runQueries = async function (routeHash, dev) {
	let routePath = `./.evidence-queries/extracted/${routeHash}`;
	let queryFile = `${routePath}/queries.json`;
	let queries = readJSONSync(queryFile, { throws: false });
	let data = {};
	if (queries && queries.length > 0) {
		data.evidencemeta = { queries };
	}
	return data;
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
	runQueries,
	testConnection
};

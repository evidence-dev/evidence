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

module.exports = {
	getQueries
};

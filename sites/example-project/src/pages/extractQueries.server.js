import md5 from 'blueimp-md5';
import fs from 'fs-extra';
import preprocessor from '@evidence-dev/preprocess';

const updateDirectoriesandStatus = function (queries, routeHash) {
	let queryDir = `./.evidence-queries/extracted/${routeHash}`;

	fs.ensureDirSync(queryDir);

	if (queries.length === 0) {
		fs.emptyDirSync(queryDir);
	} else {
		fs.writeJSONSync(`${queryDir}/queries.json`, queries);
	}

	return queries.map((query) => {
		return { id: query.id, status: 'dynamic query' }; // TODO: revamp functionality w parquet generation
	});
};

export const getStatusAndExtractQueries = async function (route) {
	let routeHash = md5(route);
	let routes = import.meta.glob('./**/+page.md', { query: '?raw', import: 'default' });
	let cleaned = `./${route}/+page.md`.split('/').filter(Boolean).join('/');
	let content = await routes[cleaned]();

	let partialInjectedContent = preprocessor.injectPartials(content);
	let queries = preprocessor.extractQueries(partialInjectedContent);

	let queryStatus = updateDirectoriesandStatus(queries, routeHash);
	return queryStatus;
};

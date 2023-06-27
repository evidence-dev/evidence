import md5 from 'blueimp-md5';
import fs from 'fs-extra';
import preprocessor from '@evidence-dev/preprocess';

const updateDirectoriesandStatus = function (queries, routeHash) {
	let queryDir = `./.evidence-queries/extracted/${routeHash}`;

	fs.ensureDirSync(queryDir);

	const existingQueries = fs.readJSONSync(`${queryDir}/queries.json`, {
		throws: false
	});

	queries.forEach((query) => {
		query.queryStringMD5 = md5(query.compiledQueryString);
		if (existingQueries) {
			let existingQuery = existingQueries.find(
				(existing) => existing.id === query.id && existing.queryStringMD5 === query.queryStringMD5
			);
			if (existingQuery) {
				query.status = existingQuery.status;
			} else {
				query.status = 'not run';
			}
		} else {
			query.status = 'not run';
		}
	});

	if (queries.length === 0) {
		fs.emptyDirSync(queryDir);
	} else {
		fs.writeJSONSync(`${queryDir}/queries.json`, queries);
	}

	let status = queries.map((query) => {
		return { id: query.id, status: 'dynamic query' }; // TODO: revamp functionality w parquet generation
	});

	return status;
};

export const getStatusAndExtractQueries = function (route) {
	let routeHash = md5(route);
	let fileRoute = `./src/pages/${route}/+page.md`;
	let content = fs.readFileSync(fileRoute);
	content = content ? content.toString() : null;

	if (content) {
		let queries = preprocessor.extractQueries(content.toString());

		let queryStatus = updateDirectoriesandStatus(queries, routeHash);
		return queryStatus;
	} else {
		return [{}]; // a little jank
	}
};

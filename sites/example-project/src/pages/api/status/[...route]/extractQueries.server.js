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

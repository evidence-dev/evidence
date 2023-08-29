import md5 from 'blueimp-md5';
import fs from 'fs-extra';
import preprocessor from '@evidence-dev/preprocess';

const strictBuild = process.env.VITE_BUILD_STRICT === 'true';
const circularRefErrorMsg = 'Compiler error: circular reference';

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
		return { id: query.id, status: query.status };
	});

	return status;
};

export const getStatusAndExtractQueries = function (route) {
	let routeHash = md5(route);
	let fileRoute = `./src/pages/${route}/+page.md`;
	let content = fs.readFileSync(fileRoute, 'utf-8');

	let partialInjectedContent = preprocessor.injectPartials(content);
	let queries = preprocessor.extractQueries(partialInjectedContent);

	// Handle query chaining:
	let maxIterations = 15;
	let queryIds = queries.map((d) => d.id);

	for (let i = 0; i <= maxIterations; i++) {
		queries.forEach((query) => {
			let references = query.compiledQueryString.match(/\${.*?\}/gi);
			if (references) {
				query.compiled = true;
				references.forEach((reference) => {
					try {
						let referencedQueryID = reference.replace('${', '').replace('}', '').trim();
						if (!queryIds.includes(referencedQueryID)) {
							let errorMessage =
								'Compiler error: ' +
								(referencedQueryID === ''
									? 'missing query reference'
									: "'" + referencedQueryID + "'" + ' is not a query on this page');
							throw new Error(errorMessage);
						} else if (i >= maxIterations) {
							throw new Error(circularRefErrorMsg);
						} else {
							const referencedQuery = queries.filter((d) => d.id === referencedQueryID)[0];
							if (!query.inline && referencedQuery.inline) {
								throw new Error(
									`Cannot reference inline query from SQL File. (Referenced ${referencedQueryID})`
								);
							}
							const queryString = `(${referencedQuery.compiledQueryString})`;
							query.compiledQueryString = query.compiledQueryString.replace(reference, queryString);
						}
					} catch (_e) {
						// if error is unknown use default circular ref. error
						const e =
							_e.message === undefined || _e.message === null ? Error(circularRefErrorMsg) : _e;
						query.compileError = e.message;
						query.compiledQueryString = e.message;
						// if build is strict and we detect an error, force a failure
						if (strictBuild) {
							throw new Error(e.message);
						}
					}
				});
			}
		});
	}

	let queryStatus = updateDirectoriesandStatus(queries, routeHash);
	return queryStatus;
};

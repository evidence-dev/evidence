// This is currently dead code from the initial sdk implementation
// import {
// 	initDB,
// 	setParquetURLs,
// 	updateSearchPath,
// 	query
// } from '@evidence-dev/universal-sql/client-duckdb';

// import { getManifest } from '$evidence/static-assets';

// export default (async () => {
// 	await initDB();
// 	let res;
// 	// TODO: Optionally take in a filepath and/or URL for the manifest
// 	res = await getManifest();
// 	res = JSON.parse(res);

// 	await setParquetURLs(res.renderedFiles ?? {});
// 	await updateSearchPath(Object.keys(res.renderedFiles ?? {}));
// 	if (!res.renderedFiles) console.error('No fixture data available!');
// 	// Test Query
// 	await query('SELECT * FROM information_schema.tables');
// 	console.log('Universal SQL has been initialized successfully');
// })();

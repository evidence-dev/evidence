const { exhaustStream } = require('@evidence-dev/db-commons');
const runQuery = require('@evidence-dev/duckdb');

/**
 * @typedef {Object} MotherDuckOptions
 * @property {string} token
 * @property {string} [database]
 */

/** @type {import("@evidence-dev/db-commons").GetRunner<MotherDuckOptions>} */
module.exports.getRunner = (opts) => {
	return async (queryText) => {
		return runQuery(queryText, {
			filename: `md:${opts.database ?? ''}?motherduck_token=${opts.token}`
		});
	};
};

/** @type {import("@evidence-dev/db-commons").ConnectionTester<MotherDuckOptions>} */
module.exports.testConnection = async (opts) => {
	const warning = setTimeout(() => {
		console.warn('[!] It looks like Motherduck is taking a bit to connect.');
		console.warn('    Motherduck connections are only compatible with motherduck >= 0.10.0');
		console.warn('    Make sure that you have upgraded your instance to at least 0.10.0');
	}, 2500);

	const result = await runQuery('SELECT 1', {
		filename: `md:${opts.database ?? ''}?motherduck_token=${opts.token}`
	})
		.then((r) => {
			clearTimeout(warning);
			return r;
		})
		.then(exhaustStream)
		.then(() => true)
		.catch((e) => ({ reason: e.message ?? 'File not found' }));
	return result;
};

module.exports.options = {
	token: {
		title: 'Token',
		description: 'MotherDuck API token.',
		type: 'string',
		secret: true,
		shown: false,
		virtual: false,
		nest: false,
		required: true,
		default: ''
	},
	database: {
		title: 'Database',
		description: 'Specific database to connect to',
		type: 'string',
		secret: false,
		shown: false,
		virtual: false,
		nest: false,
		required: false,
		default: ''
	}
};

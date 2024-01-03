const secure = require('@lukeed/uuid/secure');
const md5 = require('blueimp-md5');
const { readJSONSync, writeJSONSync, pathExistsSync } = require('fs-extra');
const wK = 'ydlp5unBbi75doGz89jC3P1Llb4QjYkM';
const Analytics = require('analytics-node');

/**
 * @typedef {'usageStatsDisabled' |
 * 			 'db-plugin-unvailable' |
 * 			 'db-connection-error' |
 * 			 'db-connection-success' |
 * 			 'source-connector-not-found' |
 * 			 'db-error' |
 * 			 'db-query'|
 * 			 'cache-query'
 * 			} TelemetryEventName
 */

const initializeProfile = async () => {
	const projectProfile = {
		anonymousId: secure.v4(),
		traits: {
			projectCreated: new Date()
		}
	};
	writeJSONSync('./.profile.json', projectProfile);

	const analytics = new Analytics(wK);
	analytics.identify(projectProfile);

	return projectProfile;
};

const getProfile = async () => {
	if (!pathExistsSync('./.profile.json')) {
		const profile = await initializeProfile();
		return profile;
	} else {
		let profile = readJSONSync('./.profile.json');
		if (profile.anonymousId === 'b958769d-6b88-43f3-978a-b970a146ffd2') {
			// This anon ID was incorrectly committed to the template project, replace with a fresh ID going forward
			profile = await initializeProfile();
		}
		return profile;
	}
};

/**
 * TODO issue-1344 consider splitting this up into a separate handlers instead of taking all possible params (e.g separate handler for DB events)
 * @param {TelemetryEventName} eventName
 * @param {boolean} dev
 * @param {any} settings
 * @param {string | undefined} [databaseName]
 * @param {string | undefined} [sourceName]
 * @param {string | undefined} [queryName]
 */
const logEvent = async (
	eventName,
	dev,
	settings,
	databaseName = undefined,
	sourceName = undefined,
	queryName = undefined
) => {
	try {
		let usageStats = settings
			? settings.send_anonymous_usage_stats ?? 'yes'
			: process.env['SEND_ANONYMOUS_USAGE_STATS'] ??
			  process.env['send_anonymous_usage_stats'] ??
			  'yes';
		let repo;
		let database;
		let demoDb;

		if (settings) {
			if (settings.gitRepo) {
				repo = md5(settings.gitRepo);
			}

			if (databaseName) {
				database = databaseName;
			} else if (settings.database) {
				//legacy - remove this post migration
				database = settings.database;
			}

			if (settings.credentials?.filename) {
				demoDb = md5(settings.credentials.filename) === md5('needful_things.duckdb');
			}
		}

		let homeDirectory = undefined;
		let codespaces = false;

		if (process.env) {
			const { HOME, CODESPACES } = process.env;
			homeDirectory = HOME;
			if (CODESPACES) {
				codespaces = CODESPACES === 'true';
			}
		}

		if (usageStats === 'yes') {
			const projectProfile = await getProfile();
			var analytics = new Analytics(wK);
			const payload = {
				anonymousId: projectProfile.anonymousId,
				event: eventName,
				properties: {
					devMode: dev,
					repoHash: repo,
					database: database, // logs database type (postgres, snowflake, etc.)
					sourceNameHash: sourceName ? md5(sourceName) : undefined, //logs the hashed name of the source this is associated with (e.g md5('pet-store')))
					queryNameHash: queryName ? md5(queryName) : undefined, //logs the hashed name of the query this is associated with (e.g md5('pet-store')))
					operatingSystem: process.platform, // logs operating system name
					nodeVersion: process.version, // logs active version of NodeJS
					arch: process.arch,
					directoryHash: homeDirectory ? md5(homeDirectory) : undefined,
					demoDb: demoDb,
					codespaces: codespaces,
					postUSQL: true
				}
			};
			analytics.track(payload);
		}
	} catch {
		// do nothing
	}
};

/**
 * Logs an event emiited from source queries
 * @param {TelemetryEventName} eventName
 * @param {string | undefined} [databaseName]
 * @param {string | undefined} [sourceName]
 * @param {string | undefined} [queryName]
 */
const logQueryEvent = async (eventName, databaseName, sourceName, queryName, dev = false) => {
	//TODO there is no concept of dev mode when running npm run sources
	try {
		await logEvent(eventName, dev, loadSettings(), databaseName, sourceName, queryName);
	} catch (e) {
		//do nothing
	}
};

function loadSettings() {
	let settings = {};
	try {
		settings = readJSONSync('evidence.settings.json');
	} catch (e) {
		//do nothing
	}
	return settings;
}

module.exports = {
	logEvent,
	logQueryEvent
};

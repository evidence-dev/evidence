const secure = require('@lukeed/uuid/secure');
const md5 = require('blueimp-md5');
const { readJSONSync, writeJSONSync, pathExistsSync, copySync } = require('fs-extra');
const wK = 'ydlp5unBbi75doGz89jC3P1Llb4QjYkM';
const { Analytics } = require('@segment/analytics-node');

const PROFILES_PATH = '../customization/.profile.json';
const LEGACY_PROFILES_PATH = './.profile.json';

/**
 * @typedef {'usageStatsDisabled' |
 *           'db-plugin-unvailable' |
 *           'db-connection-error' |
 *           'db-connection-success' |
 *           'source-connector-not-found' |
 *           'db-error' |
 *           'db-query'|
 *           'cache-query' |
 *           'dev-server-start' |
 *           'build-start' |
 *           'build-strict-start' |
 *           'build-sources-start' |
 *           'preview-server-start'
 * } TelemetryEventName
 */

/**
 * @typedef {Object} Traits
 * @property {Date} projectCreated
 */

/**
 * @typedef {Object} Profile
 * @property {string} anonymousId
 * @property {Traits} traits
 */

const initializeProfile = async () => {
	/** @type {Profile} */
	const projectProfile = {
		anonymousId: secure.v4(),
		traits: {
			projectCreated: new Date()
		}
	};
	writeJSONSync(PROFILES_PATH, projectProfile);

	const analytics = new Analytics({ writeKey: wK });
	analytics.identify(projectProfile);

	return projectProfile;
};

const getProfile = async () => {
	if (!pathExistsSync(PROFILES_PATH) && !maybeMigrateProfile()) {
		// Profile file doesn't exist and migration wasn't needed, initialize it
		return await initializeProfile();
	} else {
		try {
			/** @type {Profile | null} */
			let profile = readJSONSync(PROFILES_PATH, { throws: false });

			if (
				!profile ||
				!profile.anonymousId ||
				profile.anonymousId === 'b958769d-6b88-43f3-978a-b970a146ffd2'
			) {
				profile = await initializeProfile();
			}

			return profile;
		} catch (error) {
			console.error('Error in getProfile:', error instanceof Error ? error.message : error);
			// Initialize a new profile in case of errors
			return await initializeProfile();
		}
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
		const usageStats = settings
			? (settings.send_anonymous_usage_stats ?? 'yes')
			: (process.env['SEND_ANONYMOUS_USAGE_STATS'] ??
				process.env['send_anonymous_usage_stats'] ??
				'yes');
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
			const analytics = new Analytics({ writeKey: wK, flushAt: 1 });
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
 * Logs an event emitted from source queries
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

/**
 * Checks for existence of legacy profile and then moves it to the new location
 * @returns {boolean} true if profile was migrated
 */
function maybeMigrateProfile() {
	if (pathExistsSync(LEGACY_PROFILES_PATH)) {
		copySync(LEGACY_PROFILES_PATH, PROFILES_PATH);
		return true;
	} else {
		return false;
	}
}

module.exports = {
	logEvent,
	logQueryEvent
};

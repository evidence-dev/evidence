import { createHash } from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { DatasourceCacheSchema } from './schemas/datasourceCache.schema.js';
import merge from 'lodash.merge';

/**
 * hashes[source][query] = contentHash
 * @type {Record<string, Record<string, string>>}
 */
const knownQueryHashes = {};

/**
 * @param {string} metaDir
 */
export const loadCache = async (metaDir) => {
	const cachePath = path.join(metaDir, 'query-cache');
	await fs.mkdir(cachePath, { recursive: true });
	const cacheFile = path.join(cachePath, 'hashes.json');
	if (!(await fs.readdir(cachePath)).includes('hashes.json')) return;

	const hashes = DatasourceCacheSchema.parse(JSON.parse(await fs.readFile(cacheFile, 'utf-8')));
	Object.assign(knownQueryHashes, merge(knownQueryHashes, hashes));
};

/**
 * @param {string} metaDir
 */
export const flushCache = async (metaDir) => {
	const cachePath = path.join(metaDir, 'query-cache/hashes.json');
	await fs.writeFile(cachePath, JSON.stringify(knownQueryHashes));
};

/**
 * @param {string} str
 * @returns {string}
 */
export const hash = (str) => createHash('md5').update(str).digest('hex');

/**
 *
 * @param {string} sourceName
 * @param {string} queryName
 * @param {string} content
 */
export const addToCache = (sourceName, queryName, content) => {
	const contentHash = hash(content);
	if (!knownQueryHashes[sourceName]) knownQueryHashes[sourceName] = {};
	knownQueryHashes[sourceName][queryName] = contentHash;
};

/**
 *
 * @param {string} sourceName
 * @param {string} queryName
 * @param {string} content
 * @returns {boolean}
 */
export const checkCache = (sourceName, queryName, content) => {
	const contentHash = hash(content);
	return knownQueryHashes?.[sourceName]?.[queryName] === contentHash;
};

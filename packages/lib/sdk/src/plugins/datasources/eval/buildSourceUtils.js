import { checkCache, addToCache } from '../SourceResultCache.js';
import { subSourceVariables } from '../sub-source-vars.js';

/**
 *
 * @param {import('../types.js').DatasourceSpec} source
 * @param {import('../types.js').SourceFilters} [filters]
 * @returns {import('../types.js').SourceUtils}
 */
export const buildSourceUtils = (source, filters) => {
	/** @type {import('../types.js').SourceUtils} */
	const utils = {
		/**
		 * @param {string} name
		 * @param {string} content
		 */
		isCached: (name, content) =>
			Boolean(filters?.only_changed && checkCache(source.name, name, content)),
		/**
		 * @param {string} name
		 * @returns {boolean} true if query is included in filters
		 */
		isFiltered: (name) => {
			if (!filters?.queries?.size) return false;
			return Boolean(!filters.queries.has(name) && !filters.queries.has(`${source.name}.${name}`));
		},
		/**
		 * @param {string} name
		 * @param {string} content
		 * @returns {boolean}
		 */
		shouldRun: (name, content) => !utils.isFiltered(name) && !utils.isCached(name, content),
		/**
		 * @param {string} name
		 * @param {string} content
		 */
		addToCache: (name, content) => addToCache(source.name, name, content),
		subSourceVariables: subSourceVariables,
		escape: (tableName, tableContent) => ({
			name: tableName,
			content: tableContent,
			rows: [],
			columnTypes: []
		})
	};

	return utils;
};

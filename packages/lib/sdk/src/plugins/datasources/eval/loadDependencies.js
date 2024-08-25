import ora from 'ora';
import { loadSourcePlugins } from '../loadSourcePlugins.js';
import { loadSources } from '../loadSources.js';
import { loadCache } from '../SourceResultCache.js';

/**
 * @param {string} metaPath
 */
export const loadDependencies = async (metaPath) => {
	const pluginLoader = ora({ text: 'Loading plugins & sources' }).start();

	// Setup work
	const [sourcePlugins, sources] = await Promise.all([
		loadSourcePlugins(),
		loadSources(),
		loadCache(metaPath)
	]).catch((e) => {
		pluginLoader.fail();
		throw e;
	});

	pluginLoader.succeed();
	return { sourcePlugins, sources };
};

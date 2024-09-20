import { getEvidenceConfig } from '../../configuration/getEvidenceConfig.js';
import { EvidenceError } from '../../lib/EvidenceError.js';
import { loadPluginPackage } from '../loadPluginPackage.js';
import { isLayoutPlugin } from '../schemas/plugin-package.schema.js';

/**
 *
 * @returns {Promise<null | import("../schemas/plugin-package.schema.js").LayoutPackage & {dir: string}>}
 */
export const loadLayoutPlugin = async () => {
	const { layout } = getEvidenceConfig();

	if (!layout) return null;
	const pack = await loadPluginPackage(layout);

	if (!pack || !isLayoutPlugin(pack)) {
		throw new EvidenceError(
			`${layout} was specified as a layout, but is not a valid layout plugin`
		);
	}

	return pack;
};

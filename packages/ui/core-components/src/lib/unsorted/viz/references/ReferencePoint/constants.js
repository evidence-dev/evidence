// @ts-check

import { uiColours } from '@evidence-dev/component-utilities/colours';

export const COLORS =
	/**
	 * @type {const}
	 * @satisfies {Record<import('../types.js').ReferenceColor, { symbolColor: string; labelColor: string }>}
	 */
	({
		red: { symbolColor: '#b04646', labelColor: '#b04646' },
		green: { symbolColor: uiColours.green700, labelColor: uiColours.green700 },
		yellow: { symbolColor: uiColours.yellow600, labelColor: uiColours.yellow700 },
		grey: { symbolColor: uiColours.grey500, labelColor: uiColours.grey600 },
		blue: { symbolColor: uiColours.blue500, labelColor: uiColours.blue500 }
	});

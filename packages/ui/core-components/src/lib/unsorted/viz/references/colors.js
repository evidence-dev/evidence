// @ts-check

import { uiColours } from '@evidence-dev/component-utilities/colours';

/** @satisfies {Record<string, { symbolColor: string; labelColor: string }>} */
export const colorList = {
	red: { symbolColor: '#b04646', labelColor: '#b04646' },
	green: { symbolColor: uiColours.green700, labelColor: uiColours.green700 },
	yellow: { symbolColor: uiColours.yellow600, labelColor: uiColours.yellow700 },
	grey: { symbolColor: uiColours.grey500, labelColor: uiColours.grey600 },
	blue: { symbolColor: uiColours.blue500, labelColor: uiColours.blue500 }
};

// Hack to prevent typescript from reducing this type to just `string`
// See: https://stackoverflow.com/a/61048124
/** @typedef {keyof typeof colorList | (string & {})} Color */

/**
 * @param {{ color: string; labelColor?: string; symbolColor?: string }} colors
 * @returns {{labelColor: string, symbolColor: string}}
 */
export const getLineAndSymbolColors = (colors) => {
	const labelColor = colors.labelColor ?? colors.color;
	const symbolColor = colors.symbolColor ?? colors.color;

	return {
		labelColor: colorList[labelColor]?.labelColor ?? labelColor,
		symbolColor: colorList[symbolColor]?.symbolColor ?? symbolColor
	};
};

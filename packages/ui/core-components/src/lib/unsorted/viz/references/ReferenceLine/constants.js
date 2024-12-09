// @ts-check

export const LABEL_POSITIONS =
	/**
	 * @type {const}
	 * @satisfies {Record<import('./types.js').LabelPosition, string> & Record<string, unknown>}
	 */
	({
		aboveEnd: 'insideEndTop',
		aboveStart: 'insideStartTop',
		aboveCenter: 'insideMiddleTop',
		aboveCentre: 'insideMiddleTop',
		belowEnd: 'insideEndBottom',
		belowStart: 'insideStartBottom',
		belowCenter: 'insideMiddleBottom',
		belowCentre: 'insideMiddleBottom'
	});

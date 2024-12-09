// @ts-check

export const LABEL_POSITIONS =
	/**
	 * @type {const}
	 * @satisfies {Record<import('./types.js').LabelPosition, string> & Record<string, unknown>}
	 */
	({
		topLeft: 'insideTopLeft',
		top: 'insideTop',
		topRight: 'insideTopRight',
		bottomLeft: 'insideBottomLeft',
		bottom: 'insideBottom',
		bottomRight: 'insideBottomRight',
		left: 'insideLeft',
		center: 'inside',
		centre: 'inside',
		right: 'insideRight'
	});

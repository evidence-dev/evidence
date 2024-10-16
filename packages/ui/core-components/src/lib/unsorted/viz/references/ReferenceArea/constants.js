// @ts-check

export const COLORS =
	/**
	 * @type {const}
	 * @satisfies {Record<import('../types.js').PresetColor, { areaColor: string; labelColor: string; borderColor: string }>}
	 */
	({
		red: {
			areaColor: 'hsla(4, 71.43%, 80%, 0.2)',
			labelColor: 'hsl(4, 50%, 53%)',
			borderColor: 'hsl(4, 50%, 53%)'
		},
		green: {
			areaColor: 'hsla(120, 42.86%, 75%, 0.27)',
			labelColor: 'hsl(120, 30%, 53%)',
			borderColor: 'hsl(120, 30%, 53%)'
		},
		yellow: {
			areaColor: 'hsla(48.39, 100%, 80%, 0.25)',
			labelColor: 'hsl(48.39, 90%, 45%)',
			borderColor: 'hsl(48.39, 90%, 45%)'
		},
		grey: {
			areaColor: 'hsla(216, 33.33%, 97%, 0.2)',
			labelColor: 'hsl(216, 10%, 53%)',
			borderColor: 'hsl(216, 10%, 53%)'
		},
		blue: {
			areaColor: 'hsla(206.25, 80%, 80%, 0.2)',
			labelColor: 'hsl(206.25, 50%, 60%)',
			borderColor: 'hsl(206.25, 50%, 60%)'
		}
	});

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

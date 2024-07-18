// @ts-check

export const COLORS =
	/**
	 * @type {const}
	 * @satisfies {Record<import('../types.js').PresetColor, { areaColor: string; labelColor: string; borderColor: string }>}
	 */
	({
		red: { areaColor: '#fceeed', labelColor: '#b04646', borderColor: '#b04646' },
		green: { areaColor: '#e6f5e6', labelColor: '#65a665', borderColor: '#65a665' },
		yellow: { areaColor: '#fff9e0', labelColor: '#edb131', borderColor: '#edb131' },
		grey: {
			areaColor: 'hsl(217, 33%, 97%)',
			labelColor: 'hsl(212, 10%, 53%)',
			borderColor: 'hsl(212, 10%, 53%)'
		},
		blue: { areaColor: '#EDF6FD', labelColor: '#51a2e0', borderColor: '#51a2e0' }
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

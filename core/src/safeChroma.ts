import chroma from 'chroma-js';

export const safeChroma = (color: chroma.ChromaInput | undefined): chroma.Color | undefined => {
	if (typeof color === 'undefined') return undefined;

	try {
		return chroma(color);
	} catch {
		return undefined;
	}
};

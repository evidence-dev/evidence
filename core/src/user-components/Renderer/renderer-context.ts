import { getContext, setContext } from 'svelte';

const RENDERER_CONTEXT_KEY = Symbol('RENDERER_CONTEXT');

type RendererContext = {
	get context(): 'edit' | 'preview' | 'published' | undefined;
};

export const setRendererContext = (context: RendererContext): void => {
	setContext(RENDERER_CONTEXT_KEY, context);
};

export const getRendererContext = (): RendererContext => {
	const context = getContext<RendererContext | undefined>(RENDERER_CONTEXT_KEY);
	if (!context) {
		throw new Error('Renderer Context not set!');
	}
	return context;
};

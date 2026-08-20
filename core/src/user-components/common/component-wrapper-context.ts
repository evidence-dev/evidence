import { getContext, setContext } from 'svelte';

const COMPONENT_WRAPPER_CONTEXT_KEY = Symbol('COMPONENT_WRAPPER_CONTEXT');

interface ComponentWrapperContext {
	getComponentId: () => string;
	setError: (error: string | undefined, componentId?: string) => void;
	hasBlockingErrors: () => boolean;
	setCustomExportHandler?: (handler: (() => Promise<void>) | undefined) => void;
}

export const setComponentWrapperContext = (context: ComponentWrapperContext) =>
	setContext(COMPONENT_WRAPPER_CONTEXT_KEY, context);

export const getComponentWrapperContext = (): ComponentWrapperContext =>
	getContext(COMPONENT_WRAPPER_CONTEXT_KEY);

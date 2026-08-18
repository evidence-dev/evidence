import { getContext, setContext } from 'svelte';

type ComponentClickToSourceContext = {
	scrollToLine: (lineNumber: number) => void;
	scrollToLineRange: (startLine: number, endLine: number) => void;
	highlightedComponentId: () => string | null;
	setHighlightedComponentId: (id: string | null) => void;
	/**
	 * Project-root path of the document open in the editor (e.g.
	 * `components/my_widget`). Lets the click handler decide whether a node's
	 * parse coordinates are in the open document or in a file it was inlined
	 * from (custom component / partial) — jumping to the latter's line numbers
	 * in the former's editor lands on an unrelated line.
	 */
	currentFile?: () => string | null;
};

const CONTEXT_KEY = Symbol('component-click-to-source');

export function setComponentClickToSourceContext(context: ComponentClickToSourceContext): void {
	setContext(CONTEXT_KEY, context);
}

export function getComponentClickToSourceContext(): ComponentClickToSourceContext | undefined {
	return getContext(CONTEXT_KEY);
}

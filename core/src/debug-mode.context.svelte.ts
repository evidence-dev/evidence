import { getContext, setContext } from 'svelte';

const DEBUG_MODE_KEY = Symbol('debug-mode');

export class DebugModeContext {
	enabled = $state(false);

	toggle() {
		this.enabled = !this.enabled;
	}

	enable() {
		this.enabled = true;
	}

	disable() {
		this.enabled = false;
	}
}

export function setDebugModeContext(): DebugModeContext {
	const context = new DebugModeContext();
	setContext(DEBUG_MODE_KEY, context);
	return context;
}

export function getDebugModeContext(): DebugModeContext | undefined {
	return getContext(DEBUG_MODE_KEY);
}

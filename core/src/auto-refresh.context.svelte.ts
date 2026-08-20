import { getContext, setContext } from 'svelte';
import type { PageSettings } from './user-components/interfaces/project-settings';

const AUTO_REFRESH_CONTEXT_KEY = Symbol('AUTO_REFRESH_CONTEXT');

export type AutoRefreshContext = {
	/** Page-level auto-refresh interval in seconds (0 = off) */
	readonly intervalSeconds: number;
};

/**
 * Provides the page-level auto-refresh interval to descendant components.
 * Individual Query instances read this as a fallback when no component-level
 * refresh_interval is set. Each Query manages its own self-rearming timer,
 * which naturally staggers requests across components.
 */
export const setAutoRefreshContext = (getPageSettings: () => PageSettings): AutoRefreshContext => {
	const context: AutoRefreshContext = {
		get intervalSeconds() {
			const settings = getPageSettings() as PageSettings & { auto_refresh?: number };
			return settings.auto_refresh ?? 0;
		}
	};

	setContext(AUTO_REFRESH_CONTEXT_KEY, context);
	return context;
};

export const getAutoRefreshContext = (): AutoRefreshContext | undefined => {
	return getContext<AutoRefreshContext | undefined>(AUTO_REFRESH_CONTEXT_KEY);
};

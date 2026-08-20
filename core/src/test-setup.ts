import { vi } from 'vitest';

// jsdom doesn't implement matchMedia. Svelte's client build (used in tests so
// components can be mounted) calls it via reactive MediaQuery, so provide a
// no-op stub. Guarded so it only applies in a DOM environment.
if (typeof window !== 'undefined' && !window.matchMedia) {
	window.matchMedia = (query: string) =>
		({
			matches: false,
			media: query,
			onchange: null,
			addListener: () => {},
			removeListener: () => {},
			addEventListener: () => {},
			removeEventListener: () => {},
			dispatchEvent: () => false
		}) as unknown as MediaQueryList;
}

// Mock mode-watcher to prevent reactive loops in tests
vi.mock('mode-watcher', () => {
	// Create a stable mock mode object that doesn't cause reactive loops
	const mockMode = {
		current: 'light' as const,
		subscribe: vi.fn(() => () => {}),
		set: vi.fn(),
		update: vi.fn()
	};

	return {
		mode: mockMode,
		setMode: vi.fn(),
		resetMode: vi.fn(),
		toggleMode: vi.fn(),
		ModeWatcher: vi.fn(() => ({
			// Mock component
		}))
	};
});

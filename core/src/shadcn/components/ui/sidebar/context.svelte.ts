import { IsMobile } from '../../../../shadcn/hooks/is-mobile.svelte.js';
import { getContext, setContext } from 'svelte';
import {
	SIDEBAR_KEYBOARD_SHORTCUT,
	SIDEBAR_WIDTH_COOKIE_NAME,
	SIDEBAR_COOKIE_MAX_AGE,
	SIDEBAR_WIDTH_DEFAULT_PX,
	SIDEBAR_WIDTH_MIN_PX,
	SIDEBAR_WIDTH_MAX_PX
} from './constants.js';

type Getter<T> = () => T;

export type SidebarStateProps = {
	/**
	 * A getter function that returns the current open state of the sidebar.
	 * We use a getter function here to support `bind:open` on the `Sidebar.Provider`
	 * component.
	 */
	open: Getter<boolean>;

	/**
	 * A function that sets the open state of the sidebar. To support `bind:open`, we need
	 * a source of truth for changing the open state to ensure it will be synced throughout
	 * the sub-components and any `bind:` references.
	 */
	setOpen: (open: boolean) => void;

	/**
	 * Initial width in pixels for the sidebar. If not provided, defaults to CSS rem value.
	 */
	initialWidthPx?: number;
};

class SidebarState {
	readonly props: SidebarStateProps;
	open = $derived.by(() => this.props.open());
	openMobile = $state(false);
	setOpen: SidebarStateProps['setOpen'];
	#isMobile: IsMobile;
	state = $derived.by(() => (this.open ? 'expanded' : 'collapsed'));
	widthPx = $state(SIDEBAR_WIDTH_DEFAULT_PX);
	isResizing = $state(false);

	constructor(props: SidebarStateProps) {
		this.setOpen = props.setOpen;
		this.#isMobile = new IsMobile();
		this.props = props;
		this.widthPx = props.initialWidthPx ?? this.#readWidthCookie() ?? SIDEBAR_WIDTH_DEFAULT_PX;
	}

	#readWidthCookie(): number | null {
		if (typeof document === 'undefined') return null;
		const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${SIDEBAR_WIDTH_COOKIE_NAME}=([^;]*)`));
		if (match) {
			const px = parseInt(match[1], 10);
			if (!isNaN(px) && px >= SIDEBAR_WIDTH_MIN_PX) return px;
		}
		return null;
	}

	get widthStyle() {
		return `${this.widthPx}px`;
	}

	// Convenience getter for checking if the sidebar is mobile
	// without this, we would need to use `sidebar.isMobile.current` everywhere
	get isMobile() {
		return this.#isMobile.current;
	}

	// Event handler to apply to the `<svelte:window>`
	handleShortcutKeydown = (e: KeyboardEvent) => {
		if (e.key === SIDEBAR_KEYBOARD_SHORTCUT && (e.metaKey || e.ctrlKey)) {
			e.preventDefault();
			this.toggle();
		}
	};

	setOpenMobile = (value: boolean) => {
		this.openMobile = value;
	};

	toggle = () => {
		return this.#isMobile.current ? (this.openMobile = !this.openMobile) : this.setOpen(!this.open);
	};

	startResize = (e: PointerEvent) => {
		if (this.#isMobile.current) return;
		e.preventDefault();
		this.isResizing = true;
		const onPointerMove = (e: PointerEvent) => {
			this.widthPx = Math.min(SIDEBAR_WIDTH_MAX_PX, Math.max(SIDEBAR_WIDTH_MIN_PX, e.clientX));
		};
		const onPointerUp = () => {
			this.isResizing = false;
			document.removeEventListener('pointermove', onPointerMove);
			document.removeEventListener('pointerup', onPointerUp);
			// Persist width to cookie
			document.cookie = `${SIDEBAR_WIDTH_COOKIE_NAME}=${this.widthPx}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
		};
		document.addEventListener('pointermove', onPointerMove);
		document.addEventListener('pointerup', onPointerUp);
	};
}

const SYMBOL_KEY = 'scn-sidebar';

/**
 * Instantiates a new `SidebarState` instance and sets it in the context.
 *
 * @param props The constructor props for the `SidebarState` class.
 * @returns  The `SidebarState` instance.
 */
export function setSidebar(props: SidebarStateProps): SidebarState {
	return setContext(Symbol.for(SYMBOL_KEY), new SidebarState(props));
}

/**
 * Retrieves the `SidebarState` instance from the context. This is a class instance,
 * so you cannot destructure it.
 * @returns The `SidebarState` instance.
 */
export function useSidebar(): SidebarState {
	return getContext(Symbol.for(SYMBOL_KEY));
}

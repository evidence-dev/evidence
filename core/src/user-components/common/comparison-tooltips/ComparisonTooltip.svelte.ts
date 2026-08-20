import { getContext, setContext } from 'svelte';

interface ComparisonTooltipState {
	open: boolean;
	anchor: HTMLElement | null;
	title: string;
	rows: Array<{ label: string; value: string }>;
}

const COMPARISON_TOOLTIP_CONTEXT_KEY = Symbol('COMPARISON_TOOLTIP_CONTEXT');

export class ComparisonTooltip {
	#state: ComparisonTooltipState = $state({
		open: false,
		anchor: null,
		title: '',
		rows: []
	});

	#showTimer: number | undefined;
	#hideTimer: number | undefined;

	get open() {
		return this.#state.open;
	}

	get anchor() {
		return this.#state.anchor;
	}

	get title() {
		return this.#state.title;
	}

	get rows() {
		return this.#state.rows;
	}

	show(anchor: HTMLElement, title: string, rows: Array<{ label: string; value: string }>) {
		this.#state = {
			open: true,
			anchor,
			title,
			rows
		};
	}

	hide() {
		this.#state = {
			...this.#state,
			open: false
		};
	}

	scheduleShow(
		anchor: HTMLElement,
		title: string,
		rows: Array<{ label: string; value: string }>,
		delay = 120
	) {
		if (this.#hideTimer) {
			clearTimeout(this.#hideTimer);
			this.#hideTimer = undefined;
		}
		if (this.#showTimer) {
			clearTimeout(this.#showTimer);
		}
		this.#showTimer = window.setTimeout(() => {
			this.show(anchor, title, rows);
			this.#showTimer = undefined;
		}, delay);
	}

	scheduleHide(delay = 80) {
		if (this.#showTimer) {
			clearTimeout(this.#showTimer);
			this.#showTimer = undefined;
		}
		if (this.#hideTimer) {
			clearTimeout(this.#hideTimer);
		}
		this.#hideTimer = window.setTimeout(() => {
			this.hide();
			this.#hideTimer = undefined;
		}, delay);
	}
}

export const setComparisonTooltipContext = (tooltip: ComparisonTooltip) => {
	setContext(COMPARISON_TOOLTIP_CONTEXT_KEY, tooltip);
};

export const getComparisonTooltipContext = (): ComparisonTooltip => {
	const context = getContext<ComparisonTooltip>(COMPARISON_TOOLTIP_CONTEXT_KEY);
	if (!context) {
		throw new Error('ComparisonTooltip context not set');
	}
	return context;
};

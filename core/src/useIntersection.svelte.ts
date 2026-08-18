import type { Action } from 'svelte/action';

type IntersectionState = {
	isIntersecting: boolean;
};

type UseIntersectionReturn = {
	intersectionAction: Action<HTMLElement>;
	intersectionState: IntersectionState;
};

type Options = {
	default: boolean;
	observer?: IntersectionObserverInit;
};

export const useIntersection = (options?: Options): UseIntersectionReturn => {
	const intersectionState: IntersectionState = $state({
		isIntersecting: options?.default ?? false
	});

	const intersectionAction: Action<HTMLElement> = (node) => {
		const intersectionObserver = new IntersectionObserver((entries) => {
			if (!entries[0]) return;
			intersectionState.isIntersecting = entries[0].isIntersecting;
		}, options?.observer);
		intersectionObserver.observe(node);

		return {
			destroy() {
				intersectionObserver?.disconnect();
			}
		};
	};

	return {
		intersectionAction,
		intersectionState
	};
};

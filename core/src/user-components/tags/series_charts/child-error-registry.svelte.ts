import { untrack } from 'svelte';

/** Surfaces query errors from a chart's data-driven reference children on the parent wrapper. */
export function createChildErrorRegistry() {
	const getters = $state<Array<() => string | null | undefined>>([]);

	return {
		register(getError: () => string | null | undefined): () => void {
			// untrack the write: `push` reads array length, which would subscribe a
			// caller's mount effect to the array it wrote → effect_update_depth_exceeded
			untrack(() => getters.push(getError));
			return () =>
				untrack(() => {
					const index = getters.indexOf(getError);
					if (index > -1) getters.splice(index, 1);
				});
		},

		/** First non-empty child error; reactive, read inside a `$derived`. */
		get firstError(): string | undefined {
			return getters.map((getError) => getError()).find(Boolean) ?? undefined;
		}
	};
}

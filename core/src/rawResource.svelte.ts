import { resource, type ResourceOptions, type ResourceReturn } from 'runed';
import type { Getter } from 'runed';

/**
 * A wrapper around runed's `resource()` that stores `current` in `$state.raw()`
 * instead of `$state()`, avoiding deep reactive proxy overhead on large datasets.
 *
 * The fetcher receives un-proxied `lastData` via `info.data`, and the returned
 * `current` value is never wrapped in a deep reactive proxy.
 *
 * All other behavior (loading, error, debounce, lazy, abort, refetch) is
 * delegated to the inner `resource()`.
 */
export function rawResource<Sources extends Array<unknown>, Data>(
	sources: { [K in keyof Sources]: Getter<Sources[K]> },
	fetcher: (
		value: { [K in keyof Sources]: Sources[K] },
		previousValue: { [K in keyof Sources]: Sources[K] },
		info: {
			data: Data | undefined;
			refetching: boolean;
			onCleanup: (fn: () => void) => void;
			signal: AbortSignal;
		}
	) => Promise<Data | undefined>,
	options?: Omit<ResourceOptions<Data>, 'initialValue'>
): ResourceReturn<Data> {
	let rawCurrent: Data | undefined = $state.raw(undefined);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const inner = resource<Sources, unknown, any>(
		sources,
		async (values: any, prevValues: any, info: any) => {
			const result = await fetcher(values, prevValues, {
				...info,
				data: rawCurrent
			});
			rawCurrent = result;
			return result;
		},
		options as any
	);

	return {
		get current() {
			return rawCurrent;
		},
		get loading() {
			return inner.loading;
		},
		get error() {
			return inner.error;
		},
		mutate(value: Data) {
			rawCurrent = value;
			inner.mutate(value);
		},
		refetch: inner.refetch
	};
}

import { describe, expect, it, vi } from 'vitest';
import type { FilterDeps } from './Filter.svelte';
import { DropdownFilter } from './user-components/tags/dropdown/DropdownFilter.svelte';
import { SliderFilter } from './user-components/tags/slider/SliderFilter.svelte';

function makeDeps(initialUrl = 'https://example.com/report') {
	let url = new URL(initialUrl);
	const updateUrl = vi.fn((next: URL) => {
		url = new URL(next);
	});
	const deps: FilterDeps = {
		url: () => url,
		updateUrl,
		projectSettings: undefined,
		dialect: undefined
	};
	return { deps, updateUrl, param: (id: string) => url.searchParams.get(id) };
}

function dropdown(deps: FilterDeps, attributes: Record<string, unknown> = {}) {
	return new DropdownFilter(
		{
			id: 'region',
			userComponentName: 'dropdown',
			attributes: { value_column: 'region', multiple: false, ...attributes }
		} as unknown as ConstructorParameters<typeof DropdownFilter>[0],
		deps
	);
}

describe('Filter URL sync', () => {
	it('a user change writes the URL; a later change overwrites it', () => {
		const { deps, updateUrl, param } = makeDeps();
		const filter = dropdown(deps);

		filter.value = 'North';
		expect(updateUrl).toHaveBeenCalledTimes(1);
		expect(param('region')).toBe('North');

		filter.value = 'South';
		expect(updateUrl).toHaveBeenCalledTimes(2);
		expect(param('region')).toBe('South');
	});

	it('re-asserting a programmatic default through the setter does not write the URL', () => {
		const { deps, updateUrl, param } = makeDeps();
		const filter = dropdown(deps);

		filter.setDefault('North');
		expect(updateUrl).not.toHaveBeenCalled();

		// e.g. a bind:value echo or an effect mirroring local state back
		filter.value = 'North';
		expect(updateUrl).not.toHaveBeenCalled();
		expect(param('region')).toBeNull();

		// ...while a genuine change away from the default still persists.
		filter.value = 'South';
		expect(param('region')).toBe('South');
	});

	it('re-asserting an initial_value does not write the URL', () => {
		const { deps, updateUrl, param } = makeDeps();
		const filter = dropdown(deps, { initial_value: 'North' });
		expect(filter.value).toBe('North');

		filter.value = 'North';
		expect(updateUrl).not.toHaveBeenCalled();
		expect(param('region')).toBeNull();
	});

	it('re-asserting a value restored from the URL does not write again', () => {
		const { deps, updateUrl, param } = makeDeps('https://example.com/report?region=North');
		const filter = dropdown(deps);
		expect(filter.value).toBe('North');

		filter.value = 'North';
		expect(updateUrl).not.toHaveBeenCalled();
		expect(param('region')).toBe('North');
	});

	it('compares serialized form, so an equal-but-new object is still a no-op', () => {
		const { deps, updateUrl } = makeDeps();
		const filter = new SliderFilter(
			{
				id: 'range',
				userComponentName: 'slider',
				attributes: { range: true }
			} as unknown as ConstructorParameters<typeof SliderFilter>[0],
			deps
		);

		filter.setDefault([10, 50]);
		filter.value = [10, 50];
		expect(updateUrl).not.toHaveBeenCalled();

		filter.value = [20, 50];
		expect(updateUrl).toHaveBeenCalledTimes(1);
	});

	it('an in-place edit of the stored value still writes when re-assigned', () => {
		const { deps, updateUrl, param } = makeDeps();
		const filter = dropdown(deps, { multiple: true });

		filter.setDefault(['North']);
		expect(updateUrl).not.toHaveBeenCalled();

		// Components mutate the object the filter holds (chip operator toggles,
		// addFilter's push) and then re-assign it; the edit must still persist.
		const current = filter.value as string[];
		current.push('South');
		filter.value = current;

		expect(updateUrl).toHaveBeenCalledTimes(1);
		expect(JSON.parse(param('region')!)).toEqual(['North', 'South']);
	});

	it('normalize() rewrites a value that came from the URL', () => {
		const { deps, updateUrl, param } = makeDeps(
			'https://example.com/report?region=' + encodeURIComponent('["North","South"]')
		);
		const filter = dropdown(deps, { multiple: true });
		expect(filter.value).toEqual(['North', 'South']);

		filter.normalize(['North']);
		expect(updateUrl).toHaveBeenCalledTimes(1);
		expect(JSON.parse(param('region')!)).toEqual(['North']);

		// ...and the corrected value now counts as current: echoing it is a no-op.
		filter.value = ['North'];
		expect(updateUrl).toHaveBeenCalledTimes(1);
	});

	it('normalize() keeps a corrected default out of the URL', () => {
		const { deps, updateUrl, param } = makeDeps();
		const filter = dropdown(deps, { multiple: true, initial_value: ['North', 'South'] });

		filter.normalize(['North']);
		expect(updateUrl).not.toHaveBeenCalled();
		expect(param('region')).toBeNull();
		expect(filter.value).toEqual(['North']);

		filter.value = ['North'];
		expect(updateUrl).not.toHaveBeenCalled();
	});

	it('tracks the snapshot across a run of in-place edits (no desync)', () => {
		const { deps, updateUrl, param } = makeDeps();
		const filter = dropdown(deps, { multiple: true });

		// Each edit mutates the same array the filter holds, then re-assigns it.
		const value = ['North'];
		filter.value = value;
		expect(param('region')).toBe(JSON.stringify(['North']));

		value.push('South');
		filter.value = value;
		expect(updateUrl).toHaveBeenCalledTimes(2);
		expect(param('region')).toBe(JSON.stringify(['North', 'South']));

		// Re-asserting the exact same (already-written) state is a no-op.
		filter.value = value;
		expect(updateUrl).toHaveBeenCalledTimes(2);

		// Mutating back to a previously-seen value still writes — the snapshot is the
		// last committed value, not a set of every value ever seen.
		value.pop();
		filter.value = value;
		expect(updateUrl).toHaveBeenCalledTimes(3);
		expect(param('region')).toBe(JSON.stringify(['North']));
	});

	it('a user edit that lands on a programmatic default still writes (only setDefault suppresses)', () => {
		const { deps, updateUrl, param } = makeDeps();
		const filter = dropdown(deps, { multiple: true });

		filter.setDefault(['North']); // programmatic default → out of URL
		const value = ['North', 'South'];
		filter.value = value; // user picks something else → writes
		expect(param('region')).toBe(JSON.stringify(['North', 'South']));

		// User edits back down to the default value: still a real interaction, so it persists.
		value.pop();
		filter.value = value;
		expect(updateUrl).toHaveBeenCalledTimes(2);
		expect(param('region')).toBe(JSON.stringify(['North']));
	});

	it('clearing an unset filter does not touch the URL, clearing a chosen value removes its param', () => {
		const { deps, updateUrl, param } = makeDeps();
		const filter = dropdown(deps);

		filter.value = '';
		expect(updateUrl).not.toHaveBeenCalled();

		filter.value = 'North';
		expect(param('region')).toBe('North');

		filter.value = '';
		expect(param('region')).toBeNull();
	});
});

import { describe, expect, it } from 'vitest';
import { transitionMapLayer, type MapLayerState } from './layer-state';

describe('transitionMapLayer', () => {
	it('detects a new query result when only a later row changes', () => {
		const before = [
			{ area_id: 'CA', value: 10 },
			{ area_id: 'NY', value: 20 }
		];
		const after = [
			{ area_id: 'CA', value: 10 },
			{ area_id: 'NY', value: 99 }
		];
		const state: MapLayerState = { added: true, data: before };

		expect(transitionMapLayer(state, after).action).toBe('replace');
		expect(transitionMapLayer(state, before).action).toBe('none');
	});

	it('caches an identical auto-refresh result without replacing the layer', () => {
		const previous = [{ lat: 1, lng: 2 }];
		const current = [{ lat: 1, lng: 2 }];
		const state: MapLayerState = { added: true, data: previous };
		const transition = transitionMapLayer(state, current);

		expect(transition).toEqual({
			action: 'none',
			state: { added: true, data: current, variant: undefined }
		});
	});

	it('detects point layer clustering changes with unchanged data', () => {
		const data = [{ lat: 1, lng: 2 }];
		const state: MapLayerState = { added: true, data, variant: false };

		expect(transitionMapLayer(state, data, true).action).toBe('replace');
	});

	it('removes an existing layer when a filter returns no rows', () => {
		const state: MapLayerState = {
			added: true,
			data: [{ area_id: 'CA', value: 10 }]
		};

		expect(transitionMapLayer(state, [])).toEqual({
			action: 'remove',
			state: { added: false, data: [], variant: undefined }
		});
	});
});

import { describe, it, expect } from 'vitest';
import {
	shouldDisplayTooltipParam,
	tooltipFormatterArgSchema
} from './tooltipFormatterParams.schema';

// dataIndex is what the 100%-stacked tooltip needs to resolve each series'
// hovered-column raw value. zod strips unknown keys by default, so omitting it
// from the schema silently dropped it before it reached the value formatter.
describe('tooltipFormatterArgSchema', () => {
	const param = {
		value: ['BFH', 0.77],
		seriesIndex: 0,
		dataIndex: 1,
		seriesName: 'Rutineforløb',
		marker: '',
		seriesType: 'bar'
	};

	it('preserves dataIndex through the parse', () => {
		const parsed = tooltipFormatterArgSchema.parse([param]);
		expect(parsed[0].dataIndex).toBe(1);
	});

	it('normalizes a single param object into an array', () => {
		const parsed = tooltipFormatterArgSchema.parse(param);
		expect(parsed).toHaveLength(1);
		expect(parsed[0].dataIndex).toBe(1);
	});

	it('omits null and filled values while retaining a real zero', () => {
		const realZero = tooltipFormatterArgSchema.parse({
			...param,
			value: ['Jan', 0],
			data: ['Jan', 0]
		})[0];
		const nullValue = tooltipFormatterArgSchema.parse({
			...param,
			value: ['Feb', null],
			data: ['Feb', null]
		})[0];
		const undefinedValue = tooltipFormatterArgSchema.parse({
			...param,
			value: ['Mar', undefined],
			data: ['Mar', undefined]
		})[0];
		const filledZero = tooltipFormatterArgSchema.parse({
			...param,
			value: ['Feb', 0],
			data: { value: ['Feb', 0], isMissing: true }
		})[0];

		expect([
			shouldDisplayTooltipParam(realZero),
			shouldDisplayTooltipParam(nullValue),
			shouldDisplayTooltipParam(undefinedValue),
			shouldDisplayTooltipParam(filledZero)
		]).toEqual([true, false, false, false]);
	});
});

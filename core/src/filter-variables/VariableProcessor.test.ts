import { describe, expect, it } from 'vitest';
import { VariableProcessor } from './VariableProcessor';
import { Filters } from '../Filters.svelte';

const filters = new Filters({
	url: undefined,
	updateUrl: undefined
} as never);

describe('QEv3: engine attribute values in TEXT contexts', () => {
	const processor = new VariableProcessor(
		[filters],
		{ getRaw: () => undefined, isSqlFile: () => false } as never,
		undefined,
		undefined,
		false,
		{ aaaa: 'New York', region: 'EMEA' }
	);

	it('prints the viewer value in text context', () => {
		expect(processor.processString('My var is {{ aaaa }}', 'text')).toBe('My var is New York');
	});

	it('never resolves attributes in SQL context — the engine binds there', () => {
		expect(processor.processString('select {{ region }}', 'sql')).toBe('select {{ region }}');
	});

	it('leaves unknown names untouched (they may be filter refs)', () => {
		expect(processor.processString('My var is {{ notAnAttribute }}', 'text')).toBe(
			'My var is {{ notAnAttribute }}'
		);
	});

	it('does nothing without the attribute map (legacy orgs)', () => {
		const legacy = new VariableProcessor([filters], { getRaw: () => undefined } as never);
		expect(legacy.processString('My var is {{ aaaa }}', 'text')).toBe('My var is {{ aaaa }}');
	});
});

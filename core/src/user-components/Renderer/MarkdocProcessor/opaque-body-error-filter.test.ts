import { describe, test, expect } from 'vitest';
import { process } from './process-markdoc';
import type { ValidationContext } from '../../validators/types';

const ctx = (over: Partial<ValidationContext> = {}): ValidationContext => ({
	metadata: undefined,
	filters: undefined,
	inlineQueries: undefined,
	trees: undefined,
	...over
});

describe('filterErrorsInsideOpaqueBodies', () => {
	test('markdoc noise inside an {% html %} body is dropped', () => {
		// A ```sql fence with ${...} raises oss-query-reference — inside an
		// opaque body it is parse noise (the body is raw source, not markdoc).
		const page = [
			'{% html %}',
			'```sql inner',
			'select * from ${orders}',
			'```',
			'{% /html %}'
		].join('\n');
		const { validationErrors } = process(page, ctx());
		expect(validationErrors.find((e) => e.error?.id === 'oss-query-reference')).toBeUndefined();
	});

	test('the same error at page level survives', () => {
		const page = ['```sql outer', 'select * from ${orders}', '```'].join('\n');
		const { validationErrors } = process(page, ctx());
		expect(validationErrors.find((e) => e.error?.id === 'oss-query-reference')).toBeDefined();
	});

	test('an error from a PARTIAL whose line number collides with a page html-body range survives', () => {
		// The partial's duplicate fences sit at partial-relative lines 1–7,
		// which collide with the page's html body span (page lines 2–9). The
		// filter must compare files, not just line numbers.
		const partial = [
			'```sql dup',
			'select 1 as a',
			'```',
			'',
			'```sql dup',
			'select 2 as a',
			'```'
		].join('\n');
		const page = [
			'{% partial file="/partials/p" /%}',
			'{% html %}',
			'<div>',
			'one',
			'two',
			'three',
			'four',
			'five',
			'</div>',
			'{% /html %}'
		].join('\n');
		const { validationErrors } = process(
			page,
			ctx({ useRelativeResolution: true, basePath: 'pages/home' }),
			{ 'partials/p': partial }
		);
		const dupErrors = validationErrors.filter((e) => e.error?.id === 'duplicate-fence-name');
		expect(dupErrors.length).toBeGreaterThan(0);
	});
});

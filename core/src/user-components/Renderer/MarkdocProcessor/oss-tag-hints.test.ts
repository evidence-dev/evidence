import { describe, test, expect } from 'vitest';
import { parse, validate } from './process-markdoc';
import type { ValidationContext } from '../../validators/types';

const ctx = (): ValidationContext => ({
	metadata: undefined,
	filters: undefined,
	inlineQueries: undefined,
	trees: undefined
});

describe('OSS-Evidence tag hints on undefined-tag errors', () => {
	test('{% grid %} teaches the row/stack alternative', () => {
		// LLMs (and users) trained on open-source Evidence reach for Grid; the
		// bare "tag not found" was a dead end.
		const ast = parse('{% grid cols=3 %}\nx\n{% /grid %}', ctx());
		const errors = validate(ast, ctx());

		const gridError = errors.find((e) => e.error?.id === 'tag-undefined');
		expect(gridError).toBeDefined();
		expect(gridError?.error?.message).toContain('{% row %}');
		expect(gridError?.error?.message).toContain('{% stack %}');
	});

	test('other unknown tags keep the plain message', () => {
		const ast = parse('{% zorp /%}', ctx());
		const errors = validate(ast, ctx());
		const err = errors.find((e) => e.error?.id === 'tag-undefined');
		expect(err).toBeDefined();
		expect(err?.error?.message).not.toContain('{% row %}');
	});
});

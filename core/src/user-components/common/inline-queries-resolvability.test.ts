import { describe, test, expect } from 'vitest';
import { process } from '../Renderer/MarkdocProcessor/process-markdoc';
import type { ValidationContext } from '../validators/types';
import { InlineQueries } from './inline-queries';

const ctx = (over: Partial<ValidationContext> = {}): ValidationContext => ({
	metadata: undefined,
	filters: undefined,
	inlineQueries: undefined,
	trees: undefined,
	...over
});

// Registers a plain PAGE query named `q` (no `<tag>:` scope marker).
const registerPageQuery = (fenceSql: string): InlineQueries => {
	const inlineQueries = new InlineQueries({ filterContexts: undefined });
	process(`\`\`\`sql q\n${fenceSql}\n\`\`\``, ctx({ inlineQueries }));
	return inlineQueries;
};

describe('resolvability gate — scoped to custom-component queries only', () => {
	// Component-scoped queries (name carries the `<tag>:` marker) DO throw on an
	// unresolved token — covered in process-custom-components.test.ts. Page and
	// partial queries carry caller-scoped {{ $var }} tokens resolved at their own
	// layer (page frontmatter, or a partial's `variables=` at the call site,
	// which need not be in the partial's own frontmatter). They pre-date this
	// release, so they MUST pass through exactly as before — never a hard throw.

	test('page query with an unresolved $-token does NOT throw (passes through like main)', () => {
		const inlineQueries = registerPageQuery('select {{ $missing }} as x');
		expect(() => inlineQueries.getInterpolated('q')).not.toThrow();
		// The literal token survives into the SQL, exactly as pre-gate.
		expect(inlineQueries.getInterpolated('q')).toContain('{{ $missing }}');
	});

	test('page query with an unresolved token in a string literal does NOT throw', () => {
		const inlineQueries = registerPageQuery("select * from t where cat = '{{ $category }}'");
		expect(() => inlineQueries.getInterpolated('q')).not.toThrow();
	});

	test('$-token inside a comment is ignored either way', () => {
		const inlineQueries = registerPageQuery('-- {{ $todo }}\nselect 1 as one');
		expect(inlineQueries.getInterpolated('q')).toContain('select 1 as one');
	});
});

import { describe, expect, it } from 'vitest';
import type { Node, Config } from '@markdoc/markdoc';
import { createScopedConfig } from './schema';
import { TRANSLATIONS_KEY } from '../../../constants/variable-keys';

describe('Partial schema variable scoping', () => {
	it('should only include partial frontmatter variables and params, not parent variables', () => {
		// Create a mock partial with its own frontmatter
		const partialAst = {
			attributes: {
				frontmatter: 'title: "Partial Title"\ndescription: "Partial Description"'
			},
			children: []
		} as unknown as Node;

		// Create a mock config with parent variables
		const config: Config = {
			variables: {
				parentVar: 'parent value',
				sharedVar: 'parent shared value'
			},
			partials: {
				'test-partial': partialAst
			}
		};

		// Create a mock node with variables
		const node: Node = {
			attributes: {
				file: 'test-partial',
				variables: {
					paramVar: 'param value',
					sharedVar: 'param shared value' // This should override parent
				}
			}
		} as unknown as Node;

		// Test the function directly
		const scopedConfig = createScopedConfig(node, config);

		// Verify the scoped config only contains the expected variables
		expect(scopedConfig).toBeTruthy();
		expect(scopedConfig!.variables).toEqual({
			title: 'Partial Title',
			description: 'Partial Description',
			paramVar: 'param value',
			sharedVar: 'param shared value' // Should be from params, not parent
		});

		// Verify parent variables are NOT included
		expect(scopedConfig!.variables).not.toHaveProperty('parentVar');
	});

	it('should handle partials without frontmatter', () => {
		// Create a mock partial without frontmatter
		const partialAst = {
			attributes: {},
			children: []
		} as unknown as Node;

		const config: Config = {
			variables: {
				parentVar: 'parent value'
			},
			partials: {
				'test-partial': partialAst
			}
		};

		const node: Node = {
			attributes: {
				file: 'test-partial',
				variables: {
					paramVar: 'param value'
				}
			}
		} as unknown as Node;

		// Test the function directly
		const scopedConfig = createScopedConfig(node, config);

		// Verify the scoped config only contains params
		expect(scopedConfig).toBeTruthy();
		expect(scopedConfig!.variables).toEqual({
			paramVar: 'param value'
		});

		// Verify parent variables are NOT included
		expect(scopedConfig!.variables).not.toHaveProperty('parentVar');
	});

	it('should handle partials without params', () => {
		// Create a mock partial with frontmatter but no params
		const partialAst = {
			attributes: {
				frontmatter: 'title: "Partial Title"'
			},
			children: []
		} as unknown as Node;

		const config: Config = {
			variables: {
				parentVar: 'parent value'
			},
			partials: {
				'test-partial': partialAst
			}
		};

		const node: Node = {
			attributes: {
				file: 'test-partial'
				// No params
			}
		} as unknown as Node;

		// Test the function directly
		const scopedConfig = createScopedConfig(node, config);

		// Verify the scoped config only contains partial frontmatter variables
		expect(scopedConfig).toBeTruthy();
		expect(scopedConfig!.variables).toEqual({
			title: 'Partial Title'
		});

		// Verify parent variables are NOT included
		expect(scopedConfig!.variables).not.toHaveProperty('parentVar');
	});

	it('should return null when partial does not exist', () => {
		const config: Config = {
			variables: {
				parentVar: 'parent value'
			},
			partials: {}
		};

		const node: Node = {
			attributes: {
				file: 'nonexistent-partial'
			}
		} as unknown as Node;

		// Test the function directly
		const scopedConfig = createScopedConfig(node, config);

		// Should return null when partial doesn't exist
		expect(scopedConfig).toBeNull();
	});

	it('should inherit translations from parent config', () => {
		const partialAst = {
			attributes: {
				frontmatter: 'title: "Partial Title"'
			},
			children: []
		} as unknown as Node;

		const translations = {
			greeting: 'Hello',
			farewell: 'Goodbye'
		};

		const config: Config = {
			variables: {
				parentVar: 'parent value',
				[TRANSLATIONS_KEY]: translations
			},
			partials: {
				'test-partial': partialAst
			}
		};

		const node: Node = {
			attributes: {
				file: 'test-partial',
				variables: {
					paramVar: 'param value'
				}
			}
		} as unknown as Node;

		const scopedConfig = createScopedConfig(node, config);

		expect(scopedConfig).toBeTruthy();
		// Translations should be inherited
		expect(scopedConfig!.variables![TRANSLATIONS_KEY]).toEqual(translations);
		// Other parent variables should NOT be inherited
		expect(scopedConfig!.variables).not.toHaveProperty('parentVar');
		// Partial frontmatter and params should be included
		expect(scopedConfig!.variables!.title).toBe('Partial Title');
		expect(scopedConfig!.variables!.paramVar).toBe('param value');
	});

	it('should work without translations in parent config', () => {
		const partialAst = {
			attributes: {
				frontmatter: 'title: "Partial Title"'
			},
			children: []
		} as unknown as Node;

		const config: Config = {
			variables: {
				parentVar: 'parent value'
				// No translations
			},
			partials: {
				'test-partial': partialAst
			}
		};

		const node: Node = {
			attributes: {
				file: 'test-partial'
			}
		} as unknown as Node;

		const scopedConfig = createScopedConfig(node, config);

		expect(scopedConfig).toBeTruthy();
		// Should not have translations key if parent didn't have it
		expect(scopedConfig!.variables).not.toHaveProperty(TRANSLATIONS_KEY);
		expect(scopedConfig!.variables!.title).toBe('Partial Title');
	});

	it('should inherit translations through nested partials (two levels)', () => {
		// Simulate nested partial: page -> partial_outer -> partial_inner
		const translations = {
			greeting: 'Hello',
			farewell: 'Goodbye'
		};

		const partialInnerAst = {
			attributes: {
				frontmatter: 'innerTitle: "Inner Partial"'
			},
			children: []
		} as unknown as Node;

		const partialOuterAst = {
			attributes: {
				frontmatter: 'outerTitle: "Outer Partial"'
			},
			children: []
		} as unknown as Node;

		// Level 1: Page config with translations
		const pageConfig: Config = {
			variables: {
				pageVar: 'page value',
				[TRANSLATIONS_KEY]: translations
			},
			partials: {
				'partial-outer': partialOuterAst,
				'partial-inner': partialInnerAst
			}
		};

		// Level 1: Page includes partial-outer
		const outerNode: Node = {
			attributes: {
				file: 'partial-outer',
				variables: { outerParam: 'outer param value' }
			}
		} as unknown as Node;

		const outerScopedConfig = createScopedConfig(outerNode, pageConfig);

		expect(outerScopedConfig).toBeTruthy();
		// Translations should be inherited at level 1
		expect(outerScopedConfig!.variables![TRANSLATIONS_KEY]).toEqual(translations);
		expect(outerScopedConfig!.variables!.outerTitle).toBe('Outer Partial');
		expect(outerScopedConfig!.variables!.outerParam).toBe('outer param value');
		// Page variables should NOT be inherited
		expect(outerScopedConfig!.variables).not.toHaveProperty('pageVar');

		// Level 2: partial-outer includes partial-inner
		const innerNode: Node = {
			attributes: {
				file: 'partial-inner',
				variables: { innerParam: 'inner param value' }
			}
		} as unknown as Node;

		const innerScopedConfig = createScopedConfig(innerNode, outerScopedConfig!);

		expect(innerScopedConfig).toBeTruthy();
		// Translations should be inherited at level 2
		expect(innerScopedConfig!.variables![TRANSLATIONS_KEY]).toEqual(translations);
		expect(innerScopedConfig!.variables!.innerTitle).toBe('Inner Partial');
		expect(innerScopedConfig!.variables!.innerParam).toBe('inner param value');
		// Outer partial variables should NOT be inherited
		expect(innerScopedConfig!.variables).not.toHaveProperty('outerTitle');
		expect(innerScopedConfig!.variables).not.toHaveProperty('outerParam');
	});
});

describe('Partial schema circular reference validation', () => {
	it('should detect circular references in partials', async () => {
		const config: Config = {
			variables: {},
			partials: {
				partial_a: {
					attributes: {},
					children: [
						{
							tag: 'partial',
							attributes: { file: 'partial_b' },
							children: []
						}
					]
				} as unknown as Node,
				partial_b: {
					attributes: {},
					children: [
						{
							tag: 'partial',
							attributes: { file: 'partial_c' },
							children: []
						}
					]
				} as unknown as Node,
				partial_c: {
					attributes: {},
					children: [
						{
							tag: 'partial',
							attributes: { file: 'partial_a' },
							children: []
						}
					]
				} as unknown as Node
			}
		};

		const node: Node = {
			attributes: {
				file: 'partial_a'
			}
		} as unknown as Node;

		// Import the schema to test validation
		const { schema } = await import('./schema');

		// Create a mock validation context
		const mockContext = {
			metadata: undefined,
			filters: undefined,
			inlineQueries: undefined,
			trees: undefined
		};

		// Test validation - should detect circular reference
		const validationErrors = schema.validate(node, config, mockContext);

		expect(validationErrors).toHaveLength(1);
		expect(validationErrors[0].message).toContain('Circular reference');
		expect(validationErrors[0].id).toBe('circular-reference');
	});

	it('should detect self-referencing partials', async () => {
		const config: Config = {
			variables: {},
			partials: {
				self_referencing: {
					attributes: {},
					children: [
						{
							tag: 'partial',
							attributes: { file: 'self_referencing' },
							children: []
						}
					]
				} as unknown as Node
			}
		};

		const node: Node = {
			attributes: {
				file: 'self_referencing'
			}
		} as unknown as Node;

		// Import the schema to test validation
		const { schema } = await import('./schema');

		// Create a mock validation context
		const mockContext = {
			metadata: undefined,
			filters: undefined,
			inlineQueries: undefined,
			trees: undefined
		};

		// Test validation - should detect circular reference
		const validationErrors = schema.validate(node, config, mockContext);

		expect(validationErrors).toHaveLength(1);
		expect(validationErrors[0].message).toContain('Circular reference');
		expect(validationErrors[0].id).toBe('circular-reference');
	});
});

describe('Partial schema unresolved-variable validation', () => {
	const mockContext = {
		metadata: undefined,
		filters: undefined,
		inlineQueries: undefined,
		trees: undefined
	};

	// A partial whose SQL references $passed_var (in frontmatter), $given_var
	// (passed at the call site), and $missing_var (nowhere).
	const partialWithSqlFence = {
		attributes: { frontmatter: 'passed_var: default\n' },
		children: [
			{
				type: 'fence',
				attributes: {
					language: 'sql',
					content: "select '{{ $passed_var }}', '{{ $given_var }}', '{{ $missing_var }}'"
				},
				children: []
			}
		]
	} as unknown as Node;

	it('warns on SQL-fence $vars that are neither in frontmatter nor passed', async () => {
		const { schema } = await import('./schema');
		const config: Config = {
			variables: {},
			partials: { my_partial: partialWithSqlFence }
		};
		const node: Node = {
			attributes: {
				file: 'my_partial',
				variables: { given_var: 'x' }
			}
		} as unknown as Node;

		const errors = schema.validate(node, config, mockContext);
		const warning = errors.find((e) => e.id === 'unresolved-partial-variable');
		expect(warning).toBeDefined();
		expect(warning?.level).toBe('warning');
		expect(warning?.message).toContain('$missing_var');
		expect(warning?.message).not.toContain('$passed_var');
		expect(warning?.message).not.toContain('$given_var');
	});

	it('does not warn when every SQL-fence $var is in scope', async () => {
		const { schema } = await import('./schema');
		const config: Config = {
			variables: {},
			partials: { my_partial: partialWithSqlFence }
		};
		const node: Node = {
			attributes: {
				file: 'my_partial',
				variables: { given_var: 'x', missing_var: 'y' }
			}
		} as unknown as Node;

		const errors = schema.validate(node, config, mockContext);
		expect(errors.find((e) => e.id === 'unresolved-partial-variable')).toBeUndefined();
	});

	it('never warns on $translations (inherited), but does warn on $user/$organization (not inherited)', async () => {
		const { schema } = await import('./schema');
		const partialWithTranslations = {
			attributes: {},
			children: [
				{
					type: 'fence',
					attributes: {
						language: 'sql',
						content: "select '{{ $translations.greeting }}', '{{ $user.email }}'"
					},
					children: []
				}
			]
		} as unknown as Node;
		const config: Config = {
			variables: {},
			partials: { my_partial: partialWithTranslations }
		};
		const node: Node = {
			attributes: { file: 'my_partial' }
		} as unknown as Node;

		const errors = schema.validate(node, config, mockContext);
		const warning = errors.find((e) => e.id === 'unresolved-partial-variable');
		// $translations is inherited into partial scope; $user is not —
		// createScopedConfig drops it, so it resolves to an empty string.
		expect(warning).toBeDefined();
		expect(warning?.message).toContain('$user.email');
		expect(warning?.message).not.toContain('$translations');
	});

	it('does not treat prototype properties (e.g. toString) as in-scope frontmatter variables', async () => {
		const { schema } = await import('./schema');
		const partialWithToString = {
			attributes: { frontmatter: 'passed_var: default\n' },
			children: [
				{
					type: 'fence',
					attributes: {
						language: 'sql',
						content: "select '{{ $toString }}'"
					},
					children: []
				}
			]
		} as unknown as Node;
		const config: Config = {
			variables: {},
			partials: { my_partial: partialWithToString }
		};
		const node: Node = {
			attributes: { file: 'my_partial' }
		} as unknown as Node;

		const errors = schema.validate(node, config, mockContext);
		const warning = errors.find((e) => e.id === 'unresolved-partial-variable');
		expect(warning).toBeDefined();
		expect(warning?.message).toContain('$toString');
	});

	it('does not warn when the partial has no SQL fences', async () => {
		const { schema } = await import('./schema');
		const plainPartial = {
			attributes: {},
			children: [{ type: 'text', attributes: { content: 'hello' }, children: [] }]
		} as unknown as Node;
		const config: Config = {
			variables: {},
			partials: { my_partial: plainPartial }
		};
		const node: Node = {
			attributes: { file: 'my_partial' }
		} as unknown as Node;

		const errors = schema.validate(node, config, mockContext);
		expect(errors.find((e) => e.id === 'unresolved-partial-variable')).toBeUndefined();
	});

	it("warns on undeclared $vars in a NESTED partial's SQL", async () => {
		const { schema } = await import('./schema');
		// outer includes inner, whose SQL uses $inner_ok (inner frontmatter),
		// $inner_given (passed at the nested call site), and $inner_missing (nowhere).
		const innerPartial = {
			attributes: { frontmatter: 'inner_ok: default\n' },
			children: [
				{
					type: 'fence',
					attributes: {
						language: 'sql',
						content: "select '{{ $inner_ok }}', '{{ $inner_given }}', '{{ $inner_missing }}'"
					},
					children: []
				}
			]
		} as unknown as Node;
		const outerPartial = {
			attributes: { frontmatter: 'outer_ok: default\n' },
			children: [
				{
					tag: 'partial',
					attributes: { file: 'inner_partial', variables: { inner_given: 'x' } },
					children: []
				}
			]
		} as unknown as Node;
		const config: Config = {
			variables: {},
			partials: { outer_partial: outerPartial, inner_partial: innerPartial }
		};
		const node: Node = {
			attributes: { file: 'outer_partial' }
		} as unknown as Node;

		const errors = schema.validate(node, config, mockContext);
		const warning = errors.find((e) => e.id === 'unresolved-partial-variable');
		expect(warning).toBeDefined();
		expect(warning?.message).toContain('$inner_missing');
		expect(warning?.message).not.toContain('$inner_ok');
		expect(warning?.message).not.toContain('$inner_given');
	});

	it('does not warn when every nested-partial $var is in the nested scope', async () => {
		const { schema } = await import('./schema');
		const innerPartial = {
			attributes: { frontmatter: 'inner_ok: default\n' },
			children: [
				{
					type: 'fence',
					attributes: {
						language: 'sql',
						content: "select '{{ $inner_ok }}', '{{ $inner_given }}'"
					},
					children: []
				}
			]
		} as unknown as Node;
		const outerPartial = {
			attributes: {},
			children: [
				{
					tag: 'partial',
					attributes: { file: 'inner_partial', variables: { inner_given: 'x' } },
					children: []
				}
			]
		} as unknown as Node;
		const config: Config = {
			variables: {},
			partials: { outer_partial: outerPartial, inner_partial: innerPartial }
		};
		const node: Node = {
			attributes: { file: 'outer_partial' }
		} as unknown as Node;

		const errors = schema.validate(node, config, mockContext);
		expect(errors.find((e) => e.id === 'unresolved-partial-variable')).toBeUndefined();
	});

	it("nested scope does NOT inherit the outer partial's variables", async () => {
		const { schema } = await import('./schema');
		// inner's SQL uses $outer_ok, which exists only in the OUTER partial's
		// frontmatter — createScopedConfig drops it in inner scope, so it must warn.
		const innerPartial = {
			attributes: {},
			children: [
				{
					type: 'fence',
					attributes: { language: 'sql', content: "select '{{ $outer_ok }}'" },
					children: []
				}
			]
		} as unknown as Node;
		const outerPartial = {
			attributes: { frontmatter: 'outer_ok: default\n' },
			children: [{ tag: 'partial', attributes: { file: 'inner_partial' }, children: [] }]
		} as unknown as Node;
		const config: Config = {
			variables: {},
			partials: { outer_partial: outerPartial, inner_partial: innerPartial }
		};
		const node: Node = {
			attributes: { file: 'outer_partial' }
		} as unknown as Node;

		const errors = schema.validate(node, config, mockContext);
		const warning = errors.find((e) => e.id === 'unresolved-partial-variable');
		expect(warning).toBeDefined();
		expect(warning?.message).toContain('$outer_ok');
	});

	it('does not infinitely recurse on circular partial references', async () => {
		const { schema } = await import('./schema');
		const partialA = {
			attributes: {},
			children: [
				{
					type: 'fence',
					attributes: { language: 'sql', content: "select '{{ $a_missing }}'" },
					children: []
				},
				{ tag: 'partial', attributes: { file: 'partial_b' }, children: [] }
			]
		} as unknown as Node;
		const partialB = {
			attributes: {},
			children: [{ tag: 'partial', attributes: { file: 'partial_a' }, children: [] }]
		} as unknown as Node;
		const config: Config = {
			variables: {},
			partials: { partial_a: partialA, partial_b: partialB }
		};
		const node: Node = {
			attributes: { file: 'partial_a' }
		} as unknown as Node;

		const errors = schema.validate(node, config, mockContext);
		const warning = errors.find((e) => e.id === 'unresolved-partial-variable');
		expect(warning).toBeDefined();
		expect(warning?.message).toContain('$a_missing');
	});

	it("re-validates a diamond partial at each call site's scope", async () => {
		const { schema } = await import('./schema');
		// shared is included twice with different passed variables: the first
		// call site passes $shared_var, the second does not — the second must warn.
		const sharedPartial = {
			attributes: {},
			children: [
				{
					type: 'fence',
					attributes: { language: 'sql', content: "select '{{ $shared_var }}'" },
					children: []
				}
			]
		} as unknown as Node;
		const outerPartial = {
			attributes: {},
			children: [
				{
					tag: 'partial',
					attributes: { file: 'shared_partial', variables: { shared_var: 'x' } },
					children: []
				},
				{ tag: 'partial', attributes: { file: 'shared_partial' }, children: [] }
			]
		} as unknown as Node;
		const config: Config = {
			variables: {},
			partials: { outer_partial: outerPartial, shared_partial: sharedPartial }
		};
		const node: Node = {
			attributes: { file: 'outer_partial' }
		} as unknown as Node;

		const errors = schema.validate(node, config, mockContext);
		const warning = errors.find((e) => e.id === 'unresolved-partial-variable');
		expect(warning).toBeDefined();
		expect(warning?.message).toContain('$shared_var');
	});
});

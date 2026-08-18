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

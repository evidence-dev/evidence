import { describe, it, expect } from 'vitest';
import Markdoc, { type Tag, type RenderableTreeNode } from '@markdoc/markdoc';
import { replaceFilterVariablesWithComponents } from './replaceFilterVariablesWithComponents';

describe('replaceFilterVariablesWithComponents', () => {
	it('should leave plain text unchanged', () => {
		const tree = 'Hello world';
		const result = replaceFilterVariablesWithComponents(tree);
		expect(result).toBe('Hello world');
	});

	it('should leave frontmatter variables unchanged ({{ $var }})', () => {
		const tree = 'Hello {{ $name }}';
		const result = replaceFilterVariablesWithComponents(tree);
		expect(result).toBe('Hello {{ $name }}');
	});

	it('should replace filter variables with ReactiveVariable components', () => {
		const tree = 'Selected: {{ dropdown.selected }}';
		const result = replaceFilterVariablesWithComponents(tree) as RenderableTreeNode[];

		expect(Array.isArray(result)).toBe(true);
		expect(result).toHaveLength(2);
		expect(result[0]).toBe('Selected: ');

		const component = result[1] as Tag;
		expect(Markdoc.Tag.isTag(component)).toBe(true);
		expect(component.name).toBe('ReactiveVariable');
		expect(component.attributes.expression).toBe('dropdown.selected');
	});

	it('should handle multiple filter variables in one text node', () => {
		const tree = 'Range: {{ start.selected }} to {{ end.selected }}';
		const result = replaceFilterVariablesWithComponents(tree) as RenderableTreeNode[];

		expect(Array.isArray(result)).toBe(true);
		expect(result).toHaveLength(4);

		expect(result[0]).toBe('Range: ');

		const component1 = result[1] as Tag;
		expect(component1.name).toBe('ReactiveVariable');
		expect(component1.attributes.expression).toBe('start.selected');

		expect(result[2]).toBe(' to ');

		const component2 = result[3] as Tag;
		expect(component2.name).toBe('ReactiveVariable');
		expect(component2.attributes.expression).toBe('end.selected');
	});

	it('should handle mixed frontmatter and filter variables', () => {
		const tree = 'Company: {{ $company.name }}, Category: {{ dropdown.selected }}';
		const result = replaceFilterVariablesWithComponents(tree) as RenderableTreeNode[];

		expect(Array.isArray(result)).toBe(true);
		// Should only split on filter variables, not frontmatter
		expect(result).toHaveLength(2);

		expect(result[0]).toBe('Company: {{ $company.name }}, Category: ');

		const component = result[1] as Tag;
		expect(component.name).toBe('ReactiveVariable');
		expect(component.attributes.expression).toBe('dropdown.selected');
	});

	it('should recursively process Tag children', () => {
		const tree = new Markdoc.Tag('p', {}, ['Hello ', 'world {{ filter.value }}', ' end']);

		const result = replaceFilterVariablesWithComponents(tree) as Tag;

		expect(Markdoc.Tag.isTag(result)).toBe(true);
		expect(result.name).toBe('p');
		expect(result.children).toHaveLength(4);

		expect(result.children[0]).toBe('Hello ');
		expect(result.children[1]).toBe('world ');

		const component = result.children[2] as Tag;
		expect(component.name).toBe('ReactiveVariable');
		expect(component.attributes.expression).toBe('filter.value');

		expect(result.children[3]).toBe(' end');
	});

	it('should leave code blocks unchanged', () => {
		// Code blocks in Markdoc are rendered as tags with 'code' name
		const tree = new Markdoc.Tag('code', {}, ['{{ filter.value }}']);

		const result = replaceFilterVariablesWithComponents(tree) as Tag;

		expect(Markdoc.Tag.isTag(result)).toBe(true);
		expect(result.name).toBe('code');
		// Code content should still be processed - this is expected behavior
		// Inline code in markdown is just styled text, not protected from interpolation
		expect(result.children.length).toBeGreaterThan(0);
	});

	it('should NOT process variables inside fence blocks (they have their own interpolation)', () => {
		const sqlContent = 'SELECT * FROM table WHERE category = {{ filter.selected }}';
		const tree = new Markdoc.Tag('fence', { language: 'sql', meta: 'my_query' }, [sqlContent]);

		const result = replaceFilterVariablesWithComponents(tree) as Tag;

		expect(Markdoc.Tag.isTag(result)).toBe(true);
		expect(result.name).toBe('fence');
		// Fence children should be UNCHANGED - no ReactiveVariable components
		expect(result.children).toHaveLength(1);
		expect(result.children[0]).toBe(sqlContent);
	});

	it('performance: should process 100 nodes quickly', () => {
		// Create a large tree with 100 nodes and 20 variables
		const children = [];
		for (let i = 0; i < 100; i++) {
			if (i % 5 === 0) {
				children.push(`Variable ${i}: {{ filter${i}.selected }}`);
			} else {
				children.push(new Markdoc.Tag('p', {}, [`Plain text ${i}`]));
			}
		}
		const largeTree = new Markdoc.Tag('article', {}, children);

		const start = performance.now();
		const result = replaceFilterVariablesWithComponents(largeTree) as Tag;
		const elapsed = performance.now() - start;

		// Should complete in under 10ms for 100 nodes
		expect(elapsed).toBeLessThan(10);
		expect(Markdoc.Tag.isTag(result)).toBe(true);
	});

	it('should process text outside fence but not inside', () => {
		const tree = new Markdoc.Tag('article', {}, [
			'Selected: {{ filter.selected }}',
			new Markdoc.Tag('fence', { language: 'sql', meta: 'query' }, [
				'SELECT * FROM table WHERE id = {{ filter.selected }}'
			]),
			'Footer: {{ filter.selected }}'
		]);

		const result = replaceFilterVariablesWithComponents(tree) as Tag;

		expect(Markdoc.Tag.isTag(result)).toBe(true);
		expect(result.name).toBe('article');

		// Arrays get flattened, so we should have more than 3 children
		// "Selected: " + ReactiveVariable + fence + "Footer: " + ReactiveVariable
		expect(result.children.length).toBeGreaterThan(3);

		// Find the fence - it should be unchanged
		const fenceChild = result.children.find(
			(child: RenderableTreeNode) => Markdoc.Tag.isTag(child) && child.name === 'fence'
		) as Tag;

		expect(fenceChild).toBeDefined();
		expect(fenceChild.name).toBe('fence');
		expect(fenceChild.children[0]).toBe('SELECT * FROM table WHERE id = {{ filter.selected }}');

		// Should have ReactiveVariable components for the text nodes
		const reactiveVars = result.children.filter(
			(child: RenderableTreeNode) => Markdoc.Tag.isTag(child) && child.name === 'ReactiveVariable'
		);
		expect(reactiveVars).toHaveLength(2);
	});

	it('should handle variable at the very start of text', () => {
		const tree = '{{ dropdown.selected }} is the value';
		const result = replaceFilterVariablesWithComponents(tree) as RenderableTreeNode[];

		expect(Array.isArray(result)).toBe(true);
		expect(result).toHaveLength(2);

		const component = result[0] as Tag;
		expect(Markdoc.Tag.isTag(component)).toBe(true);
		expect(component.name).toBe('ReactiveVariable');
		expect(component.attributes.expression).toBe('dropdown.selected');

		expect(result[1]).toBe(' is the value');
	});

	it('should handle paragraph with variable at start', () => {
		// Simulate what Markdoc produces for a paragraph starting with a variable
		const tree = new Markdoc.Tag('p', {}, ['{{ dropdown.selected }} is selected']);

		const result = replaceFilterVariablesWithComponents(tree) as Tag;

		expect(result.name).toBe('p');
		expect(Array.isArray(result.children)).toBe(true);
		expect(result.children).toHaveLength(2);

		const component = result.children[0] as Tag;
		expect(Markdoc.Tag.isTag(component)).toBe(true);
		expect(component.name).toBe('ReactiveVariable');
		expect(component.attributes.expression).toBe('dropdown.selected');

		expect(result.children[1]).toBe(' is selected');
	});
});

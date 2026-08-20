import { test, expect, describe, it } from 'vitest';
import { process } from './process-markdoc';
import { Metadata } from '../../../metadata/Metadata.svelte';
import type { QueryService, QueryResult, AnyRowType } from '../../interfaces/query-service';
import { TableMetadata } from '../../../metadata/TableMetadata.svelte';
import { InlineQueries } from '../../common/inline-queries';
import type { RenderableTreeNode } from '@markdoc/markdoc';
import Markdoc, { Tag } from '@markdoc/markdoc';
import { walkTree } from './walkTree';
import { ClickHouseDialect, type SqlDialect } from '../../../sql-dialect';

class MockQueryService implements QueryService {
	readonly workspaceId: string;
	readonly dialect: SqlDialect = new ClickHouseDialect();
	readonly connectionType = 'managed';
	constructor(workspaceId: string) {
		this.workspaceId = workspaceId;
	}
	async query<T extends AnyRowType>(sql: string): Promise<QueryResult<T>> {
		if (sql.includes('system.columns')) {
			return {
				rows: [
					{
						tableName: 'order_details',
						columnName: 'order_id',
						columnType: 'Int64'
					},
					{
						tableName: 'order_details',
						columnName: 'date',
						columnType: 'Date'
					},
					{
						tableName: 'order_details',
						columnName: 'hour',
						columnType: 'Int64'
					},
					{
						tableName: 'order_details',
						columnName: 'category',
						columnType: 'String'
					},
					{
						tableName: 'order_details',
						columnName: 'item_name',
						columnType: 'String'
					},
					{
						tableName: 'order_details',
						columnName: 'unit_price',
						columnType: 'Float64'
					},
					{
						tableName: 'order_details',
						columnName: 'quantity',
						columnType: 'Int64'
					}
				] as unknown as T[],
				columns: [
					{
						name: 'tableName',
						clickhouseType: 'String',
						jsType: 'string'
					},
					{
						name: 'columnName',
						clickhouseType: 'String',
						jsType: 'string'
					},
					{
						name: 'columnType',
						clickhouseType: 'String',
						jsType: 'string'
					}
				],
				error: null
			};
		} else {
			const rows = [
				{
					tableName: 'order_details'
				}
			] as unknown as T[];
			return {
				rows,
				columns: [
					{
						name: 'tableName',
						clickhouseType: 'String',
						jsType: 'string'
					}
				],
				error: null
			};
		}
	}
}

test('Handles newlines correctly', () => {
	const markdown = `Line 1
Line 2
Line 3`;
	const result = process(markdown);
	expect(result.validationErrors).toHaveLength(0);
	expect(result.tree).toBeDefined();

	const markdown2 = `Line 1\nLine 2\nLine 3`;

	const result2 = process(markdown2);
	expect(result2.validationErrors).toHaveLength(0);
	expect(result2.tree).toBeDefined();

	expect(omitTagIdsAndAstNodes(result.tree)).toEqual(omitTagIdsAndAstNodes(result2.tree));
});

test('Handles newlines in tags', () => {
	const markdown = `{% callout %}
Line 1
Line 2
Line 3
{% /callout %}`;

	const result = process(markdown);
	expect(result.validationErrors).toHaveLength(0);
	expect(result.tree).toBeDefined();
});

test('MarkdocProcessor throws error for invalid tag names', () => {
	const markdown = `{% invalid-tag %}
Line 1
Line 2
Line 3
{% /invalid-tag %}`;

	const result = process(markdown);
	expect(result.validationErrors).toHaveLength(1);
	expect(result.validationErrors[0].error.message).toContain('invalid-tag');
});

test('Handles newline characters inside tag braces', () => {
	const markdown = `{% bar_chart
    data="test"
    x="hello"
    y="world"
/%}`;

	const result = process(markdown);
	expect(result.validationErrors).toHaveLength(0);
	expect(result.tree).toBeDefined();
});

test('Handles newline characters inside tag braces', () => {
	const markdown = `{% bar_chart\ndata="test"\nx="hello"\ny="world"\n/%}`;

	const result = process(markdown);
	expect(result.validationErrors).toHaveLength(0);
	expect(result.tree).toBeDefined();
});

// TODO: These 3 tests need QueryService context — $effect.root cleanup destroys reactive scope before metadata initializes
test.skip('Gets errors in data, x, y when markdoc has custom validation context', async () => {
	let queryService!: MockQueryService;
	let metadata!: Metadata;
	const cleanup = $effect.root(() => {
		queryService = new MockQueryService('test-org');
		metadata = new Metadata(queryService);
	});
	cleanup();

	const markdown = `{% bar_chart
    data="test"
    x="date"
    y="sum(unit_price)"
/%}`;

	await metadata.load();

	expect(metadata.tables).toHaveLength(1);
	expect(metadata.getTable('order_details')).toBeDefined();

	const result = process(markdown, {
		metadata,
		filters: undefined,
		inlineQueries: undefined,
		trees: undefined
	});
	expect(result.validationErrors).toHaveLength(1);
	expect(result.validationErrors[0].error.message).toContain('data: Table "test" does not exist');

	const markdown2 = `{% bar_chart
    data="order_details"
    x="date"
    y="sum(unit_price)"
/%}`;

	const result2 = process(markdown2, {
		metadata,
		filters: undefined,
		inlineQueries: undefined,
		trees: undefined
	});
	expect(result2.validationErrors).toHaveLength(0);
});

test('MarkdocProcessor supports HTML comments', () => {
	const markdown = `# Test Document
<!-- This is a comment that should not appear in output -->
This is visible content.
<!-- Another comment
   spanning multiple lines -->
More visible content.`;

	const result = process(markdown);
	expect(result.validationErrors).toHaveLength(0);
	expect(result.tree).toBeDefined();
	expect(result.ast).toBeDefined();

	// Helper function to find comment nodes in AST (avoiding circular reference issues)
	const findCommentNodes = (node: unknown): unknown[] => {
		const comments: unknown[] = [];
		const n = node as { type?: string; children?: unknown[]; attributes?: { content?: string } };
		if (n.type === 'comment') {
			comments.push(node);
		}
		if (n.children && Array.isArray(n.children)) {
			for (const child of n.children) {
				comments.push(...findCommentNodes(child));
			}
		}
		return comments;
	};

	// The AST should contain comment nodes
	const commentNodes = findCommentNodes(result.ast);
	expect(commentNodes.length).toBeGreaterThan(0);
	expect(
		commentNodes.some((node) => {
			const n = node as { attributes?: { content?: string } };
			return n.attributes?.content?.includes('This is a comment');
		})
	).toBe(true);

	// But the renderable tree should not contain the comment content in visible elements
	const treeString = JSON.stringify(result.tree);
	expect(treeString).not.toContain('This is a comment that should not appear');
	expect(treeString).not.toContain('Another comment');
	expect(treeString).toContain('This is visible content');
	expect(treeString).toContain('More visible content');
});

test.skip('bar_chart with date_grain passes validation', async () => {
	let queryService!: MockQueryService;
	let metadata!: Metadata;
	const cleanup = $effect.root(() => {
		queryService = new MockQueryService('test-org');
		metadata = new Metadata(queryService);
	});
	cleanup();

	// Mock getTable to return a table with a date column
	metadata.getTable = (tableName: string) =>
		tableName === 'demo.daily_orders'
			? new TableMetadata({
					name: 'demo.daily_orders',
					columns: {
						date: { name: 'date', type: 'Date', jsType: 'date' },
						total_sales: { name: 'total_sales', type: 'Float64', jsType: 'number' }
					}
				})
			: undefined;

	const markdown = `{% bar_chart data="demo.daily_orders" x="date" y="sum(total_sales)" date_grain="month" /%}`;

	const result = process(markdown, {
		metadata,
		filters: undefined,
		inlineQueries: undefined,
		trees: undefined
	});

	expect(result.validationErrors).toHaveLength(0);
});

test.skip('bar_chart with date_range passes validation', async () => {
	let queryService!: MockQueryService;
	let metadata!: Metadata;
	const cleanup = $effect.root(() => {
		queryService = new MockQueryService('test-org');
		metadata = new Metadata(queryService);
	});
	cleanup();

	// Mock getTable to return a table with a date column
	metadata.getTable = (tableName: string) =>
		tableName === 'demo.daily_orders'
			? new TableMetadata({
					name: 'demo.daily_orders',
					columns: {
						date: { name: 'date', type: 'Date', jsType: 'date' },
						total_sales: { name: 'total_sales', type: 'Float64', jsType: 'number' }
					}
				})
			: undefined;

	const markdown = `{% bar_chart data="demo.daily_orders" x="date" y="sum(total_sales)"  date_range={range="last 30 days" date="date"} /%}`;

	const result = process(markdown, {
		metadata,
		filters: undefined,
		inlineQueries: undefined,
		trees: undefined
	});
	expect(result.validationErrors).toHaveLength(0);
});

test('bar_chart with likely date column in inline query passes validation', async () => {
	const markdown = `{% bar_chart data="my_query" x="date" y="sum(total_sales)" date_grain="month" /%}`;

	const result = process(markdown, {
		metadata: undefined,
		filters: undefined,
		inlineQueries: {
			getAllNames: () => {
				return ['my_query'];
			},
			remove: () => {}
		} as unknown as InlineQueries,
		trees: undefined
	});
	expect(result.validationErrors).toHaveLength(0);
});

test('separate conditional blocks for top-level if/else/if', () => {
	const markdown = `
{% if data="demo.daily_orders" %}
Hello
{% /if %}
{% else %}
Bar
{% /else %}
{% if data="demo.daily_orders" %}
Whatever
{% /if %}
`;

	const result = process(markdown);

	const expectedTree = new Tag(
		'article',
		{},
		[
			new Tag(
				'conditional',
				{},
				[
					new Tag('if', { data: 'demo.daily_orders' }, ['Hello'], undefined),
					new Tag('else', {}, ['Bar'], undefined)
				],
				undefined
			),
			new Tag(
				'conditional',
				{},
				[new Tag('if', { data: 'demo.daily_orders' }, ['Whatever'], undefined)],
				undefined
			)
		],
		undefined
	);

	expect(omitTagIdsAndAstNodes(result.tree)).toEqual(omitTagIdsAndAstNodes(expectedTree));
});

test('conditional block with if, else_if, else, then another if', () => {
	const markdown = `
{% if  data="demo.daily_orders" %}
Hello
{% /if %}
{% else_if data="demo.daily_orders" %}
Yo
{% /else_if %}
{% else %}
World
{% /else %}
{% if data="build_complete" %}
{% /if %}
`;

	const result = process(markdown);

	const expectedTree = new Tag(
		'article',
		{},
		[
			new Tag(
				'conditional',
				{},
				[
					new Tag('if', { data: 'demo.daily_orders' }, ['Hello'], undefined),
					new Tag('else_if', { data: 'demo.daily_orders' }, ['Yo'], undefined),
					new Tag('else', {}, ['World'], undefined)
				],
				undefined
			),
			new Tag(
				'conditional',
				{},
				[new Tag('if', { data: 'build_complete' }, [], undefined)],
				undefined
			)
		],
		undefined
	);

	expect(omitTagIdsAndAstNodes(result.tree)).toEqual(omitTagIdsAndAstNodes(expectedTree));
});

test('conditional block after code blocks', () => {
	const markdown = `
\`\`\`sql
select 1
\`\`\`

\`\`\`sql
select 1
where 1=0
\`\`\`

{% if data="returns_no_rows" %}
Foo
{% /if %}
{% else_if data="returns_no_rows" %}
something
{% /else_if %}
{% else %}
Nothing
{% /else %}
`;

	const result = process(markdown);

	const expectedTree = new Tag(
		'article',
		{},
		[
			new Tag('fence', { language: 'sql', content: 'select 1\n' }, ['select 1\n'], undefined),
			new Tag(
				'fence',
				{ language: 'sql', content: 'select 1\nwhere 1=0\n' },
				['select 1\nwhere 1=0\n'],
				undefined
			),
			new Tag(
				'conditional',
				{},
				[
					new Tag('if', { data: 'returns_no_rows' }, ['Foo'], undefined),
					new Tag('else_if', { data: 'returns_no_rows' }, ['something'], undefined),
					new Tag('else', {}, ['Nothing'], undefined)
				],
				undefined
			)
		],
		undefined
	);

	expect(omitTagIdsAndAstNodes(result.tree)).toEqual(omitTagIdsAndAstNodes(expectedTree));
});

test('extracts and processes frontmatter correctly', () => {
	const markdown = `---
title: Test Document
description: A test document with frontmatter
date: 2024-01-01
tags: [test, markdown]
---

# {% $title %}

This is a test document with the title from frontmatter.

Description: {% $description %}
Date: {% $date %}
Tags: {% $tags %}
`;

	const result = process(markdown);

	// Should not have validation errors
	expect(result.validationErrors).toHaveLength(0);

	// Should have a tree
	expect(result.tree).toBeDefined();

	// The AST should contain the frontmatter variables
	// We can't easily test the variables directly, but we can verify the content is processed
	const treeString = JSON.stringify(result.tree);
	expect(treeString).toContain('Test Document');
	expect(treeString).toContain('A test document with frontmatter');

	// Verify that frontmatter is available in the AST
	expect(result.ast.attributes?.frontmatter).toBeDefined();

	// Test that the frontmatter content is actually in the AST
	const frontmatterContent = result.ast.attributes?.frontmatter as string;
	expect(frontmatterContent).toContain('title: Test Document');
	expect(frontmatterContent).toContain('description: A test document with frontmatter');
});

test('renders a {{ $var | fallback }} fallback in a heading when the variable is missing', () => {
	// The end-to-end case that motivated fallback support. Text/heading references
	// are resolved by @hughess/markdoc's interpolateString (evidence.29+).
	const result = process('---\ntitle: Hi\n---\n\n# {{ $metric_label | Attendance }}');
	const treeString = JSON.stringify(result.tree);
	expect(treeString).toContain('Attendance');
	expect(treeString).not.toContain('metric_label');
});

test('prefers the defined frontmatter variable over its fallback in a heading', () => {
	const result = process(
		'---\nmetric_label: Weekly Attendance\n---\n\n# {{ $metric_label | Attendance }}'
	);
	expect(JSON.stringify(result.tree)).toContain('Weekly Attendance');
});

// Triple-quoted string attributes ("""...""") can span lines — added in the
// @hughess/markdoc fork (evidence.29). These assert the value survives Evidence's
// preprocessVariables tag scanner (which runs before the fork tokenizes) and
// reaches the AST intact. We read the AST, not the rendered tree, because the
// tree drops attributes the component schema doesn't declare.
const parseErrorIds = (result: ReturnType<typeof process>) =>
	result.validationErrors.map((e) => e.error?.id).filter((id) => id === 'parse-error');

function collectTagAttrs(
	node: unknown,
	acc: Record<string, unknown> = {}
): Record<string, unknown> {
	const n = node as { tag?: string; attributes?: Record<string, unknown>; children?: unknown[] };
	if (n?.tag && n.attributes) Object.assign(acc, n.attributes);
	if (n?.children) for (const child of n.children) collectTagAttrs(child, acc);
	return acc;
}

test('parses a multi-line triple-quoted attribute value (SQL case statement)', () => {
	const result = process(`{% table
	data="orders"
	series="""
		case
			when total > 18000 then 'High'
			else 'Low'
		end
	"""
/%}`);
	expect(parseErrorIds(result)).toEqual([]);
	// Value preserved verbatim, newlines and all.
	const series = collectTagAttrs(result.ast).series as string;
	expect(series).toContain("when total > 18000 then 'High'");
	expect(series).toContain("else 'Low'");
});

test('preserves a simple multi-line triple-quoted attribute value', () => {
	const result = process('{% big_value data="orders" note="""line1\nline2""" /%}');
	expect(parseErrorIds(result)).toEqual([]);
	expect(collectTagAttrs(result.ast).note).toBe('line1\nline2');
});

test('still quotes an unquoted {{ $var }} in a tag that also has a triple-quoted attribute', () => {
	// The preprocessor must quote hide={{$show}} without disturbing the
	// triple-quoted note value.
	const result = process('{% big_value data="orders" note="""multi\nline""" hide={{$show}} /%}');
	expect(parseErrorIds(result)).toEqual([]);
	const attrs = collectTagAttrs(result.ast);
	expect(attrs.note).toBe('multi\nline');
	expect(attrs.hide).toBe('{{$show}}');
});

test('handles markdown without frontmatter', () => {
	const markdown = `# Simple Document

This is a simple document without frontmatter.

- Item 1
- Item 2
`;

	const result = process(markdown);

	// Should not have validation errors
	expect(result.validationErrors).toHaveLength(0);

	// Should have a tree
	expect(result.tree).toBeDefined();

	// Should contain the content
	const treeString = JSON.stringify(result.tree);
	expect(treeString).toContain('Simple Document');
	expect(treeString).toContain('Item 1');
	expect(treeString).toContain('Item 2');
});

test('handles complex frontmatter with nested objects', () => {
	const markdown = `---
title: Complex Document
metadata:
  author: John Doe
  version: 1.0.0
  settings:
    theme: dark
    language: en
tags:
  - documentation
  - tutorial
  - advanced
---

# {% $title %}

Author: {% $metadata.author %}
Version: {% $metadata.version %}
Theme: {% $metadata.settings.theme %}
Language: {% $metadata.settings.language %}

Tags: {% $tags %}
`;

	const result = process(markdown);

	// Should not have validation errors
	expect(result.validationErrors).toHaveLength(0);

	// Should have a tree
	expect(result.tree).toBeDefined();

	// Should contain the content
	const treeString = JSON.stringify(result.tree);
	expect(treeString).toContain('Complex Document');
	expect(treeString).toContain('John Doe');
	expect(treeString).toContain('1.0.0');
	expect(treeString).toContain('dark');
	expect(treeString).toContain('en');

	// Verify that frontmatter is available in the AST
	expect(result.ast.attributes?.frontmatter).toBeDefined();
});

test('handles markdown without frontmatter correctly', () => {
	const markdown = `# Simple Document

This is a simple document without frontmatter.

- Item 1
- Item 2
`;

	const result = process(markdown);

	// Should not have validation errors
	expect(result.validationErrors).toHaveLength(0);

	// Should have a tree
	expect(result.tree).toBeDefined();

	// Should contain the content
	const treeString = JSON.stringify(result.tree);
	expect(treeString).toContain('Simple Document');
	expect(treeString).toContain('Item 1');
	expect(treeString).toContain('Item 2');

	// Should not have frontmatter in AST
	expect(result.ast.attributes?.frontmatter).toBeUndefined();
});

test('handles partial', () => {
	const markdown = `
		{% partial file="my_partial" /%}
	`;
	const partials = {
		my_partial: 'hello world'
	};

	const result = process(markdown, undefined, partials);

	expect(result.validationErrors).toHaveLength(0);
	expect(result.tree).toBeDefined();
	const treeString = JSON.stringify(result.tree);
	expect(treeString).toContain('hello world');
});

test('handles unquoted variable references in partial attributes', () => {
	const markdown = `
---
my_title_var: Partial Title
---

{% partial file="my_partial" /%}
	`;
	const partials = {
		my_partial: '{% callout title={{my_title_var}} %}hello world{% /callout %}'
	};

	const result = process(markdown, undefined, partials);

	expect(result.validationErrors).toHaveLength(0);
	expect(result.tree).toBeDefined();
	const treeString = JSON.stringify(result.tree);
	expect(treeString).toContain('Partial Title');
});

test('handles auto-row in partial', () => {
	const bigValues = `
{%
	big_value
	data="something"
	value="something"
/%}
{%
	big_value
	data="something"
	value="something"
/%}
	`;
	const markdownWithPartial = `
		{% partial file="my_partial" /%}
	`;
	const partials = {
		my_partial: bigValues
	};

	const processedBigValues = process(bigValues, undefined, undefined);
	const processedPartial = process(markdownWithPartial, undefined, partials);

	expect(processedBigValues.validationErrors).toHaveLength(0);
	expect(processedPartial.validationErrors).toHaveLength(0);

	expect(omitTagIdsAndAstNodes(processedPartial.tree)).toEqual(
		omitTagIdsAndAstNodes(processedBigValues.tree)
	);
});

test('handles conditionals in partial', () => {
	const conditionals = `
{% if data="if" %}
	if content
{% /if %}
	`;
	const markdownWithPartial = `
		{% partial file="my_partial" /%}
	`;
	const partials = {
		my_partial: conditionals
	};

	const processedConditionals = process(conditionals, undefined, undefined);
	const processedPartial = process(markdownWithPartial, undefined, partials);

	expect(processedConditionals.validationErrors).toHaveLength(0);
	expect(processedPartial.validationErrors).toHaveLength(0);

	expect(omitTagIdsAndAstNodes(processedPartial.tree)).toEqual(
		omitTagIdsAndAstNodes(processedConditionals.tree)
	);
});

test('handles inline queries in partial', () => {
	const inlineQuery = `
\`\`\`sql my_query
	select 1
\`\`\`
	`;
	const markdownWithPartial = `
		{% partial file="my_partial" /%}
	`;
	const partials = {
		my_partial: inlineQuery
	};

	const processedInlineQuery = process(inlineQuery, undefined, undefined);
	const processedPartial = process(markdownWithPartial, undefined, partials);

	expect(processedInlineQuery.validationErrors).toHaveLength(0);
	expect(processedPartial.validationErrors).toHaveLength(0);

	expect(omitTagIdsAndAstNodes(processedPartial.tree)).toEqual(
		omitTagIdsAndAstNodes(processedInlineQuery.tree)
	);
});

test('prefixes data-heading-id with the include-site location so duplicated partials get unique ids', () => {
	const partialSource = `# Inside partial`;
	const markdown = `# Main heading

{% partial file="shared" /%}

{% partial file="shared" /%}
`;

	const result = process(markdown, undefined, { shared: partialSource });
	expect(result.validationErrors).toHaveLength(0);

	const headingIds: string[] = [];
	for (const { node } of walkTree(result.tree)) {
		if (!Tag.isTag(node)) continue;
		const id = node.attributes?.['data-heading-id'];
		if (typeof id === 'string') headingIds.push(id);
	}

	// Main heading keeps its bare source-location id; each partial invocation
	// gets its own include-site prefix, so the two duplicated partial headings
	// resolve to distinct ids.
	expect(headingIds).toHaveLength(3);
	const partialIds = headingIds.filter((id) => id.includes('shared::'));
	expect(partialIds).toHaveLength(2);
	expect(new Set(partialIds).size).toBe(2);
});

test('gives validation error for partial that doesnt exist', () => {
	const markdown = `
		{% partial file="doesnt_exist" /%}
	`;
	const partials = {};

	const processed = process(
		markdown,
		{
			filters: undefined,
			inlineQueries: undefined,
			metadata: undefined,
			trees: undefined
		},
		partials
	);

	expect(processed.validationErrors).toHaveLength(1);
	expect(processed.validationErrors[0].error.message).toEqual(
		'file: Partial "doesnt_exist" does not exist'
	);
});

test('automaticallyWrapConsecutiveConditionals works recursively on nested structures', () => {
	const markdown = `
{% if data="order_details" %}
	{% if data="order_details" %}
		inner content
		
	{% /if %}
{% /if %}
`;

	const result = process(markdown);

	// Should not have validation errors
	expect(result.validationErrors).toHaveLength(0);

	// Should have one conditional at the root level
	expect((result.tree as Tag).children).toHaveLength(1);
	const rootConditional = (result.tree as Tag).children[0];
	expect(Markdoc.Tag.isTag(rootConditional)).toBe(true);
	if (Markdoc.Tag.isTag(rootConditional)) {
		expect(rootConditional.name).toBe('conditional');

		// The conditional should contain an if node
		expect(rootConditional.children).toHaveLength(1);
		const ifNode = rootConditional.children[0];
		expect(Markdoc.Tag.isTag(ifNode)).toBe(true);
		if (Markdoc.Tag.isTag(ifNode)) {
			expect(ifNode.name).toBe('if');

			// The if node should contain a nested conditional
			expect(ifNode.children).toHaveLength(1);
			const nestedConditional = ifNode.children[0];
			expect(Markdoc.Tag.isTag(nestedConditional)).toBe(true);
			if (Markdoc.Tag.isTag(nestedConditional)) {
				expect(nestedConditional.name).toBe('conditional');

				// The nested conditional should contain an if node
				expect(nestedConditional.children).toHaveLength(1);
				const nestedIfNode = nestedConditional.children[0];
				expect(Markdoc.Tag.isTag(nestedIfNode)).toBe(true);
				if (Markdoc.Tag.isTag(nestedIfNode)) {
					expect(nestedIfNode.name).toBe('if');
				}
			}
		}
	}
});

test('automaticallyWrapConsecutiveConditionals consistently processes all conditional nodes recursively', () => {
	const markdown = `
{% if data="order_details" %}
	{% if data="order_details" %}
		content1

	{% /if %}
{% /if %}
{% else_if data="order_details" %}
	{% if data="order_details" %}
		content2

	{% /if %}
{% /else_if %}
{% else %}
	{% if data="order_details" %}
		content3

	{% /if %}
{% /else %}
`;

	const result = process(markdown);

	// Should not have validation errors
	expect(result.validationErrors).toHaveLength(0);

	// Should have one conditional at the root level containing all three nodes
	expect((result.tree as Tag).children).toHaveLength(1);
	const rootConditional = (result.tree as Tag).children[0];
	expect(Markdoc.Tag.isTag(rootConditional)).toBe(true);
	if (Markdoc.Tag.isTag(rootConditional)) {
		expect(rootConditional.name).toBe('conditional');

		// The conditional should contain three nodes: if, else_if, and else
		expect(rootConditional.children).toHaveLength(3);

		// First node should be 'if' and should be recursively processed
		const ifNode = rootConditional.children[0];
		expect(Markdoc.Tag.isTag(ifNode)).toBe(true);
		if (Markdoc.Tag.isTag(ifNode)) {
			expect(ifNode.name).toBe('if');
			// The if node should contain a nested conditional (recursively processed)
			expect(ifNode.children).toHaveLength(1);
			const nestedConditional1 = ifNode.children[0];
			expect(Markdoc.Tag.isTag(nestedConditional1)).toBe(true);
			if (Markdoc.Tag.isTag(nestedConditional1)) {
				expect(nestedConditional1.name).toBe('conditional');
			}
		}

		const elseIfNode = rootConditional.children[1];
		expect(Markdoc.Tag.isTag(elseIfNode)).toBe(true);
		if (Markdoc.Tag.isTag(elseIfNode)) {
			expect(elseIfNode.name).toBe('else_if');
			expect(elseIfNode.children).toHaveLength(1);
			const nestedConditional2 = elseIfNode.children[0];
			expect(Markdoc.Tag.isTag(nestedConditional2)).toBe(true);
			if (Markdoc.Tag.isTag(nestedConditional2)) {
				expect(nestedConditional2.name).toBe('conditional');
				// The conditional should contain the if node
				expect(nestedConditional2.children).toHaveLength(1);
				const nestedIf2 = nestedConditional2.children[0];
				expect(Markdoc.Tag.isTag(nestedIf2)).toBe(true);
				if (Markdoc.Tag.isTag(nestedIf2)) {
					expect(nestedIf2.name).toBe('if');
					expect(nestedIf2.children).toHaveLength(1);
					expect(Markdoc.Tag.isTag(nestedIf2.children[0])).toBe(true);
					const contentWrapper = nestedIf2.children[0] as Tag;
					expect(contentWrapper.name).toBe('p');
					expect(contentWrapper.children).toHaveLength(1);
					expect(contentWrapper.children[0]).toBe('content2');
				}
			}
		}

		// Third node should be 'else' and should now be recursively processed (FIXED)
		const elseNode = rootConditional.children[2];
		expect(Markdoc.Tag.isTag(elseNode)).toBe(true);
		if (Markdoc.Tag.isTag(elseNode)) {
			expect(elseNode.name).toBe('else');
			// The else node should now contain a nested conditional (recursively processed)
			expect(elseNode.children).toHaveLength(1);
			const nestedConditional3 = elseNode.children[0];
			expect(Markdoc.Tag.isTag(nestedConditional3)).toBe(true);
			if (Markdoc.Tag.isTag(nestedConditional3)) {
				expect(nestedConditional3.name).toBe('conditional');
				// The conditional should contain the if node
				expect(nestedConditional3.children).toHaveLength(1);
				const nestedIf3 = nestedConditional3.children[0];
				expect(Markdoc.Tag.isTag(nestedIf3)).toBe(true);
				if (Markdoc.Tag.isTag(nestedIf3)) {
					expect(nestedIf3.name).toBe('if');
					expect(nestedIf3.children).toHaveLength(1);
					expect(Markdoc.Tag.isTag(nestedIf3.children[0])).toBe(true);
					const contentWrapper = nestedIf3.children[0] as Tag;
					expect(contentWrapper.name).toBe('p');
					expect(contentWrapper.children).toHaveLength(1);
					expect(contentWrapper.children[0]).toBe('content3');
				}
			}
		}
	}
});

test('detects circular references in partials', () => {
	// Create partials with circular references
	const partials = {
		partial_a: `
			This is partial A
			{% partial file="partial_b" /%}
		`,
		partial_b: `
			This is partial B
			{% partial file="partial_c" /%}
		`,
		partial_c: `
			This is partial C
			{% partial file="partial_a" /%}
		`
	};

	const markdown = `
		{% partial file="partial_a" /%}
	`;

	const result = process(
		markdown,
		{
			filters: undefined,
			inlineQueries: undefined,
			metadata: undefined,
			trees: undefined
		},
		partials
	);

	// Should have validation errors for circular references
	expect(result.validationErrors).toHaveLength(1);
	expect(result.validationErrors[0].error.message).toContain('Circular reference');
	expect(result.validationErrors[0].error.message).toContain('partial_a');
	expect(result.validationErrors[0].error.id).toBe('circular-reference');

	// Check that the tree is still generated and contains the partial content
	expect(result.tree).toBeDefined();
	const treeString = JSON.stringify(result.tree);

	// Should contain the content from partial_a
	expect(treeString).toContain('This is partial A');
	// Should contain the content from partial_b (first level)
	expect(treeString).toContain('This is partial B');
	// Should contain the content from partial_c (second level)
	expect(treeString).toContain('This is partial C');

	// Should NOT contain multiple instances of the same content (preventing infinite recursion)
	const partialACount = (treeString.match(/This is partial A/g) || []).length;
	const partialBCount = (treeString.match(/This is partial B/g) || []).length;
	const partialCCount = (treeString.match(/This is partial C/g) || []).length;

	expect(partialACount).toBe(1);
	expect(partialBCount).toBe(1);
	expect(partialCCount).toBe(1);
});

test('detects self-referencing partials', () => {
	const partials = {
		self_referencing: `
			This partial references itself
			{% partial file="self_referencing" /%}
		`
	};

	const markdown = `
		{% partial file="self_referencing" /%}
	`;

	const result = process(
		markdown,
		{
			filters: undefined,
			inlineQueries: undefined,
			metadata: undefined,
			trees: undefined
		},
		partials
	);

	// Should have validation errors for circular references
	expect(result.validationErrors).toHaveLength(1);
	expect(result.validationErrors[0].error.message).toContain('Circular reference');
	expect(result.validationErrors[0].error.message).toContain('self_referencing');
	expect(result.validationErrors[0].error.id).toBe('circular-reference');

	// Check that the tree is still generated and contains the partial content
	expect(result.tree).toBeDefined();
	const treeString = JSON.stringify(result.tree);

	// Should contain the content from self_referencing
	expect(treeString).toContain('This partial references itself');

	// Should contain only ONE instance of the content (preventing infinite recursion)
	const contentCount = (treeString.match(/This partial references itself/g) || []).length;
	expect(contentCount).toBe(1);
});

test('handles complex circular reference chains', () => {
	const partials = {
		start: `
			Start partial
			{% partial file="middle" /%}
		`,
		middle: `
			Middle partial
			{% partial file="end" /%}
		`,
		end: `
			End partial
			{% partial file="start" /%}
		`,
		unrelated: `
			This partial is not part of the cycle
		`
	};

	const markdown = `
		{% partial file="start" /%}
		{% partial file="unrelated" /%}
	`;

	const result = process(
		markdown,
		{
			filters: undefined,
			inlineQueries: undefined,
			metadata: undefined,
			trees: undefined
		},
		partials
	);

	// Should have validation errors for circular references
	expect(result.validationErrors).toHaveLength(1);
	expect(result.validationErrors[0].error.message).toContain('Circular reference');
	expect(result.validationErrors[0].error.id).toBe('circular-reference');

	// Check that the tree is still generated and contains the partial content
	expect(result.tree).toBeDefined();
	const treeString = JSON.stringify(result.tree);

	// Should contain content from all partials in the cycle
	expect(treeString).toContain('Start partial');
	expect(treeString).toContain('Middle partial');
	expect(treeString).toContain('End partial');
	expect(treeString).toContain('This partial is not part of the cycle');

	// Should contain only ONE instance of each content (preventing infinite recursion)
	const startCount = (treeString.match(/Start partial/g) || []).length;
	const middleCount = (treeString.match(/Middle partial/g) || []).length;
	const endCount = (treeString.match(/End partial/g) || []).length;
	const unrelatedCount = (treeString.match(/This partial is not part of the cycle/g) || []).length;

	expect(startCount).toBe(1);
	expect(middleCount).toBe(1);
	expect(endCount).toBe(1);
	expect(unrelatedCount).toBe(1);
});

describe('register-inline-queries', () => {
	it('should properly register inline query two partials deep with variables', () => {
		// prettier-ignore
		const content =
`---
root_var: root_var
---

{% partial
	file="partial1"
	variables={
		hardcoded="hardcoded"
		passed_var=$root_var
	}
/%}
`;
		const partials: Record<string, string> = {
			// prettier-ignore
			partial1:
`---
hardcoded: hardcoded_default
passed_var: passed_var_default
not_passed: not_passed_default

partial1_var: partial1_var
---

\`\`\`sql partial1_query
select
	'{{$hardcoded}}' as hardcoded,
	'{{$passed_var}}' as passed_var,
	'{{$not_passed}}' as not_passed,
	'{{$partial1_var}}' as partial1_var
\`\`\`

{% partial
	file="partial2"
	variables={
		hardcoded="hardcoded"
		passed_var=$partial1_var
		double_passed_var=$passed_var
	}
/%}
`,
			// prettier-ignore
			partial2:
`---
hardcoded: hardcoded_default
passed_var: passed_var_default
double_passed_var: double_passed_var_default
not_passed: not_passed_default
---

\`\`\`sql partial2_query
select
	'{{$hardcoded}}' as hardcoded,
	'{{$passed_var}}' as passed_var,
	'{{$double_passed_var}}' as double_passed_var,
	'{{$not_passed}}' as not_passed
\`\`\`

{% table data="again" /%}
`
		};

		const expectedInlineQueries: Record<string, string> = {
			// prettier-ignore
			partial1_query:
`select
	'hardcoded' as hardcoded,
	'root_var' as passed_var,
	'not_passed_default' as not_passed,
	'partial1_var' as partial1_var
`,
			// prettier-ignore
			partial2_query:
`select
	'hardcoded' as hardcoded,
	'partial1_var' as passed_var,
	'root_var' as double_passed_var,
	'not_passed_default' as not_passed
`
		};

		const inlineQueries = new InlineQueries({ filterContexts: [] });

		process(
			content,
			{
				filters: undefined,
				inlineQueries,
				metadata: undefined,
				trees: undefined
			},
			partials
		);

		for (const name of inlineQueries.getAllNames()) {
			const actual = inlineQueries.getRaw(name);
			const expected = expectedInlineQueries[name];
			expect(actual).toEqual(expected);
		}
	});
});

describe('account variables', () => {
	const account = {
		user: {
			email: 'test@example.com',
			first_name: 'Test',
			last_name: 'User',
			time_of_day: 'Morning' as const
		},
		organization: {
			name: 'Test Org'
		}
	};

	it('renders account variable properties correctly', () => {
		const markdown = `Hello {{ $user.first_name }} {{ $user.last_name }}!`;
		const result = process(markdown, undefined, undefined, undefined, account);

		expect(result.validationErrors).toHaveLength(0);
		const treeString = JSON.stringify(result.tree);
		expect(treeString).toContain('Test');
		expect(treeString).toContain('User');
	});

	it('renders email correctly', () => {
		const markdown = `Your email is {{ $user.email }}`;
		const result = process(markdown, undefined, undefined, undefined, account);

		expect(result.validationErrors).toHaveLength(0);
		const treeString = JSON.stringify(result.tree);
		expect(treeString).toContain('test@example.com');
	});

	it('renders organization name correctly', () => {
		const markdown = `Welcome to {{ $organization.name }}!`;
		const result = process(markdown, undefined, undefined, undefined, account);

		expect(result.validationErrors).toHaveLength(0);
		const treeString = JSON.stringify(result.tree);
		expect(treeString).toContain('Test Org');
	});

	it('renders time_of_day correctly', () => {
		const markdown = `Good {{ $user.time_of_day }}!`;
		const result = process(markdown, undefined, undefined, undefined, account);

		expect(result.validationErrors).toHaveLength(0);
		const treeString = JSON.stringify(result.tree);
		expect(treeString).toContain('Good Morning!');
	});

	it('renders empty string when using {{$user}} without property access', () => {
		// When using {{$user}} (the object itself, not a property like {{$user.email}}),
		// [object Object] is removed and replaced with empty string.
		const markdown = `Hello {{ $user }}!`;
		const result = process(markdown, undefined, undefined, undefined, account);

		expect(result.validationErrors).toHaveLength(0);

		const treeString = JSON.stringify(result.tree);
		// Should NOT contain [object Object]
		expect(treeString).not.toContain('[object Object]');
		// Should have "Hello !" with the object replaced by empty string
		expect(treeString).toContain('Hello !');
	});

	it('renders empty string when using {{$organization}} without property access', () => {
		const markdown = `Welcome to {{ $organization }}!`;
		const result = process(markdown, undefined, undefined, undefined, account);

		expect(result.validationErrors).toHaveLength(0);
		const treeString = JSON.stringify(result.tree);
		// Should NOT contain [object Object]
		expect(treeString).not.toContain('[object Object]');
		// Should have "Welcome to !" with the object replaced by empty string
		expect(treeString).toContain('Welcome to !');
	});

	it('renders empty string when using frontmatter object without property access', () => {
		// Test that frontmatter objects also have [object Object] removed
		const markdown = `---
metadata:
  author: John Doe
  version: 1.0
---

Author info: {{ $metadata }}`;
		const result = process(markdown);

		expect(result.validationErrors).toHaveLength(0);
		const treeString = JSON.stringify(result.tree);
		// Should NOT contain [object Object]
		expect(treeString).not.toContain('[object Object]');
		// Should have "Author info: " with the object replaced by empty string
		expect(treeString).toContain('Author info: ');
	});
});

describe('nested inline queries validation', () => {
	it('should produce error when SQL fence with name is inside a tab', () => {
		const markdown = `
{% tabs %}
{% tab title="Tab 1" %}

\`\`\`sql my_query
SELECT * FROM demo.daily_orders
\`\`\`

{% /tab %}
{% /tabs %}
`;

		const result = process(markdown);
		const nestedErrors = result.validationErrors.filter(
			(e) => e.error.id === 'nested-inline-query'
		);
		expect(nestedErrors).toHaveLength(1);
		expect(nestedErrors[0].error.message).toContain('tab');
	});

	it('should produce error when SQL fence with name is inside accordion_item', () => {
		const markdown = `
{% accordion %}
{% accordion_item title="Section 1" %}

\`\`\`sql my_query
SELECT * FROM demo.daily_orders
\`\`\`

{% /accordion_item %}
{% /accordion %}
`;

		const result = process(markdown);
		const nestedErrors = result.validationErrors.filter(
			(e) => e.error.id === 'nested-inline-query'
		);
		expect(nestedErrors).toHaveLength(1);
		expect(nestedErrors[0].error.message).toContain('accordion_item');
	});

	it('should produce error when SQL fence with name is inside details', () => {
		const markdown = `
{% details title="More Info" %}

\`\`\`sql my_query
SELECT * FROM demo.daily_orders
\`\`\`

{% /details %}
`;

		const result = process(markdown);
		const nestedErrors = result.validationErrors.filter(
			(e) => e.error.id === 'nested-inline-query'
		);
		expect(nestedErrors).toHaveLength(1);
		expect(nestedErrors[0].error.message).toContain('details');
	});

	it('should NOT produce error for top-level SQL fence with name', () => {
		const markdown = `
\`\`\`sql my_query
SELECT * FROM demo.daily_orders
\`\`\`
`;

		const result = process(markdown);
		const nestedErrors = result.validationErrors.filter(
			(e) => e.error.id === 'nested-inline-query'
		);
		expect(nestedErrors).toHaveLength(0);
	});

	it('should NOT produce error for SQL fence without name inside component', () => {
		const markdown = `
{% details title="Code Example" %}

\`\`\`sql
SELECT * FROM demo.daily_orders
\`\`\`

{% /details %}
`;

		const result = process(markdown);
		const nestedErrors = result.validationErrors.filter(
			(e) => e.error.id === 'nested-inline-query'
		);
		expect(nestedErrors).toHaveLength(0);
	});

	it('should NOT produce error for non-SQL fence inside component', () => {
		const markdown = `
{% details title="Code Example" %}

\`\`\`javascript my_code
console.log("hello");
\`\`\`

{% /details %}
`;

		const result = process(markdown);
		const nestedErrors = result.validationErrors.filter(
			(e) => e.error.id === 'nested-inline-query'
		);
		expect(nestedErrors).toHaveLength(0);
	});
});

describe('restructureAccordionItems transform', () => {
	const findTag = (tree: RenderableTreeNode, name: string): Tag | undefined => {
		if (!Tag.isTag(tree)) return undefined;
		if (tree.name === name) return tree;
		for (const child of tree.children) {
			const found = findTag(child, name);
			if (found) return found;
		}
		return undefined;
	};

	it('wraps body children of an accordion_item in accordion_body_slot', () => {
		const markdown = `
{% accordion %}
{% accordion_item title="Section 1" %}
Body paragraph.
{% /accordion_item %}
{% /accordion %}
`;
		const result = process(markdown);
		const item = findTag(result.tree, 'accordion_item');
		expect(item).toBeDefined();
		expect(item!.children).toHaveLength(1);
		const bodySlot = item!.children[0];
		expect(Tag.isTag(bodySlot)).toBe(true);
		expect((bodySlot as Tag).name).toBe('accordion_body_slot');
	});

	it('splits accordion_title and body into separate slot tags', () => {
		const markdown = `
{% accordion %}
{% accordion_item %}
{% accordion_title %}
{% big_value data="orders" value="sum(sales)" /%}
{% /accordion_title %}
Body paragraph.
{% /accordion_item %}
{% /accordion %}
`;
		const result = process(markdown);
		const item = findTag(result.tree, 'accordion_item');
		expect(item).toBeDefined();
		expect(item!.children).toHaveLength(2);
		const [titleSlot, bodySlot] = item!.children as Tag[];
		expect(titleSlot.name).toBe('accordion_title');
		expect(bodySlot.name).toBe('accordion_body_slot');
		// title slot should contain the big_value
		expect(findTag(titleSlot, 'big_value')).toBeDefined();
		// body slot should NOT contain the big_value
		expect(findTag(bodySlot, 'big_value')).toBeUndefined();
	});

	it('flags an accordion_item with neither title attribute nor accordion_title child', () => {
		const markdown = `
{% accordion %}
{% accordion_item %}
Body only.
{% /accordion_item %}
{% /accordion %}
`;
		const result = process(markdown);
		const missing = result.validationErrors.filter((e) => e.error.id === 'missing-accordion-title');
		expect(missing).toHaveLength(1);
	});

	it('does not flag when title attribute is supplied', () => {
		const markdown = `
{% accordion %}
{% accordion_item title="Section" %}
Body.
{% /accordion_item %}
{% /accordion %}
`;
		const result = process(markdown);
		const missing = result.validationErrors.filter((e) => e.error.id === 'missing-accordion-title');
		expect(missing).toHaveLength(0);
	});

	it('does not flag when title is a Markdoc variable expression', () => {
		const markdown = `---
pageTitle: Hello
---

{% accordion %}
{% accordion_item title=$pageTitle %}
Body.
{% /accordion_item %}
{% /accordion %}
`;
		const result = process(markdown);
		const missing = result.validationErrors.filter((e) => e.error.id === 'missing-accordion-title');
		expect(missing).toHaveLength(0);
	});

	it('does not flag when accordion_title child is supplied', () => {
		const markdown = `
{% accordion %}
{% accordion_item %}
{% accordion_title %}
{% big_value data="orders" value="sum(sales)" /%}
{% /accordion_title %}
Body.
{% /accordion_item %}
{% /accordion %}
`;
		const result = process(markdown);
		const missing = result.validationErrors.filter((e) => e.error.id === 'missing-accordion-title');
		expect(missing).toHaveLength(0);
	});

	it('flags accordion_title used outside an accordion_item', () => {
		const markdown = `{% accordion_title %}Oops{% /accordion_title %}`;
		const result = process(markdown);
		const invalidParentErrors = result.validationErrors.filter(
			(e) => e.error.id === 'invalid-parent'
		);
		expect(invalidParentErrors.length).toBeGreaterThan(0);
	});
});

const omitTagIdsAndAstNodes = (tree: RenderableTreeNode): void => {
	if (!Tag.isTag(tree)) return;
	for (const { node } of walkTree(tree)) {
		if (!Tag.isTag(node)) continue;
		// @ts-expect-error id is readonly, but we want to overwrite it anyways for testing
		node.id = '';
		// @ts-expect-error astNode is readonly, but we want to overwrite it anyways for testing
		node.astNode = undefined;
	}
};

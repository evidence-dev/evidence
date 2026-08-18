import type { Node, ValidationError } from '@markdoc/markdoc';
import { WIDTH_ATTRIBUTE } from '../../common/width-attribute';
import type { UserComponentSchema } from '../../types';

export const schema = {
	render: 'fence',
	category: 'ui',
	selfClosing: false,
	description: 'Display a code block',
	// Validate SQL fences for common OSS syntax mistakes
	validate(node: Node): ValidationError[] {
		if (node.attributes?.language !== 'sql') return [];
		const content = node.attributes?.content;
		if (typeof content !== 'string') return [];

		// Check for ${...} syntax (OSS-style query references)
		if (/\$\{[^}]+\}/.test(content)) {
			return [
				{
					id: 'oss-query-reference',
					message: '${...} syntax is not supported. Use {{query_name}} to reference other queries.',
					level: 'error'
				}
			];
		}

		// A slash-path after FROM/JOIN is a SQL-file reference written without
		// the {{ }} delimiters — the natural first guess, and it fails on the
		// warehouse with an unhelpful parse error. A slash is never valid in an
		// unquoted table identifier, so this can't hit a real table name.
		// Strip comments and string literals first: `-- copied from /old/file`
		// or `like '%from /assets%'` must not trip an error-level diagnostic
		// (it blocks the commit gate). Comments before strings so an
		// apostrophe in prose ("don't") can't pair with a later SQL quote; a
		// `--` inside a string then truncates that line, which at worst
		// silences the hint — never a false error.
		const scannable = content
			.replace(/--[^\n]*/g, '')
			.replace(/\/\*[\s\S]*?\*\//g, '')
			.replace(/'(?:[^']|'')*'/g, "''");
		const barePathMatch = scannable.match(/\b(?:from|join)\s+((?:\/|queries\/)[A-Za-z0-9_/-]+)/i);
		if (barePathMatch) {
			const path = barePathMatch[1];
			const absolute = path.startsWith('/') ? path : `/${path}`;
			return [
				{
					id: 'bare-sql-file-path',
					message: `"${path}" looks like a SQL file reference — wrap it in template braces with quotes: {{ "${absolute}" }}. A bare path isn't valid SQL and will fail on the warehouse.`,
					level: 'error'
				}
			];
		}
		return [];
	},
	examples: [
		{
			hero: true,
			title: 'Basic Usage',
			example: `
\`\`\`language query_name
  content
\`\`\`
`
		},
		{
			title: 'Define a SQL query',
			example: `
\`\`\`sql electronics_orders
  SELECT * FROM demo.daily_orders WHERE category = 'Electronics'
\`\`\`

<!-- Use the query in other components -->
{% table data="electronics_orders" /%}
`
		}
	],
	attributes: {
		language: {
			type: String,
			description: 'The language of the code block'
		},
		content: {
			type: String,
			description: 'The content of the code block'
		},
		meta: {
			type: String,
			description:
				'Optional name for the code block. If provided and language is "sql", this will register the query as an inline query that can be used by other components. Inline queries must be defined at the top level of the page, not inside other components (e.g. tabs, accordion, details).',
			required: false
		},
		...WIDTH_ATTRIBUTE
	},
	componentWrapper: {
		display: 'block',
		width: 'full',
		noCard: true
	}
} as const satisfies UserComponentSchema;

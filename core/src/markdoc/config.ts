import { type Config } from '@markdoc/markdoc';
import { nodes, tags } from '../index';
import { textSchema } from './textSchema';
import { tableSchema } from '../user-components/nodes/table/schema';
import { headingSchema } from './headingSchema';

export const config = {
	nodes: {
		text: textSchema,
		table: tableSchema,
		heading: headingSchema,
		...Object.fromEntries(Object.entries(nodes).map(([name, { schema }]) => [name, schema]))
	},
	tags: Object.fromEntries(Object.entries(tags).map(([name, { schema }]) => [name, schema])),
	validation: {
		validateFunctions: true
	}
} as const satisfies Config;

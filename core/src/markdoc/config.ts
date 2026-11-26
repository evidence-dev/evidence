import { type Config } from '@markdoc/markdoc';
import { nodes, tags } from '../index';
import { textSchema } from './textSchema';
import { tableSchema } from '../user-components/nodes/table/schema';
import { headingSchema } from './headingSchema';

const buildNodes = () => ({
	text: textSchema,
	table: tableSchema,
	heading: headingSchema,
	...Object.fromEntries(Object.entries(nodes).map(([name, { schema }]) => [name, schema]))
});
const buildTags = () =>
	Object.fromEntries(Object.entries(tags).map(([name, { schema }]) => [name, schema]));

// Built on first read, not at import: `../index` imports every component, and a component that
// imports this module while `../index` is still loading would otherwise see `nodes`/`tags` undefined.
let builtNodes: ReturnType<typeof buildNodes> | undefined;
let builtTags: ReturnType<typeof buildTags> | undefined;

export const config = {
	get nodes() {
		return (builtNodes ??= buildNodes());
	},
	get tags() {
		return (builtTags ??= buildTags());
	},
	validation: {
		validateFunctions: true
	}
} as const satisfies Config;

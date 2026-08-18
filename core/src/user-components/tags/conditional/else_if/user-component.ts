import { schema as ifSchema } from '../if/schema';
import If from '../if/If.svelte';
import { and, tableExists } from '../../../validators';
import { validateSqlOptions } from '../../../validators';
import { validateConditionalOrder } from '../../../validators/validateConditionalOrder';
import { IfModel } from '../if/IfModel.svelte';
export const userComponent = {
	schema: {
		...ifSchema,
		render: 'else_if',
		description:
			'If prior conditional blocks do not pass, conditionally render the contents based on whether rows are returned by the query.',
		validate: and(tableExists('data'), validateSqlOptions('data'), validateConditionalOrder)
	},
	Component: If,
	Model: IfModel,
	props: { type: 'else_if' }
};

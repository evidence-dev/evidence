import { z } from 'zod';

const QueryResultArraySchema = z.array(z.any()).refine(
	(data) => {
		// result is not an array, fail
		if (!Array.isArray(data)) return false;
		// result has no rows, we can't validate this
		// but this is a correct result set
		if (data.length === 0) return true;
		return z.record(z.string(), z.any()).safeParse(data[0]).success;
	},
	{ message: 'Data connector returned invalid rows' }
);
const QueryResultGeneratorSchema = z.function();

export const QueryResultSchema = z
	.object({
		// Note that this only validates that the first item in the array
		// is a record with string keys. If the connector returns some
		// inconsistent array (e.g. [{}, 1]), it will not detect the
		// invalid row.
		rows: QueryResultArraySchema.or(QueryResultGeneratorSchema),
		columnTypes: z.array(
			z.object({
				name: z.string(),
				evidenceType: z.enum(['boolean', 'number', 'string', 'date']),
				typeFidelity: z.union([z.literal('precise'), z.literal('inferred')])
			})
		),
		expectedRowCount: z.number().optional()
	})
	.refine(
		(data) => {
			// We can't dig into generator functions
			if (typeof data.rows === 'function') return true;

			const rows = data.rows;

			// Validate that all columnTypes appear
			if (rows.length) {
				// Filter to column types where name is not in row
				// Then map columnTypes to their names to make things easier
				// If there are any columns that were not filtered out; provide an error to zod
				const missingColumns = data.columnTypes
					.filter((ct) => !(ct.name in rows[0]))
					.map((ct) => ct.name);

				if (missingColumns.length) {
					return false;
				}
			}
			return true;
		},
		(data) => {
			// We can't dig into generator functions
			if (typeof data.rows === 'function')
				return {
					path: ['columnTypes']
				};
			const rows = data.rows;

			const missingColumns = data.columnTypes
				.filter((ct) => !(ct.name in rows[0]))
				.map((ct) => ct.name);
			return {
				path: ['columnTypes'],
				message: `Datasource result has columns declared that are missing from results: ${missingColumns.join(
					', '
				)}`
			};
		}
	)
	.refine(
		(data) => {
			// We can't dig into generator functions
			if (typeof data.rows === 'function') return true;

			// Validate that all columns in the returned rows have declared column types
			if (data.rows.length) {
				const colNames = data.columnTypes.map((ct) => ct.name);
				const extraColumns = Object.keys(data.rows[0]).filter(
					(rowKey) => !colNames.includes(rowKey)
				);
				if (extraColumns.length) {
					return false;
				}
			}
			return true;
		},
		(data) => {
			// We can't dig into generator functions
			if (typeof data.rows === 'function')
				return {
					path: ['rows']
				};

			const colNames = data.columnTypes.map((ct) => ct.name);
			const extraColumns = Object.keys(data.rows[0]).filter((rowKey) => !colNames.includes(rowKey));
			return {
				path: ['rows'],
				message: `First row of results columns not provided in columnTypes: ${extraColumns.join(
					', '
				)}`
			};
		}
	);

export const QueryRunnerSchema = z
	.function()
	.args(
		z.string({ description: 'QueryString' }).or(z.null({ description: 'ExceededSizeQueryString' })),
		z.string({ description: 'QueryFilepath' }),
		z.number({ description: 'Batch Size' }).or(z.null())
	)
	.returns(z.promise(QueryResultSchema.or(z.null())).or(QueryResultSchema));

export const DatabaseConnectorFactorySchema = z
	.function()
	.args(
		z.any({ description: 'Connection Options' }),
		z.string({ description: 'Datasource directory' })
	)
	.returns(z.promise(QueryRunnerSchema));

export const DatabaseConnectorSchema = z.object({
	getRunner: DatabaseConnectorFactorySchema,
	supports: z.array(z.string())
});

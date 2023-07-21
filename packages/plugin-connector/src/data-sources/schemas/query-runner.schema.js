import { z } from 'zod';

export const QueryResultSchema = z
	.object({
		// Note that this only validates that the first item in the array
		// is a record with string keys. If the connector returns some
		// inconsistent array (e.g. [{}, 1]), it will not detect the
		// invalid row.
		rows: z.array(z.any()).refine(
			(data) => {
				// result is not an array, fail
				if (!Array.isArray(data)) return false;
				// result has no rows, we can't validate this
				// but this is a correct result set
				if (data.length === 0) return true;
				try {
					z.record(z.string(), z.any()).parse(data[0]);
				} catch {
					return false;
				}
				return true;
			},
			{ message: 'Data connector returned invalid rows' }
		),
		columnTypes: z.array(
			z.object({
				name: z.string(),
				evidenceType: z.enum(['boolean', 'number', 'string', 'date']),
				typeFidelity: z.union([z.literal('precise'), z.literal('inferred')])
			})
		)
	})
	.refine(
		(data) => {
			// Validate that all columnTypes appear
			if (data.rows.length) {
				// Filter to column types where name is not in row
				// Then map columnTypes to their names to make things easier
				// If there are any columns that were not filtered out; provide an error to zod
				const missingColumns = data.columnTypes
					.filter((ct) => !(ct.name in data.rows[0]))
					.map((ct) => ct.name);

				if (missingColumns.length) {
					return false;
				}
			}
			return true;
		},
		(data) => {
			const missingColumns = data.columnTypes
				.filter((ct) => !(ct.name in data.rows[0]))
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
			// Validate that all columns in the returned rows have declared column types
			if (data.rows.length) {
				const colNames = data.columnTypes.map((ct) => ct.name);
				const extraColumns = Object.keys(data.rows[0]).filter(
					(rowKey) => !colNames.includes(rowKey)
				);
				if (extraColumns.length) {
					console.error({ colNames, extraColumns });
					return false;
				}
			}
			return true;
		},
		(data) => {
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
	.args(z.string({ description: 'QueryString' }), z.string({ description: 'QueryFilepath' }))
	.returns(z.promise(QueryResultSchema.or(z.null())));

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

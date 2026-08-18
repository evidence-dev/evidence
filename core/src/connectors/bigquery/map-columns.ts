import type { Column } from '../../user-components/interfaces/query-service';
import { getBigQueryToJsType } from './type-mapping';

/**
 * Subset of @google-cloud/bigquery's TableField we read. Defined locally so
 * @evidence/core stays free of an SDK dep — both cli/ and studio/ pull schema
 * from `metadata.schema.fields` and pass it through here.
 */
export type BigQueryField = {
	name: string;
	type: string;
	mode?: 'NULLABLE' | 'REQUIRED' | 'REPEATED' | string;
};

/**
 * Map BigQuery schema fields to the Evidence Column shape.
 * REPEATED fields are wrapped as ARRAY<inner> so the schema browser shows
 * them clearly; the jsType still falls through to the inner element's
 * category (or 'object' for STRUCT/RECORD).
 */
export function mapBigQueryColumns(fields: BigQueryField[]): Column[] {
	return fields.map((field) => {
		const baseType = field.type.toUpperCase();
		const clickhouseType = field.mode === 'REPEATED' ? `ARRAY<${baseType}>` : baseType;
		return {
			name: field.name,
			clickhouseType,
			jsType: getBigQueryToJsType(clickhouseType),
			// BigQuery treats an absent mode as NULLABLE.
			nullable: field.mode ? field.mode === 'NULLABLE' : true
		};
	});
}

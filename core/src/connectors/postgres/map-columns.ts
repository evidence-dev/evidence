import type { Column } from '../../user-components/interfaces/query-service';
import { getPostgresToJsType, PG_OID_TO_NAME } from './type-mapping';

// Minimal, driver-agnostic column shape. The Studio client / CLI build these
// from node-postgres's `result.fields` (each carries a `dataTypeID` OID), so core
// needs no `pg` dependency of its own.
export type PostgresColumnMeta = {
	columnName: string;
	dataTypeID: number;
};

// Map node-postgres field metadata into Evidence columns, preserving SELECT
// order (pg returns fields in select order already).
export function mapPostgresColumns(fields: PostgresColumnMeta[]): Column[] {
	return fields.map((f) => {
		const typeName = PG_OID_TO_NAME[f.dataTypeID] ?? 'unknown';
		return {
			name: f.columnName,
			clickhouseType: typeName,
			jsType: getPostgresToJsType(typeName)
		};
	});
}

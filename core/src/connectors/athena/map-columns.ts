import type { Column } from '../../user-components/interfaces/query-service';
import { getAthenaToJsType } from './type-mapping';

// Structural subset of the SDK's `ColumnInfo`, so core needs no @aws-sdk dependency.
export type AthenaColumnInfo = {
	Name?: string;
	Type?: string;
	Nullable?: string;
};

export function mapAthenaColumns(columnInfo: AthenaColumnInfo[]): Column[] {
	return columnInfo.map((col, i) => ({
		name: col.Name ?? `col_${i}`,
		clickhouseType: col.Type ?? 'unknown',
		jsType: getAthenaToJsType(col.Type ?? ''),
		...(col.Nullable === 'NOT_NULL' ? { nullable: false } : {}),
		...(col.Nullable === 'NULLABLE' ? { nullable: true } : {})
	}));
}

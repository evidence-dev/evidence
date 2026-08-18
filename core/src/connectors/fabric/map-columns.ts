import type { Column } from '../../user-components/interfaces/query-service';
import { getFabricToJsType } from './type-mapping';

// Column metadata shape from mssql's recordset.columns; kept SDK-agnostic so core needs no mssql dep.
export type FabricColumnMeta = {
	index: number;
	name: string;
	type?: { declaration?: string; name?: string };
	nullable?: boolean;
};

// Map mssql's recordset.columns into Evidence columns, ordered by TDS index to match SELECT order.
export function mapFabricColumns(columns: unknown): Column[] {
	if (!columns || typeof columns !== 'object') return [];
	const cols = Object.values(columns) as FabricColumnMeta[];
	cols.sort((a, b) => a.index - b.index);
	return cols.map((col) => {
		const typeName = col.type?.declaration ?? col.type?.name ?? 'unknown';
		return {
			name: col.name,
			clickhouseType: typeName,
			jsType: getFabricToJsType(typeName),
			...(typeof col.nullable === 'boolean' ? { nullable: col.nullable } : {})
		};
	});
}

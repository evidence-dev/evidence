import type { Column } from '../../user-components/interfaces/query-service';
import { getMssqlToJsType } from './type-mapping';

// Column metadata shape from mssql's recordset.columns; kept SDK-agnostic so core needs no mssql dep.
export type MssqlColumnMeta = {
	index: number;
	name: string;
	type?: { declaration?: string; name?: string };
	nullable?: boolean;
};

// Map mssql's recordset.columns into Evidence columns, ordered by TDS index to match SELECT order.
export function mapMssqlColumns(columns: unknown): Column[] {
	if (!columns || typeof columns !== 'object') return [];
	const cols = Object.values(columns) as MssqlColumnMeta[];
	cols.sort((a, b) => a.index - b.index);
	return cols.map((col) => {
		const typeName = col.type?.declaration ?? col.type?.name ?? 'unknown';
		return {
			name: col.name,
			clickhouseType: typeName,
			jsType: getMssqlToJsType(typeName),
			...(typeof col.nullable === 'boolean' ? { nullable: col.nullable } : {})
		};
	});
}

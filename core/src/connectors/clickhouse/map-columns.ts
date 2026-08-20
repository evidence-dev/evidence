import type { Column } from '../../user-components/interfaces/query-service';
import { getClickHouseToJsType } from '../../user-components/common/typeConversions';

/** Column metadata from ClickHouse's JSON output format (`meta` array). */
export type ClickHouseColumnMeta = { name: string; type: string };

export function mapClickHouseColumns(meta: ClickHouseColumnMeta[]): Column[] {
	return meta.map((col) => ({
		name: col.name,
		clickhouseType: col.type,
		jsType: getClickHouseToJsType(col.type),
		nullable: /^Nullable\(/.test(col.type)
	}));
}

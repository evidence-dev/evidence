import type { Column as SfColumn } from 'snowflake-sdk';
import type { Column } from '../../user-components/interfaces/query-service';
import { getSnowflakeToJsType } from './type-mapping';

/**
 * Turn the SDK's column metadata into the shape Evidence consumers expect
 * (matches what the managed ClickHouse engine returns).
 */
export function mapSnowflakeColumns(sfColumns: SfColumn[]): Column[] {
	return sfColumns.map((col) => {
		const type = col.getType();
		return {
			name: col.getName(),
			clickhouseType: type,
			jsType: getSnowflakeToJsType(type),
			nullable: col.isNullable()
		};
	});
}

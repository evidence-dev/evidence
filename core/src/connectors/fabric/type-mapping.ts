export type JsType = 'string' | 'number' | 'boolean' | 'date' | 'object' | 'unknown';

/**
 * T-SQL / Microsoft Fabric Warehouse type names → Evidence column JsType.
 * Keys are upper-cased and stripped of any (...) precision/length suffix before
 * lookup (see getFabricToJsType). Includes legacy SQL Server names so the same
 * map also serves a generic SQL Server / Azure SQL endpoint.
 */
const FABRIC_TYPE_MAP: Record<string, JsType> = {
	BIT: 'boolean', // tedious returns T-SQL BIT as a JS boolean

	TINYINT: 'number',
	SMALLINT: 'number',
	INT: 'number',
	INTEGER: 'number',
	BIGINT: 'number',
	DECIMAL: 'number',
	NUMERIC: 'number',
	FLOAT: 'number',
	REAL: 'number',
	MONEY: 'number',
	SMALLMONEY: 'number',

	CHAR: 'string',
	NCHAR: 'string',
	VARCHAR: 'string',
	NVARCHAR: 'string',
	TEXT: 'string',
	NTEXT: 'string',
	UNIQUEIDENTIFIER: 'string',
	BINARY: 'string',
	VARBINARY: 'string',
	IMAGE: 'string',
	XML: 'string',
	JSON: 'string',
	SQL_VARIANT: 'string',

	DATE: 'date',
	DATETIME: 'date',
	DATETIME2: 'date',
	SMALLDATETIME: 'date',
	DATETIMEOFFSET: 'date',
	TIME: 'date'
};

export function getFabricToJsType(fabricType: string): JsType {
	const normalized = fabricType
		.toUpperCase()
		.replace(/\(.*\)/, '')
		.trim();
	return FABRIC_TYPE_MAP[normalized] ?? 'unknown';
}

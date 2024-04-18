export type DescribeResultRow = {
	column_name: string;
	column_type: DuckDBColumnType;
	nullable: 'YES' | 'NO';
};

export type DuckDBColumnType =
	| `STRUCT(${string})`
	| `${string}[]`
	| 'BIGINT'
	| 'BIT'
	| 'BOOLEAN'
	| 'BLOB'
	| 'DATE'
	| 'DOUBLE'
	| `DECIMAL(${number},${number})`
	| 'HUGEINT'
	| 'INTEGER'
	| 'INTERVAL'
	| 'FLOAT'
	| 'SMALLINT'
	| 'TIME'
	| 'TIMESTAMP'
	| 'TIMESTAMP_S'
	| 'TIMESTAMP_MS'
	| 'TIMESTAMP_NS'
	| 'TIME WITH TIME ZONE'
	| 'TIMESTAMP WITH TIME ZONE'
	| 'TINYINT'
	| 'UBIGINT'
	| 'UINTEGER'
	| 'USMALLINT'
	| 'UTINYINT'
	| 'UUID'
	| 'VARCHAR';

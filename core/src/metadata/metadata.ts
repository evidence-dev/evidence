type JavaScriptType = 'string' | 'number' | 'boolean' | 'date' | 'object' | 'unknown';

interface IColumnMetadata {
	name: string;
	type: string;
	jsType: JavaScriptType;
}

interface ITableMetadata {
	name: string;
	columns: {
		[columnName: string]: IColumnMetadata;
	};
	tableType?: 'table' | 'model' | 'inline_query'; // 'model' for views, 'table' for regular tables, 'inline_query' for inline SQL queries
	error?: string;
}

interface IMetadata {
	tables: {
		[tableName: string]: ITableMetadata;
	};
}

// Define the interface for what we need from TableMetadata
interface ITableMetadataProvider {
	name: string;
	columns: IColumnMetadata[];
	getColumn(name: string): IColumnMetadata | undefined;
	toJSON(): ITableMetadata;
}

/**
 * Arrow type names (the engine catalogue's `arrow_type` — 'Utf8', 'Int64',
 * 'Timestamp(Nanosecond, None)', 'List(...)', …) to the JavaScriptType the
 * schema browser displays.
 */
export function arrowToJsType(arrowType: string): JavaScriptType {
	const t = arrowType.toLowerCase();
	// Containers first — their element types contain scalar names (List(Utf8)).
	if (t.startsWith('list') || t.startsWith('struct') || t.startsWith('map')) return 'object';
	if (t.startsWith('bool')) return 'boolean';
	if (t.includes('utf8') || t.includes('string')) return 'string';
	if (
		t.startsWith('int') ||
		t.startsWith('uint') ||
		t.startsWith('float') ||
		t.startsWith('decimal')
	)
		return 'number';
	if (t.startsWith('date') || t.startsWith('time')) return 'date';
	return 'unknown';
}

export type { JavaScriptType, IColumnMetadata, ITableMetadata, IMetadata, ITableMetadataProvider };

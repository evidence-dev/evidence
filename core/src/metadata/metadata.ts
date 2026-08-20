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

export type {
	JavaScriptType,
	IColumnMetadata,
	ITableMetadata,
	IMetadata,
	ITableMetadataProvider
};

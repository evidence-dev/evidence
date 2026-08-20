export type LineageSourceKind = 'component' | 'model' | 'inline_query' | 'sql_file';

export type LineageReference = {
	/** What is being referenced */
	dataAttr: string;
	resolvedTo: string | null;
	resolvedType: 'source' | 'inline_query' | 'sql_file' | 'model' | null;
	chain: string[];
	status: 'resolved' | 'dynamic' | 'unresolved';

	/** Connection info (populated when resolved to a source) */
	connectionName: string | null;
	connectionType: string | null;
	connectionId: number | null;

	/** What kind of thing contains this reference */
	sourceKind: LineageSourceKind;

	/** For components: page location */
	projectSlug: string | null;
	projectName: string | null;
	filePath: string | null;
	component: string | null;
	line: number | null;
	attributes: Record<string, unknown>;
	isDynamic: boolean;
	fileType: string | null;

	/** For models */
	modelName: string | null;

	/** For inline queries */
	queryName: string | null;

	/** For .sql files */
	sqlFilePath: string | null;
};

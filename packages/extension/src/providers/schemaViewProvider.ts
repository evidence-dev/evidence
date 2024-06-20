import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { getManifest } from '../utils/jsonUtils';

export class SchemaViewProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
	private _onDidChangeTreeData: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
	readonly onDidChangeTreeData: vscode.Event<void> = this._onDidChangeTreeData.event;

	constructor(private manifestUri: vscode.Uri) {}

	getTreeItem(element: SchemaItem | TableItem | ColumnItem): vscode.TreeItem {
		return element;
	}

	getChildren(element?: SchemaItem | TableItem | ColumnItem): Thenable<vscode.TreeItem[]> {
		if (!this.manifestUri) {
			// should we add a warning or info box?
			return Promise.resolve([]);
		}

		if (element instanceof SchemaItem) {
			return element.getTables();
		} else if (element instanceof TableItem) {
			return Promise.resolve(element.columns);
		} else {
			if (this.pathExists(this.manifestUri)) {
				return this.getSchemaFiles(this.manifestUri);
			} else {
				return Promise.resolve([]);
			}
		}
	}

	private async getSchemaFiles(manifestUri: vscode.Uri): Promise<SchemaItem[]> {
		const manifest = await getManifest(manifestUri);
		if (!manifest) {
			return [];
		}
		// ./.evidence/template/static/data/manifest.json -> ./.evidence/template
		const templateDirectory = path.dirname(path.dirname(path.dirname(manifestUri.fsPath)));

		return Object.entries(manifest.renderedFiles).map(([schemaName, schemaFiles]) => {
			const schemaFilesUris = schemaFiles.map((schemaFile) => {
				const schemaFilePath = `${schemaFile.slice(0, -'.parquet'.length)}.schema.json`;
				return vscode.Uri.file(path.join(templateDirectory, schemaFilePath));
			});
			return new SchemaItem(schemaName, schemaFilesUris);
		});
	}

	private pathExists(p: vscode.Uri): boolean {
		return fs.existsSync(p.fsPath);
	}

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}
}

export class SchemaItem extends vscode.TreeItem {
	constructor(
		private schema: string,
		private tables: vscode.Uri[]
	) {
		super(schema, vscode.TreeItemCollapsibleState.Collapsed);
		this.tooltip = schema;
		this.id = schema;
	}

	async getTables(): Promise<TableItem[]> {
		return Promise.all(
			this.tables.map(async (table) => {
				const name = path.basename(table.fsPath, '.schema.json');
				const contents = await vscode.workspace.fs.readFile(table);
				const columns = JSON.parse(Buffer.from(contents).toString());
				return new TableItem({ name, columns }, this.schema);
			})
		);
	}

	// in the future: use each datasource icon for iconPath
}

type Table = {
	name: string;
	columns: { name: string; evidenceType: string }[];
};

export class TableItem extends vscode.TreeItem {
	columns: ColumnItem[];

	constructor(table: Table, schema: string) {
		super(table.name, vscode.TreeItemCollapsibleState.Collapsed);
		this.id = `${schema}.${table.name}`;
		this.columns = table.columns.map(
			({ name, evidenceType }) => new ColumnItem(name, table.name, schema, evidenceType)
		);
		this.contextValue = 'tableItem';
	}
}
export class ColumnItem extends vscode.TreeItem {
	constructor(name: string, table: string, schema: string, evidenceType: string) {
		super(name, vscode.TreeItemCollapsibleState.None);
		this.description = evidenceType;
		this.id = `${schema}.${table}.${name}`;
		this.iconPath =
			evidenceType === 'string'
				? new vscode.ThemeIcon('symbol-string')
				: evidenceType === 'number'
					? new vscode.ThemeIcon('symbol-number')
					: evidenceType === 'boolean'
						? new vscode.ThemeIcon('symbol-boolean')
						: new vscode.ThemeIcon('calendar');
		this.contextValue = 'columnItem';
	}
}

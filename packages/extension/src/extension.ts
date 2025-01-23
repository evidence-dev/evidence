import {
	window,
	workspace,
	ExtensionContext,
	TextEditor,
	DecorationOptions,
	Range,
	Position,
	commands,
	ConfigurationTarget,
	TextEditorDecorationType,
	env,
	ColorThemeKind,
	Uri,
	languages,
	CompletionItem,
	CompletionItemKind,
	TextDocument,
	MarkdownString,
	SnippetString
} from 'vscode';

import { TelemetryService } from './telemetryService';

import { Commands } from './commands/commands';

import { MarkdownSymbolProvider } from './providers/markdownSymbolProvider';
import { setExtensionContext } from './extensionContext';
import { registerCommands } from './commands/commands';
import {
	loadPackageJson,
	getPackageJsonFolder,
	hasDependency,
	dependencyVersion,
	getManifestUri,
	getManifest,
	isUSQL,
	hasManifest
} from './utils/jsonUtils';
import { Settings, getConfig, updateProjectContext } from './config';
import { startServer } from './commands/server';
import { openIndex } from './commands/project';
import { statusBar } from './statusBar';
import { closeTerminal } from './terminal';
import { isGitRepository } from './utils/gitCheck';
import { countFilesInDirectory, countTemplatedPages } from './utils/fsUtils';
import * as path from 'path';
import * as fs from 'fs';
import {
	SchemaViewProvider,
	ColumnItem,
	TableItem,
	SchemaItem
} from './providers/schemaViewProvider';

export const enum Context {
	isNewLine = 'evidence.isNewLine',
	isPagesDirectory = 'evidence.isPagesDirectory',
	isNonLegacyProject = 'evidence.isNonLegacyProject',
	slashCommands = 'evidence.slashCommands',
	isSQLContext = 'evidence.isSQLContext',
	isComponentContext = 'evidence.isComponentContext'
}

let isSQLContext = false;

export let telemetryService: TelemetryService; // Global instance

async function initializeTelemetryService() {
	try {
		const iK = '99ec224c-3fe8-4635-96ef-24c9aa5a354f'; // example key
		telemetryService = new TelemetryService(iK);
		telemetryService?.loadCommonProperties((await getPackageJsonFolder()) ?? '');
		// Any other telemetry initialization logic
	} catch (error) {
		console.error('Failed to initialize telemetry: ', error);
	}
}

const decorationType = window.createTextEditorDecorationType({
	after: {
		contentText: ' Press / for commands...',
		color: '#99999959'
	}
});

function decorate(editor: TextEditor) {
	let decorationsArray: DecorationOptions[] = [];
	const { text } = editor.document.lineAt(editor.selection.active.line);
	const position = editor.selection.active;

	let range = new Range(
		new Position(position.line, position.character),
		new Position(position.line, position.character)
	);

	let decoration = { range };

	// new lines are defined as empty (undefined) lines of code, plus any lines that are solely whitespace characters (spaces and tabs)
	if (text === undefined || /^\s*$/.test(text)) {
		decorationsArray.push(decoration);
		commands.executeCommand(Commands.SetContext, Context.isNewLine, true);
	} else {
		commands.executeCommand(Commands.SetContext, Context.isNewLine, false);
	}

	editor.setDecorations(decorationType, decorationsArray);
}

function isPagesDirectory() {
	const openEditor = window.activeTextEditor;
	let pageContext = false;
	// Set context for pages directory (only use Evidence markdown features within those files):
	if (openEditor && /\/pages\/|\\pages\\/.test(openEditor.document.uri.fsPath)) {
		commands.executeCommand(Commands.SetContext, Context.isPagesDirectory, true);
		pageContext = true;
	} else {
		commands.executeCommand(Commands.SetContext, Context.isPagesDirectory, false);
		pageContext = false;
	}
	return pageContext;
}

async function initializeSchemaViewer(context: ExtensionContext) {
	try {
		if (await isUSQL()) {
			const manifestUri = await getManifestUri();
			const workspaceFolder = workspace.workspaceFolders?.[0];
			const packageJsonFolder = await getPackageJsonFolder();
			const manifestPath = workspaceFolder
				? path.join(
					workspaceFolder.uri.fsPath,
					packageJsonFolder ?? '',
					'.evidence',
					'template',
					'static',
					'data',
					'manifest.json'
				)
				: '';

			const manifestWatcher = workspace.createFileSystemWatcher(
				manifestUri ? manifestUri.fsPath : manifestPath
			);
			registerCopyCommands(context);

			const schemaViewProvider = new SchemaViewProvider(manifestUri ?? Uri.file(manifestPath));
			window.registerTreeDataProvider('schemaView', schemaViewProvider);

			manifestWatcher.onDidChange(() => schemaViewProvider.refresh());
			manifestWatcher.onDidCreate(() => schemaViewProvider.refresh());
			manifestWatcher.onDidDelete(() => schemaViewProvider.refresh());

			context.subscriptions.push(manifestWatcher);

			commands.executeCommand(Commands.SetContext, Context.isNonLegacyProject, await isUSQL());
		}
	} catch (error) {
		console.error('Error initializing schema viewer:', error);
	}
}

async function applyCustomSettings() {
	const editor = window.activeTextEditor;

	if (!editor) {
		return; // No active editor, no need to update settings
	}

	const languageId = editor.document.languageId;
	const isSQLContext = isInSQLContext(editor.document, editor.selection.active);
	const isComponentContext = isInComponentContext(editor.document, editor.selection.active);

	console.log('isSqlContext', isSQLContext)
	console.log('isComponentContext', isComponentContext)
	const autocompleteContext = isSQLContext || isComponentContext;
	await updateEditorConfigForLanguage(languageId, autocompleteContext);
}

function registerCompletionProvider(context: ExtensionContext) {
	const config = workspace.getConfiguration('evidence');
	const autocompleteEnabled = config.get('enableSqlAutocomplete');
	if (!autocompleteEnabled) {
		return;
	}

	const sqlProvider = languages.registerCompletionItemProvider(
		['emd', 'sql'],
		{
			async provideCompletionItems(document, position) {
				const isSQLContext = isInSQLCodeBlock(document, position) || isInQueriesDirectory(document);
				const languageId = document.languageId;

				await updateEditorConfigForLanguage(languageId, isSQLContext);

				if (isSQLContext) {
					const context = document.languageId === 'sql' ? 'sql' : 'markdown';
					return provideSQLCompletionItems(document, position, context);
				}
				return undefined;
			}
		},
		'.',
		'(' // Trigger characters
	);

	context.subscriptions.push(sqlProvider);
}

function registerComponentProvider(context: ExtensionContext) {
	console.log('register')
	// const config = workspace.getConfiguration('evidence');
	// const autocompleteEnabled = config.get('enableComponentAutocomplete');

	// if (!autocompleteEnabled) {
	// 	return;
	// }

	const componentProvider = languages.registerCompletionItemProvider(
		['emd'], // Add other file types if needed
		{
			async provideCompletionItems(document, position) {
				console.log('provideCompletionItems')
				const isComponentContext = isInComponentContext(document, position);
				const languageId = document.languageId;
				console.log('isComponentContext', isComponentContext)
				await updateEditorConfigForLanguage(languageId, isComponentContext);
				console.log('proding...')
				return provideComponentCompletionItems(document, position);
			},
		},
		'{',
		' ', // Trigger completion after a space (inside a tag)
	);

	context.subscriptions.push(componentProvider);
}

function isInSQLContext(document: TextDocument, position: Position) {
	const isSQL = isInSQLCodeBlock(document, position) || isInQueriesDirectory(document);
	isSQLContext = isSQL;
	commands.executeCommand(Commands.SetContext, Context.isSQLContext, isSQL);

	return isSQL;
}

function isInComponentContext(document: TextDocument, position: Position): boolean {
	const text = document.getText();
	const offset = document.offsetAt(position);

	// Search backward to find the nearest `<`
	const backwardText = text.slice(0, offset);

	const openTagIndex = backwardText.lastIndexOf('<');
	const closeTagIndex = backwardText.lastIndexOf('>');

	if (openTagIndex === -1 || closeTagIndex > openTagIndex) {
		console.log('No opening tag found.');
		return false;
	}

	// Extract the tag starting from the nearest `<`
	const componentPattern = /^<([A-Za-z0-9]+)(?:\s[\s\S]*?)/;
	const match = componentPattern.exec(backwardText.slice(openTagIndex, offset));

	if (match) {
		return true;
	} else {
		return false;
	}
}



function isInSQLCodeBlock(document: TextDocument, position: Position): boolean {
	const text = document.getText();
	const offset = document.offsetAt(position);

	// Matches ``` followed by optional "sql " and anything until a newline, then captures the block content until closing ```
	const sqlCodeBlockPattern = /```(?:sql\s+)?[^\n]*\n([\s\S]*?)```/g;
	// const sqlCodeBlockPattern = /```([\s\S]+?)```/g;
	let match;

	while ((match = sqlCodeBlockPattern.exec(text)) !== null) {
		const start = match.index + match[0].indexOf('\n') + 1; // Position after the opening line
		const end = match.index + match[0].length - 3; // Position before the closing backticks

		if (offset >= start && offset <= end) {
			return true;
		}
	}

	return false;
}

const duckdbKeywords = [
	'ANY',
	'ASC',
	'BETWEEN',
	'CROSS JOIN',
	'DESC',
	'DISTINCT',
	'ELSE',
	'END',
	'EXISTS',
	'EXTRACT',
	'FALSE',
	'FROM',
	'FULL JOIN',
	'GROUP BY',
	'GROUP BY ALL',
	'HAVING',
	'ILIKE',
	'IN',
	'INNER JOIN',
	'INTERSECT',
	'IS',
	'JOIN',
	'LEFT JOIN',
	'LIKE',
	'LIMIT',
	'NATURAL JOIN',
	'NOT',
	'NULL',
	'OFFSET',
	'ON',
	'ORDER BY',
	'OUTER JOIN',
	'PARTITION BY',
	'RIGHT JOIN',
	'SELECT',
	'SIMILAR TO',
	'THEN',
	'TRUE',
	'UNION',
	'UNION ALL',
	'UNIQUE',
	'USING',
	'VALUES',
	'WHEN',
	'WHERE',
	'WITH'
];

const duckdbFunctions = [
	{
		name: 'DATE_TRUNC',
		detail: 'DATE_TRUNC(date_part, column)',
		snippet: "DATE_TRUNC('${1:day}', ${2:column})",
		documentation: 'Truncates a date to the specified date part.'
	},
	{
		name: 'SUM',
		detail: 'SUM(column)',
		snippet: 'SUM(${1:column})',
		documentation: 'Calculates the sum of values within a column'
	},
	{
		name: 'COUNT',
		detail: 'COUNT(column)',
		snippet: 'COUNT(${1:column})',
		documentation: 'Calculates the count of rows within a column'
	},
	{
		name: 'AVG',
		detail: 'AVG(column)',
		snippet: 'AVG(${1:column})',
		documentation: 'Calculates the average of values within a column'
	},
	{
		name: 'MIN',
		detail: 'MIN(column)',
		snippet: 'MIN(${1:column})',
		documentation: 'Calculates the minimum of values within a column'
	},
	{
		name: 'MAX',
		detail: 'MAX(column)',
		snippet: 'MAX(${1:column})',
		documentation: 'Calculates the maximum of values within a column'
	},
	{
		name: 'MEDIAN',
		detail: 'MEDIAN(column)',
		snippet: 'MEDIAN(${1:column})',
		documentation: 'Calculates the median of values within a column'
	},
	{
		name: 'MODE',
		detail: 'MODE(column)',
		snippet: 'MODE(${1:column})',
		documentation: 'Calculates the mode of values within a column'
	},
	{
		name: 'DATE_ADD',
		detail: 'DATE_ADD(date, interval)',
		snippet: 'DATE_ADD(${1:date}, INTERVAL ${2:X MONTH})',
		documentation: 'Adds the interval to the date'
	},
	{
		name: 'DATE_SUB',
		detail: 'DATE_SUB(date, interval)',
		snippet: 'DATE_SUB(${1:date}, INTERVAL ${2:X MONTH})',
		documentation: 'Subtracts the interval from the date'
	},
	{
		name: 'DATE_PART',
		detail: 'DATE_PART(date_part, date)',
		snippet: "DATE_PART('${1:year}',date)",
		documentation: 'Returns the specified date part from the date'
	},
	{
		name: 'DATE_DIFF',
		detail: 'DATE_DIFF(date_part, start_date, end_date)',
		snippet: "DATE_DIFF('${1:month}', ${2:start_date}, ${3:end_date})",
		documentation: 'Returns the difference between two dates in the specified time grain'
	},
	{
		name: 'LAST_DAY',
		detail: 'LAST_DAY(date)',
		snippet: 'LAST_DAY(${1:date})',
		documentation: 'The last day of the corresponding month in the date'
	},
	{
		name: 'TODAY',
		detail: 'TODAY()',
		snippet: 'TODAY()',
		documentation: 'Current date'
	},
	{
		name: 'CURRENT_DATE',
		detail: 'CURRENT_DATE()',
		snippet: 'CURRENT_DATE()',
		documentation: 'Current date'
	},
	{
		name: 'STRFTIME',
		detail: 'STRFTIME(date, format)',
		snippet: "STRFTIME(${1:date}, '${2:%a, %-d %B %Y}')",
		documentation: 'Converts a date to a string according to the format supplied'
	},
	{
		name: 'ARRAY_AGG',
		detail: "ARRAY_AGG({'col1': column1, `col2`: column2})",
		snippet: "ARRAY_AGG({'${1:col1}': ${2:column1}, `${3:col2}`: ${4:column2}})",
		documentation: 'Create an array within a table cell'
	},
	{
		name: 'LENGTH',
		detail: 'LENGTH(string)',
		snippet: 'LENGTH(${1:string})',
		documentation: 'Number of characters in string'
	},
	{
		name: 'EXTRACT',
		detail: 'EXTRACT(date_part FROM date)',
		snippet: "EXTRACT('${1:year}' FROM ${2:date})",
		documentation: 'Returns the specified date part from the date'
	},
	{
		name: 'LOWER',
		detail: 'LOWER(string)',
		snippet: 'LOWER(${1:string})',
		documentation: 'Converts string to lowercase'
	},
	{
		name: 'UPPER',
		detail: 'UPPER(string)',
		snippet: 'UPPER(${1:string})',
		documentation: 'Converts string to uppercase'
	},
	{
		name: 'LEFT',
		detail: 'LEFT(string, count)',
		snippet: 'LEFT(${1:string}, ${2:count})',
		documentation: 'Extracts the specified number of characters from the left side of the string'
	},
	{
		name: 'RIGHT',
		detail: 'RIGHT(string, count)',
		snippet: 'RIGHT(${1:string}, ${2:count})',
		documentation: 'Extracts the specified number of characters from the right side of the string'
	},
	{
		name: 'TRIM',
		detail: 'TRIM(string)',
		snippet: 'TRIM(${1:string})',
		documentation: 'Removes whitespace from both sides of the string'
	},
	{
		name: 'SUBSTRING',
		detail: 'SUBSTRING(string, start, length)',
		snippet: 'SUBSTRING(${1:string}, ${2:start}, ${3:length})',
		documentation:
			'Extracts a substring starting at the start character and extending for characters supplied in length. Note that a start value of 1 refers to the first character of the string'
	},
	{
		name: 'STRPOS',
		detail: 'STRPOS(string, search_string)',
		snippet: 'STRPOS(${1:string}, ${2:search_string})',
		documentation:
			'Returns location of first occurrence of search_string in string, counting from 1. Returns 0 if no match found'
	},
	{
		name: 'STARTS_WITH',
		detail: 'STARTS_WITH(string, search_string)',
		snippet: 'STARTS_WITH(${1:string}, ${2:search_string})',
		documentation: 'Return true if string begins with search_string'
	},
	{
		name: 'CAST',
		detail: 'CAST(column AS type)',
		snippet: 'CAST(${1:column} AS ${2:INTEGER})',
		documentation: 'Converts value to the specified type'
	},
	{
		name: 'COUNT_IF',
		detail: 'COUNT_IF(x)',
		snippet: 'COUNT_IF(${1:x})',
		documentation: 'Returns 1 per row where x is true or a non-zero number'
	},
	{
		name: 'FILTER',
		detail: 'FILTER (x)',
		snippet: 'FILTER (${1:x})',
		documentation:
			'Filters an aggregation for rows where x is true. x is a logical expression - e.g., FILTER (year = 2023)'
	},
	{
		name: 'IFNULL',
		detail: 'IFNULL(value, fallback_value)',
		snippet: 'IFNULL(${1:value}, ${2:fallback_value})',
		documentation:
			'Returns the first value if it is not null. Otherwise, returns the fallback_value'
	},
	{
		name: 'COALESCE',
		detail: 'COALESCE(value, ...)',
		snippet: 'COALESCE(${1:value1}, ${2:value2})',
		documentation: 'Returns the first value that is non-null'
	},
	{
		name: 'NULLIF',
		detail: 'NULLIF(a, b)',
		snippet: 'NULLIF(${1:a}, ${2:b})',
		documentation: 'Returns null if a=b. Otherwise returns a'
	},
	{
		name: 'CORR',
		detail: 'CORR(y, x)',
		snippet: 'CORR(${1:y}, ${2:x})',
		documentation: 'Returns the correlation coefficient'
	},
	{
		name: 'LAG',
		detail: 'LAG(column, row_offset) OVER (ORDER BY order_column)',
		snippet: 'LAG(${1:column}, ${2:row_offset}) OVER (ORDER BY ${3:order_column})',
		documentation:
			'Returns the value X rows below the current value, where x is determined by row_offset. A third argument can be supplied to indicate the value that should be inserted if the row does not exist - by default this is null'
	},
	{
		name: 'LEAD',
		detail: 'LEAD(column, row_offset) OVER (ORDER BY order_column)',
		snippet: 'LEAD(${1:column}, ${2:row_offset}) OVER (ORDER BY ${3:order_column})',
		documentation:
			'Returns the value X rows above the current value, where x is determined by row_offset. A third argument can be supplied to indicate the value that should be inserted if the row does not exist - by default this is null'
	},
	{
		name: 'ROW_NUMBER',
		detail: 'ROW_NUMBER() OVER (ORDER BY order_column)',
		snippet: 'ROW_NUMBER() OVER (ORDER BY ${1:order_column})',
		documentation: 'Returns the distinct index number of the row'
	},
	{
		name: 'RANK',
		detail: 'RANK() OVER (ORDER BY order_column)',
		snippet: 'RANK() OVER (ORDER BY ${1:order_column})',
		documentation:
			'Returns the rank of the current row based on the values in the order_column. If 2 order_column values are identical, the rank will be the same'
	},
	{
		name: 'DENSE_RANK',
		detail: 'DENSE_RANK() OVER (ORDER BY order_column)',
		snippet: 'DENSE_RANK() OVER (ORDER BY ${1:order_column})',
		documentation:
			'Same as RANK(), but does not increment after a tie. Returns the rank of the current row based on the values in the order_column. If 2 order_column values are identical, the rank will be the same.'
	},
	{
		name: 'OVER',
		detail: 'OVER()',
		snippet: 'OVER()',
		documentation:
			'Used in window functions to determine which order or partitions to use for the window. Follows another function.'
	},
	{
		name: 'LEAST',
		detail: 'LEAST(value1, value2)',
		snippet: 'LEAST(${1:value1}, ${2:value2})',
		documentation:
			'Returns the lowest value of the provided values. Can supply more than 2 values if needed.'
	},
	{
		name: 'PIVOT',
		detail: 'PIVOT dataset\nON columns_to_pivot\nUSING (aggregation)',
		snippet: 'PIVOT ${1:dataset}\nON ${2:columns_to_pivot}\nUSING (${3:aggregation})',
		documentation:
			'Creates columns from the entries in columns_to_pivot and fills in the cells with aggregation'
	},
	{
		name: 'CASE',
		detail: 'CASE\n\tWHEN expr THEN value\n\tELSE fallback_value\nEND AS alias',
		snippet:
			'CASE\n\tWHEN ${1:expr} THEN ${2:value}\n\tELSE ${3:fallback_value}\nEND AS ${4:alias}',
		documentation: 'Conditional statement'
	},
	{
		name: 'EXCLUDE',
		detail: 'EXCLUDE (column)',
		snippet: 'EXCLUDE (${1:column})',
		documentation: 'Exclude specific columns - use after a select *'
	}
];

const duckdbCompletionItems = duckdbKeywords.map((keyword) => {
	return new CompletionItem(keyword, CompletionItemKind.Keyword);
});

function isInQueriesDirectory(document: TextDocument): boolean {
	const filePath = document.uri.fsPath;
	const queriesDir = path.join(workspace.workspaceFolders?.[0].uri.fsPath || '', 'queries');
	return filePath.endsWith('.sql') && filePath.startsWith(queriesDir);
}

async function updateEditorConfigForLanguage(languageId: string, autoCompleteContext: boolean) {
	const config = workspace.getConfiguration('editor', { languageId });
	const customConfig = workspace.getConfiguration('evidence');
	const sqlAcceptSuggestionsOnEnter = customConfig.get('sqlAcceptSuggestionsOnEnter');
	const slashCommandsAcceptSuggestionsOnEnter = customConfig.get(
		'slashCommandsAcceptSuggestionsOnEnter'
	);

	try {
		if (autoCompleteContext) {
			await config.update(
				'acceptSuggestionOnEnter',
				sqlAcceptSuggestionsOnEnter,
				ConfigurationTarget.Workspace
			);
			await config.update(
				'quickSuggestions',
				{ other: true, comments: false, strings: false },
				ConfigurationTarget.Workspace
			);
			await config.update('quickSuggestionsDelay', 0, ConfigurationTarget.Workspace);
		} else {
			await config.update(
				'acceptSuggestionOnEnter',
				slashCommandsAcceptSuggestionsOnEnter,
				ConfigurationTarget.Workspace
			);
			await config.update(
				'quickSuggestions',
				{ other: false, comments: false, strings: false },
				ConfigurationTarget.Workspace
			);
			await config.update('quickSuggestionsDelay', 300, ConfigurationTarget.Workspace);
		}

		// Log the current configuration to verify
		const currentAcceptSuggestionOnEnter = config.get('acceptSuggestionOnEnter');
		const currentQuickSuggestions = config.get('quickSuggestions');
	} catch (error) {
		console.error(`Error updating editor config for ${languageId}:`, error);
	}
}

function applyCaseToKeywords(keywords: any[], setting: string) {
	return setting === 'lowercase' ? keywords.map((keyword) => keyword.toLowerCase()) : keywords;
}

function applyCaseToFunction(
	func:
		| { name: string; detail: string; snippet: string; documentation: string }
		| { name: string; detail: string; snippet: string; documentation?: undefined },
	setting: string
) {
	return {
		name: applyCaseToKeywords([func.name], setting)[0],
		detail: applyCaseToKeywords([func.detail], setting)[0],
		documentation: func.documentation,
		snippet: applyCaseToKeywords([func.snippet], setting)[0]
	};
}

function extractCTENames(query: string) {
	// Updated regex to match all CTEs after 'WITH' and commas
	const cteRegex = /WITH\s+([a-zA-Z0-9_]+)\s+AS\s*\(|,\s*([a-zA-Z0-9_]+)\s+AS\s*\(/gi;
	const matches = [];
	let match;

	while ((match = cteRegex.exec(query)) !== null) {
		// Match either the first group (after WITH) or second group (after comma)
		matches.push(match[1] || match[2]);
	}

	return matches;
}

function extractInputNames() {

	const editor = window.activeTextEditor;

	if (!editor) {
		window.showErrorMessage('No active editor. Open a document to extract query names.');
		return [];
	}

	const text = editor.document.getText();

	// Regex to match standalone `name=` props in any Svelte component
	const nameRegex = /\bname=(["']?)([a-zA-Z0-9_]+)\1/g;
	const matches = [];
	let match;

	while ((match = nameRegex.exec(text)) !== null) {
		matches.push(match[2]); // Capture the value of the 'name' attribute
	}

	return matches;
}


async function provideSQLCompletionItems(
	document: TextDocument,
	position: Position,
	context: string
) {
	const completionItems = [];
	const schemaItems = await getSchemaItems();
	const textBeforePosition = document.getText(new Range(new Position(0, 0), position));
	const config = workspace.getConfiguration('evidence');
	const sqlKeywordSuggestionCase = config.get('sqlKeywordSuggestionCase', 'uppercase') as string;

	const fromPattern = /(?<!\bextract\([^\)]*)\bFROM\s+([a-zA-Z0-9_\.]*)$/i;
	const joinPattern = /\bJOIN\s+([a-zA-Z0-9_\.]*)$/i;
	const inputPattern = /\$\{inputs\.$/;
	const fromMatch = fromPattern.exec(textBeforePosition);
	const joinMatch = joinPattern.exec(textBeforePosition);
	const inputMatch = inputPattern.exec(textBeforePosition);

	let keywords = [];
	let functions = duckdbFunctions.map((func) =>
		applyCaseToFunction(func, sqlKeywordSuggestionCase)
	);

	keywords = applyCaseToKeywords(duckdbKeywords, sqlKeywordSuggestionCase);

	const keywordCompletionItems = keywords.map(
		(keyword) => new CompletionItem(keyword, CompletionItemKind.Keyword)
	);
	const functionCompletionItems = functions.map((func) => {
		const item = new CompletionItem(func.name, CompletionItemKind.Function);
		item.detail = func.detail;
		item.documentation = new MarkdownString(func.documentation);
		item.insertText = new SnippetString(func.snippet);
		return item;
	});

	// If the cursor is after `${inputs.`, suggest input names
	if (inputMatch) {
		const inputNames = extractInputNames();

		for (const inputName of inputNames) {
			const inputCompletionItem = new CompletionItem(
				inputName,
				CompletionItemKind.Variable
			);
			inputCompletionItem.insertText = inputName;
			inputCompletionItem.detail = 'Input Variable\n\nRemember to use .value or .label if needed';
			completionItems.push(inputCompletionItem);
		}
	} else if (fromMatch || joinMatch) {
		// Only add tables if after FROM
		for (const schemaItem of schemaItems) {
			const schemaName = schemaItem.label;
			const tables = await schemaItem.getTables();

			for (const table of tables) {
				const tableName = table.label;

				const tableCompletionItem = new CompletionItem(
					`${schemaName}.${tableName}`,
					CompletionItemKind.Struct
				);
				completionItems.push(tableCompletionItem);
			}
		}

		const queryNames = extractQueryNames();

		for (const queryName of queryNames) {
			const queryNameCompletionItem = new CompletionItem(
				queryName,
				CompletionItemKind.Interface
			);
			queryNameCompletionItem.insertText = `\$\{${queryName}}`
			completionItems.push(queryNameCompletionItem)
		}

		const cteNames = extractCTENames(textBeforePosition);

		for (const cteName of cteNames) {
			const cteNameCompletionItem = new CompletionItem(
				cteName,
				CompletionItemKind.File
			);
			cteNameCompletionItem.insertText = `${cteName}`;
			completionItems.push(cteNameCompletionItem);
		}

	} else {
		completionItems.push(...keywordCompletionItems);
		completionItems.push(...functionCompletionItems);

		// Add schema, table, and column items for other contexts
		for (const schemaItem of schemaItems) {
			const schemaName = schemaItem.label;
			const tables = await schemaItem.getTables();

			for (const table of tables) {
				const tableName = table.label;

				const tableCompletionItem = new CompletionItem(
					`${schemaName}.${tableName}`,
					CompletionItemKind.Struct
				);
				completionItems.push(tableCompletionItem);

				for (const column of table.columns) {
					const columnName = column.label;
					const columnCompletionItem = new CompletionItem(
						{
							label: `${columnName}`,
							detail: ` ${schemaName}.${tableName}`
						},
						CompletionItemKind.Field
					);

					completionItems.push(columnCompletionItem);
				}
			}
		}
	}

	return completionItems;
}

function extractQueryNames(): string[] {
	const editor = window.activeTextEditor;

	if (!editor) {
		window.showErrorMessage('No active editor. Open a document to extract query names.');
		return [];
	}

	const text = editor.document.getText();
	const queries = new Set<string>(); // Use a Set to avoid duplicates

	// Frontmatter: `queries: - myquery1: myquery1.sql`
	const frontmatterPattern = /^queries:\s*([\s\S]*?)(?:\n{2,}|\n$|$)/m; // Match the `queries` block
	const frontmatterMatch = text.match(frontmatterPattern);
	if (frontmatterMatch) {
		const queryLines = frontmatterMatch[1].split('\n').map((line) => line.trim());
		for (const line of queryLines) {
			const match = line.match(/- ([a-zA-Z0-9_]+):/); // Extract query names like `- myquery1:`
			if (match) {
				queries.add(match[1]);
			}
		}
	}

	// Non-SQL Markdown Blocks: ```myquery1
	const nonSQLPattern = /```([a-zA-Z0-9_]+)\n/g;
	const nonSQLMatches = [...text.matchAll(nonSQLPattern)];
	for (const match of nonSQLMatches) {
		queries.add(match[1]);
	}

	// SQL Markdown Blocks: ```sql myquery1
	const sqlPattern = /```sql\s+([a-zA-Z0-9_]+)\n/g;
	const sqlMatches = [...text.matchAll(sqlPattern)];
	for (const match of sqlMatches) {
		queries.add(match[1]);
	}

	return [...queries]; // Convert Set to Array for the final result
}



async function provideComponentCompletionItems(document: TextDocument, position: Position) {
	if (!isInComponentContext(document, position)) {
		console.log('Not in component context, returning no suggestions.');
		return []; // Return no suggestions
	}

	console.log('In component context, providing suggestions...');
	const completionItems: CompletionItem[] = [];
	const textBeforeCursor = document.getText(new Range(new Position(0, 0), position));

	// Extract the component name from the open tag
	const lastOpenTagIndex = textBeforeCursor.lastIndexOf('<');
	if (lastOpenTagIndex === -1) {
		return []; // No opening tag found
	}

	// Extract the nearest tag's text
	const nearestTagText = textBeforeCursor.slice(lastOpenTagIndex);
	const match = /^<([A-Za-z0-9]+)\s?/.exec(nearestTagText);
	if (!match) {
		console.log('No valid component name found in context.');
		return []; // No valid component found
	}

	const componentName = match[1];
	console.log('Component name:', componentName);
	const componentDefinition = evidenceComponents[componentName];

	if (!componentDefinition) {
		console.log(`No matching component found for "${componentName}".`);
		return []; // No suggestions for unknown components
	}

	const bracePattern = /=\{([^}]*)$/g; // Match `={` and ensure no closing brace `}` has occurred yet
	const braceMatch = bracePattern.exec(textBeforeCursor);

	if (braceMatch) {
		// if (false) {
		const queryNames = extractQueryNames();

		for (const queryName of queryNames) {
			const queryNameCompletionItem = new CompletionItem(
				queryName,
				CompletionItemKind.Interface
			);
			queryNameCompletionItem.insertText = `${queryName}`;
			completionItems.push(queryNameCompletionItem);
		}

	} else {

		// Add props as suggestions and include sortText based on rank
		for (const prop of componentDefinition.props) {
			const item = new CompletionItem(prop.name, CompletionItemKind.Property);
			// item.insertText = new SnippetString(prop.name + '=');
			item.documentation = new MarkdownString(
				`**Description:** ${prop.description || 'No description available'}\n\n` +
				`**Type:** ${prop.type}\n\n` +
				`**Default:** ${prop.defaultValue || 'None'}\n\n` +
				`**Options:** ${prop.options?.replace('{[','').replace(']}', '')}`),
			item.insertText = new SnippetString(
				prop.name === 'data' ? `${prop.name}={\${1}}` : `${prop.name}=`
			);
			item.sortText = String(prop.rank).padStart(3, '0'); // Ensure sortText is always defined
			completionItems.push(item);
		}

		// Explicit sorting to ensure rank is respected
		completionItems.sort((a, b) => a.sortText!.localeCompare(b.sortText!)); // Use the `!` to assert sortText is defined

	}

	return completionItems;
}


async function getSchemaItems(): Promise<SchemaItem[]> {
	const manifestUri = await getManifestUri();
	if (!manifestUri) {
		return [];
	}

	const manifest = await getManifest(manifestUri);
	if (!manifest) {
		return [];
	}

	// ./.evidence/template/static/data/manifest.json -> ./.evidence/template
	const templateDirectory = path.dirname(path.dirname(path.dirname(manifestUri.fsPath)));

	return Object.entries(manifest.renderedFiles).map(([schemaName, schemaFiles]) => {
		const schemaFilesUris = schemaFiles.map((schemaFile) => {
			const schemaFilePath = `${schemaFile.slice(0, -'.parquet'.length)}.schema.json`;
			return Uri.file(path.join(templateDirectory, schemaFilePath));
		});

		return new SchemaItem(schemaName, schemaFilesUris);
	});
}

function registerCopyCommands(context: ExtensionContext) {
	context.subscriptions.push(
		commands.registerCommand('evidence.copyColumnName', (item: ColumnItem) => {
			let label = '';

			if (typeof item.label === 'string') {
				label = item.label;
			} else if (item.label && typeof item.label.label === 'string') {
				label = item.label.label;
			}

			if (label) {
				env.clipboard.writeText(label);
				window.showInformationMessage(`Copied: ${label}`);
			}
		}),
		commands.registerCommand('evidence.copyTableName', (item: TableItem) => {
			const label = `${item.id}`;
			env.clipboard.writeText(label);
			window.showInformationMessage(`Copied: ${label}`);
		}),
		commands.registerCommand('evidence.insertColumnName', (item: ColumnItem) => {
			let label = '';

			if (typeof item.label === 'string') {
				label = item.label;
			} else if (item.label && typeof item.label.label === 'string') {
				label = item.label.label;
			}

			if (label) {
				insertTextAtCursor(label);
				window.showInformationMessage(`Inserted: ${label}`);
			}
		}),
		commands.registerCommand('evidence.insertTableName', (item: TableItem) => {
			const label = `${item.id}`;
			insertTextAtCursor(label);
			window.showInformationMessage(`Inserted: ${label}`);
		})
	);
}

function insertTextAtCursor(text: string) {
	const editor = window.activeTextEditor;
	if (editor) {
		const position = editor.selection.active;
		editor.edit((editBuilder) => {
			editBuilder.insert(position, text);
		});
	}
}

interface ComponentProp {
	name: string;
	description: string | null;
	required: boolean;
	type: string;
	options?: string;
	defaultValue: string | null;
	rank: number;
}

interface ComponentDefinition {
	props: ComponentProp[];
}

type ComponentList = Record<string, ComponentDefinition>;

let evidenceComponents: ComponentList = {};

function loadComponents() {
	try {
		const filePath = path.resolve(__dirname, '../src/props_list.json');
		const data = fs.readFileSync(filePath, 'utf-8');
		evidenceComponents = JSON.parse(data) as ComponentList;
		console.log('Components loaded successfully:', evidenceComponents);
	} catch (error) {
		console.error('Failed to load components:', error);
		evidenceComponents = {}; // Fallback to an empty object
	}
}


/**
 * Activates Evidence vscode extension.
 *
 * @param context Extension context.
 */
export async function activate(context: ExtensionContext) {
	setExtensionContext(context);
	registerCommands(context);
	loadComponents();

	await initializeTelemetryService();

	// Ensure it gets properly disposed. Upon disposal, the events will be flushed
	if (telemetryService) {
		context.subscriptions.push(telemetryService);
	}

	// register markdown symbol provider
	const markdownLanguage = { language: 'emd', scheme: 'file' };
	const provider = new MarkdownSymbolProvider();
	// const selector: DocumentSelector = { language: 'emd', scheme: 'file' };

	// const symbolProviderRegistration = languages.registerDocumentSymbolProvider(
	//     selector,
	//     provider
	// );

	// // Add to context subscriptions to ensure proper disposal
	// context.subscriptions.push(symbolProviderRegistration);
	// languages.registerDocumentSymbolProvider(markdownLanguage, provider);

	// load package.json
	const workspacePackageJson = await loadPackageJson();

	// get all evidence files in workspace
	const evidenceFiles = await workspace.findFiles('**/.evidence/**/*.*', '**/node_modules/**');

	// check for evidence app files and dependencies in the loaded package.json
	if (
		workspace.workspaceFolders &&
		evidenceFiles.length > 0 &&
		workspacePackageJson &&
		hasDependency(workspacePackageJson, '@evidence-dev/evidence')
	) {
		try {
			telemetryService?.sendEvent('preActivate');

			let sqlDecorationType: TextEditorDecorationType;
			let frontmatterDecorationType: TextEditorDecorationType;
			let svelteEachDecorationType: TextEditorDecorationType;
			let svelteIfDecorationType: TextEditorDecorationType;

			const getThemeBasedDecorationType = () => {
				const colorTheme = window.activeColorTheme.kind;
				const isLightTheme = colorTheme === ColorThemeKind.Light;
				sqlDecorationType = window.createTextEditorDecorationType({
					backgroundColor: isLightTheme ? 'rgba(219, 219, 219, 0.2)' : 'rgba(219,219,219, 0.03)', // light blue or darker blue background with some transparency
					isWholeLine: true
				});

				frontmatterDecorationType = window.createTextEditorDecorationType({
					backgroundColor: isLightTheme ? 'rgba(84, 134, 209, 0.04)' : 'rgba(84, 134, 209, 0.05)', // light blue or darker blue background with some transparency
					isWholeLine: true
				});

				svelteEachDecorationType = window.createTextEditorDecorationType({
					backgroundColor: isLightTheme ? 'rgba(156, 58, 176, 0.05)' : 'rgba(75, 0, 130, 0.05)', // light purple or darker purple background with some transparency
					isWholeLine: true
				});

				svelteIfDecorationType = window.createTextEditorDecorationType({
					backgroundColor: isLightTheme ? 'rgba(255, 165, 0, 0.08)' : 'rgba(255, 140, 0, 0.05)', // light orange or darker orange background with some transparency
					isWholeLine: true
				});
			};

			const clearDecorations = (editor: TextEditor) => {
				if (sqlDecorationType) {
					editor.setDecorations(sqlDecorationType, []);
				}
				if (frontmatterDecorationType) {
					editor.setDecorations(frontmatterDecorationType, []);
				}
				if (svelteEachDecorationType) {
					editor.setDecorations(svelteEachDecorationType, []);
				}
				if (svelteIfDecorationType) {
					editor.setDecorations(svelteIfDecorationType, []);
				}
			};

			const highlightCodeBlocks = (editor: TextEditor) => {
				if (!editor) {
					return;
				}

				const config = workspace.getConfiguration('evidence');
				const enableSqlBackground = config.get<boolean>('enableSqlBackground', true);
				const enableFrontmatterBackground = config.get<boolean>(
					'enableFrontmatterBackground',
					true
				);
				const enableIfBackground = config.get<boolean>('enableIfBackground', true);
				const enableEachBackground = config.get<boolean>('enableEachBackground', true);

				const text = editor.document.getText();

				const sqlRegex = /```[\s\S]*?```/gm;
				const frontmatterRegex = /^---[\s\S]*?---/g;
				const svelteEachRegex = /{#each[\s\S]*?{\/each}/gm;
				const svelteIfRegex = /{#if[\s\S]*?{\/if}/gm;

				const sqlRanges: DecorationOptions[] = [];
				const frontmatterRanges: DecorationOptions[] = [];
				const svelteEachRanges: DecorationOptions[] = [];
				const svelteIfRanges: DecorationOptions[] = [];

				let match;
				if (enableSqlBackground) {
					while ((match = sqlRegex.exec(text)) !== null) {
						const startPos = editor.document.positionAt(match.index);
						const endPos = editor.document.positionAt(match.index + match[0].length);
						const range = new Range(startPos, endPos);
						sqlRanges.push({ range });
					}
				}

				if (enableFrontmatterBackground) {
					while ((match = frontmatterRegex.exec(text)) !== null) {
						const startPos = editor.document.positionAt(match.index);
						const endPos = editor.document.positionAt(match.index + match[0].length);
						const range = new Range(startPos, endPos);
						frontmatterRanges.push({ range });
					}
				}

				if (enableEachBackground) {
					while ((match = svelteEachRegex.exec(text)) !== null) {
						const startPos = editor.document.positionAt(match.index);
						const endPos = editor.document.positionAt(match.index + match[0].length);
						const range = new Range(startPos, endPos);
						svelteEachRanges.push({ range });
					}
				}

				const svelteIfRangesRecursively = (regex: RegExp, text: string, startIndex = 0) => {
					let nestedCount = 0;
					let startPos: number | null = null;
					const ranges: Range[] = [];

					let match;
					regex.lastIndex = startIndex;
					while ((match = regex.exec(text)) !== null) {
						if (match[0].startsWith('{#if')) {
							if (nestedCount === 0) {
								startPos = match.index;
							}
							nestedCount++;
						} else if (match[0] === '{/if}') {
							nestedCount--;
							if (nestedCount === 0 && startPos !== null) {
								const start = editor.document.positionAt(startPos);
								const end = editor.document.positionAt(match.index + match[0].length);
								ranges.push(new Range(start, end));
								startPos = null;
							}
						}
					}
					return ranges;
				};

				if (enableIfBackground) {
					svelteIfRangesRecursively(/({#if.*?})|({\/if})/gm, text).forEach((range) => {
						svelteIfRanges.push({ range });
					});
				}

				const svelteEachRangesRecursively = (regex: RegExp, text: string, startIndex = 0) => {
					let nestedCount = 0;
					let startPos: number | null = null;
					const ranges: Range[] = [];

					let match;
					regex.lastIndex = startIndex;
					while ((match = regex.exec(text)) !== null) {
						if (match[0].startsWith('{#each')) {
							if (nestedCount === 0) {
								startPos = match.index;
							}
							nestedCount++;
						} else if (match[0] === '{/each}') {
							nestedCount--;
							if (nestedCount === 0 && startPos !== null) {
								const start = editor.document.positionAt(startPos);
								const end = editor.document.positionAt(match.index + match[0].length);
								ranges.push(new Range(start, end));
								startPos = null;
							}
						}
					}
					return ranges;
				};

				if (enableEachBackground) {
					svelteEachRangesRecursively(/({#each.*?})|({\/each})/gm, text).forEach((range) => {
						svelteEachRanges.push({ range });
					});
				}

				editor.setDecorations(sqlDecorationType, sqlRanges);
				editor.setDecorations(frontmatterDecorationType, frontmatterRanges);
				editor.setDecorations(svelteEachDecorationType, svelteEachRanges);
				editor.setDecorations(svelteIfDecorationType, svelteIfRanges);
			};

			// Initial setup
			getThemeBasedDecorationType();

			window.onDidChangeActiveTextEditor(
				(editor) => {
					if (editor && editor.document.languageId === 'emd') {
						highlightCodeBlocks(editor);
					}
				},
				null,
				context.subscriptions
			);

			workspace.onDidChangeTextDocument(
				(event) => {
					const editor = window.activeTextEditor;
					if (
						editor &&
						event.document === editor.document &&
						editor.document.languageId === 'emd'
					) {
						highlightCodeBlocks(editor);
					}
				},
				null,
				context.subscriptions
			);

			// Reapply decorations on theme change
			window.onDidChangeActiveColorTheme(
				() => {
					// Update decoration types
					getThemeBasedDecorationType();
					// Reapply decorations in the active editor
					const editor = window.activeTextEditor;
					if (editor && editor.document.languageId === 'emd') {
						clearDecorations(editor);
						highlightCodeBlocks(editor);
					}
				},
				null,
				context.subscriptions
			);

			// Highlight code blocks in the active editor if it's an emd file
			if (window.activeTextEditor && window.activeTextEditor.document.languageId === 'emd') {
				highlightCodeBlocks(window.activeTextEditor);
			}

			// set up file watcher for .profile.json
			const workspaceFolder = workspace.workspaceFolders?.[0];

			// check if evidence project is in subdirectory:
			const packageJsonFolder = await getPackageJsonFolder();

			if (workspaceFolder) {
				const baseEvidencePath = path.join(
					workspaceFolder.uri.fsPath,
					packageJsonFolder ?? '',
					'.evidence'
				);
				const oldProfilePath = path.join(baseEvidencePath, 'template', '.profile.json');
				const newProfilePath = path.join(baseEvidencePath, 'customization', '.profile.json');

				const updateProfileDetails = (profilePath: string) => {
					try {
						if (!fs.existsSync(profilePath)) {
							throw new Error('Profile file does not exist');
						}

						const content = fs.readFileSync(profilePath, 'utf8');
						if (!content) {
							throw new Error('Profile file is empty');
						}

						const profile = JSON.parse(content);
						if (!profile || typeof profile !== 'object') {
							throw new Error('Invalid profile data');
						}

						if (!profile.anonymousId || !profile.traits || !profile.traits.projectCreated) {
							throw new Error('Required profile fields are missing');
						}
						telemetryService?.updateProfileDetails(
							profile.anonymousId,
							profile.traits.projectCreated
						);
					} catch (err) {
						if (err instanceof Error) {
							telemetryService?.clearProfileDetails();
							telemetryService?.sendEvent('telemetryError', {
								location: 'updateProfileDetailsFromJson',
								error: err.message
							});
						} else {
							telemetryService?.clearProfileDetails();
							// Send a generic error message if the error type is unknown
							telemetryService?.sendEvent('telemetryError', {
								location: 'updateProfileDetailsFromJson',
								error: 'Unknown error'
							});
						}
					}
				};

				const handleProfileChange = () => {
					if (fs.existsSync(newProfilePath)) {
						updateProfileDetails(newProfilePath);
					} else if (fs.existsSync(oldProfilePath)) {
						updateProfileDetails(oldProfilePath);
					} else {
						telemetryService?.clearProfileDetails();
					}
				};

				const oldProfileWatcher = workspace.createFileSystemWatcher(oldProfilePath);
				oldProfileWatcher.onDidChange(handleProfileChange);
				oldProfileWatcher.onDidCreate(() => {
					handleProfileChange();
					telemetryService?.sendEvent('profileCreated');
				});
				oldProfileWatcher.onDidDelete(handleProfileChange);
				context.subscriptions.push(oldProfileWatcher);

				const newProfileWatcher = workspace.createFileSystemWatcher(newProfilePath);
				newProfileWatcher.onDidChange(handleProfileChange);
				newProfileWatcher.onDidCreate(() => {
					handleProfileChange();
					telemetryService?.sendEvent('profileCreated');
				});
				newProfileWatcher.onDidDelete(handleProfileChange);
				context.subscriptions.push(newProfileWatcher);

				// Initial check
				handleProfileChange();

				// Git watcher
				const gitPath = path.join(workspaceFolder.uri.fsPath, '.git');
				const gitWatcher = workspace.createFileSystemWatcher(gitPath);

				const updateGitCheck = () => {
					try {
						const gitCheck = isGitRepository(workspaceFolder.uri.fsPath).toString();
						telemetryService?.updateGitCheck(gitCheck);
					} catch (err) {
						telemetryService?.clearGitCheck();
					}
				};

				gitWatcher.onDidChange(updateGitCheck);
				gitWatcher.onDidCreate(updateGitCheck);
				gitWatcher.onDidDelete(() => telemetryService?.clearGitCheck());

				context.subscriptions.push(gitWatcher);

				// initial check
				updateGitCheck();
			}

			// get slashCommands setting from extension settings:
			const slashCommands: boolean = <boolean>getConfig(Settings.SlashCommands);

			// Set context for slashCommands setting
			commands.executeCommand(Commands.SetContext, Context.slashCommands, slashCommands);

			// decorate slash command on activation if the active file is a markdown file and slash commands are enabled
			const openEditor = window.activeTextEditor;
			if (
				openEditor &&
				openEditor.document.fileName.endsWith('.md') &&
				isPagesDirectory() &&
				slashCommands === true &&
				!isInSQLCodeBlock(openEditor.document, openEditor.selection.active) &&
				!isInComponentContext(openEditor.document, openEditor.selection.active)

			) {
				try {
					decorate(openEditor);
				} catch (e) {
					telemetryService?.sendEvent('decorationError');
				}
			}

			window.onDidChangeTextEditorSelection(() => {
				const openEditor = window.activeTextEditor;
				if (
					openEditor &&
					openEditor.document.fileName.endsWith('.md') &&
					isPagesDirectory() &&
					slashCommands === true &&
					!isInSQLCodeBlock(openEditor.document, openEditor.selection.active) &&
					!isInComponentContext(openEditor.document, openEditor.selection.active)
				) {
					try {
						decorate(openEditor);
					} catch (e) {
						telemetryService?.sendEvent('decorationError');
					}
				}
			});

			// Needed for delete key events which are not captured by the onDidChangeTextEditorSelection event
			workspace.onDidChangeTextDocument(() => {
				const openEditor = window.activeTextEditor;
				if (
					openEditor &&
					openEditor.document.fileName.endsWith('.md') &&
					isPagesDirectory() &&
					slashCommands === true &&
					!isInSQLCodeBlock(openEditor.document, openEditor.selection.active) &&
					!isInComponentContext(openEditor.document, openEditor.selection.active)
				) {
					try {
						decorate(openEditor);
					} catch (e) {
						telemetryService?.sendEvent('decorationError');
					}
				}
			});

			// When markdown file is saved:
			workspace.onDidSaveTextDocument((document) => {
				try {
					if (document.fileName.endsWith('.md') && isPagesDirectory()) {
						const isTemplated = /\[.+\]/.test(document.fileName);
						const text = document.getText();
						const codeBlockMatches = (text.match(/```/g) || []).length;
						const numberOfCodeBlocks = codeBlockMatches / 2; // Divide by 2 because each block has opening and closing backticks
						const eachBlocks = (text.match(/\{#each\s+[^}]+\}/g) || []).length;
						const ifBlocks = (text.match(/\{#if\s+[^}]+\}/g) || []).length;
						const svelteComponents = (
							text.match(/<\w+(\s+[^>]*)?\/>|<\w+(\s+[^>]*)?>[\s\S]*?<\/\w+>/g) || []
						).length;
						const expressions = (text.match(/\{[^}]+\}/g) || []).length;
						const dataTables = (text.match(/<DataTable[\s\S]*?(<\/DataTable>|\/>)/g) || []).length;
						const columns = (text.match(/<Column[\s\S]*?(<\/Column>|\/>)/g) || []).length;
						const values = (text.match(/<Value[\s\S]*?(<\/Value>|\/>)/g) || []).length;
						const bigValues = (text.match(/<BigValue[\s\S]*?(<\/BigValue>|\/>)/g) || []).length;
						const charts = (
							text.match(/<\w*(Chart|Plot)\w*[\s\S]*?(<\/\w*(Chart|Plot)\w*>|\/>)/g) || []
						).length;
						const annotations = (
							text.match(/<\w*Reference\w*[\s\S]*?(<\/\w*Reference\w*>|\/>)/g) || []
						).length;

						telemetryService?.sendEvent('saveMarkdown', {
							templated: isTemplated.toString(),
							linesInFile: document.lineCount.toString(),
							charactersInFile: text.length.toString(),
							codeBlocksInFile: numberOfCodeBlocks.toString(),
							ifBlocksInFile: ifBlocks.toString(),
							eachBlocksInFile: eachBlocks.toString(),
							componentsInFile: svelteComponents.toString(),
							expressionsInFile: expressions.toString(),
							dataTablesInFile: dataTables.toString(),
							columnsInFile: columns.toString(),
							valuesInFile: values.toString(),
							bigValuesInFile: bigValues.toString(),
							chartsInFile: charts.toString(),
							annotationsInFile: annotations.toString()
						});
					}
				} catch (e) {
					telemetryService?.sendEvent('telemetryError', { location: 'saveMarkdown' });
				}
			});

			// Track file changes in pages directory:
			workspace.onDidCreateFiles((event) => {
				event.files.forEach((file) => {
					if (file.path.endsWith('.md') && file.path.includes(`${path.sep}pages${path.sep}`)) {
						const isTemplated = /\[.+\]/.test(file.path);
						telemetryService?.sendEvent('createMarkdownFile', {
							templated: isTemplated.toString()
						});
					}
				});
			});

			workspace.onDidDeleteFiles((event) => {
				event.files.forEach((file) => {
					const isTemplated = /\[.+\]/.test(file.path);
					const isInPagesDirectory = file.path.includes(`${path.sep}pages${path.sep}`);

					if (file.path.endsWith('.md') && isInPagesDirectory) {
						telemetryService?.sendEvent('deleteMarkdownFile', {
							templated: isTemplated.toString()
						});
					} else if (isInPagesDirectory) {
						// Assuming it's a directory within 'pages'
						telemetryService?.sendEvent('deleteDirectory', { templated: isTemplated.toString() });
					}
				});
			});

			workspace.onDidCreateFiles((event) => {
				try {
					event.files.forEach((file) => {
						if (
							fs.lstatSync(file.path).isDirectory() &&
							file.path.includes(`${path.sep}pages${path.sep}`)
						) {
							const isTemplated = /\[.+\]/.test(file.path);
							telemetryService?.sendEvent('createDirectory', { templated: isTemplated.toString() });
						}
					});
				} catch (e) {
					telemetryService?.sendEvent('telemetryError', { location: 'createDirectory' });
				}
			});

			// Disable auto save in Codespaces:
			if (process.env.CODESPACES === 'true') {
				// Access workspace configuration
				const config = workspace.getConfiguration();

				// Set autosave to 'on'
				await config.update('files.autoSave', 'off', ConfigurationTarget.Workspace);
			}

			// Activate Telemetry Event:

			// get evidence version
			const evidenceVersion = dependencyVersion(workspacePackageJson, '@evidence-dev/evidence');

			// get information about project
			let markdownFilesCount: number = 0;
			let templatedPagesCount: number = 0;
			let sourcesFilesCount: number = 0;
			let componentsFilesCount: number = 0;
			let evidenceFolderAtRoot: boolean = false;
			if (workspaceFolder) {
				markdownFilesCount = countFilesInDirectory(
					path.join(workspaceFolder?.uri.fsPath, packageJsonFolder ?? '', 'pages'),
					/\.md$/
				);
				templatedPagesCount = countTemplatedPages(
					path.join(workspaceFolder?.uri.fsPath, packageJsonFolder ?? '', 'pages')
				);
				sourcesFilesCount = countFilesInDirectory(
					path.join(workspaceFolder?.uri.fsPath, packageJsonFolder ?? '', 'sources'),
					/.*$/
				);
				componentsFilesCount = countFilesInDirectory(
					path.join(workspaceFolder?.uri.fsPath, packageJsonFolder ?? '', 'components'),
					/.*$/
				);
				evidenceFolderAtRoot = fs.existsSync(
					path.join(workspaceFolder?.uri.fsPath, packageJsonFolder ?? '', '.evidence')
				);
			}

			telemetryService?.sendEvent('activate', {
				evidenceVersion: evidenceVersion,
				markdownFiles: `${markdownFilesCount}`,
				templatedPages: `${templatedPagesCount}`,
				sourcesFiles: `${sourcesFilesCount}`,
				componentsFiles: `${componentsFilesCount}`,
				evidenceFolderAtRoot: `${evidenceFolderAtRoot}`
			});
		} catch (e) {
			telemetryService?.sendEvent('telemetryError', { location: 'activate' });
		}

		// set Evidence project context
		updateProjectContext();

		// get autoStart setting:
		const autoStart: boolean = <boolean>getConfig(Settings.AutoStart);

		// show start dev server status
		statusBar.showStart();

		// open index.md if no other files are open
		openIndex();

		initializeSchemaViewer(context);
		registerCompletionProvider(context);
		registerComponentProvider(context);

		// Apply custom settings whenever the active editor changes
		window.onDidChangeActiveTextEditor((editor) => {
			applyCustomSettings();
		});

		// Apply custom settings whenever the content of the editor changes
		workspace.onDidChangeTextDocument((event) => {
			if (window.activeTextEditor && event.document === window.activeTextEditor.document) {
				applyCustomSettings();
			}
		});

		// Apply custom settings whenever the cursor position changes
		window.onDidChangeTextEditorSelection((event) => {
			if (
				window.activeTextEditor &&
				event.textEditor.document === window.activeTextEditor.document
			) {
				applyCustomSettings();
			}
		});

		// Apply custom settings when the extension is activated
		applyCustomSettings();

		if (autoStart) {
			startServer();
		}
	}
}

/**
 * Deactivates Evidence extension
 * and disposes extension resources.
 */
export function deactivate() {
	statusBar?.dispose();
	closeTerminal();
}

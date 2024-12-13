import { PostgreSQL, sql } from '@codemirror/lang-sql';
import { EditorView } from 'codemirror';

import { espresso, boysAndGirls } from 'thememirror';

import {
	closeBrackets,
	autocompletion,
	closeBracketsKeymap,
	completionKeymap,
	acceptCompletion,
	completionStatus
} from '@codemirror/autocomplete';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import {
	indentOnInput,
	syntaxHighlighting,
	defaultHighlightStyle,
	bracketMatching,
	foldKeymap
} from '@codemirror/language';
import { lintKeymap } from '@codemirror/lint';
import { drawSelection, dropCursor, keymap } from '@codemirror/view';
import { highlightSelectionMatches, searchKeymap } from '@codemirror/search';

import { buildQuery } from '@evidence-dev/component-utilities/buildQuery';

/** @typedef {import("@codemirror/autocomplete").Completion} Completion */
/** @typedef {import("@codemirror/view").Command} Command */
/** @typedef {import("@codemirror/view").ViewUpdate} ViewUpdate */
/** @typedef {import("@codemirror/lang-sql").SQLConfig} SQLConfig */
/** @typedef {import("svelte/action").Action} Action */

/**
 * @typedef {Object} SqlConsoleArgs
 * @property {string} initialState
 * @property {ReturnType<typeof buildAutoCompletes>} schema
 * @property {(update: ViewUpdate) => void} onChange
 * @property {Command} onSubmit
 * @property {boolean} [disabled = false]
 * @property {'light' | 'dark'} theme
 */

/**
 *
 * @returns {{schema: SQLConfig['schema'], tables: SQLConfig['tables']}}
 */
export const buildAutoCompletes = async () => {
	const columnsQuery = `
SELECT  concat(tables.table_schema, '.', tables.table_name) as qualifiedTable,
	column_name as label,
	ordinal_position as ordinal,
	* 
FROM information_schema.tables
INNER JOIN information_schema.columns 
ON  tables.table_name = columns.table_name 
  AND tables.table_schema = columns.table_schema`.trim();
	/** @typedef {{qualifiedTable: string; table_name: string, ordinal: number, table_schema: string, label: string; data_type: string; is_nullable: 'YES' | 'NO'}} SchemaRow */

	const columnsData = buildQuery(columnsQuery);
	await columnsData.fetch();
	if (columnsData.error) throw columnsData.error;
	/** @type {SQLConfig['schema']} */
	const columns = columnsData.reduce(
		(/** @type {Record<string, Completion[]>} */ a, /** @type { SchemaRow } */ row) => {
			if (!(row.qualifiedTable in a)) a[row.qualifiedTable] = [];

			const nullStr = row.is_nullable === 'YES' ? '' : '(NOT NULL)';
			a[row.qualifiedTable].push({
				label: row.label,
				type: 'property',
				detail: `${row.data_type} ${nullStr}`,
				boost: Math.floor(100 / row.ordinal)
			});

			return a;
		},
		{}
	);
	const tablesQuery = `
		SELECT  concat(tables.table_schema, '.', tables.table_name) as qualifiedTable,
			* 
		FROM information_schema.tables`.trim();

	const tablesData = buildQuery(tablesQuery);
	await tablesData.fetch();
	if (tablesData.error) throw tablesData.error;
	/** @type {SQLConfig['tables']} */
	const tables = tablesData.map((/** @type { SchemaRow } */ row) => {
		/** @type {SQLConfig['tables'][number]} */
		const completion = {
			label: row.qualifiedTable,
			displayLabel: row.table_name,
			detail: row.table_schema,
			type: 'class',
			info: (cmp) => {
				const colCompletions = columns[cmp.label];
				const dl = document.createElement('dl');
				dl.classList.add('grid-cols-2', 'grid', 'gap-x-4');

				colCompletions.forEach((cc) => {
					const term = document.createElement('dt');
					term.classList.add('overflow-hidden', 'truncate', 'text-ellipsis');
					term.textContent = cc.label;

					const def = document.createElement('dd');
					def.textContent = cc.detail;

					dl.appendChild(term);
					dl.appendChild(def);
				});

				return dl;
			}
		};

		return completion;
	});

	const schemas = Object.values(
		tablesData.reduce(
			(/** @type {Record<string, Completion>} */ a, /** @type { SchemaRow } */ row) => {
				if (!a[row.label]) {
					/** @type {Completion} */
					const schemaCompletion = {
						label: row.table_schema,
						type: 'namespace',
						info: (completion) => {
							const tableCompletions = tables.filter((t) => t.label.startsWith(completion.label));

							const dl = document.createElement('dl');
							dl.classList.add('grid-cols-2', 'grid', 'gap-x-4');
							tableCompletions.forEach((cc) => {
								const term = document.createElement('dt');
								term.classList.add('overflow-hidden', 'truncate', 'text-ellipsis');
								term.textContent = cc.displayLabel;

								const def = document.createElement('dd');
								def.textContent = cc.detail;

								dl.appendChild(term);
								dl.appendChild(def);
							});

							return dl;
						}
					};
					a[row.label] = schemaCompletion;
				}

				return a;
			},
			{}
		)
	);

	return {
		schema: columns,
		tables,
		schemas
	};
};

/** @type {Action<HTMLDivElement>} */
export const sqlConsole = (
	/** @type {HTMLDivElement} */ el,
	/** @type {SqlConsoleArgs | undefined} */ args
) => {
	/** @type {EditorView} */
	let view;

	/** @type {() => void} */
	let removeClickListener;
	function bootstrap(
		/** @type {SqlConsoleArgs} */ { initialState, schema, onChange, onSubmit, theme }
	) {
		if (view) view.destroy();
		if (removeClickListener) removeClickListener();
		view = new EditorView({
			doc: initialState,
			extensions: [
				keymap.of([
					{
						preventDefault: true,
						stopPropagation: true,
						key: 'Ctrl-Enter',
						mac: 'Cmd-Enter',
						run: onSubmit
					},
					{
						preventDefault: true,
						key: 'Tab',
						run: (editorView) => {
							const status = completionStatus(editorView.state);
							if (status !== null) acceptCompletion(editorView);
							else {
								const range = editorView.state.selection.asSingle().ranges[0];

								if (range.from === range.to) {
									const insertAt = range.from;
									editorView.dispatch({
										changes: {
											from: insertAt,
											insert: '\t'
										},
										selection: {
											anchor: range.from + 1,
											head: range.from + 1
										}
									});
								} else {
									const linebreak = editorView.lineBlockAt(range.from);
									editorView.dispatch({
										changes: {
											from: linebreak.from,
											insert: '\t'
										}
									});
								}
							}
						}
					},
					{
						preventDefault: true,
						key: 'Shift-Tab',
						run: (editorView) => {
							const range = editorView.state.selection.asSingle().ranges[0];
							const linebreak = editorView.lineBlockAt(range.from);
							const isTabbed =
								editorView.state.doc.slice(linebreak.from, linebreak.from + 1).toString() === '\t';
							if (isTabbed)
								// Remove the first character from the line
								// (which we have determined is a tab)
								editorView.dispatch({
									changes: {
										from: linebreak.from,
										to: linebreak.from + 1,
										insert: ''
									}
								});
							const isSpaced =
								editorView.state.doc.slice(linebreak.from, linebreak.from + 2).toString() === '  ';
							if (isSpaced)
								// Remove the first 2 characters from the line
								// (which we have determined is 2 spaces)
								editorView.dispatch({
									changes: {
										from: linebreak.from,
										to: linebreak.from + 2,
										insert: ''
									}
								});
						}
					}
				]),
				theme === 'light' ? espresso : boysAndGirls,
				...defaultSettings,
				sql({
					...schema,
					dialect: PostgreSQL
				}),
				EditorView.updateListener.of(onChange)
			],
			parent: el
		});
		const clickListener = (e) => {
			e.stopImmediatePropagation();
			view.focus();
		};
		el.addEventListener('click', clickListener);
		removeClickListener = () => el.removeEventListener('click', clickListener);
	}
	if (args) bootstrap(args);
	return {
		destroy() {
			view.destroy();
		},
		update(args) {
			if (args) bootstrap(args);
		}
	};
};

const defaultSettings = [
	// highlightSpecialChars(),
	history(),
	drawSelection(),
	dropCursor(),
	indentOnInput(),
	syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
	bracketMatching(),
	closeBrackets(),
	autocompletion(),
	highlightSelectionMatches(),
	keymap.of([
		...closeBracketsKeymap,
		...defaultKeymap,
		...searchKeymap,
		...historyKeymap,
		...foldKeymap,
		...completionKeymap,
		...lintKeymap
	])
];

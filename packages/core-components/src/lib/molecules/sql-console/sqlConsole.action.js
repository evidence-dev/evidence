import { sql } from '@codemirror/lang-sql';
import { EditorView } from 'codemirror';

import { espresso } from 'thememirror';

import {
	closeBrackets,
	autocompletion,
	closeBracketsKeymap,
	completionKeymap,
	acceptCompletion
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
 * @property {SqlConfig['schema']} schema
 * @property {(update: ViewUpdate) => void} onChange
 * @property {Command} onSubmit
 */

export const buildAutoCompletes = async () => {
	const schemaQuery = `
        SELECT  concat(tables.table_schema, '.', tables.table_name) as qualifiedTable,
                column_name as label,
                * 
        FROM information_schema.tables
            INNER JOIN information_schema.columns ON 
                                tables.table_name = columns.table_name AND 
                                tables.table_schema = columns.table_schema
    `.trim();

	const schemaData = buildQuery(schemaQuery);
	await schemaData.fetch();
	/** @type {SQLConfig['schema']} */
	const dynamicSchema = schemaData
		.value()
		.reduce(
			(
				/** @type {Record<string, Completion[]>} */ a,
				/** @type { qualifiedTable: string; label: string; data_type: string; is_nullable: 'YES' | 'NO' } */ row
			) => {
				if (!(row.qualifiedTable in a)) a[row.qualifiedTable] = [];

				const nullStr = row.is_nullable === 'YES' ? '' : '(NOT NULL)';
				a[row.qualifiedTable].push({
					label: row.label,
					type: 'variable',
					detail: `${row.data_type} ${nullStr}`
				});

				return a;
			},
			{}
		);

	return dynamicSchema;
};

/** @type {Action<HTMLDivElement>} */
export const sqlConsole = (
	/** @type {HTMLDivElement} */ el,
	/** @type {SqlConsoleArgs | undefined} */ args
) => {
	/** @type {EditorView} */
	let view;
	function bootstrap(/** @type {SqlConsoleArgs} */ { initialState, schema, onChange, onSubmit }) {
		if (view) view.destroy();
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
						run: acceptCompletion
					}
				]),
				...defaultSettings,
				sql({
					schema
				}),
				EditorView.updateListener.of(onChange)
			],
			parent: el
		});
		el.addEventListener('click', (e) => {
			e.stopImmediatePropagation();
			view.focus();
		});
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
	espresso,
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

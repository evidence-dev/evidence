const { getRouteHash } = require('./utils/get-route-hash.cjs');
const { extractQueries } = require('./extract-queries/extract-queries.cjs');
const { highlighter } = require('./utils/highlighter.cjs');
const { containsFrontmatter } = require('./frontmatter/frontmatter.regex.cjs');

const createDefaultProps = function (filename, componentDevelopmentMode, duckdbQueries = {}) {
	const routeH = getRouteHash(filename);

	let queryDeclarations = '';

	if (Object.keys(duckdbQueries).length > 0) {
		const valid_ids = Object.keys(duckdbQueries).filter((queryId) =>
			queryId.match('^([a-zA-Z_$][a-zA-Z0-9d_$]*)$')
		);

		const queryStores = valid_ids.map(
			(id) => `

		
		/*
			"What the heck is happening here":
				_${id}_initial_query:
					Copy of the query as it is written in the source markdown file
					It is interpolated with the initial values of any variables _at mount time_
					and does not change after that

					This variable _must_ be declared; then assigned "reactively" to make sure it can reference the user's variables,
					as it pushes the reactive assignment to the bottom of the file (after the user's scripts have run)
					
					We use the if to make sure it is only reactive once, and still acts as a "constant"


				_${id}_current_query:
					Copy of the query with the variables reactively interpolated - this is what will
					actually be executed against the database

					
				_${id}_changed:
					Helper variable to check if current is same as initial

				
				We care about all of this because we want to provide the initialData from SSR when the query is unchanged,
				but we need to ensure that if the query changes, it re-executes. When constructing the QueryStore below,
				we hinge on the change to pass intiailData (or not).
		*/
		// Initial Query
		let _${id}_initial_query
		$: if(!_${id}_initial_query) _${id}_initial_query = \`${duckdbQueries[id].replaceAll('`', '\\`')}\`
		onMount(() => _${id}_initial_query = \`${duckdbQueries[id].replaceAll('`', '\\`')}\`)

		// Current Query
		$: _${id}_current_query = \`${duckdbQueries[id].replaceAll('`', '\\`')}\`
		
		// Query has changed
		$: _${id}_changed = browser ? _${id}_current_query !== _${id}_initial_query : false
		
		// Actual Query Execution
		$: _${id} = new QueryStore(
			\`${duckdbQueries[id].replaceAll('`', '\\`')}\`,
			queryFunc,
			\`${id}\`,
			{
				scoreNotifier,
				initialData: _${id}_changed 
					// Query has changed, do not provide intiial data
					? undefined 
					// Query has not changed, provide initial data
					: data.${id} ?? profile(__db.query, \`${duckdbQueries[id].replaceAll('`', '\\`')}\`, '${id}')
			}
		);

		/** @type {QueryStore} */
		let ${id};
		$: ${id} = $_${id};
		`
		);

		queryDeclarations += `
		import {browser} from "$app/environment";
		import {profile} from '@evidence-dev/component-utilities/profile';
		import debounce from 'debounce';
		import {QueryStore} from '@evidence-dev/query-store';
		
		const queryFunc = (query) => profile(__db.query, query);	
		const scoreNotifier = (info) => {
			toasts.add({
				id: Math.random(),
				title: info.id,
				message: \`Results estimated to use \${
					Intl.NumberFormat().format(info.score / (1024 * 1024))
				}mb of memory, performance may be impacted\`,
				style: 'border-yellow-200 border bg-yellow-50 text-yellow-800 transition-all duration-300'
			}, 5000);
		}

		${queryStores.join('\n')}	
		`;
	}

	let defaultProps = `
        import { page } from '$app/stores';
        import { pageHasQueries, routeHash, toasts } from '@evidence-dev/component-utilities/stores';
        import { setContext, getContext, beforeUpdate, onMount } from 'svelte';
        
        // Functions
        import { fmt } from '@evidence-dev/component-utilities/formatting';

		import { CUSTOM_FORMATTING_SETTINGS_CONTEXT_KEY } from '@evidence-dev/component-utilities/globalContexts';
        
        let props;
        export { props as data }; // little hack to make the data name not overlap
        let { data = {}, customFormattingSettings, __db } = props;
        $: ({ data = {}, customFormattingSettings, __db } = props);

        $routeHash = '${routeH}';

        $: data, Object.keys(data).length > 0 ? pageHasQueries.set(true) : pageHasQueries.set(false);

        setContext(CUSTOM_FORMATTING_SETTINGS_CONTEXT_KEY, {
            getCustomFormats: () => {
                return customFormattingSettings.customFormats || [];
            }
        });

        ${queryDeclarations}
        `;
	return defaultProps;
};

/**
 * @type {(componentDevelopmentMode: boolean) => import("svelte-preprocess/dist/types").PreprocessorGroup}
 */
const processQueries = (componentDevelopmentMode) => {
	const dynamicQueries = {};
	return {
		markup({ content, filename }) {
			if (filename.endsWith('.md')) {
				let fileQueries = extractQueries(content);
				dynamicQueries[getRouteHash(filename)] = fileQueries.reduce((acc, q) => {
					acc[q.id] = q.compiledQueryString;
					return acc;
				}, {});

				const externalQueryViews =
					'\n\n\n' +
					fileQueries
						.filter((q) => !q.inline)
						.map((q) => {
							return highlighter(q.compiledQueryString, q.id.toLowerCase());
						})
						.join('\n');

				// Page contains frontmatter
				const frontmatter = containsFrontmatter(content);
				if (frontmatter) {
					const contentWithoutFrontmatter = content.substring(frontmatter.length + 6);
					const output =
						`---\n${frontmatter}\n---` + externalQueryViews + contentWithoutFrontmatter;
					return {
						code: output
					};
				}

				return {
					code: externalQueryViews + content
				};
			}
		},
		script({ content, filename, attributes }) {
			if (filename.endsWith('.md')) {
				if (attributes.context != 'module') {
					const duckdbQueries = dynamicQueries[getRouteHash(filename)];
					return {
						code: createDefaultProps(filename, componentDevelopmentMode, duckdbQueries) + content
					};
				}
			}
		}
	};
};
module.exports = processQueries;

const { getRouteHash } = require('./utils/get-route-hash.cjs');
const { extractQueries } = require('./extract-queries/extract-queries.cjs');
const { highlighter } = require('./utils/highlighter.cjs');
const { containsFrontmatter } = require('./frontmatter/frontmatter.regex.cjs');

// prettier obliterates the formatting of queryDeclarations
// prettier-ignore
/**
 *
 * @param {string} filename
 * @param {boolean} componentDevelopmentMode
 * @param {Record<string, import('./extract-queries/extract-queries.cjs').Query>} duckdbQueries
 * @returns
 */
const createDefaultProps = function (filename, componentDevelopmentMode, duckdbQueries = {}) {
	const routeH = getRouteHash(filename);

	let queryDeclarations = '';

	if (Object.keys(duckdbQueries).length > 0) {
		const IS_VALID_QUERY = /^([a-zA-Z_$][a-zA-Z0-9d_$]*)$/;
		const validIds = Object.keys(duckdbQueries).filter((query) => IS_VALID_QUERY.test(query) && !duckdbQueries[query].compileError);

		// prerendered queries: stuff without ${}
		// reactive queries: stuff with ${}
		const IS_REACTIVE_QUERY = /\${.*?}/s;
		const reactiveIds = validIds.filter((id) => IS_REACTIVE_QUERY.test(duckdbQueries[id].compiledQueryString));

		// input queries: reactive with ${inputs...} in it
		const IS_INPUT_QUERY = /\${\s*inputs\s*\..*?}/s;
		const input_ids = reactiveIds.filter((id) => IS_INPUT_QUERY.test(duckdbQueries[id].compiledQueryString));

		const errQueries = Object.values(duckdbQueries).filter(q => q.compileError).map(q => `const ${q.id} = Query.create(\`${q.compiledQueryString.replaceAll("$", "\\$")}\`, undefined, { id: "${q.id}", initialError: new Error(\`${q.compileError.replaceAll("$", "\\$")}\`)})`)

		
		const queryStoreDeclarations = validIds.map((id) => {
			return `
				// Update external queries
				if (import.meta?.hot) {
					import.meta.hot.on("evidence:queryChange", ({queryId, content}) => {
						let errors = []
						if (!queryId) errors.push("Malformed event: Missing queryId")
						if (!content) errors.push("Malformed event: Missing content")
						if (errors.length) {
							console.warn("Failed to update query on serverside change!", errors.join("\\n"))
							return
						}

						if (queryId === "${id}") {
							__${id}Text = content
						}
						
					})
				}

				let ${id}InitialStates = { initialData: undefined, initialError: undefined }
				
				// Give initial states for these variables
				/** @type {boolean} */
				let __${id}HasUnresolved = hasUnsetValues\`${duckdbQueries[id].compiledQueryString.replaceAll('`', '\\`')}\`;
				/** @type {string]} */
				let __${id}Text = \`${duckdbQueries[id].compiledQueryString.replaceAll('`', '\\`')}\`


				if (browser) {
					// Data came from SSR
					if (data.${id}) {
						if (data.${id} instanceof Error) {
							${id}InitialStates.initialError = data.${id}
						} else {
							${id}InitialStates.initialData = data.${id}
						}
					}
				} else {
					// On server
					try {
						if (__${id}HasUnresolved)
							${id}InitialStates.initialData = profile(__db.query, __${id}Text, { query_name: '${id}' })
					} catch (e) {
						console.error(e)
						if (import.meta.env.VITE_BUILD_STRICT) throw e;
						${id}InitialStates.initialError = e
					}
				}
				
				
				/** @type {import("@evidence-dev/sdk/usql").QueryValue} */
				let ${id};

				$: __${id}HasUnresolved = hasUnsetValues\`${duckdbQueries[id].compiledQueryString.replaceAll('`', '\\`')}\`;
				$: __${id}Text = \`${duckdbQueries[id].compiledQueryString.replaceAll('`', '\\`')}\`
				$: __${id}Factory(__${id}Text, { noResolve: __${id}HasUnresolved })

				const __${id}Factory = Query.createReactive(
					{ callback: $v => ${id} = $v, execFn: queryFunc },
					{ id: '${id}', initialData: ${id}InitialStates.initialData, initialError: ${id}InitialStates.initialError }
				)

				// Assign a value for the initial run-through
				// This is split because chicken / egg
				__${id}Factory(__${id}Text, { noResolve: __${id}HasUnresolved })

				// Add queries to global scope inside symbols to ease debugging
				globalThis[Symbol.for("${id}")] = { get value() { return ${id} } }
				
				
			`;
		});

		/* 
			reactivity doesn't happen on the server, so we need to manually subscribe to the inputs store
			and update the queries when the inputs change
		*/
		const input_query_stores = `
		if (!browser) {
			onDestroy(inputs_store.subscribe((inputs) => {
				${input_ids.map((id) => `
				__${id}Factory(\`${duckdbQueries[id].compiledQueryString.replaceAll('`', '\\`')}\`, { noResolve: hasUnsetValues\`${duckdbQueries[id].compiledQueryString.replaceAll('`', '\\`')}\` });
				`).join('\n')}
			}));
		}
		`;

		queryDeclarations += `
		${errQueries.join("\n")}
		${queryStoreDeclarations.join('\n')}
		${input_query_stores}
		
		`;
	}

	let defaultProps = `
        import { page } from '$app/stores';
        import { pageHasQueries, routeHash, toasts } from '@evidence-dev/component-utilities/stores';
        import { setContext, getContext, beforeUpdate, onDestroy, onMount } from 'svelte';
		import { writable, get } from 'svelte/store';
        
        // Functions
        import { fmt } from '@evidence-dev/component-utilities/formatting';

		import { CUSTOM_FORMATTING_SETTINGS_CONTEXT_KEY, INPUTS_CONTEXT_KEY } from '@evidence-dev/component-utilities/globalContexts';		
        
        let props;
        export { props as data }; // little hack to make the data name not overlap
        let { data = {}, customFormattingSettings, __db, inputs } = props;
        $: ({ data = {}, customFormattingSettings, __db } = props);

        $routeHash = '${routeH}';

		${/* 
			do not switch to $: inputs = $inputs_store
			reactive statements do not rerun during SSR 
		*/''}
		let inputs_store = writable(inputs);
		
		setContext(INPUTS_CONTEXT_KEY, inputs_store);
		onDestroy(inputs_store.subscribe((value) => inputs = value));

        $: pageHasQueries.set(Object.keys(data).length > 0);

        setContext(CUSTOM_FORMATTING_SETTINGS_CONTEXT_KEY, {
            getCustomFormats: () => {
                return customFormattingSettings.customFormats || [];
            }
        });

		import { browser, dev } from "$app/environment";
		import { profile } from '@evidence-dev/component-utilities/profile';
		import debounce from 'debounce';
		import { Query, hasUnsetValues } from '@evidence-dev/sdk/usql';
		import { setQueryFunction } from '@evidence-dev/component-utilities/buildQuery';

		if (!browser) {
			onDestroy(() => Query.emptyCache());
		}

		const queryFunc = (query, query_name) => profile(__db.query, query, { query_name });
		setQueryFunction(queryFunc);

		const scoreNotifier = !dev? () => {} : (info) => {
			toasts.add({
				id: Math.random(),
				title: info.id,
				message: \`Results estimated to use \${
					Intl.NumberFormat().format(info.score / (1024 * 1024))
				}mb of memory, performance may be impacted\`,
				status: 'warning'
			}, 5000);
		};

		
		let inflightQueryTimeout
		const onInflightQueriesStart = () => {
			if (!inflightQueryTimeout) inflightQueryTimeout = setTimeout(() => {
				toasts.add({
					id: 'LoadingToast',
					title: '',
					message: 'Loading...',
					status: 'info'
				}, 0); // timeout of 0 means forever
			}, 3000)
		}
		const onInflightQueriesEnd = () => {
			if (inflightQueryTimeout) {
				clearTimeout(inflightQueryTimeout)
				inflightQueryTimeout = null
			}
			else toasts.dismiss('LoadingToast')
		}
		onMount(() => {
			Query.addEventListener('inFlightQueryStart', onInflightQueriesStart)
			Query.addEventListener('inFlightQueryEnd', onInflightQueriesEnd)
			if (Query.QueriesLoading) {
				onInflightQueriesStart()
			}
			return () => {
				Query.removeEventListener('inFlightQueryStart', onInflightQueriesStart)
				Query.removeEventListener('inFlightQueryEnd', onInflightQueriesEnd)
			}
		})

		if (import.meta?.hot) {
            if (typeof import.meta.hot.data.hmrHasRun === 'undefined') import.meta.hot.data.hmrHasRun = false
	        import.meta.hot.on("vite:beforeUpdate", () => {
				import.meta.hot.data.hmrHasRun = true
				Query.emptyCache() // All bets are off
			})
	    }
		
		let params = $page.params;
		$: params = $page.params;
		
		let _mounted = false;
		onMount(() => (_mounted = true));

        ${queryDeclarations}
    `;

	return defaultProps;
};

/**
 * @type {(componentDevelopmentMode: boolean) => import("svelte-preprocess/dist/types").PreprocessorGroup}
 */
const processQueries = (componentDevelopmentMode) => {
	/**
	 * @type {Record<string, Record<string, import("./extract-queries/extract-queries.cjs").Query>>}
	 */
	const dynamicQueries = {};
	return {
		markup({ content, filename }) {
			if (filename.endsWith('.md')) {
				let fileQueries = extractQueries(content);

				dynamicQueries[getRouteHash(filename)] = fileQueries.reduce((acc, q) => {
					acc[q.id] = q;
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
				if (attributes.context !== 'module') {
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

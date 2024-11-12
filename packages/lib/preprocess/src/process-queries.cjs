const { getRouteHash } = require('./utils/get-route-hash.cjs');
const { extractQueries } = require('./extract-queries/extract-queries.cjs');
const { highlighter } = require('./utils/highlighter.cjs');
const { containsFrontmatter } = require('./frontmatter/frontmatter.regex.cjs');

/**
 * If you need an @evidence-dev import in the template strings below, it must be added here to prevent a poor user experience when running a template
 * @type {{ import: string; from: `@evidence-dev/${string}` }[]}
 */
const injectedEvidenceImports = [
	{
		import: '{ pageHasQueries, routeHash, toasts }',
		from: '@evidence-dev/component-utilities/stores'
	},
	{ import: '{ fmt }', from: '@evidence-dev/component-utilities/formatting' },
	{
		import: '{ CUSTOM_FORMATTING_SETTINGS_CONTEXT_KEY }',
		from: '@evidence-dev/component-utilities/globalContexts'
	},
	{ import: '{ ensureInputContext }', from: '@evidence-dev/sdk/utils/svelte' },
	{ import: '{ profile }', from: '@evidence-dev/component-utilities/profile' },
	{ import: '{ Query, hasUnsetValues }', from: '@evidence-dev/sdk/usql' },
	{ import: '{ setQueryFunction }', from: '@evidence-dev/component-utilities/buildQuery' }
];

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

	const IS_VALID_QUERY = /^([a-zA-Z_$][a-zA-Z0-9d_$]*)$/;
	const validIds = Object.keys(duckdbQueries).filter(
		(query) => IS_VALID_QUERY.test(query) && !duckdbQueries[query].compileError
	);
	if (validIds.length > 0) {
		// prerendered queries: stuff without ${}
		// reactive queries: stuff with ${}
		const IS_REACTIVE_QUERY = /\${.*?}/s;
		const reactiveIds = validIds.filter((id) =>
			IS_REACTIVE_QUERY.test(duckdbQueries[id].compiledQueryString)
		);

		// input queries: reactive with ${inputs...} in it
		const IS_INPUT_QUERY = /\${\s*inputs\s*\..*?}/s;
		const input_ids = reactiveIds.filter((id) =>
			IS_INPUT_QUERY.test(duckdbQueries[id].compiledQueryString)
		);

		const errQueries = Object.values(duckdbQueries)
			.filter((q) => q.compileError)
			.map(
				(q) =>
					`const ${q.id} = Query.create(\`${q.compiledQueryString.replaceAll('$', '\\$')}\`, undefined, { id: "${q.id}", initialError: new Error(\`${/** @type {string} */ (q.compileError).replaceAll('$', '\\$')}\`)})`
			);

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
                /** @type {string} */
                let __${id}Text = \`${duckdbQueries[id].compiledQueryString.replaceAll('`', '\\`')}\`


                if (browser) {
                    // Data came from SSR
                    if (data.${id}_data) {
                        // vvv is this still used/possible?
                        if (data.${id}_data instanceof Error) {
                            ${id}InitialStates.initialError = data.${id}_data
                        } else {
                            ${id}InitialStates.initialData = data.${id}_data
                        }
                        if (data.${id}_columns) {
                            ${id}InitialStates.knownColumns = data.${id}_columns
                        }
                    }
                }

                /** @type {import("@evidence-dev/sdk/usql").QueryValue} */
                let ${id};

                $: __${id}HasUnresolved = hasUnsetValues\`${duckdbQueries[id].compiledQueryString.replaceAll('`', '\\`')}\`;
                $: __${id}Text = \`${duckdbQueries[id].compiledQueryString.replaceAll('`', '\\`')}\`

                // keep initial state around until after the query has resolved once
                let __${id}InitialFactory = false;
                $: if (__${id}HasUnresolved || !__${id}InitialFactory) {    
                    if (!__${id}HasUnresolved) {
                        __${id}Factory(__${id}Text, { noResolve: __${id}HasUnresolved, ...${id}InitialStates });
                        __${id}InitialFactory = true;
                    }
                } else {
                    __${id}Factory(__${id}Text, { noResolve: __${id}HasUnresolved });
                }

                const __${id}Factory = Query.createReactive(
                    { callback: v => {
                        ${id} = v
                    }, execFn: queryFunc },
                    { id: '${id}', ...${id}InitialStates }
                )

                // Assign a value for the initial run-through
                // This is split because chicken / egg
                __${id}Factory(__${id}Text, { noResolve: __${id}HasUnresolved, ...${id}InitialStates })

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
				${input_ids
					.map(
						(id) => `
						__${id}HasUnresolved = hasUnsetValues\`${duckdbQueries[id].compiledQueryString.replaceAll('`', '\\`')}\`;
						__${id}Text = \`${duckdbQueries[id].compiledQueryString.replaceAll('`', '\\`')}\`;
						__${id}Factory(__${id}Text, { noResolve: __${id}HasUnresolved });
				`
					)
					.join('\n')}
			}));
		}
		`;

		queryDeclarations += `
		${errQueries.join('\n')}
		${queryStoreDeclarations.join('\n')}
		${input_query_stores}
		
		`;
	}

	let defaultProps = `
        import { page } from '$app/stores';
        import { setContext, getContext, beforeUpdate, onDestroy, onMount } from 'svelte';
		import { writable, get } from 'svelte/store';
        
        // Functions

        
        let props;
        export { props as data }; // little hack to make the data name not overlap
        let { data = {}, customFormattingSettings, __db, inputs } = props;
        $: ({ data = {}, customFormattingSettings, __db } = props);

        $routeHash = '${routeH}';

		${
			/* 
			do not switch to $: inputs = $inputs_store
			reactive statements do not rerun during SSR 
			*/ ''
		}
		let inputs_store = ensureInputContext(writable(inputs));
		onDestroy(inputs_store.subscribe((value) => inputs = value));

        $: pageHasQueries.set(Object.keys(data).length > 0);

        setContext(CUSTOM_FORMATTING_SETTINGS_CONTEXT_KEY, {
            getCustomFormats: () => {
                return customFormattingSettings.customFormats || [];
            }
        });

		import { browser, dev } from "$app/environment";

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

		if (import.meta?.hot) {
            if (typeof import.meta.hot.data.hmrHasRun === 'undefined') import.meta.hot.data.hmrHasRun = false

			import.meta.hot.on("evidence:reset-queries", async (payload) => {
				await $page.data.__db.updateParquetURLs(JSON.stringify(payload.latestManifest), true);
				Query.emptyCache()
				${validIds
					.map((id) => `__${id}Factory(__${id}Text, { noResolve: __${id}HasUnresolved });`)
					.join('\n')}
			})
	    }
		
		let params = $page.params;
		$: params = $page.params;
		
		let _mounted = false;
		onMount(() => (_mounted = true));

        ${queryDeclarations}
    `;

	return `
		${injectedEvidenceImports.map((i) => `import ${i.import} from '${i.from}';`).join('\n')}
		${defaultProps}
	`;
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
			if (filename?.endsWith('.md')) {
				let fileQueries = extractQueries(content);

				dynamicQueries[getRouteHash(filename)] = fileQueries.reduce((acc, q) => {
					acc[q.id] = q;
					return acc;
				}, /** @type {typeof dynamicQueries[string]} */ ({}));

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
			if (filename?.endsWith('.md')) {
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
module.exports = { processQueries, injectedEvidenceImports };

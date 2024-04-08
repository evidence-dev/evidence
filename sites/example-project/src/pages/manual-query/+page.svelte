<script context="module">
	const metadata = undefined;
</script>

<script>
	import { page } from '$app/stores';
	import { pageHasQueries, routeHash, toasts } from '@evidence-dev/component-utilities/stores';
	import { setContext, getContext, beforeUpdate, onDestroy, onMount } from 'svelte';
	import { writable, get } from 'svelte/store';

	// Functions
	import { fmt } from '@evidence-dev/component-utilities/formatting';

	import {
		CUSTOM_FORMATTING_SETTINGS_CONTEXT_KEY,
		INPUTS_CONTEXT_KEY
	} from '@evidence-dev/component-utilities/globalContexts';

	let props;
	export { props as data }; // little hack to make the data name not overlap
	let { data = {}, customFormattingSettings, __db, inputs } = props;
	$: ({ data = {}, customFormattingSettings, __db } = props);

	$routeHash = 'e99ad613f8c32ef77b74fbece3bae577';

	let inputs_store = writable(inputs);
	setContext(INPUTS_CONTEXT_KEY, inputs_store);
	onDestroy(inputs_store.subscribe((value) => (inputs = value)));

	$: pageHasQueries.set(Object.keys(data).length > 0);

	setContext(CUSTOM_FORMATTING_SETTINGS_CONTEXT_KEY, {
		getCustomFormats: () => {
			return customFormattingSettings.customFormats || [];
		}
	});

	import { browser, dev } from '$app/environment';
	import { profile } from '@evidence-dev/component-utilities/profile';
	import debounce from 'debounce';
	import { Query } from '@evidence-dev/sdk/usql';
	import { setQueryFunction } from '@evidence-dev/component-utilities/buildQuery';

	const queryFunc = (query, query_name) => profile(__db.query, query, { query_name });
	setQueryFunction(queryFunc);

	const scoreNotifier = !dev
		? () => {}
		: (info) => {
				toasts.add(
					{
						id: Math.random(),
						title: info.id,
						message: `Results estimated to use ${Intl.NumberFormat().format(
							info.score / (1024 * 1024)
						)}mb of memory, performance may be impacted`,
						status: 'warning'
					},
					5000
				);
			};

	const onInflightQueriesStart = () => {
		toasts.add(
			{
				id: 'LoadingToast',
				title: '',
				message: 'Loading...',
				status: 'info'
			},
			0
		); // timeout of 0 means forever
	};
	const onInflightQueriesEnd = () => {
		toasts.dismiss('LoadingToast');
	};
	onMount(() => {
		Query.addEventListener('inFlightQueryStart', onInflightQueriesStart);
		Query.addEventListener('inFlightQueryEnd', onInflightQueriesEnd);
		if (Query.QueriesLoading) {
			onInflightQueriesStart();
		}
		return () => {
			Query.removeEventListener('inFlightQueryStart', onInflightQueriesStart);
			Query.removeEventListener('inFlightQueryEnd', onInflightQueriesEnd);
		};
	});

	if (import.meta?.hot) {
		if (typeof import.meta.hot.data.hmrHasRun === 'undefined')
			import.meta.hot.data.hmrHasRun = false;
		import.meta.hot.on('vite:beforeUpdate', () => {
			import.meta.hot.data.hmrHasRun = true;
			Query.emptyCache(); // All bets are off
		});
	}

	let params = $page.params;
	$: params = $page.params;

	function __checkForUnsetInputs(strings, ...args) {
		if (args.some((a) => a?.__unset)) {
			return true;
		} else {
			return false;
		}
	}

	let _mounted = false;
	onMount(() => (_mounted = true));

	$: _DUMMYQUERY_query_text = `SELECT 'WE ARE HMRING LIKE A BOSS'`;
	$: _DUMMYQUERY_has_unresolved = __checkForUnsetInputs`SELECT 'WE ARE HMRING LIKE A BOSS'`;

	if (import.meta?.hot) {
		import.meta.hot.on('evidence:queryChange', ({ queryId, content }) => {
			let errors = [];
			if (!queryId) errors.push('Malformed event: Missing queryId');
			if (!content) errors.push('Malformed event: Missing content');
			if (errors.length) {
				console.warn('Failed to update query on serverside change!', errors.join('\n'));
				return;
			}

			if (queryId === 'DUMMYQUERY') {
				_DUMMYQUERY_query_text = content;
			}
		});
	}

	// Initial Query
	let _DUMMYQUERY_initial_query;
	$: if (!_DUMMYQUERY_initial_query) _DUMMYQUERY_initial_query = _DUMMYQUERY_query_text;
	onMount(() => (_DUMMYQUERY_initial_query = _DUMMYQUERY_query_text));

	// Current Query
	$: _DUMMYQUERY_current_query = _DUMMYQUERY_query_text;

	// Query has changed
	$: _DUMMYQUERY_changed = browser
		? _DUMMYQUERY_current_query !== _DUMMYQUERY_initial_query
		: false;

	// Actual Query Execution
	let _DUMMYQUERY;

	const _DUMMYQUERY_reactivity_manager = () => {
		const update = () => {
			let initialData, initialError;

			console.log('Updating DUMMYQUERY');
			try {
				if (_DUMMYQUERY_changed || import.meta.hot?.data.hmrHasRun) {
					// Query changed after page load, we have no prerendered results
					initialData = undefined;
					initialError = undefined;
				} else if (data.DUMMYQUERY) {
					// Data is coming from SSR
					if (data.DUMMYQUERY instanceof Error) {
						throw data.DUMMYQUERY;
					} else {
						initialData = data.DUMMYQUERY;
					}
				} else {
					// We are currently prerendering
					initialData = profile(__db.query, _DUMMYQUERY_query_text, { query_name: 'DUMMYQUERY' });
				}
			} catch (e) {
				if (!browser) {
					// If building in strict mode; we should fail, this query broke
					if (import.meta.env.VITE_BUILD_STRICT) throw e;
				}
				initialData = [];
				initialError = e;
			}

			const query_store = Query.create(_DUMMYQUERY_query_text, queryFunc, {
				id: 'DUMMYQUERY',
				scoreNotifier,
				initialData,
				initialError,
				noResolve: _DUMMYQUERY_has_unresolved
			});

			let fetch_maybepromise = undefined;
			if (!query_store.loaded) {
				fetch_maybepromise = query_store.fetch();
			}

			// if we have initial data, execute the query anyways in the background, ignoring results
			// this helps fetch some parquet which can speed up future queries
			if (initialData) {
				query_store.backgroundFetch();
			}

			if (_DUMMYQUERY) {
				// Query has already been created
				// Fetch the data and then replace

				if (fetch_maybepromise instanceof Promise) {
					fetch_maybepromise.then(() => (_DUMMYQUERY = query_store));
				} else {
					_DUMMYQUERY = query_store;
				}
			} else {
				_DUMMYQUERY = query_store;
			}
		};

		update();

		const debounced = debounce(update, 500);

		return () => {
			if (_mounted) {
				debounced();
			} else {
				update();
			}
		};
	};

	let _DUMMYQUERY_debounced_updater;
	// make sure svelte knows debounced updater is dependent on query text
	$: if (typeof _DUMMYQUERY_debounced_updater === 'undefined') {
		_DUMMYQUERY_query_text;
		_DUMMYQUERY_debounced_updater = _DUMMYQUERY_reactivity_manager();
	}

	// rerun if query text changes, prevent initial run to stop unnecessary update
	let _DUMMYQUERY_debounced_once = false;
	$: if (_DUMMYQUERY_debounced_once) {
		_DUMMYQUERY_query_text;
		_DUMMYQUERY_debounced_updater();
	} else {
		_DUMMYQUERY_debounced_once = true;
	}

	// rerun if data changes during dev mode, likely source HMR, prevent initial for same reason as above
	let _DUMMYQUERY_hmr_once = false;
	$: if (dev) {
		if (_DUMMYQUERY_hmr_once) {
			data;
			_DUMMYQUERY_debounced_updater();
		} else {
			_DUMMYQUERY_hmr_once = true;
		}
	}

	if (!browser) {
		onDestroy(inputs_store.subscribe((inputs) => {}));
	}

	$: DUMMYQUERY = $_DUMMYQUERY;
</script>

<!-- 
    MDSvex comes in handy here because it takes frontmatter and shoves it into the metadata object.
    This means that all we need to do is build out the expected page metadata
-->
<!-- Show title as h1 if defined, and not hidden -->
{#if typeof metadata !== 'undefined' && (metadata.title || metadata.og?.title) && metadata.hide_title !== true}
	<h1 class="title">{metadata.title ?? metadata.og?.title}</h1>
{/if}
<svelte:head>
	<!-- Title has a default case; so we need to handle it in a special way -->
	{#if typeof metadata !== 'undefined' && (metadata.title || metadata.og?.title)}
		<title>{metadata.title ?? metadata.og?.title}</title>
		<meta property="og:title" content={metadata.og?.title ?? metadata.title} />
		<meta name="twitter:title" content={metadata.og?.title ?? metadata.title} />
	{:else}
		<!-- EITHER there is no metadata, or there is no specified style -->
		<title>Evidence</title>
	{/if}

	<!-- default twitter cardtags -->
	<meta name="twitter:card" content="summary" />
	<meta name="twitter:site" content="@evidence_dev" />

	{#if typeof metadata === 'object'}
		{#if metadata.description || metadata.og?.description}
			<meta name="description" content={metadata.description ?? metadata.og?.description} />
			<meta property="og:description" content={metadata.og?.description ?? metadata.description} />
			<meta name="twitter:description" content={metadata.og?.description ?? metadata.description} />
		{/if}
		{#if metadata.og?.image}
			<meta property="og:image" content={metadata.og?.image} />
			<meta name="twitter:image" content={metadata.og?.image} />
		{/if}
	{/if}
</svelte:head>

{#if DUMMYQUERY}
	<QueryViewer queryID="DUMMYQUERY" queryResult={DUMMYQUERY} />
{/if}

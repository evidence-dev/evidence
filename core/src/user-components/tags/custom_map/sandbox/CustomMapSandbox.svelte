<script lang="ts">
	import SandboxFrame from '../../../sandbox/SandboxFrame.svelte';
	import type { SandboxLogEntry } from '../../../sandbox/log-protocol';
	import { SANDBOX_RUNTIME_PATH } from './sandbox-srcdoc';
	import { buildMapSandboxCsp } from './map-csp';
	import {
		SANDBOX_MESSAGE_SOURCE,
		SANDBOX_PROTOCOL_VERSION,
		MAP_QUERY_REQUEST,
		validateFilterSetMessage,
		validateFilterCreateMessage,
		type InitMessage,
		type MapProvider,
		type MapVariables,
		type MapThemeSnapshot,
		type MapFiltersSnapshot,
		type MapQueryResponse,
		type SandboxErrorMessage
	} from './sandbox-protocol';

	type Props = {
		userCode: string;
		provider: MapProvider;
		token?: string;
		variables: MapVariables;
		theme: MapThemeSnapshot;
		filters: MapFiltersSnapshot;
		printing?: boolean;
		height?: number;
		class?: string;
		/** Resolve a named page query to rows (parent owns QueryService access). */
		runQuery: (name: string) => Promise<MapQueryResponse>;
		/** `evidence.filters.set(id, value)` — cross-filter the page. */
		onFilterSet?: (id: string, value: unknown) => void;
		/** `evidence.filters.create(id, value, { column })` — declare a new page filter. */
		onFilterCreate?: (id: string, value: unknown, column?: string) => void;
		onError?: (message: string | undefined) => void;
		onRendered?: () => void;
		onLog?: (entry: SandboxLogEntry) => void;
	};

	let {
		userCode,
		provider,
		token,
		variables,
		theme,
		filters,
		printing = false,
		height,
		class: className,
		runQuery,
		onFilterSet,
		onFilterCreate,
		onError,
		onRendered,
		onLog
	}: Props = $props();

	const instanceId =
		typeof crypto !== 'undefined' && 'randomUUID' in crypto
			? crypto.randomUUID()
			: `cm-${Math.random().toString(36).slice(2)}`;

	const runtimeUrl = $derived(
		typeof window !== 'undefined'
			? `${window.location.origin}${SANDBOX_RUNTIME_PATH}?v=${SANDBOX_PROTOCOL_VERSION}`
			: ''
	);

	const init = $derived<InitMessage>({
		type: 'init',
		userCode,
		provider,
		token,
		variables,
		theme,
		filters,
		printing
	});

	// Pull-model data: author `evidence.query(name)` → this handler → the page's
	// named queries. No ad-hoc SQL — `name` can only reach declared queries.
	const requestHandlers = {
		[MAP_QUERY_REQUEST]: async (payload: unknown) => {
			const name = (payload as { name?: unknown })?.name;
			if (typeof name !== 'string') throw new Error('query request missing a name');
			return runQuery(name);
		}
	};

	let postToFrame = $state<((message: Record<string, unknown>) => void) | undefined>();
	// Mirror of what the sandbox last received, so a filter change reposts only
	// state and a body edit only the code (init already carried them at connect).
	let sent: {
		userCode: string;
		variables: MapVariables;
		theme: MapThemeSnapshot;
		filters: MapFiltersSnapshot;
	} | null = null;

	function onConnect(post: (message: Record<string, unknown>) => void): void {
		postToFrame = post;
		sent = { userCode, variables, theme, filters };
	}

	$effect(() => {
		if (!postToFrame || !sent) return;
		// A body edit tears down + re-runs; state changes re-seed in place.
		if (userCode !== sent.userCode) {
			postToFrame({ type: 'code', userCode });
			sent.userCode = userCode;
		}
		if (variables !== sent.variables || theme !== sent.theme || filters !== sent.filters) {
			postToFrame({ type: 'state-change', variables, theme, filters });
			sent.variables = variables;
			sent.theme = theme;
			sent.filters = filters;
		}
	});

	function handleMapMessage(message: { type: string } & Record<string, unknown>): void {
		if (message.type === 'error') {
			onError?.((message as unknown as SandboxErrorMessage).message);
		} else if (message.type === 'filter-set') {
			const validated = validateFilterSetMessage(message);
			if (validated) onFilterSet?.(validated.id, validated.value);
		} else if (message.type === 'filter-create') {
			const validated = validateFilterCreateMessage(message);
			if (validated) onFilterCreate?.(validated.id, validated.value, validated.column);
		}
	}
</script>

<SandboxFrame
	source={SANDBOX_MESSAGE_SOURCE}
	version={SANDBOX_PROTOCOL_VERSION}
	{instanceId}
	{runtimeUrl}
	bodyHtml={'<style>#evidence-map-root { width: 100%; height: 100%; }</style><div id="evidence-map-root"></div>'}
	{init}
	taskName="custom_map"
	title="Custom map"
	{height}
	minHeight={215}
	class={className}
	{requestHandlers}
	buildCsp={buildMapSandboxCsp}
	{onRendered}
	{onError}
	{onLog}
	{onConnect}
	onMessage={handleMapMessage}
/>

<script lang="ts">
	import type { UserComponentProps } from '../../types';
	import { schema } from './schema';
	import { getComponentWrapperContext } from '../../common/component-wrapper-context';
	import { getAssetDeliveryContext } from '../../common/asset-delivery-context';
	import { getQueryInfoContext } from '../../../query-info-context.svelte';
	import { setupRenderReadiness } from '../../../readiness.svelte';
	import { ImageModel } from './ImageModel.svelte';
	import { getModelContext } from '../../model-context.svelte';

	const props: UserComponentProps<typeof schema> = $props();

	const model = getModelContext({ expected: ImageModel });

	const { getComponentId, setError } = getComponentWrapperContext();
	const componentId = $derived(getComponentId());
	const queryInfoContext = getQueryInfoContext();
	// Unset except in embedded reports, where it appends the embed token so the
	// third-party iframe can authenticate the image request.
	const assetDelivery = getAssetDeliveryContext();

	/**
	 * Expands short evd_ aliases to the authenticated image proxy path.
	 * Uploaded images are private blobs, only readable via Studio's proxy —
	 * e.g. evd_<orgId>/abc.png -> /upload-image/<orgId>/abc.png
	 */
	function expandImageUrl(url: string | undefined): string | undefined {
		if (!url) return url;
		if (url.startsWith('evd_')) {
			const proxied = `/upload-image/${url.substring(4)}`;
			return assetDelivery ? assetDelivery.authorize(proxied) : proxied;
		}
		return url;
	}

	const url = $derived(expandImageUrl(model.imageUrl));
	const dark_url = $derived(expandImageUrl(model.darkImageUrl));
	const description = $derived(model.imageDescription ?? '');
	const width = $derived(props.max_width);
	// Gate on queryConfig: an empty-resolving data/column never runs a query, and an
	// idle Query reports loading forever — which would strand the skeleton and hang
	// PDF readiness.
	const loading = $derived(
		model.isDataDriven && model.queryConfig !== undefined && model.query.loading
	);

	setupRenderReadiness('image', () => !loading);

	$effect(() => {
		if (!model.isDataDriven) return;
		return queryInfoContext?.registerQuery(componentId, 'image', model.query);
	});

	$effect(() => {
		// Mode-aware rather than an early-return guard: switching a tag from data
		// mode back to static in the editor must clear a previously-set error.
		setError(model.isDataDriven ? (model.query.result?.error ?? undefined) : undefined);
	});

	const containerClasses = $derived(
		[
			'flex',
			props.align === 'left'
				? 'justify-start'
				: props.align === 'right'
					? 'justify-end'
					: 'justify-center',
			props.dither && 'dither-xs'
		]
			.filter(Boolean)
			.join(' ')
	);
	const imageClasses = $derived(
		['rounded-lg', props.border && 'border border-solid border-gray-300', props.class]
			.filter(Boolean)
			.join(' ')
	);
</script>

<div class={containerClasses}>
	{#if loading}
		<div
			class="bg-muted/60 h-32 animate-pulse rounded-lg"
			style:width={width ? `${width}px` : '12rem'}
		></div>
	{:else if url && dark_url}
		<img src={url} alt={description} {width} class="{imageClasses} dark:hidden" />
		<img src={dark_url} alt={description} {width} class="{imageClasses} hidden dark:block" />
	{:else if url}
		<img src={url} alt={description} {width} class={imageClasses} />
	{/if}
</div>

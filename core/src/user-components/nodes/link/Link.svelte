<script lang="ts">
	import { page } from '$app/state';
	import { getRendererContext } from '../../Renderer/renderer-context';
	import {
		isInternalLink,
		transformInternalLink,
		mergeCurrentSearchParams
	} from '../../common/transform-internal-link';
	import type { UserComponentProps } from '../../types';
	import type { schema } from './schema';

	const {
		/**
		 * For internal links: /...<directorySlugs>/<pageSlug>
		 * For external links: any valid URL
		 */
		href,
		children
	}: UserComponentProps<typeof schema> = $props();

	const rendererContext = getRendererContext();

	const isInternal = $derived(isInternalLink(href));

	const transformedHref = $derived(
		transformInternalLink(href, rendererContext.context, page.params)
	);

	/**
	 * Merge the current page's filter params into the link at click time.
	 * This runs before SvelteKit's delegated click handler, so modifying
	 * e.currentTarget.href here ensures the router navigates to the merged URL.
	 *
	 * Click-time (not render-time) ensures the latest filter values are included,
	 * since window.location.search is always fresh from synchronous replaceState writes.
	 */
	function handleInternalClick(e: MouseEvent & { currentTarget: HTMLAnchorElement }) {
		const merged = mergeCurrentSearchParams(transformedHref);
		if (merged !== transformedHref) {
			e.currentTarget.href = merged;
		}
	}
</script>

<a
	href={transformedHref}
	target={isInternal ? undefined : '_blank'}
	rel={isInternal ? undefined : 'noopener noreferrer'}
	onclick={isInternal ? handleInternalClick : undefined}>{@render children?.()}</a>

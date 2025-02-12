<script context="module">
	export const evidenceInclude = true;

	const DEPRECATED_STATUS_MAP = /** @type {const} */ ({
		default: 'base',
		danger: 'negative',
		success: 'positive'
	});

	const isDeprecatedStatus = (input) => Object.keys(DEPRECATED_STATUS_MAP).includes(input);

	const checkDeprecatedStatus = (input) => {
		if (isDeprecatedStatus(input)) {
			console.warn(
				`[Alert] The status "${input}" is deprecated. Please use "${DEPRECATED_STATUS_MAP[input]}" instead.`
			);
			return DEPRECATED_STATUS_MAP[input];
		}
		return input;
	};

	const classMap = {
		info: 'border-info/50 bg-info/10 text-info',
		negative: 'border-negative/50 bg-negative/10 text-negative',
		positive: 'border-positive/50 bg-positive/10 text-positive',
		warning: 'border-warning/50 bg-warning/10 text-warning',
	};
</script>

<script>
	// Based on the alert from FlowBite: https://flowbite.com/docs/components/alerts/

	import InlineError from '../inputs/InlineError.svelte';

	/**
	 * Defines the color of the alert
	 * @type {"base" | "info" | "positive" | "warning" | "negative"}
	 */
	export let status = 'base';
	$: status = checkDeprecatedStatus(status);
</script>

{#if !$$slots.default}
	<InlineError inputType="Alert" height="42" error={['No Alert content found']} />
{:else}
	<div
		class="alert {classMap[
			status
		]} border px-3 py-2 mb-4 rounded-sm border-base-content/50 bg-base-content/10"
		role="alert"
	>
		<slot />
	</div>
{/if}

<style>
	/* We can't target :global without a style tag, and we can't use tailwind in style tags. */
	.alert :global(.markdown:first-child) {
		margin-top: 0;
	}
	.alert :global(.markdown:last-child) {
		margin-bottom: 0;
	}
</style>

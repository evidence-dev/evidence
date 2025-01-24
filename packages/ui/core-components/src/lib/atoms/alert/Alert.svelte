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
</script>

<script>
	// Based on the alert from FlowBite: https://flowbite.com/docs/components/alerts/

	import InputError from '../inputs/InputError.svelte';

	/**
	 * Defines the color of the alert
	 * @type {"base" | "info" | "positive" | "warning" | "negative"}
	 */
	export let status = 'base';
	$: status = checkDeprecatedStatus(status);
</script>

{#if !$$slots.default}
	<InputError inputType="Alert" height="42" error="No {status} Alert content found" />
{:else}
	<div class="alert {status}" role="alert">
		<div>
			<slot />
		</div>
	</div>
{/if}

<style lang="postcss">
	.alert {
		@apply border px-3 py-2 mb-4 rounded border-base-content/50 bg-base-content/10;

		&.info {
			@apply border-info/50 bg-info/10;
		}
		&.negative {
			@apply border-negative/50 bg-negative/10;
		}
		&.positive {
			@apply border-positive/50 bg-positive/10;
		}
		&.warning {
			@apply border-warning/50 bg-warning/10;
		}

		& :global(.markdown:last-child) {
			@apply mb-0;
		}
		& :global(.markdown:first-child) {
			@apply mt-0;
		}
	}
</style>

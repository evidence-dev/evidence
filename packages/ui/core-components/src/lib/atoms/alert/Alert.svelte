<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	// Based on the alert from FlowBite: https://flowbite.com/docs/components/alerts/
	/**
	 * Defines the color of the alert
	 * @type {"default" | "info" | "danger" | "success" | "warning"}
	 */
	export let status = 'default';
</script>

<div class="alert {status}" role="alert">
	<div>
		<slot />
	</div>
</div>

<style lang="postcss">
	.alert {
		@apply p-2 mb-4 rounded bg-neutral text-neutral-content top-14;

		&.info {
			@apply bg-info text-info-content;
		}
		&.danger {
			@apply bg-negative text-negative-content;
		}
		&.success {
			@apply bg-positive text-positive-content;
		}
		&.warning {
			@apply bg-warning text-warning-content;
		}

		& :global(p) {
			@apply mb-0;
		}
	}
</style>

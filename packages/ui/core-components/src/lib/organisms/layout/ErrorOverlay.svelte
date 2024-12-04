<script>
	import { fade, fly } from 'svelte/transition';
	import {
		handleClosingTagErrors,
		handleUnexpectedBlockClosingTagErrors,
		handleOpenTagErrors,
		handleExpectedCharacterErrors,
		handlePropErrors,
		handleUnexpectedEnd,
		handleUnexpectedTokens,
		handleExpectedWhitespace
	} from '@evidence-dev/component-utilities/hmrErrorHandling';
	let hasError = false;
	let message;

	if (import.meta.hot) {
		import.meta.hot.on('vite:error', (data) => {
			const err = data.err;

			const errorHandlers = [
				handleClosingTagErrors,
				handleUnexpectedBlockClosingTagErrors,
				handleOpenTagErrors,
				handleExpectedCharacterErrors,
				handlePropErrors,
				handleUnexpectedEnd,
				handleUnexpectedTokens,
				handleExpectedWhitespace
			];

			const customErrorMessage = errorHandlers.reduce((acc, handler) => {
				return acc || handler(err);
			}, null);

			hasError = true;
			message = customErrorMessage || err.message;
			return false;
		});

		import.meta.hot.on('vite:beforeUpdate', () => {
			hasError = false;
		});
	}
</script>

{#if hasError}
	<div
		class="fixed flex flex-col z-50 h-screen w-screen bg-base-100/50 justify-center items-center py-20 px-10 sm:px-20 select-none backdrop-blur-sm"
		transition:fade|local={{ duration: 100 }}
	>
		<div
			transition:fly|local={{ y: 100, duration: 300 }}
			class="relative min-w-full h-screen bg-gradient-to-b from-base-200 to-base-300 rounded-lg border-t-8 border-negative shadow-xl p-8"
		>
			<h1 class="text-2xl font-bold tracking-wide border-b pb-4 border-base-300">Error</h1>
			<p class="text-xl mt-6 leading-relaxed select-text">{message}</p>
			<div class="absolute bottom-0 flex items-end gap-4 text-lg mb-6">
				<a
					href="https://docs.evidence.dev"
					target="”_blank”"
					class="hover:text-base-content-muted transition-colors duration-200">docs</a
				>
				<a
					href="https://evidencedev.slack.com/join/shared_invite/zt-uda6wp6a-hP6Qyz0LUOddwpXW5qG03Q#/shared-invite/email"
					target="”_blank”"
					class="hover:text-base-content-muted transition-colors duration-200">slack</a
				>
				<a
					href="mailto:support@evidence.dev"
					class="hover:text-base-content-muted transition-colors duration-200">email</a
				>
			</div>
		</div>
	</div>
{/if}

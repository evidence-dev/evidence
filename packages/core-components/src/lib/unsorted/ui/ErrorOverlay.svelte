<script>
	import { fade, fly } from 'svelte/transition';
	let hasError = false;
	let message;

	if (import.meta.hot) {
		import.meta.hot.on('vite:error', (data) => {
			let customErrorMessage;
			if (data.err.message.includes('Unexpected block closing tag')) {
				if (data.err.frame.includes('{/each}')) {
					if (data.err.frame.includes('</li>')) {
						customErrorMessage =
							'{#each} block requires an empty line before the closing {/each} tag';
					} else {
						customErrorMessage =
							'Component tag was left open inside {#each} block. Ensure that all components are closed';
					}
				} else {
					customErrorMessage = 'Unexpected block closing';
				}
			} else if (data.err.message.includes('Block was left open')) {
				customErrorMessage = 'Component tag was left open. Ensure that all components are closed';
			} else if (data.err.message.includes('is not defined')) {
				customErrorMessage = data.err.message;
			} else if (data.err.message.includes('attempted to close an element that was not open')) {
				if (data.err.frame.includes('{/each}')) {
					customErrorMessage =
						'Component tag was left open inside {#each} block. Ensure that all components are closed';
				} else {
					customErrorMessage = 'Component tag was left open. Ensure that all components are closed';
				}
			} else if (data.err.message.includes('Expected >')) {
				customErrorMessage = 'Component tag was left open. Ensure that all components are closed';
			}
			hasError = true;
			message = customErrorMessage || data.err.message;
			return false;
		});

		import.meta.hot.on('vite:beforeUpdate', () => {
			hasError = false;
		});
	}
</script>

{#if hasError}
	<div
		class="fixed flex flex-col z-50 h-screen w-screen bg-gray-900/80 justify-center items-center py-20 px-10 sm:px-20  select-none backdrop-blur-sm"
		transition:fade|local={{ duration: 100 }}
	>
		<div
			transition:fly|local={{ y: 100, duration: 300 }}
			class="relative min-w-full h-screen bg-gradient-to-b from-black/95 to-gray-900/90 border-t-red-600 rounded-lg border-t-8 border-red-600 shadow-xl p-8 "
		>
			<h1 class="text-4xl font-bold tracking-wide text-gray-200 border-b pb-4 border-gray-800">
				Error
			</h1>
			<p class="text-xl text-gray-200 mt-6 leading-relaxed select-text">{message}</p>
			<div class="absolute bottom-0 flex items-end gap-4 text-lg mb-6">
				<a
					href="https://docs.evidence.dev"
					target="”_blank”"
					class="text-gray-300 hover:text-white transition-colors duration-200">docs</a
				>
				<a
					href="https://evidencedev.slack.com/join/shared_invite/zt-uda6wp6a-hP6Qyz0LUOddwpXW5qG03Q#/shared-invite/email"
					target="”_blank”"
					class="text-gray-300 hover:text-white transition-colors duration-200 ">slack</a
				>
				<a
					href="mailto:support@evidence.dev"
					class="text-gray-300 hover:text-white transition-colors duration-200 ">email</a
				>
			</div>
		</div>
	</div>
{/if}

<script>
	let display = false;
	let message;

	if (import.meta.hot) {
		let hasError = false;
		import.meta.hot.on('vite:error', (data) => {
			console.log(data.err.frame);
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
			displayCustomError(customErrorMessage);
			return false;
		});

		import.meta.hot.on('vite:beforeUpdate', () => {
			hasError = false;
			setTimeout(() => {
				if (!hasError) {
					clearCustomError();
				}
			}, 100);
		});
	}

	function displayCustomError(message) {
		display = true;

		errorDisplay.textContent = `Error: ${message}`;
		errorDisplay.style.display = 'block'; // Ensure it's visible
	}

	function clearCustomError() {
		display = false;
		let errorDisplay = document.getElementById('custom-error-display');
		if (errorDisplay) {
			// console.log('Clearing custom error display.');
			errorDisplay.style.display = 'none'; // Hide the overlay
		}
	}
</script>

{#if display}
	<div class=" absolute z-50 h-screen w-screen bg-black">
		{message}
	</div>
{/if}

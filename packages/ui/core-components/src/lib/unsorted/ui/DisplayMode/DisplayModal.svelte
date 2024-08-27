
<script>
    import { setContext } from 'svelte';
	export let showModal; // boolean

	let dialog; // HTMLDialogElement

    setContext('displayModal-showModal', showModal);

	$: if (dialog && showModal) dialog.showModal();
</script>

<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-noninteractive-element-interactions -->
<dialog
	bind:this={dialog}
	on:close={() => (showModal = false)}
    on:click|self={() => {
        setTimeout(() => {
          dialog.close();
        }, 500); // wait for 500ms, which is the duration of the animation
      }}
>
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div class='relative' on:click|stopPropagation>
        <slot />
		<!-- svelte-ignore a11y-autofocus -->
		<button class='p-2 absolute top-5 right-5 hover:opacity-60 hover:cursor-pointer hover:border-2 hover:border-gray-300 border-2 border-white rounded-full' autofocus on:click={() => dialog.close()}>X</button>
	</div>
</dialog>

<style>
	dialog {
        width: 95vw;
        height: 100%;
		border-radius: 0.2em;
		border: none;
		padding: 0;
	}
	dialog::backdrop {
		background: rgba(0, 0, 0, 0.3);
	}
	dialog > div {
		padding: 1em;
	}
	dialog[open] {
		animation: zoom 0.5s ease-in-out;
	}
	@keyframes zoom {
        from {
            transform: translateX(-20%) scale(0.95)
        }
        to {
            transform: translateX(0) scale(1)
        }

	}
	dialog[open]::backdrop {
		animation: fade 1.5s ease-out;
	}
	@keyframes fade {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

    dialog:not([open]) {
		animation: exit 0.5s ease-in-out;
	}
	@keyframes exit {
        from {
            transform: translateX(0%) scale(0.95); opacity: 1;
        }
        to {
            transform: translateX(-20) scale(1); opacity: 0;
        }

	}
	button {
		display: block;
	}
</style>

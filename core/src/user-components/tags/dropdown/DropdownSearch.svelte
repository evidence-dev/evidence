<script lang="ts">
	import { SearchIcon } from 'lucide-svelte';
	import { Input } from '../../../shadcn/components/ui/input';
	import Separator from '../../../shadcn/components/ui/separator/separator.svelte';

	let {
		value = $bindable(''),
		ref = $bindable(null),
		label,
		controls,
		open,
		trigger
	}: {
		value: string;
		ref: HTMLInputElement | null;
		label: string;
		controls: string;
		open: boolean;
		trigger: HTMLButtonElement | null;
	} = $props();

	const listbox = $derived(ref?.closest('[role="listbox"]'));
	let activeOptionId: string | undefined = $state();

	$effect(() => {
		const button = trigger;
		const popup = listbox;
		if (!button || !popup) return;
		// Keep Select's active option on the textbox, including after filtering virtual items.
		const syncActiveOption = () => {
			const id = button.getAttribute('data-active-descendant');
			const option = id ? popup.ownerDocument.getElementById(id) : null;
			activeOptionId = option && popup.contains(option) ? option.id : undefined;
		};
		const observer = new MutationObserver(syncActiveOption);
		observer.observe(button, { attributeFilter: ['data-active-descendant'] });
		observer.observe(popup, { childList: true, subtree: true });
		syncActiveOption();
		return () => observer.disconnect();
	});

	function handleKeydown(event: KeyboardEvent) {
		if (
			!trigger ||
			trigger.disabled ||
			event.isComposing ||
			!['ArrowDown', 'ArrowUp', 'Enter', 'Tab'].includes(event.key)
		) {
			return;
		}
		if (event.key === 'Tab') {
			// The popup is portalled. Continue tabbing from the trigger's position.
			trigger.focus({ preventScroll: true });
		} else if (!listbox?.querySelector('[role="option"]:not([data-disabled])')) {
			event.preventDefault();
			return;
		} else if (!activeOptionId) {
			// Filtering can remove the highlighted option between keystrokes.
			const key = event.key === 'ArrowUp' ? 'End' : 'Home';
			trigger.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
			if (event.key !== 'Enter') {
				event.preventDefault();
				return;
			}
		}
		if (!trigger.dispatchEvent(new KeyboardEvent('keydown', event))) event.preventDefault();
	}
</script>

<div class="fixed top-0 right-0 left-0 mx-1 mt-1">
	<div class="relative">
		<Input
			bind:ref
			bind:value
			role="combobox"
			aria-label={label}
			aria-controls={controls}
			aria-expanded={open}
			aria-autocomplete="list"
			aria-activedescendant={open ? activeOptionId : undefined}
			placeholder={label}
			class="h-8 border-none p-0 pl-8 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
			onkeydown={handleKeydown}
		/>
		<div class="absolute top-0 left-0 flex h-full items-center justify-center">
			<SearchIcon class="ml-2 h-4 w-4 text-muted-foreground" />
		</div>
	</div>
	<Separator orientation="horizontal" class="my-1" />
</div>

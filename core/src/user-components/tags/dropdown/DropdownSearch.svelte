<script lang="ts">
	import { SearchIcon } from 'lucide-svelte';
	import { Input } from '../../../shadcn/components/ui/input';
	import Separator from '../../../shadcn/components/ui/separator/separator.svelte';

	let {
		value = $bindable(''),
		ref = $bindable(null),
		label,
		controls,
		trigger
	}: {
		value: string;
		ref: HTMLInputElement | null;
		label: string;
		controls: string;
		trigger: HTMLButtonElement | null;
	} = $props();

	function handleKeydown(event: KeyboardEvent) {
		if (
			!trigger ||
			trigger.disabled ||
			event.isComposing ||
			!['ArrowDown', 'ArrowUp', 'Enter', 'Tab'].includes(event.key)
		) {
			return;
		}
		// The select handles option navigation and selection on its trigger.
		trigger.focus({ preventScroll: true });
		const activeId = trigger.getAttribute('aria-activedescendant');
		const active = activeId && trigger.ownerDocument.getElementById(activeId);
		if (!active && event.key !== 'Tab') {
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
			aria-label={label}
			aria-controls={controls}
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

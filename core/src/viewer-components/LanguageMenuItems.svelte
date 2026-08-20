<script lang="ts">
	import * as DropdownMenu from '../shadcn/components/ui/dropdown-menu/index.js';
	import { Languages, Check } from 'lucide-svelte';
	import { invalidateAll } from '$app/navigation';

	type Props = {
		languages: string[];
		currentLanguage: string | null;
	};

	let { languages, currentLanguage }: Props = $props();

	function selectLanguage(code: string) {
		document.cookie = `lang=${code}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
		invalidateAll();
	}

	function getLanguageDisplayName(code: string): string {
		try {
			// Display language name in its native language (e.g., "Français" for fr)
			const displayNames = new Intl.DisplayNames([code], { type: 'language' });
			const name = displayNames.of(code);
			if (name && name !== code) {
				// Capitalize first letter
				return name.charAt(0).toUpperCase() + name.slice(1);
			}
		} catch {
			// Fall back to code if Intl.DisplayNames fails
		}
		return code.toUpperCase();
	}
</script>

{#if languages.length > 0}
	<DropdownMenu.Sub>
		<DropdownMenu.SubTrigger class="cursor-pointer text-sm">
			<Languages class="size-4" />
			<span>Language</span>
		</DropdownMenu.SubTrigger>
		<DropdownMenu.SubContent>
			{#each languages as lang}
				<DropdownMenu.Item class="cursor-pointer text-sm" onclick={() => selectLanguage(lang)}>
					<span>{getLanguageDisplayName(lang)}</span>
					{#if currentLanguage === lang}
						<Check class="ml-auto size-4" />
					{/if}
				</DropdownMenu.Item>
			{/each}
		</DropdownMenu.SubContent>
	</DropdownMenu.Sub>
{/if}

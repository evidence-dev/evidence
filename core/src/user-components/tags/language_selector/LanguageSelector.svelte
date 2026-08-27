<script lang="ts">
	import type { UserComponentProps } from '../../types';
	import type { schema } from './schema';
	import { getLocaleContext } from '../../../i18n/locale-context.svelte';
	import { AVAILABLE_LOCALES } from '../../../i18n/translations';
	import { Button } from '../../../shadcn/components/ui/button';
	import { cn } from '../../../shadcn/utils';
	import Globe from 'lucide-svelte/icons/globe';
	import Check from 'lucide-svelte/icons/check';
	import { browser } from '../../../shims/env';

	const props: UserComponentProps<typeof schema> = $props();

	const localeContext = getLocaleContext();
	const currentLocale = $derived(localeContext?.locale ?? 'en-US');
	const variant = $derived(props.variant ?? 'pills');
	const size = $derived(props.size ?? 'sm');
	const title = $derived(props.title);

	const customLocales = $derived(props.locales as string[] | undefined);
	const displayedLocales = $derived.by(() => {
		if (customLocales && Array.isArray(customLocales) && customLocales.length > 0) {
			return customLocales.map((code) => {
				const match = AVAILABLE_LOCALES.find((l) => l.code === code || l.code.startsWith(code));
				return match ?? { code, label: code, flag: '🌐' };
			});
		}
		return [
			{ code: 'en-US', label: 'English', flag: '🇬🇧' },
			{ code: 'it-IT', label: 'Italiano', flag: '🇮🇹' }
		];
	});

	function setLanguage(code: string) {
		if (localeContext) {
			localeContext.locale = code;
		}
		if (browser) {
			try {
				localStorage.setItem('evidence_locale', code);
			} catch {}
		}
	}
</script>

<div class="inline-flex flex-col gap-1 my-1">
	{#if title}
		<span class="text-xs font-medium text-muted-foreground flex items-center gap-1">
			<Globe class="h-3 w-3" />
			<span>{title}</span>
		</span>
	{/if}

	<div class="inline-flex flex-wrap items-center gap-1">
		{#if variant === 'buttons'}
			{#each displayedLocales as item}
				{@const active = currentLocale === item.code || currentLocale.startsWith(item.code.split('-')[0])}
				<Button
					variant={active ? 'default' : 'outline'}
					size={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'default'}
					class="gap-1.5"
					onclick={() => setLanguage(item.code)}
				>
					<span>{item.flag}</span>
					<span>{item.label}</span>
					{#if active}
						<Check class="h-3.5 w-3.5" />
					{/if}
				</Button>
			{/each}
		{:else}
			<!-- Pills variant -->
			<div class="inline-flex rounded-full border border-border bg-muted/30 p-0.5">
				{#each displayedLocales as item}
					{@const active = currentLocale === item.code || currentLocale.startsWith(item.code.split('-')[0])}
					<button
						type="button"
						onclick={() => setLanguage(item.code)}
						class={cn(
							'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-all select-none',
							size === 'sm' && 'px-2 py-0.5 text-xs',
							size === 'lg' && 'px-3.5 py-1 text-sm',
							active
								? 'bg-background text-foreground shadow-xs'
								: 'text-muted-foreground hover:text-foreground'
						)}
					>
						<span>{item.flag}</span>
						<span>{item.label}</span>
					</button>
				{/each}
			</div>
		{/if}
	</div>
</div>

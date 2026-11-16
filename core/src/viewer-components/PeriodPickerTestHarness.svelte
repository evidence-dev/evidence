<script lang="ts">
	import { untrack } from 'svelte';
	import Markdoc from '@markdoc/markdoc';
	import { setConnectionRegistry } from '../connection/context';
	import { setLocaleContext, type LocaleContext } from '../locale/locale.context.svelte';
	import { createPageFiltersContext } from '../page-filters-context';
	import { setProjectSettingsContext } from '../project-settings.context';
	import { registerFiltersFromAST } from '../user-components/Renderer/MarkdocProcessor/register-filters';
	import { DEFAULT_PROJECT_SETTINGS } from '../user-components/interfaces/project-settings';
	import PeriodPicker from './PeriodPicker.svelte';

	let {
		language,
		markdown,
		readonly,
		onLocale
	}: {
		language: string;
		markdown: string;
		readonly: boolean;
		onLocale: (locale: LocaleContext) => void;
	} = $props();

	untrack(() => {
		setConnectionRegistry({ default: { dialect: undefined } } as never);
		setProjectSettingsContext(() => ({
			...DEFAULT_PROJECT_SETTINGS,
			computedDefaultDateRangeEnd: '2026-08-14'
		}));
		onLocale(setLocaleContext(language));
		registerFiltersFromAST(Markdoc.parse(markdown), createPageFiltersContext());
	});
</script>

<PeriodPicker {readonly} />

import type { Writable } from 'svelte/store';

type Tab = {
	internalId: string;
	id: string;
	label: string;
};

type TabsStore = Writable<{
	tabs: Tab[];
	activeId: string;
}>;

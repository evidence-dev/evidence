import { getContext, setContext } from 'svelte';
import type { Option } from '../option/types';

type InputTabsContext = {
	addOption: (option: Option) => void;
	removeOption: (option: Option) => void;
};

const INPUT_TABS_CONTEXT_KEY = Symbol('input_tabs');

export function setInputTabsContext(context: InputTabsContext) {
	setContext(INPUT_TABS_CONTEXT_KEY, context);
}

export function getInputTabsContext(): InputTabsContext | undefined {
	return getContext<InputTabsContext | undefined>(INPUT_TABS_CONTEXT_KEY);
}

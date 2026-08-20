import { getContext, setContext } from 'svelte';
import type { Option } from '../option/types';

const BUTTON_GROUP_CONTEXT_KEY = Symbol('BUTTON_GROUP_CONTEXT');

interface ButtonGroupContext {
	addOption: (option: Option) => void;
	removeOption: (option: Option) => void;
}

export const setButtonGroupContext = (context: ButtonGroupContext) =>
	setContext(BUTTON_GROUP_CONTEXT_KEY, context);

export const getButtonGroupContext = (): ButtonGroupContext | undefined => {
	try {
		return getContext(BUTTON_GROUP_CONTEXT_KEY);
	} catch {
		return undefined;
	}
};

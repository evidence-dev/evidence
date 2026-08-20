import { getContext, setContext } from 'svelte';
import type { Option } from '../option/types';

const DROPDOWN_CONTEXT_KEY = Symbol('DROPDOWN_CONTEXT');

interface DropdownContext {
	addOption: (option: Option) => void;
	removeOption: (option: Option) => void;
}

export const setDropdownContext = (context: DropdownContext) =>
	setContext(DROPDOWN_CONTEXT_KEY, context);

export const getDropdownContext = (): DropdownContext | undefined => {
	try {
		return getContext(DROPDOWN_CONTEXT_KEY);
	} catch {
		return undefined;
	}
};

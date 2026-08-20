import { getContext, setContext } from 'svelte';

const CARD_CONTEXT_KEY = Symbol('CARD_CONTEXT');

interface CardContext {
	insideCard: boolean;
}

export const setCardContext = (context: CardContext) => setContext(CARD_CONTEXT_KEY, context);

export const getCardContext = (): CardContext | undefined =>
	getContext<CardContext | undefined>(CARD_CONTEXT_KEY);

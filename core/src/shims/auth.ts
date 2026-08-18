/**
 * Auth context shim for @evidence/core
 *
 * Components using auth should gracefully degrade when auth context is not available.
 * Studio provides the real implementation via context.
 */
import { getContext, setContext } from 'svelte';

const AUTH_CONTEXT_KEY = Symbol('AUTH_CONTEXT');

export type ClientSafeUser = {
	id: string;
	email: string;
	firstName: string | null;
	lastName: string | null;
	profilePictureUrl: string | null;
	first_name?: string | null;
	last_name?: string | null;
};

export type ClientSafeOrganization = {
	id: string;
	name: string;
};

type AuthValue = {
	user?: ClientSafeUser;
	organization?: ClientSafeOrganization;
};

export class Auth {
	#value: AuthValue | undefined = $state.raw();

	get user() {
		return this.#value?.user;
	}

	get organization() {
		return this.#value?.organization;
	}

	constructor(initialValue?: AuthValue) {
		this.#value = initialValue;
	}

	update(value: AuthValue) {
		this.#value = value;
	}

	getUser(): ClientSafeUser | undefined {
		return this.#value?.user;
	}

	getOrganization(): ClientSafeOrganization | undefined {
		return this.#value?.organization;
	}
}

export const setAuthContext = (auth: Auth) => {
	setContext(AUTH_CONTEXT_KEY, auth);
};

export const getAuthContext = (): Auth | undefined => {
	return getContext<Auth | undefined>(AUTH_CONTEXT_KEY);
};

import type { Readable } from 'svelte/store';

export type Subscriber<T> = (value: T) => unknown;

export abstract class AbstractStore<T> implements Readable<T> {
	#subscribers = new Set<Subscriber<T>>();

	protected abstract value(): T;

	subscribe = (subFn: Subscriber<T>) => {
		this.#subscribers.add(subFn);
		subFn(this.value());
		return () => this.#subscribers.delete(subFn);
	};

	protected publish = () => {
		// get value before iterating to ensure consistency
		const value = this.value();
		this.#subscribers.forEach((sub) => sub(value));
	};
}

import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('$app/environment', () => ({ dev: false, browser: false }));

import { toasts } from '../stores.js';
import { get } from 'svelte/store';

describe('Toast Store', () => {
	beforeEach(() => vi.useFakeTimers());
	afterEach(() => vi.useRealTimers());
	it('should update a toast if another is added with the same id', () => {
		toasts.add({ id: 'a', title: 'x', message: 'x' });
		expect(get(toasts)[0].id).toBe('a');

		toasts.add({ id: 'a', title: 'y' });
		expect(get(toasts)[0].id).toBe('a');
		expect(get(toasts)[0].title).toBe('y');
	});
	it('should respect the updated timeout if another toast is added with the same id', () => {
		toasts.add({ id: 'a', title: 'x', message: 'x' });
		expect(get(toasts)).toHaveLength(1);
		vi.advanceTimersByTime(1999);
		toasts.add({ id: 'a' }, 2000);
		vi.advanceTimersByTime(5);
		expect(get(toasts)).toHaveLength(1);
		vi.advanceTimersByTime(2000);
		expect(get(toasts)).toHaveLength(0);
	});
});

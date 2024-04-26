/**
 * Sets timeout for the given number of milliseconds.
 *
 * @param ms Millisends to use for the timeout.
 * @returns Promise that resolves after the given number of milliseconds.
 */
export function timeout(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

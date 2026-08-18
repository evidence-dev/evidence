/**
 * Returns true when `value` should be considered a valid selection given the
 * dropdown's currently-known options.
 *
 * Used by `Dropdown.svelte` to decide whether to clear the underlying filter
 * when the options query result no longer contains the user's selection.
 *
 * Three states matter:
 *
 *   1. **Still loading** (`!hasQueryResults && !hasStaticOptions`) — return
 *      true. We have no information yet, so don't drop the value. This keeps
 *      URL-hydrated values intact through the first paint.
 *
 *   2. **Loaded but empty** (`(hasQueryResults || hasStaticOptions)` AND
 *      `availableValues.size === 0`) — return true. An empty option set is
 *      usually a transient state (race with inline-query interpolation, or
 *      a query error). Clearing here is what broke PDF exports: they were
 *      dropping the URL filter value and `select_first` was locking in
 *      an arbitrary default. If options stay empty, the user just sees their
 *      URL value with no dropdown choices — far less surprising than silently
 *      swapping to a different value.
 *
 *   3. **Loaded with non-empty options** — return true iff the value is one
 *      of them. This is the genuine "stale selection" case that we DO want
 *      to clear, typically driven by cascading dropdowns.
 *
 * Empty / undefined values short-circuit to true (no validation needed —
 * Dropdown handles `!value` separately).
 */
export function isDropdownValueValid(
	value: string | undefined,
	availableValues: Set<string>,
	opts: { hasQueryResults: boolean; hasStaticOptions: boolean }
): boolean {
	if (!value) return true;

	const shouldValidate = opts.hasQueryResults || opts.hasStaticOptions;
	if (!shouldValidate) return true;

	if (availableValues.size === 0) return true;

	return availableValues.has(value);
}

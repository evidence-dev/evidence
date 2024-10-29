/**
 * Object.fromEntries but with correct types
 * https://stackoverflow.com/a/76176570
 * @template {ReadonlyArray<readonly [PropertyKey, unknown]>} T
 * @param {T} entries
 * @returns {{ [K in T[number] as K[0]]: K[1] }}
 */
export const fromEntries = (entries) => /** @type {any} */ (Object.fromEntries(entries));

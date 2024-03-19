/**
 *
 * @param {string | undefined} filename
 * @returns
 */
export const isTargetFile = (filename) => filename?.split('/').at(-1)?.startsWith('+');

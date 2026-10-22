/**
 * Human-facing status output on stderr (stdout stays clean for data).
 *
 * Bun prints every `console.error` in red, so routine messages that went through it read as
 * failures. Use these for anything that isn't an error; keep `console.error` for real errors.
 */

import pc from 'picocolors';

export function info(message: string): void {
	process.stderr.write(`${message}\n`);
}

export function tip(message: string): void {
	info(pc.cyan(message));
}

export function warn(message: string): void {
	info(pc.yellow(message));
}

/** The device code framed in a box so it stands out from the surrounding output. */
export function codeBox(code: string, indent = '  '): string {
	const inner = `  ${code}  `;
	const bar = '─'.repeat(inner.length);
	return [`${indent}┌${bar}┐`, `${indent}│${inner}│`, `${indent}└${bar}┘`].join('\n');
}

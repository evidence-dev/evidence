/**
 * Cross-consumer log shape for diagnostics produced inside sandboxed iframes
 * and forwarded to the parent's runtime-error ring buffer (read by the AI
 * agent's debug_code tool).
 *
 * Lives in `user-components/sandbox/` rather than under any single tag because
 * every sandbox-using component speaks the same log shape — custom_echart's
 * JS body, the html component, anything else later. Each
 * consumer still owns its own sandbox protocol (init/data/render messages
 * are tag-specific) and embeds a `{ type: 'log', entry }` message in its
 * own message union.
 */

export interface SandboxLogEntry {
	level: 'error' | 'warn';
	source: 'console' | 'script' | 'fetch' | 'worker';
	message: string;
	stack?: string;
}

export interface LogMessage {
	type: 'log';
	entry: SandboxLogEntry;
}

const LOG_LEVELS = new Set<SandboxLogEntry['level']>(['error', 'warn']);
const LOG_SOURCES = new Set<SandboxLogEntry['source']>([
	'console',
	'script',
	'fetch',
	'worker'
]);

/**
 * Narrow an unknown inbound message to a LogMessage with a valid entry shape.
 * Entries land in a ring buffer consumed by the AI agent's debug_code tool;
 * a malformed entry could poison the buffer's reducer (which is forgiving but
 * not unconditional) or feed the agent garbage that wastes a turn. Drop and
 * move on rather than try to coerce.
 */
export function validateLogMessage(message: unknown): LogMessage | null {
	if (!message || typeof message !== 'object') return null;
	const m = message as Record<string, unknown>;
	if (m.type !== 'log') return null;
	const entry = m.entry;
	if (!entry || typeof entry !== 'object') return null;
	const e = entry as Record<string, unknown>;
	if (typeof e.level !== 'string' || !LOG_LEVELS.has(e.level as SandboxLogEntry['level'])) {
		return null;
	}
	if (typeof e.source !== 'string' || !LOG_SOURCES.has(e.source as SandboxLogEntry['source'])) {
		return null;
	}
	if (typeof e.message !== 'string') return null;
	if (e.stack !== undefined && typeof e.stack !== 'string') return null;
	return {
		type: 'log',
		entry: {
			level: e.level as SandboxLogEntry['level'],
			source: e.source as SandboxLogEntry['source'],
			message: e.message,
			...(typeof e.stack === 'string' ? { stack: e.stack } : {})
		}
	};
}

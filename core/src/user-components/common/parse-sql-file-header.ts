// A `.sql` file has no fence meta line, so it declares its connection in a leading SQL comment
// (`-- connection: snowflake`). The comment is valid SQL, so it stays in the body — nothing strips it.

export type SqlFileHeader = {
	/** The declared connection name, or undefined for the page default. */
	connection?: string;
};

/** `-- connection: name` / `--connection:name`, optionally quoted. */
const CONNECTION_DIRECTIVE = /^\s*--\s*connection\s*:\s*(?:"([^"]+)"|'([^']+)'|(\S+))\s*$/i;

/**
 * Read directives from a `.sql` file's leading comment block. Only leading
 * comment/blank lines are scanned — a `-- connection:` further down is a normal
 * comment, so an author can't accidentally re-route a query from the middle of
 * it.
 */
export function parseSqlFileHeader(body: string | undefined | null): SqlFileHeader {
	if (typeof body !== 'string' || !body) return {};

	for (const line of body.split('\n')) {
		const trimmed = line.trim();
		if (!trimmed) continue;
		if (!trimmed.startsWith('--')) break; // first real SQL — stop scanning
		const match = CONNECTION_DIRECTIVE.exec(trimmed);
		if (match) {
			const name = (match[1] ?? match[2] ?? match[3])?.trim();
			if (name) return { connection: name };
		}
	}
	return {};
}

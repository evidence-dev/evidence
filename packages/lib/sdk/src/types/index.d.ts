// Needed to include the virtual type defs in the output
/// <reference path="./virtuals.d.ts"/>
/// <reference path="./sveltekit-autoimport.d.ts"/>
/// <reference path="./mosaic-sql.d.ts"/>
/// <reference path="./html-attributes.ts" />

export type FileMetadata = {
	queries: Record<string, string>;
};

declare global {
	interface Window {
		__evidence_ssr?: Record<
			string,
			{ data: unknown[]; initialQuery: string; columns: { name: string; evidenceType: string } }
		>;
	}
}

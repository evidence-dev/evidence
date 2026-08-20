/**
 * Project tree interfaces - flexible interfaces used by @evidence/core validators.
 * These use permissive types to accommodate variations between Studio and CLI.
 */

/**
 * Directory entry in the project tree.
 * Uses Record<string, unknown> to be compatible with Studio's type.
 */
export interface Directory {
	id: string | number;
	name: string;
	[key: string]: unknown;
}

/**
 * File entry with page settings.
 * Uses Record<string, unknown> to be compatible with Studio's type.
 */
export interface FileWithPageSettings {
	id: string | number;
	name: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	pageSettings?: Record<string, any>;
	[key: string]: unknown;
}

/**
 * Project entry.
 */
export interface Project {
	id: string | number;
	name: string;
	slug: string;
	organizationId: string;
	[key: string]: unknown;
}

/**
 * Tree entry - either a directory or a page.
 */
export type ProjectTreeEntry =
	| {
			type: 'directory';
			entry: Directory;
			children: ProjectTreeEntry[];
	  }
	| {
			type: 'page';
			entry: FileWithPageSettings;
	  };

/**
 * Project tree - a project with its hierarchical entries.
 */
export interface ProjectTree {
	project: Project;
	entries: ProjectTreeEntry[];
}

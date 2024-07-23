import path from 'path';

export const URL_PREFIX =
	'EVIDENCE_URL_PREFIX' in process.env ? process.env.EVIDENCE_URL_PREFIX : '_evidence';

export const inTemplate = process.cwd().includes(path.join('.evidence', 'template'));

export const evidenceDirectory = inTemplate ? '..' : '.evidence';

export const dataDirectory =
	'EVIDENCE_DATA_DIR' in process.env && process.env.EVIDENCE_DATA_DIR
		? path.resolve(process.env.EVIDENCE_DATA_DIR)
		: path.resolve(evidenceDirectory, 'data');

export const dataUrlPrefix =
	'EVIDENCE_DATA_URL_PREFIX' in process.env
		? process.env.EVIDENCE_DATA_URL_PREFIX
		: `/${URL_PREFIX}/query`;

export const metaDirectory = path.resolve(evidenceDirectory, 'meta');

export const projectRoot = path.resolve(...(inTemplate ? ['..', '..'] : []));

export const sourcesDirectory = path.resolve(projectRoot, 'sources');

export const pagesDirectory =
	'EVIDENCE_PAGES_DIR' in process.env && process.env.EVIDENCE_PAGES_DIR
		? path.resolve(process.env.EVIDENCE_PAGES_DIR)
		: path.resolve(projectRoot, 'pages');

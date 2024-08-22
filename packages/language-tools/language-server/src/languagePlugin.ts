import type { URI } from 'vscode-uri';
import type { LanguagePlugin } from '@volar/language-core';

import { EvidenceCode } from './evidence-code';

export const evidenceLanguagePlugin = {
	getLanguageId(uri) {
		// TODO Do we need more detailed logic to determine when to enable Evidence Language Server?
		// e.g. not all .md files, non-md files, certain project directories (pages, components, etc)
		if (uri.path.endsWith('.md')) {
			return 'evidence';
		}
	},
	createVirtualCode(_uri, languageId, snapshot) {
		// console.log('createVirtualCode', { uri, languageId, snapshot });
		if (languageId === 'evidence') {
			return new EvidenceCode(snapshot);
		}
	},
	updateVirtualCode(_uri, languageCode, snapshot) {
		// console.log('createVirtualCode', { uri, languageCode, snapshot });
		languageCode.update(snapshot);
		return languageCode;
	}
} satisfies LanguagePlugin<URI, EvidenceCode>;

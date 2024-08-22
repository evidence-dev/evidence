import { LanguageServicePlugin, LanguageServicePluginInstance } from '@volar/language-service';
import { SveltePlugin } from 'svelte-language-server/dist/src/plugins/svelte/SveltePlugin';
import { LSConfigManager } from 'svelte-language-server/dist/src/ls-config';
import { Document } from 'svelte-language-server/dist/src/lib/documents';

export const svelte: LanguageServicePlugin = {
	name: 'svelte',
	// Svelte LS capabilities: https://github.com/sveltejs/language-tools/blob/master/packages/language-server/src/server.ts#L215
	capabilities: {
		hoverProvider: true,
		completionProvider: {
			resolveProvider: true,
			triggerCharacters: [
				'.',
				'"',
				"'",
				'`',
				'/',
				'@',
				'<',

				// Emmet
				'>',
				'*',
				'#',
				'$',
				'+',
				'^',
				'(',
				'[',
				'@',
				'-',
				// No whitespace because
				// it makes for weird/too many completions
				// of other completion providers

				// Svelte
				':',
				'|'
			]
		}
	},
	create(): LanguageServicePluginInstance {
		const configManager = new LSConfigManager();
		const svelte = new SveltePlugin(configManager);

		return {
			provideCompletionItems(textDocument, position, context, token) {
				const document = new Document(textDocument.uri, textDocument.getText());
				return svelte.getCompletions(document, position, context, token);
			},
			provideHover(textDocument, position) {
				const document = new Document(textDocument.uri, textDocument.getText());
				return svelte.doHover(document, position);
			}
		};
	}
};

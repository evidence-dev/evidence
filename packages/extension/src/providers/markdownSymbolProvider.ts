import {
	CancellationToken,
	DocumentSymbol,
	DocumentSymbolProvider,
	ProviderResult,
	SymbolKind,
	TextDocument,
	Range
} from 'vscode';

export class MarkdownSymbolProvider implements DocumentSymbolProvider {
	provideDocumentSymbols(
		document: TextDocument,
		token: CancellationToken
	): ProviderResult<DocumentSymbol[]> {
		const symbols: DocumentSymbol[] = [];
		const stack: { symbol: DocumentSymbol; level: number }[] = [];

		for (let i = 0; i < document.lineCount; i++) {
			const line = document.lineAt(i);

			// Handle headers
			const headerMatch = line.text.match(/^(#+)\s+(.*)$/);
			if (headerMatch) {
				const level = headerMatch[1].length;
				const symbol = new DocumentSymbol(
					headerMatch[2],
					'',
					SymbolKind.Number,
					line.range,
					line.range
				);
				this.addToHierarchy(symbols, stack, symbol, level);
				continue;
			}

			// Handle Svelte components (self-closing and with closing tags)
			const componentStartMatch = line.text.match(/<\s*([A-Z][A-Za-z0-9]*)\b[^>]*(\/?)/);
			if (componentStartMatch) {
				const componentName = componentStartMatch[1];
				let componentEndLine = i;
				let isSelfClosing = componentStartMatch[2] === '/';

				if (!isSelfClosing && !line.text.endsWith('>')) {
					// Continue reading lines until we find the closing tag
					for (let j = i + 1; j < document.lineCount; j++) {
						componentEndLine = j;
						const endLineText = document.lineAt(j).text;
						if (endLineText.includes('>')) {
							isSelfClosing = endLineText.includes('/>');
							break;
						}
					}
				}

				const range = new Range(
					i,
					0,
					componentEndLine,
					document.lineAt(componentEndLine).text.length
				);
				const componentSymbol = new DocumentSymbol(
					`${componentName}`,
					'',
					SymbolKind.Field,
					range,
					range
				);
				const level = stack.length > 0 ? stack[0].level + 1 : 1;
				this.addToHierarchy(symbols, stack, componentSymbol, level);
				if (!isSelfClosing) {
					i = componentEndLine;
				}
				continue;
			}

			// Handle SQL blocks with backticks
			const sqlBlockMatch = line.text.match(/^\s*```\s*(sql)?\s*(\w*)/);
			if (sqlBlockMatch) {
				const sqlName = sqlBlockMatch[2];
				const endLine = this.findClosingTag(document, i, /^```$/);
				if (endLine !== -1) {
					const range = new Range(i, 0, endLine, document.lineAt(endLine).text.length);
					const sqlSymbol = new DocumentSymbol(
						`Query | ${sqlName}`,
						'',
						SymbolKind.Method,
						range,
						range
					);
					const level = stack.length > 0 ? stack[stack.length - 1].level + 1 : 1;
					this.addToHierarchy(symbols, stack, sqlSymbol, level);
					i = endLine;
				}
				continue;
			}

			// Handle Svelte {#each} and {#if} blocks
			const controlBlockMatch = line.text.match(/\{#(each|if)\s/);
			if (controlBlockMatch) {
				const blockName = `${controlBlockMatch[1].charAt(0).toUpperCase() + controlBlockMatch[1].slice(1)} Block`;
				const endLine = this.findClosingTag(
					document,
					i,
					new RegExp(`{\\/${controlBlockMatch[1]}}`)
				);
				if (endLine !== -1) {
					const range = new Range(i, 0, endLine, document.lineAt(endLine).text.length);
					const controlBlockSymbol = new DocumentSymbol(
						blockName,
						'',
						SymbolKind.Namespace,
						range,
						range
					);
					const level = stack.length > 0 ? stack[0].level + 1 : 1;
					this.addToHierarchy(symbols, stack, controlBlockSymbol, level);
					i = endLine;
				}
				continue;
			}
		}

		return symbols;
	}

	addToHierarchy(
		symbols: DocumentSymbol[],
		stack: { symbol: DocumentSymbol; level: number }[],
		symbol: DocumentSymbol,
		level: number
	) {
		while (stack.length > 0 && stack[stack.length - 1].level >= level) {
			stack.pop();
		}
		if (stack.length > 0) {
			stack[stack.length - 1].symbol.children.push(symbol);
		} else {
			symbols.push(symbol);
		}
		stack.push({ symbol, level });
	}

	findClosingTag(document: TextDocument, startLine: number, regex: RegExp): number {
		for (let i = startLine + 1; i < document.lineCount; i++) {
			if (document.lineAt(i).text.match(regex)) {
				return i;
			}
		}
		return -1; // Not found
	}
}

import {
  CancellationToken,
  DocumentSymbolProvider,
  Location,
  ProviderResult,
  SymbolInformation,
  SymbolKind,
  TextDocument,
} from 'vscode';

/**
 * Implements custom Evidence markdown document symbol provider.
 */
export class MarkdownSymbolProvider implements DocumentSymbolProvider {

  provideDocumentSymbols(document: TextDocument, token: CancellationToken):
    ProviderResult<SymbolInformation[]> {

    // parse text document symbols per line
    const symbols: SymbolInformation[] = [];
    for (let i = 0; i < document.lineCount; i++) {
      const line = document.lineAt(i);

      // match heading lines
      const match = line.text.match(/^#+\s+(.*)$/);
      if (match) {
        const symbol = new SymbolInformation(match[1], SymbolKind.String,
          '', // container name
          new Location(document.uri, line.range)
        );

        symbols.push(symbol);
      }
    }

    return symbols;
  }
}

# Change Log

All notable changes to the Evidence VS Code extension will be documented in this file.

## 0.0.6
- Bug fix for most recent VS Code release

## 0.0.5
- Remove template select statement from SQL query block autocomplete (issues with behaviour of Markdown's asterisk surrounding pair)

## 0.0.4
- Deactivated `editor.acceptSuggestionsOnEnter` to avoid insertion of autocomplete suggestions when trying to add a new line. This is a temporary fix until VS Code fixes the sensitivity of the suggestion triggers (e.g., suggestions appearing on the last character of a word)
- Minor autocomplete fixes

## 0.0.3
- Added extension dependency for Svelte for VS Code (Svelte language support)

## 0.0.2
- Extension published to Open VSX for availability in cloud IDEs and web versions of VS Code.

## 0.0.1
Initial release of the official VSCode extension for Evidence:
- Syntax highlighting for Markdown, SQL, Svelte, and JavaScript
- Autocomplete suggestions for inserting:
   - SQL Query Blocks
   - Components: Charts, Tables, and Text Components
   - Templating: Loops and Conditionals


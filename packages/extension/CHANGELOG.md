# Change Log

## 1.5.6

### Patch Changes

- 73782e654: dont create legacy file on new project

## 1.5.4

### Patch Changes

- 9ca3a61e0: support for Node v22

## 1.5.3

### Patch Changes

- bad1038c1: Override dset version to resolve security vulnerability

## 1.5.1

### Patch Changes

- 6cdedceb0: Remove db-orchestrator

## 1.3.17 - 2023-10-06

- Bumps Evidence to v22.0.0

## 1.3.8 - 2023-07-25

- Bumps Evidence to v20.0.1

## 1.3.6 - 2023-07-17

- Adds slash commands for new UI components: Accordion, Modal, LinkButton, and BigLink

## 1.3.5 - 2023-07-05

- Move position of "New Evidence Project" option lower in the explorer menu
- Limit scope of slash commands to markdown files inside the Evidence pages directory
- Update snippets to include more detailed examples

## 1.3.4 - 2023-06-27

- Update Evidence template project

## 1.3.3 - 2023-06-27

- Refine scope of slash commands and suggestions to only markdown files
  ([#124](https://github.com/evidence-dev/evidence-vscode/pull/124))

## 1.3.2 - 2023-06-26

- Patch release: Update template for new projects
  ([#123](https://github.com/evidence-dev/evidence-vscode/pull/123))

## 1.3.1 - 2023-06-26

- Refines availability of slash commands to only active text documents
  ([#122](https://github.com/evidence-dev/evidence-vscode/pull/122))

## 1.3.0 - 2023-06-23

- Add new autocomplete options and a slash command to open menu of available components
  ([#119](https://github.com/evidence-dev/evidence-vscode/pull/119))

## 1.2.1 - 2023-06-19

- Add walkthrough step to create a new project when one isn't detected
  ([#117](https://github.com/evidence-dev/evidence-vscode/pull/117))
- Modify settings command names

## 1.2.0 - 2023-06-15

- Automatically open folder when new project created
  ([#81](https://github.com/evidence-dev/evidence-vscode/issues/82))
- Automatically open `index.md` and walkthrough on new project creatio
  ([#85](https://github.com/evidence-dev/evidence-vscode/issues/85))
- Add keyboard shortcuts
  ([#89](https://github.com/evidence-dev/evidence-vscode/issues/89))
- Simplify CLI output
  ([#92](https://github.com/evidence-dev/evidence-vscode/issues/92))
- Automatically install dependencies when needed
  ([#95](https://github.com/evidence-dev/evidence-vscode/pull/95))
- Add setting for default preview position
  ([#102](https://github.com/evidence-dev/evidence-vscode/pull/102))
- Improve NodeJS dependency check and download prompt
  ([#105](https://github.com/evidence-dev/evidence-vscode/pull/105))
- Add getting started walkthrough
  ([#109](https://github.com/evidence-dev/evidence-vscode/pull/109))

## 1.1.2 - 2023-06-08

- Fix for new project template gitignore issue

## 1.1.1 - 2023-06-07

- Fixes issue for new projects created in non-empty folders

## 1.1.0 - 2023-06-06

- Add `Dev` to `Evidence:` `Start Server` and `Stop Server` command titles
  ([#35](https://github.com/evidence-dev/evidence-vscode/issues/35))
- Hide display of Preview command in Command Palette...
  ([#36](https://github.com/evidence-dev/evidence-vscode/issues/36))
- Hide `Evidence: View Settings` command in `Command Palette...`
  ([#37](https://github.com/evidence-dev/evidence-vscode/issues/37))
- Add Version, Install and Download VS Code Extension badges to README.md
  ([#38](https://github.com/evidence-dev/evidence-vscode/issues/38))
- Add `.evidence/template/evidence/settings.json` config to new projects created from Evidence template
  ([#39](https://github.com/evidence-dev/evidence-vscode/issues/39))
- Refactor workspace folder lookups
  ([#40](https://github.com/evidence-dev/evidence-vscode/issues/40))
- Add Dev Build section to README.md
  ([#41](https://github.com/evidence-dev/evidence-vscode/issues/41))
- Add `workspaceContains` and `onView` to extension `activationEvents` in `package.json`
  ([#42](https://github.com/evidence-dev/evidence-vscode/issues/42))
- Check `package.json` dependencies for `@evidence-dev/*` libraries to enable Evidence app dev/extension commands
  ([#43](https://github.com/evidence-dev/evidence-vscode/issues/43))
- List current limitations in README.md
  ([#44](https://github.com/evidence-dev/evidence-vscode/issues/44))
- Add `Evidence: New Project` command and folder context menu options
  ([#48](https://github.com/evidence-dev/evidence-vscode/issues/48))
- Create new output.ts with only one instance of Evidence Output Channel to log all commands and trace info
  ([#50](https://github.com/evidence-dev/evidence-vscode/issues/50))
- Add `Evidence: Show Output` shortcut command to display extension output
  ([#51](https://github.com/evidence-dev/evidence-vscode/issues/51))
- Add new `evidence.defaultPort` configuration setting
  ([#52](https://github.com/evidence-dev/evidence-vscode/issues/52))
- Provide Autostart Evidence dev server setting and implement autostart and install dependencies prompt on vscode load for smoother user onboarding
  ([#53](https://github.com/evidence-dev/evidence-vscode/issues/53))
- Document new default port and autostart settings in new Settings section in README.md
  ([#54](https://github.com/evidence-dev/evidence-vscode/issues/54))
- Remap `Evidence: View Settings` command we disabled to display extension settings in the built-in VS Code Settings editor
  ([#55](https://github.com/evidence-dev/evidence-vscode/issues/55))
- Prompt to Install Dependencies after new project from a template is created to get started with the new Evidence app
  ([#56](https://github.com/evidence-dev/evidence-vscode/issues/56))
- Start Server and Create project from template progress notification messages and display
  ([#57](https://github.com/evidence-dev/evidence-vscode/issues/57))
- Refine Create Project from Template progress notification messages and increments
  ([#58](https://github.com/evidence-dev/evidence-vscode/issues/58))
- Add Notification message to Open Folder after New Evidence Project is created
  ([#59](https://github.com/evidence-dev/evidence-vscode/issues/59))
- Create new simple Evidence app project `template` to bundle with extension
  ([#60](https://github.com/evidence-dev/evidence-vscode/issues/60))
- Use new simple Evidence `/template` bundled with extension to create `New Project`
  ([#61](https://github.com/evidence-dev/evidence-vscode/issues/61))
- Add new `Evidence: Template Project Url` extension Setting
  ([#62](https://github.com/evidence-dev/evidence-vscode/issues/62))
- Ping Evidence server when we start it via Terminal to get the first page loaded in the built-in Simple Browser view
  ([#66](https://github.com/evidence-dev/evidence-vscode/issues/66))
- Modify Evidence Preview to render only markdown documents in `/pages/` folder
  ([#67](https://github.com/evidence-dev/evidence-vscode/issues/67))
- Ensure `/node_modules` is present prior to starting Evidence dev server
  ([#68](https://github.com/evidence-dev/evidence-vscode/issues/68))
- Create new `/data` folder for the Evidence VS Code extension to store demo data, duckdb, parquet files, etc.
  ([#69](https://github.com/evidence-dev/evidence-vscode/issues/69))
- Rewrite standard and Evidence markdown documents Preview rules and webviews to use
  ([#70](https://github.com/evidence-dev/evidence-vscode/issues/70))
- Copy files and subfolders instead of using `workspace.fs.copy` to copy `/template` project into an open workspace root folder
  ([#72](https://github.com/evidence-dev/evidence-vscode/issues/72))
- Add new Issue Templates to this Evidence VS Code extension repository
  ([#74](https://github.com/evidence-dev/evidence-vscode/issues/74))
- Document, package, and publish `v1.1.0` release
  ([#65](https://github.com/evidence-dev/evidence-vscode/issues/65))

## 1.0.0 - 2023-05-30

Evidence extension v1.0.0 adds new interactive command features to streamline Evidence BI applications developement in VS Code and enhance new users onboarding experience.

Main new features include Evidence app and pages Preview using built-in simple browser extension, new Terminal API, Evidence dev server status bar, and custom Evidence commands to create, update, develop and build Evidance BI applications using built-in file, editor, terminal and context menus VS Code features and public extension APIs.

### Major Changes

- Import evidence.dev VSCode extension code from evidence monorepo
  ([#1](https://github.com/evidence-dev/evidence-vscode/issues/1))
- Add Evidence: Create Project from Template command
  ([#2](https://github.com/evidence-dev/evidence-vscode/issues/2))
- Create Evidence app Preview and render app content in VSCode IDE
  ([#3](https://github.com/evidence-dev/evidence-vscode/issues/3))
- Create Terminal API to run Evidence app dev server
  ([#4](https://github.com/evidence-dev/evidence-vscode/issues/4))
- Add Evidence: Open Settings File shortcut command
  ([#5](https://github.com/evidence-dev/evidence-vscode/issues/5))
- Create Evidence app status bar
  ([#6](https://github.com/evidence-dev/evidence-vscode/issues/6))
- Add Evidence: Clear Cache shortcut command
  ([#7](https://github.com/evidence-dev/evidence-vscode/issues/7))
- Add Evidence: Build shortcut commands
  ([#8](https://github.com/evidence-dev/evidence-vscode/issues/8))
- Review current emd language configuration and determine why it overwrites built-in .md Open Preview command in vscode
  ([#9](https://github.com/evidence-dev/evidence-vscode/issues/9))
- Document new Evidence extension commands
  ([#12](https://github.com/evidence-dev/evidence-vscode/issues/12))
- Add Evidence: Install Dependencies shortcut command
  ([#13](https://github.com/evidence-dev/evidence-vscode/issues/13))
- Add Evidence: View Settings shortcut command
  ([#14](https://github.com/evidence-dev/evidence-vscode/issues/14))
- Add local NodeJS version check prior to running Evidence app commands in terminal
  ([#15](https://github.com/evidence-dev/evidence-vscode/issues/15))
- Add Evidence extension demo gif to the intro section in readme.md
  ([#16](https://github.com/evidence-dev/evidence-vscode/issues/16))
- Add Evidence: Update to Latest Version shortcut command
  ([#17](https://github.com/evidence-dev/evidence-vscode/issues/17))
- Enable custom Evidence project commands only when ./evidence/template files are present
  ([#18](https://github.com/evidence-dev/evidence-vscode/issues/18))
- Add Getting Started section to README.md
  ([#19](https://github.com/evidence-dev/evidence-vscode/issues/19))
- Update Requirements and add Installation section to README.md
  ([#20](https://github.com/evidence-dev/evidence-vscode/issues/20))
- Extend new Evidence app Preview in VS Code to support GitHub Codespaces in a browser
  ([#21](https://github.com/evidence-dev/evidence-vscode/issues/21))
- Split Install Dependencies and Start Server into two actions in Evidence dev server status bar
  ([#27](https://github.com/evidence-dev/evidence-vscode/issues/27))
- Log commands sent to terminal in Evidence Output panel
  ([#28](https://github.com/evidence-dev/evidence-vscode/issues/28))
- Restore built-in markdown.showPreview and markdown.showPreviewToSide commands mapping for all markdown documents
  ([#29](https://github.com/evidence-dev/evidence-vscode/issues/29))
- Package and publish Evidence extension v1.0.0 release
  ([#11](https://github.com/evidence-dev/evidence-vscode/issues/11))

## 0.0.9

### Patch Changes

- c9dde3d: Addition of a "next" release tag in-sync with main branch

All notable changes to the Evidence VS Code extension will be documented in this file.

## 0.0.8

- Add autocomplete suggestion for markdown table
- Update autocomplete suggestions to match simplified Evidence dataset syntax

## 0.0.7

- Fixed markdown preview shortcuts (cmd-shift-V, cmd-K V)
- Adding more space in js snippets so they 'work' by default rather than throwing a user error

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

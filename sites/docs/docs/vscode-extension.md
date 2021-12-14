---
sidebar_position: 3
hide_table_of_contents: false
---

# VS Code Extension
[Evidence VS Code](https://marketplace.visualstudio.com/items?itemName=Evidence.evidence-vscode) provides syntax highlighting and basic autocomplete for Evidence projects.

This is an early version of the extension and will serve as the starting point for deeper VS Code support for Evidence in the future.

## Installation
You can install the extension in 2 ways:
1. In VS Code, search for "Evidence" in the Extensions menu and click to install

    ![extension-menu](/img/extensions-menu-search.png)

1. Install from the the [VS Code Marketplace webpage](https://marketplace.visualstudio.com/items?itemName=Evidence.evidence-vscode)

## Syntax Highlighting
Evidence VS Code provides syntax highlighting for SQL queries, components, templating, Markdown, HTML, and JavaScript.

![highlight-before-after-2](/img/highlight-before-after-2.png)

## Autocomplete
Evidence VS Code includes a collection of autocomplete suggestions which can be quickly inserted into your project with only a few keystrokes. This is not full intellisense, which is planned for a future version of the extension.

![autocomplete-several](/img/autocomplete-several.gif)

### How to Use

#### See Suggestions
There are 2 ways to see available autocomplete suggestions:

1. Start typing an autocomplete keyword. Don't include any tags or special characters when looking for suggestions (e.g., `<`, `{`)

    ![typing-suggestion](/img/typing-suggestion.png)

1. `Ctrl + Space` to open the full list of suggestions

    ![autocomplete-suggestions](/img/autocomplete-suggestions.png)

    Use the up and down arrow keys to navigate the options in the suggestion menu.

#### Select and Insert Suggestion

Press `tab` to insert a suggestion.

#### Fill in Placeholder Information

Once you have inserted a suggestion, you should see several placeholder sections highlighted. You can tab through these placeholders to fill in your component props. 

![bar-with-props](/img/bar-with-props.gif)

Start typing in the first placeholder, then press `tab` and it will move to the next placeholder. When you reach the last placeholder, you can either continue adding props as normal, or press `tab` once more to take you 2 lines below the component you just inserted.

:::note Over-Sensitive Suggestions
You may encounter situations where autocomplete suggestions pop up at the ends of words. The VS Code development team are aware of the issues and are working on a fix which should be available shortly. For this reason, we have temporarily disabled using the `Enter` or `return` keys for selecting suggestions (to avoid suggestions being inserted when you are trying to add a new line to your file).
:::

### Examples

#### SQL Query Blocks
![sql-query-autocomplete-3](/img/sql-query-autocomplete-3.gif)

#### Components
![scatterplot-autocomplete](/img/scatterplot-autocomplete.gif)

#### Templating
![each-autocomplete](/img/each-autocomplete.gif)



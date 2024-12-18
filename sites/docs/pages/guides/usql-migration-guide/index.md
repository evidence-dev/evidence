---
title: Universal SQL Migration Guide
sidebar_position: 3
description: Migrate your < v24 Evidence app to Universal SQL (v24+)
---

Universal SQL is Evidence's latest release, and fundamentally changes how Evidence queries data in order to bring support for three big new features:
1. **Multiple Data Sources:** Combine data from multiple databases, flat files like CSVs, and even non-SQL data sources like Google Sheets - and query them all with SQL
2. **Inputs and Filters:** Use input components to dynamically update your queries and charts based on user input. Filter data using parameterized queries rather than Javascript filter syntax
3. **Adapter Plugins:** Create your own adapter to enable connecting to any data source

This is a big release and contains several breaking changes. This guide will help you migrate your existing apps to USQL.

The following sections explain what is changing in Evidence with Universal SQL. To jump straight to the migration steps, [click here](#migration-steps).

## Do I need to migrate my app?
- If your `@evidence-dev/evidence` package version is `&lt; v24` then it has not yet been migrated, and we encourage you to do so as soon as is practical
- `v23` will continue to be supported for now (sunset date TBC) and will receive critical bugfixes during this period
- If you're unsure what you need to do, or if you need help, [reach out to us on Slack](https://slack.evidence.dev) in the `#migration` channel

## Breaking Changes
- Existing data source connections will need to be reconfigured
- Queries to your data source will need to be moved to the new `sources` directory (details below)
- Queries in markdown files and in the `queries` directory are now written in DuckDB SQL
- Deprecated syntax:
    - `{data.my_query}`. Use `{my_query}` instead
    - Declaring variables from queries in `&lt;script&gt;` tags using `let my_var = ` or `var my_var = `. Use `$: my_var` instead

## How Universal SQL Works
- Universal SQL introduces a new data loading step (called `run sources`) - you write queries against multiple data sources, and Evidence will combine them all into the same format so you can query across them using SQL
- Once your sources are loaded, they can be queried using DuckDB SQL syntax, either directly on your markdown page, or by writing a `.sql` file in your `queries` directory and referencing it in the frontmatter of your markdown file
- These DuckDB SQL queries run in your browser and can be changed on the fly by interactive user input (e.g., filters, dropdowns) using parameterized queries (e.g., `where customer_id = '${inputs.customer}'`)

## Change to Project Structure
To support multiple data sources, USQL introduces a new `sources` directory, which contains one folder per data source. Each data source folder includes connection configuration files (defined in YAML, but configurable via the settings UI of your project in your browser).

If you already have a `sources` directory in your project (e.g., for `.sql` files or `.csv` files), it will need to be renamed to `queries`. This functions in the same way as before, but the `.sql` files use DuckDB SQL syntax and the queries run in the browser rather than during the build step.

Queries in your markdown files will use DuckDB SQL syntax and will also run in the browser.

#### Pre-USQL Basic Project Structure
```bash
+-- .evidence
+-- pages/
|   `-- index.md
+-- sources/
|   `-- a_query.sql
|   `-- another_query.sql
```

#### USQL Basic Project Structure
```bash
+-- .evidence
+-- pages/
|   `-- index.md
+-- queries/
|   `-- a_query.sql
|   `-- another_query.sql
+-- sources/
|   `-- my_source/
|        `-- connection.yaml
|        `-- connection.options.yaml
|        `-- source_query.sql
```

Optional folders for `components`, `static`, and `partials` still work as they did before.

## Overview of Changes you will need to make

<Alert status=info>

**Recommendations**

We recommend creating a backup of your project before starting the migration.

</Alert>

- Use new template project scaffold
- Migrate queries to new project folder structure
- Update on-page queries to use DuckDB syntax
- (Suggested) Refactor `.filter()` statements to take advantage of SQL-based filtering
- (If necessary) Update deprecated syntax
- (If necessary) Reinstall any custom plugins 
- (If necessary) Reinstall any custom external dependencies (non-evidence libraries) 
- (If necessary) Update `.gitignore` to include `**/connection.options.yaml` - only needed if you do not start from a fresh Universal SQL template

## Migration Steps

<Alert status=info>

**VS Code Migration Command**

We have created a VSCode extension command to assist with migration. This will aid significantly with the migration process. Steps for VS Code are shown here. If you prefer to complete the steps manually, see the next section below.

</Alert>

### Using the VS Code Migration Command
This migration command covers most situations, but there may be edge cases where you will need to make adjustments or fix query syntax.

<Alert status=info>

**Troubleshooting**

Issues and errors in the migration command can be related to npm or NodeJS versions - if in doubt, update to the latest LTS versions (see [system requirements](/guides/system-requirements))

</Alert>

1. Ensure you have the Evidence VS Code extension version `1.4.1` or higher installed
2. Open the Evidence project you want to migrate. If your project is within a monorepo, for this migration open only the Evidence project folder as the "workspace" in VS Code - otherwise the migration command will not be able to run
3. Open the command palette (`Cmd`/`Ctrl` + `Shift` + `P`)
4. Type `Evidence: Migrate Project to USQL` and select that command
5. Follow the prompts in VS Code. You will be asked to provide a name for your data source. This will appear as a folder within the `sources` directory in your project (e.g., you could use `needful_things` if using the Evidence demo database)
6. The command should run quickly - no more than a few minutes. If it's taking longer, try cancelling and starting again or [reach out on Slack in the #migration channel for assistance](https://slack.evidence.dev). When the command has finished running, you will have a migrated project. 
7. Click `Start Evidence` to run the server, or use the commands below:
    ```shell
    npm install
    npm run sources
    npm run dev
    ```
    **Notes:** 
    - `npm run sources` is a new step introduced by USQL. This step runs the queries against your data sources and loads the data into Evidence
    - It is normal to see errors in your terminal at this stage - you need to configure your data source to avoid these (see next step)
8. Configure your data source in the Settings menu
    - In your browser, click the 3-dot menu at the top right of the page and click Settings
    - In the Data Sources section, click to add a new connection
    - Select the data source type your app uses and provide the name you set when going through the VS Code prompts earlier (e.g., `needful_things` to continue the example from above)
    - Click to test your connection
    - Click to confirm the changes
9. Navigate back to the home page in your browser and refresh the page
10. The page should now be working. The migration command covers most situations, but not all - you may need to fix a few remaining issues. If you still see errors, they may be related to query chaining or SQL syntax. See the Special Situations section below for information which may help. If you need assistance tracking down the issues, please [reach out on Slack](https://slack.evidence.dev) in the `#migration` channel


### Completing the Migration Steps Manually
The easiest way to migrate your app is to create a app using the latest version of the template, and copy over your markdown pages and queries. These steps will guide you through doing that in the same project so that you can track the changes in version control.

1. In your Evidence project directory, create a new folder called `_legacy_project`
2. Copy all of the files from your existing project into the `_legacy_project` folder - this will serve as a backup, and you will need to reference these in the following steps to copy content back into your project
3. Create another folder called `temporary`
4. Scaffold a new project into this `temporary` folder using the latest version of the template
    - CLI: `npx degit evidence-dev/template temporary`
    - This step is required because `degit` only works in an empty folder
    - After this step, you should have a new evidence project in your `temporary` directory
5. Move all of the files from this `temporary` folder into the root of your project. Then delete the `temporary` folder
    - Now you should have a `_legacy_project` folder and a new Evidence project in the same workspace
6. Set up your new `sources` directory
    - In the new `sources` folder, delete any demo data folders so that the folder is empty - you won't need any of those
    - Create a new folder in your `sources/` directory, with a name for your existing data source (e.g., `sources/my-data-source/`)
7. Copy files from `_legacy_project` into your new project. Make sure to **copy** rather than **move** the files. If the folder already exists in the new project, replace the contents with the contents from `_legacy_project`:
    - Folders to copy from `_legacy_project` to your new project
        - `pages/` -> `pages/`
        - `components/` -> `components/`
        - `partials/` -> `partials/`
        - `static/` -> `static/`
    - `sources` folder
        - If `_legacy_project` has a `sources` directory, copy the contents of that folder into the `sources/my-data-source` folder in your new project
    - Files in the root of `_legacy_project`
        - Any data files in the root of your old project should be copied into your `sources/my-data-source` folder. This includes files with these extensions:
            - `.duckdb`
            - `.db`
            - `.sqlite`
            - `.sqlite3`
            - `.csv`
            - `.parquet`
6. Set up your `queries` directory
    - If a `queries` directory does not exist in your new project, create that folder now (in the root of your project)
    - If you don't have any `.sql` files in your `sources/my-data-source` directory, you can move to the next step and leave the `queries` folder empty
    - For each `.sql` file in your `sources/my-data-source` directory, create a file in `queries` with the same name (e.g., `sources/my-data-source/my-query.sql` --> `queries/my-query.sql`)
    - Write this query into each `.sql` file you created in `queries`: `select * from [my-data-source].[my-query]`
8. Migrate queries in your markdown files
    - Changes to make in each markdown file:
        - If you have frontmatter that references `sources`, change the name from `sources` to `queries`
        - For each inline query in the file:
           - Create a `.sql` file in your data source folder using the same name as the query (e.g., `sources/my-data-source/my-query.sql`) and paste in the contents of the query
           - In your markdown file, replace the contents of the query with `select * from [my-data-source].[my-query]`
           - If your query is a chained query, check that the reference will still work, and adjust as necessary
    - If you run into duplicate query names across pages, you will need to create unique names and ensure they are referenced correctly on your markdown page
9. Update templated page syntax
    - On each templated page, you can replace `$page.params.my_param` with `params.my_param`
    - The old reference will continue to work but will be phased out in the future in favour of this simpler syntax
10. Run the commands below:
    ```shell
    npm install
    npm run sources
    npm run dev
    ```
    **Notes:** 
    - `npm run sources` is a new step introduced by USQL. This step runs the queries against your data sources
    - It is normal to see errors in your terminal at this stage - you need to configure your data source to avoid these (see next step)
11. Configure your data source in the Settings menu
    - Click the 3-dot menu at the top right of the page and click Settings
    - In the Data Sources section, click to add a new connection
    - Select the data source type your app uses and provide a name for your data source. This will appear as a folder within the `sources` directory in your project (e.g., you could use `needful_things` if using the Evidence demo database)
    - Click to test your connection
    - Click to confirm the changes
12. Navigate back to the home page in your browser and refresh the page
13. The page should now be working. If you still see errors, they may be related to query chaining or SQL syntax. See the Special Situations section below for information which may help. If you need assistance tracking down the issues, please [reach out on Slack](https://slack.evidence.dev) in the `#migration` channel

## Deployment Changes

### Evidence Cloud
1. Copy environment variables for your app from your local dev environment (Settings page > Deployment)
    ![env vars](/img/settings-vars.png)

2. Update the environment variables for your Evidence Cloud app by pasting the environment variables from Step 1
    ![cloud vars](/img/cloud-settings-edit.png)

3. Click to redeploy your app


### Self-Hosting
You will need to update 2 things in your deployment setup to complete the migration to USQL:
1. Update your environment variables
    - See links in the Resources section for Netlify and Vercel docs
    - Find the new environment variables in your app's settings menu in your browser (click 3-dot menu at top right > Settings) - then scroll down to Deployment and select your deployment provider
    - Copy your variables and change them in the configuration for your deployment provider
2. Update the build command
    - USQL introduces the new `run sources` step to load data into your app from your data sources
    - Replace the build command in your deployment provider to `npm run sources && npm run build:strict`
    - See Netlify and Vercel docs in the Resources section

## Special Situations to Migrate

### Script Tags & Javascript References

If you use a script tag on a markdown page, you will need to change any variable declarations of of `let` or `var` to `$:`.

The reason for this change relates to how the new query engine updates query results - because queries run in the browser and can change based on input, you need to use a reactive variable declaration (that's what `$:` means), which can update itself when the data is instantiated, and when it changes.

The good news is that most of what you currently include in a script tag should be able to be migrated to USQL by using parameterized SQL queries.

For example:

#### Before - Using `let`
```html
&lt;script&gt;
    let filtered_data = my_query.filter(d => d.column === $page.params.my_variable);
&lt;/script&gt;

<LineChart data={filtered_data}/>
```

#### After - Using `$:`
```html
&lt;script&gt;
    $: filtered_data = my_query.filter(d => d.column === $page.params.my_variable);
&lt;/script&gt;

<LineChart data={filtered_data}/>
```

#### Ideal - Refactor to SQL Query in USQL
````html
```filtered_data
select * from my_table
where column = '${params.my_variable}'
```

<LineChart data={filtered_data}/>
````

### Query Chaining
Our migration steps do not take into account query chaining. In some cases, chained queries will continue to work as normal. In other cases, you will need to make adjustments.

Query chaining is not supported in the `sources` directory, but is still supported in `queries` and on your markdown pages.

This means that any query chains included in `sources` will need to be replaced with actual references to the tables you need.

If you use the VS Code migration command, chained queries found on markdown pages are left on the page rather than being moved to the `sources` directory like other queries. This is because we assume that most chained queries are simple enough for the syntax of your source database to match with the DuckDB syntax they will need to move to. In some cases, the syntax will not line up and you will need to make an adjustment.

### Evidence Plugins
If your app includes an Evidence plugin
1. Find the `evidence.plugins.yaml` file in your `_legacy_project` folder and copy the line(s) containing the plugin(s) you're using
2. Paste those lines into the `evidence.plugins.yaml` file in your new project
3. Install the plugin(s) in your project. E.g.,:
```shell
npm install --save your-plugin-name
```

### External Package Dependencies

If your project includes external packages installed via npm, you will need to reinstall those packages so that they are reflected in your `package.json`

```bash
npm install <package-name>
```

## Common Syntax Change Examples

- In DuckDB, double quotes are used to reference columns. If you have double quotes in your queries for strings, you will need to change to single quotes
- `date_trunc` - in DuckDB, the date part is the first argument to the function and is passed as a string, whereas in some other dialects it is the second argument and is passed as a keyword
- `safe_divide` - in DuckDB you can use `number / nullif(other_number, 0) as divided_number` rather than `safe_divide(number, other_number)`
- You may need to change how you cast columns to other types. In DuckDB, you can use the `::type` syntax like so: `select order_time::date as order_date`

## Resources

- [#migration Slack channel](https://slack.evidence.dev)
- [DuckDB SQL Syntax Reference](https://duckdb.org/docs/sql/statements/select)
- [Netlify: Modify Environment Variables](https://docs.netlify.com/environment-variables/get-started/#modify-and-delete-environment-variables)
- [Netlify: Set your Build Command](https://docs.netlify.com/configure-builds/overview/#set-the-build-command)
- [Vercel: Environment Variables](https://vercel.com/docs/projects/environment-variables)
- [Vercel: Build Configurations](https://vercel.com/docs/deployments/configure-a-build)
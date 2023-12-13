---
title: USQL Migration Guide
sidebar_position: 3
---

Universal SQL is Evidence's latest release, and fundamentally changes how Evidence queries data in order to bring support for three big new features:
1. **Multiple Data Sources:** Combine data from multiple databases, flat files like CSVs, and even non-SQL data sources like Google Sheets.
2. **Inputs and Filters:** Input components can dynamically update your queries and charts based on user input.
3. **Adapter Plugins:** Create your own adapter to enable connecting to any data source. 

This is a big release and contains several breaking changes. This guide will help you migrate your existing projects to USQL.

## Breaking Changes
- Queries are now written in DuckDB SQL.
- Existing data source connections will need to be reconfigured.

## Overview of Changes you will need to make
- Use new template scaffold
- Migrate queries


## Migration Steps

:::info
We have created a VSCode extension command to assist with migration. This will aid significantly with the migration process.
:::

The easiest way to migrate your project is to create a project using the latest version of the template, and copy over your markdown pages and queries.

1. Copy the following existing directories to a safe location
    - `pages/`
    - `sources/` (if it exists)
    - `components/` (if it exists)
    - `partials/` (if it exists)
    - `static/` (if it exists)
2. Delete all the files inside your project directory
3. Scaffold a new project using the latest version of the template
    - VSCode Extension: `Evidence: New Evidence Project`
    - CLI: `npx degit evidence-dev/template .`
4. Copy the files you saved in step 1 into your new project directory
    - `pages/` -> `pages/`
    - `sources/` -> `queries/` (N.B. this directory name has changed!)
    - `components/` -> `components/`
    - `partials/` -> `partials/`
    - `static/` -> `static/`
5. Migrate queries to USQL
    - VSCode Extension: `Evidence: Migrate Queries to USQL`
    - Manually:
       - Create a new folder in your `sources/` directory, with a name for your exsiting data source e.g. `sources/my-data-source/`
       - For Inline Queries: 
            - Create .sql files in this directory for each of your existing queries in your project. eg if you have a query called `my-query` in your existing project, create a file called `my-query.sql` in your new project, and copy the contents of the query into this file.
            - Update the queries in the markdown page to `select * from [my-data-source].[my-query]`
       - For SQL file queries, update the frontmatter from `sources: - my-file-query.sql` to `queries: - my-file-query.sql`
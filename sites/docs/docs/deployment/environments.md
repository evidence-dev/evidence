---
sidebar_position: 2
hide_table_of_contents: false
title: Environments
---

## What are environments?

In software engineering, _environments_ are used to enable engineers to develop and test code without impacting the users of their software.

“Production” (or prod) refers to the environment that end users interact with, while “development” (dev) is the environment engineers write code in. This allows engineers to work iteratively when writing and testing new code in development, and once they are confident in these changes, deploy their code to production.

In traditional software engineering, different environments often use separate architecture. For example, the dev and prod versions of a website may use different servers and databases.
Data warehouses often also use separate environments – the _production_ environment refers to the data that your end users can access.

Unlike many other BI tools, Evidence supports using different data sources for dev and prod, so you can use dev data in dev, and prod data in prod. This has the benefit of allowing you to test changes to your data alongside changes to your viz tools.

## Typical environment configurations

There are three typical ways that data teams separate their data environments:
1. **Separate databases[^1]:** Each environment has its own database, but with the same schemas and tables in each database. This is the most common way to separate environments.
2. **Separate schemas[^2]:** Each environment has its own schema, with schemas hosted on the same database.
3. **Separate accounts[^3]:** Each environment has its own account. This is less common.

## Setting up Evidence to use different environments

### Dev environment
Add your dev database credentials for your dev environment via the settings page. If you are running Evidence, this is typically at `http://localhost:3000/settings`.

### Prod environment
Add your prod database credentials as **environment variables**. The specific instructions depend on what you are using to deploy Evidence. Instructions can be found in the deployment section of the settings page of your local project.

:::note
If you are using separate schemas, you will need to add the optional `schema` parameter to your credentials in dev, and an environment variable in prod. This is only currently supported for Postgres. 
:::

[^1]: Also known as _projects_ (BigQuery)
[^2]: Also known as _datasets_ (BigQuery)
[^3]: Also known as _clusters, instances_, or _organizations_ (BiqQuery)
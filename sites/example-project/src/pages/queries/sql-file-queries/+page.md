---
title: SQL File Queries

sources:
  - test_query.sql
  - test_query_nested: nested/test_query.sql
  - DEP_query.sql
  - not_sql.python
  - should_break.sql
---

```sql query_on_the_page
SELECT 10 as t
```

Evidence supports using `.sql` files directly; instead of inlining your queries.
This provides a few benefits:

- Reuse common queries across pages
- Take advantage of your editor's support for your database (e.g. syntax highlighting, autocomplete, etc.)

<Alert status="warning">
If you haven't read about <a href="/frontmatter" target="_blank">frontmatter</a> yet, you should start there.
</Alert>

## Using sql file queries

### Basic Usage

In your project; create a `sources` folder. It should look something like this:

<CodeBlock source={`my_project/ pages/ my_page.md sources/ my_query.sql`}/>

<br/>
You can now access `my_query.sql` with frontmatter:

<CodeBlock source={`--- sources: - my_query.sql ---`}/>

### Usage with Subdirectories

You can also use directories within your sources to organize your queries:
<CodeBlock source={`my_project/ pages/ my_page.md sources/ my_query.sql my_group/ my_query`}/>

<br/>
You can now access `my_query.sql` and `my_group/my_query.sql` with frontmatter:

<CodeBlock source={`--- sources: - my_query.sql - nested/my_query.sql ---`}/>

Note that all slashes (`/`) will be replaced with underscores (`_`), so `nested/my_query.sql` is accessible as `nested_my_query.sql`.

It is also noteworthy that when trying to view queries; all sql file queries will be placed at the bottom of the page.

---

Your query can contain anything; for the examples on this page, we have some very simple queries

#### test_query.sql

<CodeBlock source="SELECT 1 as t;"/>

#### nested/test_query.sql

<CodeBlock source="SELECT 2 as t;"/>

#### dep_query.sql

<CodeBlock source="SELECT t * 2 as x FROM $&#123;test_query}"/>

### Aliasing Query Names

It is possible to escape the default name for your queries by using some simple yaml syntax:

```yaml
---
sources:
  - default_query_name.sql # This will be referenced as default_query_name
  - alias: default_query_name.sql # This will be referenced as alias
#      ^ This is the key
---
```

The format is `alias: query_file.sql`, instead of just `query_file.sql`, this can lead
to any query file that you would like, and can be helpful if you have many subdirectories

## Test Query

This is from `test_query.sql`

Result <Value data={test_query} value="t"/>

## Nested Test Query

This is from `nested/test_query.sql`

Result = <Value data={test_query_nested} value="t"/>

## Query with File dependency

This is from `dep_query.sql`; it depends on `test_query.sql`

Result = <Value data={dep_query} value="x"/>

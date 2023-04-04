---
title: External Queries

sources:
    - test_query.sql
    - nested/test_query.sql
    - dep_query.sql
    - inline_dep_query.sql
---

```query_on_the_page
SELECT 10 as t
```

Evidence supports using `.sql` files directly; instead of inlining your queries.
This provides a few benefits:
 - Reuse common queries across pages
 - Take advantage of your editor's support for your database (e.g. syntax highlighting, autocomplete, etc.)

<Alert status="warning">
If you haven't read about <a href="/frontmatter" target="_blank">frontmatter</a> yet, you should start there.
</Alert>


## Using external queries

### Basic Usage

In your project; create a `sources` folder. It should look something like this:

<CodeBlock source={`my_project/
  pages/
    my_page.md
  sources/
    my_query.sql`}/>

<br/>
You can now access `my_query.sql` with frontmatter:

<CodeBlock source={`---
    sources:
        - my_query.sql
---`}/>

### Usage with Subdirectories

You can also use directories within your sources to organize your queries:
<CodeBlock source={`my_project/
  pages/
    my_page.md
  sources/
    my_query.sql
    my_group/
      my_query`}/>

<br/>
You can now access `my_query.sql` and `my_group/my_query.sql` with frontmatter:

<CodeBlock source={`---
    sources:
        - my_query.sql
        - nested/my_query.sql
---`}/>

Note that all slashes (`/`) will be replaced with underscores (`_`), so `nested/my_query.sql` is accessible as `nested_my_query.sql`.

It is also noteworthy that when trying to view queries; all external queries will be placed at the bottom of the page.

--- 

Your query can contain anything; for the examples on this page, we have some very simple queries

#### test_query.sql
<CodeBlock source="SELECT 1 as t;"/>

#### nested/test_query.sql
<CodeBlock source="SELECT 2 as t;"/>

#### dep_query.sql
<CodeBlock source="SELECT t * 2 as x FROM ${test_query}"/>

#### inline_dep_query.sql
<CodeBlock source="SELECT t * 4 as x FROM ${query_on_the_page}"/>


## Test Query

This is from `test_query.sql`

Result <Value data={test_query} value="t"/>

## Nested Test Query

This is from `nested/test_query.sql`

Result = <Value data={nested_test_query} value="t"/>

## Query with File dependency

This is from `dep_query.sql`; it depends on `test_query.sql`

Result = <Value data={dep_query} value="x"/>

## Query with Inline dependency

This is from `inline_dep_query.sql`; it depends on `query_on_the_page`; which is declared on the page in which it is used.

Result = <Value data={inline_dep_query} value="x"/>
---
sidebar_position: 3
hide_table_of_contents: true
title: Connect a Database
---

We need the add the data from the Needful Things - we are going to use a local SQLite database for the tutorial. 

1. [Download the SQLite database here](/needful_things.db) and put it in your my-project folder, *renaming the file* to `needful_things.db` for convenience.

   Your folder should now look something like this:

```
my-project
|-- .evidence /
|-- node_modules /
|-- pages /
    `-- index.md
|-- .gitignore
|-- README.md
|-- needful_things.db
|-- package-lock.json
`-- package.json
```

2. Navigate to the [settings](http://localhost:3000/settings) menu in the bottom left corner of the Homepage, and connect the SQLite database.

## The Needful Things dataset

The `needful_things.db` database has 3 tables:
- **ORDERS:** data on customer orders, with one row per order (containing only one item each)
- **MARKETING_SPEND:** data showing how much Needful Things has spent on each paid marketing channels per month
- **REVIEWS:** stores customers reviews for some orders, which are Net Promoter Scores (NPS) on a scale of 0-10
---
sidebar_position: 2
title: Connect a Database
---

To connect your local development environment to a database: 

1. Run your evidence project with `npm run dev` 
1. Navigate to [localhost:3000/settings](http://localhost:3000/settings)
1. Select your database and enter your credentials 

Evidence will save your credentials locally, and run a test query to confirm that it can connect. 

## Supported Databases

Evidence supports: 

- BigQuery 
- Snowflake 
- Redshift
- PostgreSQL 
- MySQL 
- SQLite
- DuckDB
- Clickhouse
- & More

We're adding new connectors regularly. Feel free to [create a GitHub issue](https://github.com/evidence-dev/evidence/issues) or [send us a message in Slack](https://join.slack.com/t/evidencedev/shared_invite/zt-uda6wp6a-hP6Qyz0LUOddwpXW5qG03Q) if you'd like to use Evidence with a database that isn't currently supported.


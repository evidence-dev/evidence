---
sidebar_position: 4
title: Cloud Execution Engine
---

## Default Engine: DuckDB WASM

By default, and when developing locally, markdown queries are executed in the browser by DuckDB's WASM engine. This is a fast and convenient way to develop and test queries, and scales relatively well on source queries up to ~1M rows.

## Cloud Execution Engine

Projects hosted on Evidence Cloud can take advantage of a more powerful execution engine, which can handle much larger data. This query engine runs inside Evidence Cloud, and return results back to the browser.

### Enabling the Cloud Execution Engine

The Cloud Execution Engine is available to Evidence Cloud customers on the Enterprise plan. To enable the Cloud Execution Engine for your app, reach on your dedicated support channel.

If you are interesting in trying the Cloud Execution Engine, [request a trial](https://calendly.com/evidence-cloud/evidence-enterprise).
# DuckDB direct connector: data quality and metadata contract

This document describes the conversion contract implemented by the native
DuckDB connector, not a universal contract for all Evidence warehouses.
The contract is tested at the direct connector boundary and through the
compiled CLI and HTTP `/api/query` endpoint.

## Data representation

The native `@duckdb/node-api` driver's `getRowObjectsJson()` returns values
that can be serialized to JSON. The Evidence connector subsequently applies
shared date and sparkline normalization and converts numeric JSON strings
to JavaScript numbers only when the conversion is considered safe.

| DuckDB type | Evidence `jsType` | Result representation |
| --- | --- | --- |
| `BOOLEAN` | `boolean` | `true` / `false` / `null` |
| `TINYINT`, `INTEGER` and other ordinary integers | `number` | JSON number where safe |
| `BIGINT`, `UBIGINT`, `HUGEINT` | `number` | Safe integers as numbers; values outside JS safe-integer range as exact strings |
| `DECIMAL(p,s)` | `number` | Ordinary safely representable values as numbers, high-precision values as exact strings |
| `DATE` | `date` | `YYYY-MM-DD` string |
| `TIMESTAMP`, `TIMESTAMPTZ` | `date` | Evidence canonical date/time string; time zone offsets normalized to UTC |
| `TIME` | `date` | Time string; not an instant |
| `VARCHAR`, `UUID`, `JSON` | `string` | String; JSON columns are not implicitly parsed |
| `LIST`, `ARRAY` | `object` | JSON arrays, nested nulls preserved |
| `STRUCT`, `MAP` | `object` | JSON object/array structures |
| `INTERVAL` | `object` | `{ months, days, micros }`, with `micros` represented as a string |
| Any nullable column | Its declared `jsType` | SQL `NULL` becomes JSON `null` |

A column whose `jsType` is `number` can still carry a string for a value
outside JavaScript's safe numeric range. This is deliberate: turning large
IDs, high-precision financial values or decimals into an imprecise
`number` would silently corrupt them. Consumers must handle this
union rather than assume every `number`-typed value is a JS number.

The Evidence shared date normalizer produces canonical date/time strings,
which are currently second-resolution for timestamps. This is a
compatibility convention; it is **not** a promise to preserve every original
subsecond digit. A `TIMESTAMP` without a time zone preserves its wall-clock
date/time, while `TIMESTAMPTZ` denotes an instant normalized to UTC.

## Repeated column names

DuckDB allows duplicate SQL aliases (e.g.
`SELECT 1 AS id, 2 AS id`). A JSON object cannot represent distinct
properties with identical keys. The connector therefore uses the positional
JSON row accessor when duplicate names are present, preserving all values,
and returns unique output labels (`id`, `id_2`, `id_3`).

If a query already contains an explicit suffix such as `id_2`, the connector
skips that name when allocating an automatic suffix. Normal queries with
unique names retain their original labels and the normal fast path.

**Review note:** Some other direct Evidence connectors still collapse duplicate
aliases into one JSON key. This change intentionally prevents silent data
loss in native DuckDB without altering those other adapters.

## Verification

- `cli/cli/connection/duckdb-data-contract.test.ts` tests numeric boundaries,
  ordinary decimals, precision-sensitive values, timestamps, nulls, Unicode,
  nested LIST/STRUCT, INTERVAL/MAP, empty-result metadata and duplicate aliases.
- `cli/scripts/smoke-duckdb-binary.mjs` checks data values and metadata through
  the **compiled** CLI and HTTP server on Linux, Windows and macOS.
- `.github/workflows/duckdb-native-build.yml` runs those tests in the native
  platform matrix.

The test suite is not a complete inventory of every DuckDB logical type.
For a future phase, consider `UNION`, spatial extensions, `BLOB`, `BIT`,
`TIMESTAMP_NS`, and explicit subsecond preservation policies.

For underlying serialization behavior, refer to
[DuckDB's Node.js (Neo) API](https://duckdb.org/docs/1.5/clients/node_neo/overview).

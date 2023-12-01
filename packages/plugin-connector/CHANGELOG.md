# @evidence-dev/plugin-connector

## 2.0.0-usql.23

### Patch Changes

- fd74bd3c: Prevent queries with the same name from different connectors from colliding
- Updated dependencies [fd74bd3c]
  - @evidence-dev/universal-sql@2.0.0-usql.14

## 2.0.0-usql.22

### Patch Changes

- da6ba2eb: Fix stdin being disabled after spinners run
- b5592a3f: Usability Improvements
- Updated dependencies [b5592a3f]
  - @evidence-dev/universal-sql@2.0.0-usql.13

## 2.0.0-usql.21

### Patch Changes

- 0ba78b67: polish working with sources
- cd57ba69: Add new interface for datasources for fine-grained control of output
- Updated dependencies [0ba78b67]
- Updated dependencies [cd57ba69]
  - @evidence-dev/universal-sql@2.0.0-usql.12
  - @evidence-dev/db-commons@0.2.1-usql.3

## 2.0.0-usql.20

### Patch Changes

- Updated dependencies [130950d7]
- Updated dependencies [52d81ce2]
  - @evidence-dev/universal-sql@2.0.0-usql.11

## 2.0.0-usql.19

### Patch Changes

- Increase batch size from 100k to 1m

## 2.0.0-usql.18

### Patch Changes

- Support for streaming results
- Updated dependencies
  - @evidence-dev/universal-sql@2.0.0-usql.10

## 2.0.0-usql.17

### Patch Changes

- 5828c375: Enviroment variables use \__ instead of _ to delimit option properties
- cad09993: improve source refresh experience
- 64d1405b: Loading state is now respected by Value and BigValue

## 2.0.0-usql.16

### Patch Changes

- 5be92c14: don't fully overwrite manifest.json on filtered builds
- 239a18d7: Actually ensure that zod schemas don't iterate entire QueryResult.
- ca1f90b3: Improved Logging
- Updated dependencies [52e114cc]
  - @evidence-dev/universal-sql@2.0.0-usql.9

## 2.0.0-usql.15

### Patch Changes

- 7c8a9f9d: Tweak source building to increase max possible result set
- afbb50fc: Added support for sources having subdirectories for better organization
- 20127231: Bump all versions so version pinning works
- Updated dependencies [20127231]
  - @evidence-dev/universal-sql@2.0.0-usql.8

## 2.0.0-usql.14

### Patch Changes

- 4b6262d8: added `build:sources` filtration options to cli

## 2.0.0-usql.13

### Patch Changes

- Updated dependencies [69126c94]
  - @evidence-dev/universal-sql@2.0.0-usql.7

## 2.0.0-usql.12

### Patch Changes

- Updated dependencies
  - @evidence-dev/universal-sql@2.0.0-usql.6

## 2.0.0-usql.11

### Patch Changes

- Updated dependencies
  - @evidence-dev/universal-sql@2.0.0-usql.5

## 2.0.0-usql.10

### Patch Changes

- Updated dependencies
  - @evidence-dev/universal-sql@2.0.0-usql.4

## 2.0.0-usql.9

### Minor Changes

- cfb0f248: Respect component plugin's tailwind configuration

### Patch Changes

- 8ffbb361: skip massive files and non-directories in sources

## 2.0.0-usql.8

### Minor Changes

- e6f550f3: Improve data source return type validation to be more performance and stringent

## 2.0.0-usql.7

### Patch Changes

- Updated dependencies [ca7337ba]
  - @evidence-dev/universal-sql@2.0.0-usql.3

## 2.0.0-usql.5

### Patch Changes

- df7a8c5a: Ignore source files larger than 100Mb

## 2.0.0-usql.4

### Patch Changes

- cff22ece: Only read files on demand, prevents attempted loading of very large db files

## 2.0.0-usql.3

### Patch Changes

- Updated dependencies [9b1ac9b7]
  - @evidence-dev/universal-sql@2.0.0-usql.2

## 2.0.0-usql.2

### Patch Changes

- ef2a9106: Sources are now segmented into schemas to prevent source name conflicts
- Updated dependencies [ef2a9106]
- Updated dependencies [f62bd26e]
  - @evidence-dev/universal-sql@2.0.0-usql.1

## 2.0.0-usql.1

### Patch Changes

- e6091323: chore: remove postinstall script

## 2.0.0-usql.0

### Major Changes

- cb0fc468: This update includes major changes to the way Evidence interacts with data.
  Instead of running queries against the production database, and including it
  with the project as pre-rendered, static JSON data; those queries are now stored as .parquet files.

  .parquet enables the use of DuckDB on the client, allowing for much greater levels of interactivity
  on pages, and interoperability between different data sources (e.g. joins across postgres & mysql).

### Patch Changes

- Updated dependencies [cb0fc468]
  - @evidence-dev/universal-sql@2.0.0-usql.0

## 1.1.0

### Minor Changes

- ed2f4728: allow for components folder to be used as a component plugin

## 1.0.0

### Major Changes

- 4cd28cf5: Add support for component plugins; move @evidence-dev/components to @evidence-dev/core-components

### Patch Changes

- ac3d47d3: fixes bugs preventing usage directly from npm
- 84208c04: updated licenses, general cleanup

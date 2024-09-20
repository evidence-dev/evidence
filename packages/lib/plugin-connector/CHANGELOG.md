# @evidence-dev/plugin-connector

## 2.1.11

### Patch Changes

- c8315da2e: Update svelte to resolve security vulnerability
- Updated dependencies [bad1038c1]
  - @evidence-dev/telemetry@2.1.3

## 2.1.10

### Patch Changes

- 67dbd116b: Adds support for Multiline strings as source config
  Moves snowflake private key to multi-line string field

## 2.1.9

### Patch Changes

- Updated dependencies [c0e1799e2]
  - @evidence-dev/universal-sql@2.1.5

## 2.1.8

### Patch Changes

- 8c2982505: Update vitest to latest
- Updated dependencies [8c2982505]
  - @evidence-dev/universal-sql@2.1.4

## 2.1.7

### Patch Changes

- 32035eeaa: Override fast-xml-parser version to >=4.4.1 to resolve vulnerability
- Updated dependencies [3572fcfd7]
- Updated dependencies [907efee29]
  - @evidence-dev/telemetry@2.1.2

## 2.1.6

### Patch Changes

- c3b86ef5f: Updated sub-source-vars logic to handle multiple env vars in the same string

## 2.1.5

### Patch Changes

- 6cdedceb0: Remove db-orchestrator
- Updated dependencies [b84ef07ac]
- Updated dependencies [6cdedceb0]
  - @evidence-dev/universal-sql@2.1.3
  - @evidence-dev/db-commons@1.0.5
  - @evidence-dev/telemetry@2.1.1

## 2.1.4

### Patch Changes

- Updated dependencies [af9b74ee]
  - @evidence-dev/telemetry@2.1.0

## 2.1.3

### Patch Changes

- 7f85e600: version bumps

## 2.1.2

### Patch Changes

- a95db3d3: Move types to devDependencies
- Updated dependencies [7620a1af]
- Updated dependencies [a95db3d3]
  - @evidence-dev/universal-sql@2.1.2

## 2.1.1

### Patch Changes

- Updated dependencies [1da26c4e]
- Updated dependencies [5e0bbf31]
  - @evidence-dev/db-commons@1.0.4
  - @evidence-dev/universal-sql@2.1.1

## 2.1.0

### Minor Changes

- ca3e593b: - Updated major dependencies (Svelte, SvelteKit, Vite) to improve memory usage when building

### Patch Changes

- Updated dependencies [ca3e593b]
  - @evidence-dev/universal-sql@2.1.0

## 2.0.10

### Patch Changes

- 5a1e46a5: Fix for svelte vite errors
- 008cf432: Roll back proxy server
- 69b9ed32: Fix file imports for evidence package
- Updated dependencies [5a1e46a5]
- Updated dependencies [008cf432]
- Updated dependencies [69b9ed32]
  - @evidence-dev/universal-sql@2.0.5

## 2.0.9

### Patch Changes

- Updated dependencies [57f71211]
  - @evidence-dev/universal-sql@2.0.4

## 2.0.8

### Patch Changes

- b4ffed1e: use `Date.now()` instead of `query.hash` for parquet filepath
- Updated dependencies [e79974f3]
  - @evidence-dev/telemetry@2.0.4

## 2.0.7

### Patch Changes

- Updated dependencies [f4ccf03c]
  - @evidence-dev/universal-sql@2.0.3

## 2.0.6

### Patch Changes

- 31381835: Add support for EVIDENCE_VAR\_\_ interpolation in source queries
- Updated dependencies [31381835]
- Updated dependencies [e4e7d822]
  - @evidence-dev/db-commons@1.0.3
  - @evidence-dev/universal-sql@2.0.2

## 2.0.5

### Patch Changes

- 2082578e: Added support for HMR in external query files
- Updated dependencies [97e7123d]
- Updated dependencies [fc7fe470]
  - @evidence-dev/telemetry@2.0.3
  - @evidence-dev/db-commons@1.0.2

## 2.0.4

### Patch Changes

- Updated dependencies [92f4ad61]
  - @evidence-dev/telemetry@2.0.2

## 2.0.3

### Patch Changes

- c09bd981: Telemetry parity with USQL
- Updated dependencies [c09bd981]
  - @evidence-dev/telemetry@2.0.1

## 2.0.2

### Patch Changes

- Updated dependencies [913f5919]
  - @evidence-dev/universal-sql@2.0.1

## 2.0.1

### Patch Changes

- Updated dependencies
  - @evidence-dev/db-commons@1.0.1

## 2.0.0

### Major Changes

- cb0fc468: This update includes major changes to the way Evidence interacts with data.
  Instead of running queries against the production database, and including it
  with the project as pre-rendered, static JSON data; those queries are now stored as .parquet files.

  .parquet enables the use of DuckDB on the client, allowing for much greater levels of interactivity
  on pages, and interoperability between different data sources (e.g. joins across postgres & mysql).

### Minor Changes

- e6f550f3: Improve data source return type validation to be more performance and stringent
- cfb0f248: Respect component plugin's tailwind configuration

### Patch Changes

- 26ad2d2c: Source Query HMR now uses returned manifest instead of reloading from fs
- 5be92c14: don't fully overwrite manifest.json on filtered builds
- e23691d0: Handle errors during source query execution
- b7d02a29: Source Query HMR is now debounced
- 5247996b: Improved behavior when copying environment variables
- fd74bd3c: Prevent queries with the same name from different connectors from colliding
- da6ba2eb: Fix stdin being disabled after spinners run
- 26ad2d2c: Plugin Connector will now show stack traces if a source query fails in debug mode
- a192deb2: Increase batch size from 100k to 1m
- 377abb4a: Rename databases -> datasources
- e134351d: - connection.options.yaml values are now b64 encoded
  - children that do not have a key for all child values no longer break - e.g. when ssl is disabled for postgres, there are no children. This was breaking previously
- af4a8a1e: Explicit mappings for all DuckDB types
- 239a18d7: Actually ensure that zod schemas don't iterate entire QueryResult.
- 0ba78b67: polish working with sources
- b5592a3f: Usability Improvements
- bf4a112a: Update package.json to use new datasource field
- e7781efd: Get real sourcename during hmr
- cff22ece: Only read files on demand, prevents attempted loading of very large db files
- 7c8a9f9d: Tweak source building to increase max possible result set
- 741885bf: Fix Source Query HMR
- 2d85508a: Handle sources that haven't been generated more effectively
- 5828c375: Enviroment variables use \__ instead of _ to delimit option properties
- 1ed3fe07: Handle missing manifest more effectively
- cd57ba69: Add new interface for datasources for fine-grained control of output
- 9da3812e: - QueryStatus only notifies once now
  - Source HMR uses a path-specific queue to prevent queuing a file twice, and prevent running more than one source command at a time
- c4822852: Support for streaming results
- 8ffbb361: skip massive files and non-directories in sources
- 6fdfec28: Plugin connector now removes outdated cache files
- 4d5735a2: Fix a few fs related issues
- ca1f90b3: Improved Logging
- 6fbde887: Modify duplicate component message
- afbb50fc: Added support for sources having subdirectories for better organization
- cad09993: improve source refresh experience
- 60619a90: Create static/data and .evidence-queries if for some reason they don't exist
- 4a75c077: Re-add support for --changed and --queries
- a20cd1e0: Fix workspace project version references
- ef2a9106: Sources are now segmented into schemas to prevent source name conflicts
- 6505351f: Misc Fixes
- 4b6262d8: added `build:sources` filtration options to cli
- e6091323: chore: remove postinstall script
- dbc69a59: Handle directories without connection.yaml more elegantly
- 20127231: Bump all versions so version pinning works
- 78a8be8b: connection.options.yaml auto-generated header is more descriptive now
- 64d1405b: Loading state is now respected by Value and BigValue
- df7a8c5a: Ignore source files larger than 100Mb
- Updated dependencies [aa34d0b3]
- Updated dependencies [840d1195]
- Updated dependencies [b25a95d7]
- Updated dependencies [fd74bd3c]
- Updated dependencies [377abb4a]
- Updated dependencies [9132146b]
- Updated dependencies [0ba78b67]
- Updated dependencies [2aaef5fb]
- Updated dependencies [9603c4e7]
- Updated dependencies [cb74406a]
- Updated dependencies [b5592a3f]
- Updated dependencies [cb0fc468]
- Updated dependencies [bf4a112a]
- Updated dependencies [69126c94]
- Updated dependencies [5928e45d]
- Updated dependencies [ca7337ba]
- Updated dependencies [cd57ba69]
- Updated dependencies [c4822852]
- Updated dependencies [52e114cc]
- Updated dependencies [e173ca9d]
- Updated dependencies [4d5735a2]
- Updated dependencies [781d2677]
- Updated dependencies [26ad2d2c]
- Updated dependencies [ca4c3b00]
- Updated dependencies [15248699]
- Updated dependencies [ef2a9106]
- Updated dependencies [130950d7]
- Updated dependencies [f62bd26e]
- Updated dependencies [52d81ce2]
- Updated dependencies [d1ab5e62]
- Updated dependencies [20127231]
- Updated dependencies [9b1ac9b7]
- Updated dependencies [29c149d6]
  - @evidence-dev/universal-sql@2.0.0
  - @evidence-dev/db-commons@0.2.1

## 2.0.0-usql.43

### Patch Changes

- 6fbde887: Modify duplicate component message

## 2.0.0-usql.42

### Patch Changes

- a20cd1e0: Fix workspace project version references

## 2.0.0-usql.41

### Patch Changes

- 741885bf: Fix Source Query HMR

## 2.0.0-usql.40

### Patch Changes

- 2d85508a: Handle sources that haven't been generated more effectively

## 2.0.0-usql.39

### Patch Changes

- Updated dependencies [e173ca9d]
  - @evidence-dev/universal-sql@2.0.0-usql.25

## 2.0.0-usql.38

### Patch Changes

- 9da3812e: - QueryStatus only notifies once now
  - Source HMR uses a path-specific queue to prevent queuing a file twice, and prevent running more than one source command at a time

## 2.0.0-usql.37

### Patch Changes

- Updated dependencies [15248699]
  - @evidence-dev/universal-sql@2.0.0-usql.24

## 2.0.0-usql.36

### Patch Changes

- af4a8a1e: Explicit mappings for all DuckDB types

## 2.0.0-usql.35

### Patch Changes

- Updated dependencies [9603c4e7]
  - @evidence-dev/universal-sql@2.0.0-usql.23

## 2.0.0-usql.34

### Patch Changes

- 60619a90: Create static/data and .evidence-queries if for some reason they don't exist

## 2.0.0-usql.33

### Patch Changes

- 1ed3fe07: Handle missing manifest more effectively

## 2.0.0-usql.32

### Patch Changes

- Updated dependencies [9132146b]
  - @evidence-dev/universal-sql@2.0.0-usql.22

## 2.0.0-usql.31

### Patch Changes

- Updated dependencies [781d2677]
  - @evidence-dev/db-commons@0.2.1-usql.5

## 2.0.0-usql.30

### Patch Changes

- Updated dependencies [2aaef5fb]
  - @evidence-dev/universal-sql@2.0.0-usql.21

## 2.0.0-usql.29

### Patch Changes

- e23691d0: Handle errors during source query execution
- dbc69a59: Handle directories without connection.yaml more elegantly
- Updated dependencies [cb74406a]
- Updated dependencies [d1ab5e62]
  - @evidence-dev/universal-sql@2.0.0-usql.20

## 2.0.0-usql.28

### Patch Changes

- Update package.json to use new datasource field
- Updated dependencies
  - @evidence-dev/db-commons@0.2.1-usql.4
  - @evidence-dev/universal-sql@2.0.0-usql.19

## 2.0.0-usql.27

### Patch Changes

- 377abb4a: Rename databases -> datasources
- 78a8be8b: connection.options.yaml auto-generated header is more descriptive now
- Updated dependencies [377abb4a]
  - @evidence-dev/universal-sql@2.0.0-usql.18

## 2.0.0-usql.26

### Patch Changes

- 26ad2d2c: Source Query HMR now uses returned manifest instead of reloading from fs
- 26ad2d2c: Plugin Connector will now show stack traces if a source query fails in debug mode
- e7781efd: Get real sourcename during hmr
- 6505351f: Misc Fixes
- Updated dependencies [840d1195]
- Updated dependencies [26ad2d2c]
  - @evidence-dev/universal-sql@2.0.0-usql.17

## 2.0.0-usql.25

### Patch Changes

- b7d02a29: Source Query HMR is now debounced
- e134351d: - connection.options.yaml values are now b64 encoded
  - children that do not have a key for all child values no longer break - e.g. when ssl is disabled for postgres, there are no children. This was breaking previously
- 6fdfec28: Plugin connector now removes outdated cache files
- 4d5735a2: Fix a few fs related issues
- 4a75c077: Re-add support for --changed and --queries
- Updated dependencies [4d5735a2]
  - @evidence-dev/universal-sql@2.0.0-usql.16

## 2.0.0-usql.24

### Patch Changes

- 5247996b: Improved behavior when copying environment variables
- Updated dependencies [b25a95d7]
  - @evidence-dev/universal-sql@2.0.0-usql.15

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

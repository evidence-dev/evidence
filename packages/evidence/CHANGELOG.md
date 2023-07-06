# @evidence-dev/evidence

## 20.0.0-usql.1

### Patch Changes

- Updated dependencies [e6091323]
  - @evidence-dev/plugin-connector@2.0.0-usql.1

## 20.0.0-usql.0

### Major Changes

- cb0fc468: This update includes major changes to the way Evidence interacts with data.
  Instead of running queries against the production database, and including it
  with the project as pre-rendered, static JSON data; those queries are now stored as .parquet files.

  .parquet enables the use of DuckDB on the client, allowing for much greater levels of interactivity
  on pages, and interoperability between different data sources (e.g. joins across postgres & mysql).

### Patch Changes

- Updated dependencies [cb0fc468]
- Updated dependencies [75560a31]
  - @evidence-dev/component-utilities@2.0.0-usql.0
  - @evidence-dev/core-components@2.0.0-usql.0
  - @evidence-dev/db-orchestrator@3.0.0-usql.0
  - @evidence-dev/plugin-connector@2.0.0-usql.0
  - @evidence-dev/preprocess@4.0.0-usql.0

## 19.0.0

### Patch Changes

- 7fd1f889: emptied sources folder in template
- Updated dependencies [d999fe37]
- Updated dependencies [4e94b57a]
- Updated dependencies [121c7868]
- Updated dependencies [ed2f4728]
- Updated dependencies [f6be30cf]
- Updated dependencies [8865684b]
  - @evidence-dev/core-components@1.1.0
  - @evidence-dev/component-utilities@1.1.0
  - @evidence-dev/plugin-connector@1.1.0
  - @evidence-dev/preprocess@3.0.1

## 18.0.3

### Patch Changes

- Updated dependencies [168af3bb]
- Updated dependencies [929a0074]
- Updated dependencies [eb886615]
  - @evidence-dev/core-components@1.0.3
  - @evidence-dev/db-orchestrator@2.2.2

## 18.0.2

### Patch Changes

- Updated dependencies [2b7809e6]
  - @evidence-dev/core-components@1.0.2

## 18.0.1

### Patch Changes

- Updated dependencies [44c0c4ca]
- Updated dependencies [a38148b5]
  - @evidence-dev/core-components@1.0.1
  - @evidence-dev/db-orchestrator@2.2.1

## 18.0.0

### Major Changes

- 4cd28cf5: Add support for component plugins; move @evidence-dev/components to @evidence-dev/core-components

### Patch Changes

- fb6ac548: switched plugin-connector to evidence dep
- ac3d47d3: fixes bugs preventing usage directly from npm
- c8932e5e: added hooks.client.js to template
- 84208c04: updated licenses, general cleanup
- Updated dependencies [4c04edd0]
- Updated dependencies [ac3d47d3]
- Updated dependencies [7873115f]
- Updated dependencies [d7d4dfce]
- Updated dependencies [4cd28cf5]
- Updated dependencies [84208c04]
  - @evidence-dev/db-orchestrator@2.2.0
  - @evidence-dev/component-utilities@1.0.0
  - @evidence-dev/core-components@1.0.0
  - @evidence-dev/plugin-connector@1.0.0
  - @evidence-dev/preprocess@3.0.0

## 17.0.3

### Patch Changes

- @evidence-dev/db-orchestrator@2.1.3

## 17.0.2

### Patch Changes

- Updated dependencies [1c330b52]
  - @evidence-dev/db-orchestrator@2.1.2

## 17.0.1

### Patch Changes

- 42ea6aff: Make build:strict compatible with Windows OS
- Updated dependencies [f34ac566]
  - @evidence-dev/db-orchestrator@2.1.1

## 17.0.0

### Patch Changes

- 922d2c6c: Add click handler to eCharts
- Updated dependencies [5d623eda]
- Updated dependencies [52c540d5]
- Updated dependencies [5f813cdd]
- Updated dependencies [9ad17fbf]
- Updated dependencies [61b60097]
- Updated dependencies [ae3a487e]
- Updated dependencies [3a023d5c]
- Updated dependencies [185f1b8d]
- Updated dependencies [f15e5685]
- Updated dependencies [ec8d363a]
- Updated dependencies [a3cf89e7]
- Updated dependencies [b333b0ea]
  - @evidence-dev/components@2.4.0
  - @evidence-dev/preprocess@2.4.0
  - @evidence-dev/db-orchestrator@2.1.0

## 16.0.2

### Patch Changes

- Updated dependencies [14a6bff7]
- Updated dependencies [97babfb2]
  - @evidence-dev/preprocess@2.3.2
  - @evidence-dev/components@2.3.2

## 16.0.1

### Patch Changes

- aff6c041: fix list styling
- Updated dependencies [e2b0b5d1]
- Updated dependencies [5be07009]
- Updated dependencies [6d5d22dd]
- Updated dependencies [aff6c041]
  - @evidence-dev/components@2.3.1
  - @evidence-dev/preprocess@2.3.1
  - @evidence-dev/db-orchestrator@2.0.3

## 16.0.0

### Patch Changes

- Updated dependencies [218ce1a6]
- Updated dependencies [2cf93f09]
- Updated dependencies [822417fb]
- Updated dependencies [138a3891]
- Updated dependencies [3b3ceb17]
- Updated dependencies [3b41627d]
- Updated dependencies [3de027b4]
- Updated dependencies [195f1004]
- Updated dependencies [2cf93f09]
  - @evidence-dev/components@2.3.0
  - @evidence-dev/preprocess@2.3.0

## 15.0.1

### Patch Changes

- fa958c52: Performance Improvements; Queries now run in batches of 2; Charts are less eager to resize
- Updated dependencies [847e8c81]
- Updated dependencies [fa958c52]
  - @evidence-dev/components@2.2.1
  - @evidence-dev/db-orchestrator@2.0.2

## 15.0.0

### Minor Changes

- f7a08956: Addition of missing dependencies in multiple pkg, fix the LinkedChart by moving to svelte:component
- 54904e9e: Hot Fix, Fix show/hide Query button, rework on reactivity and query toast, move build:strict to vite command

### Patch Changes

- Updated dependencies [f7a08956]
- Updated dependencies [f1b25b51]
- Updated dependencies [e4f698a4]
- Updated dependencies [406cdc6e]
- Updated dependencies [54904e9e]
  - @evidence-dev/preprocess@2.2.0
  - @evidence-dev/components@2.2.0
  - @evidence-dev/db-orchestrator@2.0.1

## 14.0.0

### Minor Changes

- a7a9757: Minor import changes, adjust generated vite config, minor variable rename

### Patch Changes

- Updated dependencies [a7a9757]
  - @evidence-dev/preprocess@2.1.0
  - @evidence-dev/components@2.1.0

## 13.0.1

### Patch Changes

- 8647a03: Bump TS dependencies

## 13.0.0

### Major Changes

- 96c9c81: Upgrade to svelte kit 1.0.0, remove support for Node 14

### Patch Changes

- f036b94: align svelte-kit version with adapter static's requirements
- 45822a6: Updating deps to support SK 1.0.0
- 69f2f9c: Updating deps for SK 1.0 upgrade
- Updated dependencies [15e9176]
- Updated dependencies [8439630]
- Updated dependencies [96c9c81]
- Updated dependencies [84b097a]
- Updated dependencies [45822a6]
- Updated dependencies [67e7597]
- Updated dependencies [5bfde4f]
- Updated dependencies [69f2f9c]
  - @evidence-dev/components@2.0.0
  - @evidence-dev/preprocess@2.0.0
  - @evidence-dev/db-orchestrator@2.0.0

## 12.1.0

### Minor Changes

- a7168a4: Issue-646 SQL Connector broken due to constant being re-assigned (possibly due to a JS runtime change)

### Patch Changes

- @evidence-dev/db-orchestrator@1.3.1

## 12.0.1

### Patch Changes

- 856bc76: Fix allowing inclusion of a sources directory in projects
- Updated dependencies [1e90c45]
  - @evidence-dev/components@1.10.1

## 12.0.0

### Minor Changes

- 005a55e: Add CSV connector

### Patch Changes

- c9dde3d: Addition of a "next" release tag in-sync with main branch
- Updated dependencies [85c3f94]
- Updated dependencies [005a55e]
- Updated dependencies [794e61c]
- Updated dependencies [315b243]
- Updated dependencies [c9dde3d]
  - @evidence-dev/components@1.10.0
  - @evidence-dev/db-orchestrator@1.3.0
  - @evidence-dev/preprocess@1.5.1
  - @evidence-dev/telemetry@1.0.5

## 11.0.0

### Minor Changes

- c801fa9: New capability to fail build if there are errors in components or queries

### Patch Changes

- Updated dependencies [e2550fd]
- Updated dependencies [c0f69cb]
- Updated dependencies [5fbbb9c]
- Updated dependencies [ccbca9c]
- Updated dependencies [fa4edec]
- Updated dependencies [c06c1a1]
- Updated dependencies [77cc9c9]
- Updated dependencies [2e81dbe]
- Updated dependencies [c801fa9]
- Updated dependencies [db92de1]
- Updated dependencies [470291c]
  - @evidence-dev/components@1.9.0
  - @evidence-dev/preprocess@1.5.0
  - @evidence-dev/db-orchestrator@1.2.0

## 10.0.0

### Patch Changes

- Updated dependencies [9d42aae]
- Updated dependencies [b665eb2]
- Updated dependencies [453919a]
- Updated dependencies [80eaa2d]
- Updated dependencies [5e5cf29]
  - @evidence-dev/components@1.8.0

## 9.0.0

### Patch Changes

- 5a44815: Ability to style project by overwriting app.css
- Updated dependencies [afda5ba]
- Updated dependencies [5a44815]
- Updated dependencies [84dc796]
- Updated dependencies [d83c741]
- Updated dependencies [c993d09]
- Updated dependencies [8a7bd67]
  - @evidence-dev/components@1.7.0

## 8.0.0

### Patch Changes

- 175c091: clear query cache at start of build
- Updated dependencies [8894ea3]
- Updated dependencies [141dc5b]
  - @evidence-dev/db-orchestrator@1.1.12
  - @evidence-dev/preprocess@1.4.0
  - @evidence-dev/components@1.6.0

## 7.0.0

### Patch Changes

- Updated dependencies [94805f9]
- Updated dependencies [fed8cf3]
- Updated dependencies [e098028]
- Updated dependencies [2a1ff16]
- Updated dependencies [d41cbe4]
- Updated dependencies [6445c6f]
- Updated dependencies [12aced0]
- Updated dependencies [ea10232]
- Updated dependencies [c013859]
- Updated dependencies [c50ce10]
- Updated dependencies [1f339fb]
- Updated dependencies [224c553]
- Updated dependencies [7afdf97]
- Updated dependencies [f5ec614]
  - @evidence-dev/components@1.5.0
  - @evidence-dev/preprocess@1.3.0
  - @evidence-dev/db-orchestrator@1.1.11

## 6.0.2

### Patch Changes

- Updated dependencies [1b052b2]
- Updated dependencies [0ca1dd2]
- Updated dependencies [9bd0f88]
- Updated dependencies [32e797f]
  - @evidence-dev/components@1.4.2

## 6.0.1

### Patch Changes

- Updated dependencies [3b27c0e]
- Updated dependencies [9728baf]
- Updated dependencies [75d5863]
- Updated dependencies [bb18575]
  - @evidence-dev/components@1.4.1

## 6.0.0

### Patch Changes

- Updated dependencies [79dca60]
- Updated dependencies [755b1bb]
- Updated dependencies [c68f658]
  - @evidence-dev/preprocess@1.2.6
  - @evidence-dev/components@1.4.0

## 5.0.18

### Patch Changes

- Updated dependencies [975fdb1]
  - @evidence-dev/components@1.3.14

## 5.0.17

### Patch Changes

- @evidence-dev/db-orchestrator@1.1.10

## 5.0.16

### Patch Changes

- 64e939f: bump svelte
- Updated dependencies [81755d7]
- Updated dependencies [1922765]
  - @evidence-dev/components@1.3.13

## 5.0.15

### Patch Changes

- 44b1412: Remove the need for a hard page refresh when editing queries, and provide live feedback on the status of queries while they run
- Updated dependencies [44b1412]
  - @evidence-dev/db-orchestrator@1.1.9
  - @evidence-dev/preprocess@1.2.5
  - @evidence-dev/components@1.3.12

## 5.0.14

### Patch Changes

- Updated dependencies [76f5617]
- Updated dependencies [de49590]
  - @evidence-dev/components@1.3.11
  - @evidence-dev/db-orchestrator@1.1.8

## 5.0.13

### Patch Changes

- Updated dependencies [77cee78]
- Updated dependencies [f16158e]
- Updated dependencies [7ea5780]
- Updated dependencies [03bf05f]
- Updated dependencies [90b1846]
- Updated dependencies [7aaa078]
  - @evidence-dev/components@1.3.10
  - @evidence-dev/db-orchestrator@1.1.7
  - @evidence-dev/telemetry@1.0.4

## 5.0.12

### Patch Changes

- Updated dependencies [fb3b5ec]
- Updated dependencies [245c76f]
  - @evidence-dev/components@1.3.9

## 5.0.11

### Patch Changes

- d12e700: Support adding local components from a /components/ directory
- 2fbf018: Update docs and test-env
- Updated dependencies [dec9ebe]
- Updated dependencies [3523b63]
- Updated dependencies [e2383bb]
- Updated dependencies [fe65489]
- Updated dependencies [08074f1]
  - @evidence-dev/components@1.3.8
  - @evidence-dev/db-orchestrator@1.1.6

## 5.0.10

### Patch Changes

- df25e4d: Log telemetry opt outs, include anonymized hash of git repo
- Updated dependencies [6dce090]
- Updated dependencies [df25e4d]
  - @evidence-dev/components@1.3.7
  - @evidence-dev/telemetry@1.0.3
  - @evidence-dev/db-orchestrator@1.1.5

## 5.0.9

### Patch Changes

- Updated dependencies [00f097f]
- Updated dependencies [fba883b]
- Updated dependencies [e6b72ac]
- Updated dependencies [90e3748]
- Updated dependencies [63a758b]
- Updated dependencies [81ff4e1]
- Updated dependencies [0091256]
  - @evidence-dev/components@1.3.6

## 5.0.8

### Patch Changes

- Updated dependencies [74a09a0]
  - @evidence-dev/preprocess@1.2.4

## 5.0.7

### Patch Changes

- Updated dependencies [49bc1d6]
- Updated dependencies [a60d10e]
- Updated dependencies [5c81d4d]
  - @evidence-dev/components@1.3.5
  - @evidence-dev/db-orchestrator@1.1.4

## 5.0.6

### Patch Changes

- Updated dependencies [1dec9a4]
  - @evidence-dev/preprocess@1.2.3

## 5.0.5

### Patch Changes

- Updated dependencies [7469dc2]
  - @evidence-dev/components@1.3.4

## 5.0.4

### Patch Changes

- Updated dependencies [ad52ef7]
  - @evidence-dev/components@1.3.3

## 5.0.3

### Patch Changes

- 07971d8: Ensure the version of Vite stays belows 3.0
- Updated dependencies [bc62401]
- Updated dependencies [9275cda]
- Updated dependencies [07971d8]
- Updated dependencies [b5d4f28]
  - @evidence-dev/components@1.3.2

## 5.0.2

### Patch Changes

- d933ab8: Fix test-env failing to build + silent errors when test-env fails to build
- 4702901: Adds support for static folder that users can put files in
- Updated dependencies [87fd331]
- Updated dependencies [9d2726b]
- Updated dependencies [d933ab8]
- Updated dependencies [11b6dd0]
- Updated dependencies [6ed9a37]
- Updated dependencies [4702901]
- Updated dependencies [e5a3eb7]
- Updated dependencies [77c205d]
  - @evidence-dev/components@1.3.1
  - @evidence-dev/preprocess@1.2.2

## 5.0.1

### Patch Changes

- 1dec76c: Fixed a bug with query names not being updated on reloads
- Updated dependencies [1dec76c]
  - @evidence-dev/preprocess@1.2.1

## 5.0.0

### Minor Changes

- 51c65c5: Fixed a dependency issue with the ssf library

### Patch Changes

- Updated dependencies [51c65c5]
  - @evidence-dev/components@1.3.0

## 4.0.0

### Patch Changes

- Updated dependencies [6a7fb35]
- Updated dependencies [23d0234]
- Updated dependencies [7a87d0b]
- Updated dependencies [06cc44a]
- Updated dependencies [04ad3b9]
- Updated dependencies [9f894e7]
- Updated dependencies [f6d00c3]
- Updated dependencies [e2c7319]
- Updated dependencies [23f90b7]
- Updated dependencies [6fd2f57]
  - @evidence-dev/preprocess@1.2.0
  - @evidence-dev/components@1.2.0
  - @evidence-dev/db-orchestrator@1.1.3

## 3.0.2

### Patch Changes

- @evidence-dev/db-orchestrator@1.1.2

## 3.0.1

### Patch Changes

- @evidence-dev/db-orchestrator@1.1.1

## 3.0.0

### Patch Changes

- Updated dependencies [a83857e]
- Updated dependencies [cb6d561]
  - @evidence-dev/preprocess@1.1.1
  - @evidence-dev/db-orchestrator@1.1.0

## 2.1.0

### Minor Changes

- 1fead9d: Exposed queries as their own variable (data={queryName}, in addition to existing data={data.queryname}) and exposed native Postgres/BigQuery types to components

### Patch Changes

- Updated dependencies [1fead9d]
- Updated dependencies [f651bda]
- Updated dependencies [d225abf]
- Updated dependencies [a728873]
  - @evidence-dev/preprocess@1.1.0
  - @evidence-dev/db-orchestrator@1.0.3
  - @evidence-dev/components@1.1.4

## 2.0.5

### Patch Changes

- Updated dependencies [44ebd1a]
  - @evidence-dev/db-orchestrator@1.0.2
  - @evidence-dev/components@1.1.3

## 2.0.4

### Patch Changes

- Updated dependencies [e8ceec3]
  - @evidence-dev/components@1.1.2

## 2.0.3

### Patch Changes

- d79dc33: Minor bug fix

## 2.0.2

### Patch Changes

- 5aa64df: Minor bug fix

## 2.0.1

### Patch Changes

- 6a078e6: Dependency fix and minor bug fixes
- Updated dependencies [6a078e6]
  - @evidence-dev/components@1.1.1

## 2.0.0

### Minor Changes

- 58eda6e: Add Print to PDF Feature

### Patch Changes

- 8170b66: Add telemetry options to the development mode settings page.
- Updated dependencies [8170b66]
- Updated dependencies [80d38a5]
- Updated dependencies [3b5f1af]
- Updated dependencies [fc45df2]
  - @evidence-dev/components@1.1.0
  - @evidence-dev/db-orchestrator@1.0.1

## 1.0.3

### Patch Changes

- Updated dependencies [174a626]
  - @evidence-dev/components@1.0.3

## 1.0.2

### Patch Changes

- 2e483e4: Support passing arguments to svelte-kit through the CLI
- Updated dependencies [2e483e4]
- Updated dependencies [eeabad3]
  - @evidence-dev/components@1.0.2

## 1.0.1

### Patch Changes

- 8c125c5: Allow for a missing git repo
- Updated dependencies [8c125c5]
  - @evidence-dev/components@1.0.1

## 1.0.0

### Major Changes

- 1b81b58: Hides most of the front-end experience from analysts, introduces a new side-bar navigation scheme, adds a development mode settings page to configure database connections

### Patch Changes

- 3d0d93c: Various UI changes
- 54044fa: Inline svelte-kit config into the template
- a50f8c2: fix sqlite gitignore error, settings optionals, and misc UI fixes
- 36dcd68: Fix import error for show hide queries button
- 644963c: Add deployment instructions and a check on the status of the user's git repo to the dev mode settings panel
- e45a29a: Add a deployment panel to settings
- Updated dependencies [54044fa]
- Updated dependencies [3d0d93c]
- Updated dependencies [9d6417e]
- Updated dependencies [a50f8c2]
- Updated dependencies [1b81b58]
- Updated dependencies [36dcd68]
- Updated dependencies [644963c]
- Updated dependencies [e45a29a]
  - @evidence-dev/components@1.0.0
  - @evidence-dev/preprocess@1.0.0
  - @evidence-dev/db-orchestrator@1.0.0

## 1.0.0-next.10

### Patch Changes

- Updated dependencies
  - @evidence-dev/components@1.0.0-next.7

## 1.0.0-next.9

### Patch Changes

- 644963c: Add deployment instructions and a check on the status of the user's git repo to the dev mode settings panel
- Updated dependencies [644963c]
  - @evidence-dev/db-orchestrator@1.0.0-next.5
  - @evidence-dev/preprocess@1.0.0-next.2
  - @evidence-dev/components@1.0.0-next.6

## 1.0.0-next.8

### Patch Changes

- e45a29a: Add a deployment panel to settings
- Updated dependencies [e45a29a]
  - @evidence-dev/components@1.0.0-next.5

## 1.0.0-next.7

### Patch Changes

- Fix import error for show hide queries button
- Updated dependencies
  - @evidence-dev/components@1.0.0-next.4

## 1.0.0-next.6

### Patch Changes

- 3d0d93c: Various UI changes
- Updated dependencies [3d0d93c]
  - @evidence-dev/preprocess@1.0.0-next.1
  - @evidence-dev/components@1.0.0-next.3
  - @evidence-dev/db-orchestrator@1.0.0-next.4

## 1.0.0-next.5

### Patch Changes

- @evidence-dev/db-orchestrator@1.0.0-next.3

## 1.0.0-next.4

### Patch Changes

- Fixes sqlite gitignore error, settings optionals, and misc UI bugs
- Updated dependencies
  - @evidence-dev/components@1.0.0-next.2
  - @evidence-dev/db-orchestrator@1.0.0-next.2

## 1.0.0-next.3

### Patch Changes

- @evidence-dev/db-orchestrator@1.0.0-next.1

## 1.0.0-next.2

### Patch Changes

- Updated dependencies
  - @evidence-dev/components@1.0.0-next.1

## 1.0.0-next.1

### Patch Changes

- Inline svelte-kit config into the template

## 1.0.0-next.0

### Major Changes

- Hides most of the front-end experience from analysts, introduces a new side-bar navigation scheme, adds a development mode settings page to configure database connections

### Patch Changes

- Updated dependencies
  - @evidence-dev/db-orchestrator@1.0.0-next.0
  - @evidence-dev/preprocess@1.0.0-next.0
  - @evidence-dev/components@1.0.0-next.0

## 0.1.25

### Patch Changes

- Updated dependencies [b1bd12f]
  - @evidence-dev/components@0.1.21

## 0.1.24

### Patch Changes

- Updated dependencies [6f74e1c]
  - @evidence-dev/components@0.1.20

## 0.1.23

### Patch Changes

- Updated dependencies
  - @evidence-dev/components@0.1.19

## 0.1.22

### Patch Changes

- 0713a5d: take these back to public
- Updated dependencies [0713a5d]
  - @evidence-dev/components@0.1.18

## 0.1.21

### Patch Changes

- Updated dependencies [e540391]
  - @evidence-dev/components@0.1.17

## 0.1.20

### Patch Changes

- Updated dependencies [c75b082]
  - @evidence-dev/components@0.1.16

## 0.1.19

### Patch Changes

- bd66abe: Fix BubbleChart scaling function
- Updated dependencies [bd66abe]
  - @evidence-dev/components@0.1.15

## 0.1.18

### Patch Changes

- Updated dependencies [09edb57]
  - @evidence-dev/db-orchestrator@0.1.18

## 0.1.17

### Patch Changes

- Updated dependencies [478de2c]
  - @evidence-dev/components@0.1.14

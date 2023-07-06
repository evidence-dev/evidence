# evidence-test-environment

## 3.0.0-usql.1

### Patch Changes

- @evidence-dev/evidence@20.0.0-usql.1

## 3.0.0-usql.0

### Major Changes

- cb0fc468: This update includes major changes to the way Evidence interacts with data.
  Instead of running queries against the production database, and including it
  with the project as pre-rendered, static JSON data; those queries are now stored as .parquet files.

  .parquet enables the use of DuckDB on the client, allowing for much greater levels of interactivity
  on pages, and interoperability between different data sources (e.g. joins across postgres & mysql).

### Patch Changes

- Updated dependencies [cb0fc468]
- Updated dependencies [4e783f36]
- Updated dependencies [75560a31]
  - @evidence-dev/component-utilities@2.0.0-usql.0
  - @evidence-dev/core-components@2.0.0-usql.0
  - @evidence-dev/duckdb@1.0.0-usql.0
  - @evidence-dev/evidence@20.0.0-usql.0
  - @evidence-dev/faker-datasource@2.0.0-usql.0

## 2.0.16

### Patch Changes

- Updated dependencies [d999fe37]
- Updated dependencies [4e94b57a]
- Updated dependencies [121c7868]
- Updated dependencies [7fd1f889]
- Updated dependencies [f6be30cf]
  - @evidence-dev/core-components@1.1.0
  - @evidence-dev/component-utilities@1.1.0
  - @evidence-dev/evidence@19.0.0

## 2.0.15

### Patch Changes

- Updated dependencies [168af3bb]
- Updated dependencies [929a0074]
- Updated dependencies [eb886615]
  - @evidence-dev/core-components@1.0.3
  - @evidence-dev/evidence@18.0.3

## 2.0.14

### Patch Changes

- Updated dependencies [2b7809e6]
  - @evidence-dev/core-components@1.0.2
  - @evidence-dev/evidence@18.0.2

## 2.0.13

### Patch Changes

- Updated dependencies [44c0c4ca]
- Updated dependencies [a38148b5]
  - @evidence-dev/core-components@1.0.1
  - @evidence-dev/evidence@18.0.1

## 2.0.12

### Patch Changes

- fb6ac548: switched plugin-connector to evidence dep
- Updated dependencies [fb6ac548]
- Updated dependencies [ac3d47d3]
- Updated dependencies [c8932e5e]
- Updated dependencies [7873115f]
- Updated dependencies [d7d4dfce]
- Updated dependencies [4cd28cf5]
- Updated dependencies [84208c04]
  - @evidence-dev/evidence@18.0.0
  - @evidence-dev/component-utilities@1.0.0
  - @evidence-dev/core-components@1.0.0

## 2.0.11

### Patch Changes

- @evidence-dev/evidence@17.0.3

## 2.0.10

### Patch Changes

- @evidence-dev/evidence@17.0.2

## 2.0.9

### Patch Changes

- Updated dependencies [42ea6aff]
  - @evidence-dev/evidence@17.0.1

## 2.0.8

### Patch Changes

- Updated dependencies [922d2c6c]
  - @evidence-dev/evidence@17.0.0

## 2.0.7

### Patch Changes

- @evidence-dev/evidence@16.0.2

## 2.0.6

### Patch Changes

- Updated dependencies [aff6c041]
  - @evidence-dev/evidence@16.0.1

## 2.0.5

### Patch Changes

- @evidence-dev/evidence@16.0.0

## 2.0.4

### Patch Changes

- Updated dependencies [fa958c52]
  - @evidence-dev/evidence@15.0.1

## 2.0.3

### Patch Changes

- Updated dependencies [f7a08956]
- Updated dependencies [54904e9e]
  - @evidence-dev/evidence@15.0.0

## 2.0.2

### Patch Changes

- Updated dependencies [a7a9757]
  - @evidence-dev/evidence@14.0.0

## 2.0.1

### Patch Changes

- Updated dependencies [8647a03]
  - @evidence-dev/evidence@13.0.1

## 2.0.0

### Major Changes

- 96c9c81: Upgrade to svelte kit 1.0.0, remove support for Node 14

### Patch Changes

- Updated dependencies [f036b94]
- Updated dependencies [96c9c81]
- Updated dependencies [45822a6]
- Updated dependencies [69f2f9c]
  - @evidence-dev/evidence@13.0.0

## 1.0.44

### Patch Changes

- Updated dependencies [a7168a4]
  - @evidence-dev/evidence@12.1.0

## 1.0.43

### Patch Changes

- Updated dependencies [856bc76]
  - @evidence-dev/evidence@12.0.1

## 1.0.42

### Patch Changes

- c9dde3d: Addition of a "next" release tag in-sync with main branch
- Updated dependencies [005a55e]
- Updated dependencies [c9dde3d]
  - @evidence-dev/evidence@12.0.0

## 1.0.41

### Patch Changes

- Updated dependencies [c801fa9]
  - @evidence-dev/evidence@11.0.0

## 1.0.40

### Patch Changes

- @evidence-dev/evidence@10.0.0

## 1.0.39

### Patch Changes

- Updated dependencies [5a44815]
  - @evidence-dev/evidence@9.0.0

## 1.0.38

### Patch Changes

- Updated dependencies [175c091]
  - @evidence-dev/evidence@8.0.0

## 1.0.37

### Patch Changes

- @evidence-dev/evidence@7.0.0

## 1.0.36

### Patch Changes

- @evidence-dev/evidence@6.0.2

## 1.0.35

### Patch Changes

- @evidence-dev/evidence@6.0.1

## 1.0.34

### Patch Changes

- @evidence-dev/evidence@6.0.0

## 1.0.33

### Patch Changes

- @evidence-dev/evidence@5.0.18

## 1.0.32

### Patch Changes

- @evidence-dev/evidence@5.0.17

## 1.0.31

### Patch Changes

- Updated dependencies [64e939f]
  - @evidence-dev/evidence@5.0.16

## 1.0.30

### Patch Changes

- Updated dependencies [44b1412]
  - @evidence-dev/evidence@5.0.15

## 1.0.29

### Patch Changes

- @evidence-dev/evidence@5.0.14

## 1.0.28

### Patch Changes

- @evidence-dev/evidence@5.0.13

## 1.0.27

### Patch Changes

- @evidence-dev/evidence@5.0.12

## 1.0.26

### Patch Changes

- d12e700: Support adding local components from a /components/ directory
- 2fbf018: Update docs and test-env
- Updated dependencies [d12e700]
- Updated dependencies [2fbf018]
  - @evidence-dev/evidence@5.0.11

## 1.0.25

### Patch Changes

- Updated dependencies [df25e4d]
  - @evidence-dev/evidence@5.0.10

## 1.0.24

### Patch Changes

- @evidence-dev/evidence@5.0.9

## 1.0.23

### Patch Changes

- @evidence-dev/evidence@5.0.8

## 1.0.22

### Patch Changes

- @evidence-dev/evidence@5.0.7

## 1.0.21

### Patch Changes

- @evidence-dev/evidence@5.0.6

## 1.0.20

### Patch Changes

- @evidence-dev/evidence@5.0.5

## 1.0.19

### Patch Changes

- @evidence-dev/evidence@5.0.4

## 1.0.18

### Patch Changes

- Updated dependencies [07971d8]
  - @evidence-dev/evidence@5.0.3

## 1.0.17

### Patch Changes

- 4702901: Adds support for static folder that users can put files in
- Updated dependencies [d933ab8]
- Updated dependencies [4702901]
  - @evidence-dev/evidence@5.0.2

## 1.0.16

### Patch Changes

- Updated dependencies [1dec76c]
  - @evidence-dev/evidence@5.0.1

## 1.0.15

### Patch Changes

- Updated dependencies [51c65c5]
  - @evidence-dev/evidence@5.0.0

## 1.0.14

### Patch Changes

- @evidence-dev/evidence@4.0.0

## 1.0.13

### Patch Changes

- @evidence-dev/evidence@3.0.2

## 1.0.12

### Patch Changes

- @evidence-dev/evidence@3.0.1

## 1.0.11

### Patch Changes

- @evidence-dev/evidence@3.0.0

## 1.0.10

### Patch Changes

- 1fead9d: Exposed queries as their own variable (data={queryName}, in addition to existing data={data.queryname}) and exposed native Postgres/BigQuery types to components
- Updated dependencies [1fead9d]
  - @evidence-dev/evidence@2.1.0

## 1.0.9

### Patch Changes

- @evidence-dev/evidence@2.0.5

## 1.0.8

### Patch Changes

- @evidence-dev/evidence@2.0.4

## 1.0.7

### Patch Changes

- Updated dependencies [d79dc33]
  - @evidence-dev/evidence@2.0.3

## 1.0.6

### Patch Changes

- Updated dependencies [5aa64df]
  - @evidence-dev/evidence@2.0.2

## 1.0.5

### Patch Changes

- Updated dependencies [6a078e6]
  - @evidence-dev/evidence@2.0.1

## 1.0.4

### Patch Changes

- Updated dependencies [8170b66]
- Updated dependencies [58eda6e]
  - @evidence-dev/evidence@2.0.0

## 1.0.3

### Patch Changes

- @evidence-dev/evidence@1.0.3

## 1.0.2

### Patch Changes

- Updated dependencies [2e483e4]
  - @evidence-dev/evidence@1.0.2

## 1.0.1

### Patch Changes

- Updated dependencies [8c125c5]
  - @evidence-dev/evidence@1.0.1

## 1.0.0

### Major Changes

- 1b81b58: Hides most of the front-end experience from analysts, introduces a new side-bar navigation scheme, adds a development mode settings page to configure database connections

### Patch Changes

- 644963c: Add deployment instructions and a check on the status of the user's git repo to the dev mode settings panel
- Updated dependencies [3d0d93c]
- Updated dependencies [54044fa]
- Updated dependencies [a50f8c2]
- Updated dependencies [1b81b58]
- Updated dependencies [36dcd68]
- Updated dependencies [644963c]
- Updated dependencies [e45a29a]
  - @evidence-dev/evidence@1.0.0

## 1.0.0-next.10

### Patch Changes

- @evidence-dev/evidence@1.0.0-next.10

## 1.0.0-next.9

### Patch Changes

- 644963c: Add deployment instructions and a check on the status of the user's git repo to the dev mode settings panel
- Updated dependencies [644963c]
  - @evidence-dev/evidence@1.0.0-next.9

## 1.0.0-next.8

### Patch Changes

- Updated dependencies [e45a29a]
  - @evidence-dev/evidence@1.0.0-next.8

## 1.0.0-next.7

### Patch Changes

- Updated dependencies
  - @evidence-dev/evidence@1.0.0-next.7

## 1.0.0-next.6

### Patch Changes

- Updated dependencies [3d0d93c]
  - @evidence-dev/evidence@1.0.0-next.6

## 1.0.0-next.5

### Patch Changes

- @evidence-dev/evidence@1.0.0-next.5

## 1.0.0-next.4

### Patch Changes

- Updated dependencies
  - @evidence-dev/evidence@1.0.0-next.4

## 1.0.0-next.3

### Patch Changes

- @evidence-dev/evidence@1.0.0-next.3

## 1.0.0-next.2

### Patch Changes

- @evidence-dev/evidence@1.0.0-next.2

## 1.0.0-next.1

### Patch Changes

- Updated dependencies
  - @evidence-dev/evidence@1.0.0-next.1

## 1.0.0-next.0

### Major Changes

- Hides most of the front-end experience from analysts, introduces a new side-bar navigation scheme, adds a development mode settings page to configure database connections

### Patch Changes

- Updated dependencies
  - @evidence-dev/evidence@1.0.0-next.0

## 0.0.9

### Patch Changes

- @evidence-dev/evidence@0.1.25

## 0.0.8

### Patch Changes

- @evidence-dev/evidence@0.1.24

## 0.0.7

### Patch Changes

- @evidence-dev/evidence@0.1.23

## 0.0.6

### Patch Changes

- Updated dependencies [0713a5d]
  - @evidence-dev/evidence@0.1.22

## 0.0.5

### Patch Changes

- @evidence-dev/evidence@0.1.21

## 0.0.4

### Patch Changes

- @evidence-dev/evidence@0.1.20

## 0.0.3

### Patch Changes

- Updated dependencies [bd66abe]
  - @evidence-dev/evidence@0.1.19

## 0.0.2

### Patch Changes

- @evidence-dev/evidence@0.1.18

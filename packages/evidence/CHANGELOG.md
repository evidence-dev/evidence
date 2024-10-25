# @evidence-dev/evidence

## 39.1.13

### Patch Changes

- cbe4c1d2f: Hide manifest toast in prod
- Updated dependencies [b2126ac1a]
  - @evidence-dev/sdk@1.4.5
  - @evidence-dev/universal-sql@2.1.6
  - @evidence-dev/plugin-connector@2.1.12

## 39.1.12

### Patch Changes

- 426ccd4d4: Disable windows cache service worker with VITE_EVIDENCE_DISABLE_WINDOWS_CACHE_SERVICE_WORKER
- ddc18a271: Windows cache service worker isnt asynchronous
- Updated dependencies [a91b26fb3]
- Updated dependencies [cbb8b16f4]
  - @evidence-dev/sdk@1.4.4
  - @evidence-dev/plugin-connector@2.1.11

## 39.1.11

### Patch Changes

- f3a352dbe: Disable windows cache service worker with VITE_EVIDENCE_DISABLE_WINDOWS_CACHE_SERVICE_WORKER

## 39.1.10

### Patch Changes

- 71a20080c: When using --debug to build a project, the results are not transpiled or minified
- Updated dependencies [e0abcc56d]
- Updated dependencies [71a20080c]
- Updated dependencies [e0abcc56d]
  - @evidence-dev/sdk@1.4.3
  - @evidence-dev/preprocess@5.2.2
  - @evidence-dev/plugin-connector@2.1.11

## 39.1.9

### Patch Changes

- c8315da2e: Update svelte to resolve security vulnerability
- 75331a410: fix frontmatter on home page
- 069acb65a: Allows environment variables to be used in custom components in development mode
  Loads .env file in cli and keeps VITE\_ prefixed variables

  Fixes #2550

- Updated dependencies [952abbd16]
- Updated dependencies [0a0695588]
- Updated dependencies [c8315da2e]
- Updated dependencies [06313c848]
- Updated dependencies [bad1038c1]
  - @evidence-dev/sdk@1.4.2
  - @evidence-dev/preprocess@5.2.1
  - @evidence-dev/plugin-connector@2.1.11
  - @evidence-dev/telemetry@2.1.3

## 39.1.8

### Patch Changes

- Updated dependencies [057558028]
  - @evidence-dev/sdk@1.4.1
  - @evidence-dev/plugin-connector@2.1.10

## 39.1.7

### Patch Changes

- Updated dependencies [4c1e5330c]
  - @evidence-dev/preprocess@5.2.0

## 39.1.6

### Patch Changes

- 999fffa38: Improve sdk debug behavior for better consistency
- Updated dependencies [999fffa38]
- Updated dependencies [999fffa38]
- Updated dependencies [999fffa38]
- Updated dependencies [1e5e5f1da]
- Updated dependencies [67dbd116b]
- Updated dependencies [999fffa38]
  - @evidence-dev/sdk@1.4.0
  - @evidence-dev/plugin-connector@2.1.10

## 39.1.5

### Patch Changes

- 190a99590: preview command uses VITE_EVIDENCE_SPA environment variable to serve build in SPA mode
- f7253ad4b: Fix noisy "Failed to pre-render columns" log during build
- Updated dependencies [b84f22fce]
- Updated dependencies [c0e1799e2]
- Updated dependencies [f7253ad4b]
  - @evidence-dev/preprocess@5.1.7
  - @evidence-dev/universal-sql@2.1.5
  - @evidence-dev/sdk@1.3.10
  - @evidence-dev/plugin-connector@2.1.9

## 39.1.4

### Patch Changes

- 2527838c4: Fix TProtocolException when loading Parquet files on Windows
- Updated dependencies [8c2982505]
- Updated dependencies [8c2982505]
  - @evidence-dev/plugin-connector@2.1.8
  - @evidence-dev/preprocess@5.1.6
  - @evidence-dev/universal-sql@2.1.4
  - @evidence-dev/sdk@1.3.9

## 39.1.3

### Patch Changes

- 32035eeaa: Override fast-xml-parser version to >=4.4.1 to resolve vulnerability
- dc29b7fd0: Increase node memory limit to 4GB
- Updated dependencies [32035eeaa]
- Updated dependencies [3572fcfd7]
- Updated dependencies [907efee29]
  - @evidence-dev/plugin-connector@2.1.7
  - @evidence-dev/preprocess@5.1.5
  - @evidence-dev/sdk@1.3.8
  - @evidence-dev/telemetry@2.1.2

## 39.1.2

### Patch Changes

- e50e7ed58: Pre-render column information using DESCRIBE query
- Updated dependencies [e50e7ed58]
- Updated dependencies [fbdfe2dd6]
  - @evidence-dev/preprocess@5.1.4
  - @evidence-dev/sdk@1.3.7
  - @evidence-dev/plugin-connector@2.1.6

## 39.1.1

### Patch Changes

- Updated dependencies [3571b0b3a]
  - @evidence-dev/sdk@1.3.6
  - @evidence-dev/plugin-connector@2.1.6

## 39.1.0

### Minor Changes

- 804949397: frontmatter title option sets breadcrumb
- 7cb558c32: allow for dynamic breadcrumbs via frontmatter

### Patch Changes

- db8326efa: Re-added entry detection to evidencemeta, fixes SPA mode
- 3b2e06a0b: Remove unnecessary core-component and component-utilities peer dependencies.
- Updated dependencies [08818477d]
- Updated dependencies [db8326efa]
  - @evidence-dev/sdk@1.3.5
  - @evidence-dev/plugin-connector@2.1.6

## 39.0.2

### Patch Changes

- Updated dependencies [a2f9bfb7a]
  - @evidence-dev/core-components@4.6.2

## 39.0.1

### Patch Changes

- Updated dependencies [a5b141dec]
- Updated dependencies [c3b86ef5f]
- Updated dependencies [c392866a0]
- Updated dependencies [6754944ca]
- Updated dependencies [e6aa2021d]
- Updated dependencies [6d2a194e6]
  - @evidence-dev/core-components@4.6.1
  - @evidence-dev/plugin-connector@2.1.6

## 39.0.0

### Patch Changes

- Updated dependencies [0b4ae10c5]
- Updated dependencies [dbc4116e3]
- Updated dependencies [42ca6d4ce]
  - @evidence-dev/core-components@4.6.0

## 38.1.3

### Patch Changes

- 90668a4c6: Remove sdk from deps

## 38.1.2

### Patch Changes

- 6e184f95e: Fixed optimizeDeps firing on dev server start. Removed dead package
- 69bd76b47: Fix HMR
- Updated dependencies [cb3f17c9e]
- Updated dependencies [1009026e8]
- Updated dependencies [20af8e6b6]
- Updated dependencies [3a1e1d664]
- Updated dependencies [55bc6a52b]
- Updated dependencies [e8a5d9964]
  - @evidence-dev/core-components@4.5.4
  - @evidence-dev/sdk@1.3.4
  - @evidence-dev/component-utilities@3.2.4
  - @evidence-dev/plugin-connector@2.1.5

## 38.1.1

### Patch Changes

- Updated dependencies [244c795be]
  - @evidence-dev/sdk@1.3.3
  - @evidence-dev/component-utilities@3.2.3
  - @evidence-dev/core-components@4.5.3
  - @evidence-dev/plugin-connector@2.1.5

## 38.1.0

### Minor Changes

- a08542924: Switch to using sdk for datasources instead of plugin connector

### Patch Changes

- 6cdedceb0: Remove db-orchestrator
- 38c669d2e: Fixed Custom Formatting
- Updated dependencies [b84ef07ac]
- Updated dependencies [c14bc0a66]
- Updated dependencies [0bb7718a2]
- Updated dependencies [c14bc0a66]
- Updated dependencies [f15071659]
- Updated dependencies [d6b25b02c]
- Updated dependencies [93a838ca2]
- Updated dependencies [df9159f2b]
- Updated dependencies [3daa83ffc]
- Updated dependencies [6cdedceb0]
- Updated dependencies [df9159f2b]
- Updated dependencies [9982970fd]
  - @evidence-dev/sdk@1.3.2
  - @evidence-dev/universal-sql@2.1.3
  - @evidence-dev/core-components@4.5.2
  - @evidence-dev/preprocess@5.1.3
  - @evidence-dev/component-utilities@3.2.2
  - @evidence-dev/plugin-connector@2.1.5
  - @evidence-dev/query-store@2.1.5
  - @evidence-dev/telemetry@2.1.1
  - @evidence-dev/tailwind@2.1.1

## 38.0.1

### Patch Changes

- Updated dependencies [c10e35be1]
- Updated dependencies [08d7b9405]
- Updated dependencies [8a0ba1414]
  - @evidence-dev/core-components@4.5.1
  - @evidence-dev/sdk@1.3.1
  - @evidence-dev/db-orchestrator@3.1.3
  - @evidence-dev/component-utilities@3.2.1
  - @evidence-dev/plugin-connector@2.1.4

## 38.0.0

### Patch Changes

- Updated dependencies [f411c8650]
- Updated dependencies [79f4758e0]
- Updated dependencies [b041f5f9a]
  - @evidence-dev/core-components@4.5.0
  - @evidence-dev/db-orchestrator@3.1.2

## 37.0.0

### Patch Changes

- c601d1c9: Updates preview command to better match deployed behaviour
- Updated dependencies [9fdc805b]
- Updated dependencies [97cb3a7c]
- Updated dependencies [e058d2d3]
- Updated dependencies [73fc7ebf]
- Updated dependencies [87e56af2]
- Updated dependencies [3d1c42e0]
- Updated dependencies [8f374326]
- Updated dependencies [f6b22bbc]
- Updated dependencies [a24deaf0]
- Updated dependencies [acba0f3a]
- Updated dependencies [dc8f01be]
- Updated dependencies [106222df]
- Updated dependencies [90f381dc]
- Updated dependencies [a2af0bea]
- Updated dependencies [2523e5f1]
- Updated dependencies [106222df]
- Updated dependencies [5705a7eb]
  - @evidence-dev/core-components@4.4.0
  - @evidence-dev/preprocess@5.1.2
  - @evidence-dev/component-utilities@3.2.0
  - @evidence-dev/sdk@1.3.0
  - @evidence-dev/plugin-connector@2.1.4

## 36.0.0

### Patch Changes

- Updated dependencies [064a5c96]
- Updated dependencies [737642a0]
- Updated dependencies [54546362]
- Updated dependencies [9dd69149]
- Updated dependencies [f8f7ebdb]
- Updated dependencies [ac0df6ca]
  - @evidence-dev/core-components@4.3.0
  - @evidence-dev/component-utilities@3.1.0
  - @evidence-dev/plugin-connector@2.1.4

## 36.0.0-features-b.6

### Patch Changes

- Updated dependencies [a24deaf04]
  - @evidence-dev/core-components@4.3.0-features-b.6

## 36.0.0-features-b.5

### Patch Changes

- Updated dependencies [e058d2d35]
  - @evidence-dev/core-components@4.3.0-features-b.5

## 36.0.0-features-b.4

### Patch Changes

- Updated dependencies [9fdc805b5]
  - @evidence-dev/core-components@4.3.0-features-b.4

## 36.0.0-features-b.3

### Patch Changes

- Updated dependencies [90f381dc1]
- Updated dependencies [a2af0beaf]
  - @evidence-dev/core-components@4.3.0-features-b.3

## 36.0.0-features-b.2

### Patch Changes

- Updated dependencies [73fc7ebfe]
  - @evidence-dev/core-components@4.3.0-features-b.2

## 36.0.0-features-b.1

### Patch Changes

- Updated dependencies [064a5c96e]
- Updated dependencies [9dd691497]
- Updated dependencies [f8f7ebdbc]
  - @evidence-dev/core-components@4.3.0-features-b.1

## 35.0.1-features-b.0

### Patch Changes

- Updated dependencies [97cb3a7c3]
- Updated dependencies [f6b22bbce]
- Updated dependencies [acba0f3a6]
- Updated dependencies [dc8f01be2]
- Updated dependencies [106222df8]
- Updated dependencies [106222df8]
  - @evidence-dev/core-components@4.2.1-features-b.0
  - @evidence-dev/component-utilities@3.0.5-features-b.0
  - @evidence-dev/sdk@1.2.3-features-b.0
  - @evidence-dev/plugin-connector@2.1.4

## 35.0.0

### Patch Changes

- Updated dependencies [2a396873]
- Updated dependencies [af9b74ee]
- Updated dependencies [1377e0ed]
- Updated dependencies [40c83ee2]
- Updated dependencies [4e3b925e]
- Updated dependencies [6157db9a]
  - @evidence-dev/core-components@4.2.0
  - @evidence-dev/telemetry@2.1.0
  - @evidence-dev/sdk@1.2.2
  - @evidence-dev/db-orchestrator@3.1.1
  - @evidence-dev/plugin-connector@2.1.4
  - @evidence-dev/component-utilities@3.0.4

## 34.0.1

### Patch Changes

- Updated dependencies [25ea0fe4]
- Updated dependencies [c88cb063]
- Updated dependencies [b3e10dac]
- Updated dependencies [a6414446]
- Updated dependencies [e400971e]
- Updated dependencies [43d66875]
- Updated dependencies [52b3fde1]
- Updated dependencies [e400971e]
  - @evidence-dev/sdk@1.2.1
  - @evidence-dev/preprocess@5.1.1
  - @evidence-dev/core-components@4.1.1
  - @evidence-dev/component-utilities@3.0.3
  - @evidence-dev/plugin-connector@2.1.3

## 34.0.0

### Minor Changes

- 84496e62: enable SPA mode

### Patch Changes

- 7f85e600: version bumps
- Updated dependencies [9e0f10cc]
- Updated dependencies [3f6975af]
- Updated dependencies [1e1486f3]
- Updated dependencies [f4d9b336]
- Updated dependencies [3f53e809]
- Updated dependencies [1e1486f3]
- Updated dependencies [1e1486f3]
- Updated dependencies [1e1486f3]
- Updated dependencies [85d01792]
- Updated dependencies [53f7bd14]
- Updated dependencies [abae3ed9]
- Updated dependencies [30c942b1]
- Updated dependencies [276718dd]
- Updated dependencies [cafc814b]
- Updated dependencies [51dd57fb]
- Updated dependencies [b0539005]
- Updated dependencies [564f3444]
- Updated dependencies [71dabb41]
- Updated dependencies [9e8f8b1a]
- Updated dependencies [7f85e600]
- Updated dependencies [dd0dbc16]
- Updated dependencies [84496e62]
  - @evidence-dev/core-components@4.1.0
  - @evidence-dev/component-utilities@3.0.2
  - @evidence-dev/preprocess@5.1.0
  - @evidence-dev/sdk@1.2.0
  - @evidence-dev/query-store@2.1.4
  - @evidence-dev/plugin-connector@2.1.3
  - @evidence-dev/db-orchestrator@3.1.0

## 33.0.2

### Patch Changes

- Updated dependencies [41a9f1b5]
- Updated dependencies [0a67d65e]
- Updated dependencies [63908810]
- Updated dependencies [09b999d5]
  - @evidence-dev/core-components@4.0.2

## 33.0.1

### Patch Changes

- Updated dependencies [d60fdad7]
- Updated dependencies [cb6db1a1]
  - @evidence-dev/preprocess@5.0.0
  - @evidence-dev/sdk@1.1.1
  - @evidence-dev/core-components@4.0.1
  - @evidence-dev/component-utilities@3.0.1
  - @evidence-dev/plugin-connector@2.1.2

## 33.0.0

### Major Changes

- 64a54b56: Use the new Query from the SDK package

### Patch Changes

- Updated dependencies [2a7f0fc2]
- Updated dependencies [a27de58e]
- Updated dependencies [64a54b56]
- Updated dependencies [7620a1af]
- Updated dependencies [6f72d476]
- Updated dependencies [d2e44015]
- Updated dependencies [a95db3d3]
- Updated dependencies [dc073f6e]
- Updated dependencies [d23b166c]
  - @evidence-dev/core-components@4.0.0
  - @evidence-dev/component-utilities@3.0.0
  - @evidence-dev/universal-sql@2.1.2
  - @evidence-dev/plugin-connector@2.1.2
  - @evidence-dev/sdk@1.1.0
  - @evidence-dev/query-store@2.1.3
  - @evidence-dev/db-orchestrator@3.0.14

## 32.0.1

### Patch Changes

- 1cf4025a: cleaned up logging
  - @evidence-dev/db-orchestrator@3.0.13

## 32.0.0

### Patch Changes

- Updated dependencies [9bac016c]
- Updated dependencies [5e0bbf31]
- Updated dependencies [e1e9a068]
- Updated dependencies [629f93a0]
- Updated dependencies [505f121b]
- Updated dependencies [5098c3ee]
  - @evidence-dev/core-components@3.8.0
  - @evidence-dev/universal-sql@2.1.1
  - @evidence-dev/preprocess@4.1.2
  - @evidence-dev/component-utilities@2.5.3
  - @evidence-dev/db-orchestrator@3.0.12
  - @evidence-dev/plugin-connector@2.1.1
  - @evidence-dev/query-store@2.1.2

## 31.0.3

### Patch Changes

- Updated dependencies [fab378cb]
  - @evidence-dev/core-components@3.7.3

## 31.0.2

### Patch Changes

- 996f4280: Adds a loading screen when in dev mode
- c449ac45: Fix scrollbar appearing during Windows print
- Updated dependencies [be3085ce]
- Updated dependencies [32af67c5]
- Updated dependencies [94156598]
- Updated dependencies [75f30e70]
- Updated dependencies [3a91fdc1]
  - @evidence-dev/core-components@3.7.2
  - @evidence-dev/preprocess@4.1.1
  - @evidence-dev/query-store@2.1.1
  - @evidence-dev/component-utilities@2.5.2
  - @evidence-dev/plugin-connector@2.1.0

## 31.0.1

### Patch Changes

- Updated dependencies [8b636a62]
- Updated dependencies [24cec2ec]
  - @evidence-dev/core-components@3.7.1

## 31.0.0

### Patch Changes

- Updated dependencies [58880cc9]
- Updated dependencies [4f918c71]
- Updated dependencies [d3847df4]
- Updated dependencies [aa5708f0]
- Updated dependencies [d97d75e6]
- Updated dependencies [8efccce0]
- Updated dependencies [dbf8db42]
  - @evidence-dev/core-components@3.7.0
  - @evidence-dev/component-utilities@2.5.1
  - @evidence-dev/plugin-connector@2.1.0

## 30.0.1

### Patch Changes

- Updated dependencies [73421976]
  - @evidence-dev/core-components@3.6.1

## 30.0.0

### Minor Changes

- ca3e593b: - Updated major dependencies (Svelte, SvelteKit, Vite) to improve memory usage when building

### Patch Changes

- 2a7bc23f: Reduces the amount of data returned in the pages manifest
- Updated dependencies [a9cf5c1a]
- Updated dependencies [cb669665]
- Updated dependencies [5b12c2a9]
- Updated dependencies [f9fe4d89]
- Updated dependencies [6b475bf6]
- Updated dependencies [ca3e593b]
- Updated dependencies [029c9f32]
- Updated dependencies [76be235f]
- Updated dependencies [705a1a9f]
- Updated dependencies [089a08e4]
- Updated dependencies [e3cf9809]
- Updated dependencies [67b14c20]
  - @evidence-dev/core-components@3.6.0
  - @evidence-dev/component-utilities@2.5.0
  - @evidence-dev/plugin-connector@2.1.0
  - @evidence-dev/preprocess@4.1.0
  - @evidence-dev/query-store@2.1.0
  - @evidence-dev/tailwind@2.1.0
  - @evidence-dev/universal-sql@2.1.0

## 29.0.3

### Patch Changes

- dcbc0580: Maxwidth option to layout, bug fixes
- Updated dependencies [b50ec639]
- Updated dependencies [9a9ace8f]
- Updated dependencies [dcbc0580]
  - @evidence-dev/core-components@3.5.2
  - @evidence-dev/query-store@2.0.6
  - @evidence-dev/component-utilities@2.4.2
  - @evidence-dev/plugin-connector@2.0.10

## 29.0.2

### Patch Changes

- 07ec253a: Bump svelte dep

## 29.0.1

### Patch Changes

- 5a1e46a5: Fix for svelte vite errors
- 008cf432: Roll back proxy server
- 69b9ed32: Fix file imports for evidence package
- Updated dependencies [5a1e46a5]
- Updated dependencies [008cf432]
- Updated dependencies [69b9ed32]
  - @evidence-dev/component-utilities@2.4.1
  - @evidence-dev/core-components@3.5.1
  - @evidence-dev/plugin-connector@2.0.10
  - @evidence-dev/preprocess@4.0.3
  - @evidence-dev/query-store@2.0.5
  - @evidence-dev/universal-sql@2.0.5

## 29.0.0

### Patch Changes

- 28a971e6: Add server start feedback in console and browser
- 7e550a1d: Refactor the default layout into a single component, add a set of layout options
- bdad802b: Add dev mode flag to telemetry
- 4713bd3a: - Load environment variables from .env files (prefixed with EVIDENCE\_ only)
  - Add env-debug command to show which environment variables Evidence is currently aware of
- 64871070: Adjust Svelte and Vite configs
- Updated dependencies [1ff76fdf]
- Updated dependencies [023cd946]
- Updated dependencies [15a6eeab]
- Updated dependencies [31903452]
- Updated dependencies [33e46d1c]
- Updated dependencies [2d0c00b9]
- Updated dependencies [7e550a1d]
- Updated dependencies [0042519f]
- Updated dependencies [152b7224]
- Updated dependencies [1ff76fdf]
- Updated dependencies [72f9833a]
- Updated dependencies [57f71211]
- Updated dependencies [57c81240]
  - @evidence-dev/component-utilities@2.4.0
  - @evidence-dev/core-components@3.5.0
  - @evidence-dev/preprocess@4.0.2
  - @evidence-dev/query-store@2.0.4
  - @evidence-dev/universal-sql@2.0.4
  - @evidence-dev/plugin-connector@2.0.9

## 28.0.2

### Patch Changes

- Updated dependencies [403f492c]
- Updated dependencies [f3efd049]
  - @evidence-dev/core-components@3.4.2

## 28.0.1

### Patch Changes

- 1e665bf2: Replace sparkline component
- Updated dependencies [6c37b473]
- Updated dependencies [37cbbc43]
- Updated dependencies [1e665bf2]
- Updated dependencies [858ea06f]
- Updated dependencies [5c492a00]
  - @evidence-dev/core-components@3.4.1
  - @evidence-dev/db-orchestrator@3.0.11

## 28.0.0

### Patch Changes

- e79974f3: add telemetry to cli
- Updated dependencies [bc3b2807]
- Updated dependencies [eb21097b]
- Updated dependencies [5ea44a86]
- Updated dependencies [168f657a]
- Updated dependencies [e09c5716]
- Updated dependencies [6ec752a7]
- Updated dependencies [4352150c]
- Updated dependencies [b864b3cd]
- Updated dependencies [e79974f3]
- Updated dependencies [b4ffed1e]
  - @evidence-dev/core-components@3.4.0
  - @evidence-dev/component-utilities@2.3.0
  - @evidence-dev/telemetry@2.0.4
  - @evidence-dev/plugin-connector@2.0.8
  - @evidence-dev/db-orchestrator@3.0.10

## 27.0.1

### Patch Changes

- Updated dependencies [6a61ea17]
  - @evidence-dev/component-utilities@2.2.1
  - @evidence-dev/core-components@3.3.1
  - @evidence-dev/plugin-connector@2.0.7

## 27.0.0

### Patch Changes

- Updated dependencies [9176c2cc]
- Updated dependencies [3e1da500]
- Updated dependencies [0f42e927]
- Updated dependencies [cbc7e8a4]
- Updated dependencies [f4ccf03c]
  - @evidence-dev/component-utilities@2.2.0
  - @evidence-dev/core-components@3.3.0
  - @evidence-dev/universal-sql@2.0.3
  - @evidence-dev/plugin-connector@2.0.7
  - @evidence-dev/db-orchestrator@3.0.9
  - @evidence-dev/query-store@2.0.3

## 26.0.0

### Patch Changes

- 05f2155e: Enabled dependabot to create automatic PRs
- 415653a7: Adds a preview command to allow previews of built outputs
- Updated dependencies [3e3b3940]
- Updated dependencies [f7903b86]
- Updated dependencies [cd9c80b2]
- Updated dependencies [3427433c]
- Updated dependencies [31381835]
- Updated dependencies [fa0faf8c]
- Updated dependencies [a6de89de]
- Updated dependencies [2181ed9c]
- Updated dependencies [ca1e46cf]
- Updated dependencies [9978899e]
- Updated dependencies [f45a3a91]
- Updated dependencies [6d3021e2]
- Updated dependencies [c25fc1ac]
- Updated dependencies [39390112]
- Updated dependencies [f501513a]
- Updated dependencies [e4e7d822]
  - @evidence-dev/core-components@3.2.0
  - @evidence-dev/component-utilities@2.1.0
  - @evidence-dev/plugin-connector@2.0.6
  - @evidence-dev/universal-sql@2.0.2
  - @evidence-dev/db-orchestrator@3.0.8
  - @evidence-dev/query-store@2.0.2

## 25.0.0

### Patch Changes

- Updated dependencies [1ef5544d]
  - @evidence-dev/core-components@3.1.0
  - @evidence-dev/db-orchestrator@3.0.7

## 24.0.9

### Patch Changes

- @evidence-dev/db-orchestrator@3.0.6

## 24.0.8

### Patch Changes

- Updated dependencies [5a9edf0c]
- Updated dependencies [1027087a]
- Updated dependencies [e3a88847]
- Updated dependencies [97e7123d]
- Updated dependencies [2082578e]
  - @evidence-dev/core-components@3.0.5
  - @evidence-dev/telemetry@2.0.3
  - @evidence-dev/plugin-connector@2.0.5
  - @evidence-dev/preprocess@4.0.1
  - @evidence-dev/db-orchestrator@3.0.5

## 24.0.7

### Patch Changes

- Updated dependencies [92f4ad61]
- Updated dependencies [00145c4c]
- Updated dependencies [03b3b626]
- Updated dependencies [7b2b8a00]
  - @evidence-dev/telemetry@2.0.2
  - @evidence-dev/core-components@3.0.4
  - @evidence-dev/component-utilities@2.0.2
  - @evidence-dev/db-orchestrator@3.0.4
  - @evidence-dev/plugin-connector@2.0.4

## 24.0.6

### Patch Changes

- Updated dependencies [c09bd981]
  - @evidence-dev/db-orchestrator@3.0.3
  - @evidence-dev/plugin-connector@2.0.3
  - @evidence-dev/telemetry@2.0.1
  - @evidence-dev/core-components@3.0.3

## 24.0.5

### Patch Changes

- Updated dependencies [913f5919]
- Updated dependencies [913f5919]
  - @evidence-dev/universal-sql@2.0.1
  - @evidence-dev/component-utilities@2.0.1
  - @evidence-dev/plugin-connector@2.0.2
  - @evidence-dev/query-store@2.0.1
  - @evidence-dev/core-components@3.0.3

## 24.0.4

### Patch Changes

- Updated dependencies
  - @evidence-dev/core-components@3.0.2

## 24.0.3

### Patch Changes

- Updated dependencies
  - @evidence-dev/core-components@3.0.1

## 24.0.2

### Patch Changes

- @evidence-dev/db-orchestrator@3.0.2
- @evidence-dev/plugin-connector@2.0.1
- @evidence-dev/core-components@3.0.0

## 24.0.1

### Patch Changes

- @evidence-dev/db-orchestrator@3.0.1

## 24.0.0

### Major Changes

- cb0fc468: This update includes major changes to the way Evidence interacts with data.
  Instead of running queries against the production database, and including it
  with the project as pre-rendered, static JSON data; those queries are now stored as .parquet files.

  .parquet enables the use of DuckDB on the client, allowing for much greater levels of interactivity
  on pages, and interoperability between different data sources (e.g. joins across postgres & mysql).

- e1facffd: Add QueryStore concept

  - Loads data as it is requested, rather than all at page-load / build
  - Uses duckdb to get data length / column data
  - Ties metadata, mutation queries, and data together to make component development easier
  - Provides information regarding loading (and query errors in the future)

### Minor Changes

- cfb0f248: Respect component plugin's tailwind configuration
- 87aaf1c3: removed explore pages from built site
- f62bd26e: prerenders clientside duckdb queries in their initial state to allow for some form of prerendering
- 52d81ce2: fix parameterized page prerendering

### Patch Changes

- 4293e084: Clean up console logs
- dd11468b: Add --debug to build and build:strict
- 2588049c: Add tailwind as peer dep
- 3d28ff33: Site no longer dies completely when manifest does not exist; allowing settings setup
- 9132146b: fix vite hard refreshes, fix dropdown flickering on ssr, fix null columns
- c9892e20: Fix publish issue
- fca7a313: Fix schema explorer
- 0940b996: remove dummy page sql string collection
- 20aad351: Add universal-sql to excluded deps in vite configuration
- 0ba78b67: polish working with sources
- e1174aa1: added profile function to note load and query times
- 26ad2d2c: cli now has a --debug option on development commands for more-verbose logging
- b5592a3f: Usability Improvements
- 130950d7: revamp toast notifications
- b6683ba0: Deploy screen now shows environment variables for USQL
- 9b1ac9b7: removed evidencemeta on the data object
- 0a60b724: Remove reduntant QueryStatus notifications
- 20722eab: build:sources is now sources
  build:sources outputs a deprecation notice to prevent immediate breakage of existing projects
- 73cfef71: Removed legacy database settings UI
- bf4a112a: Update package.json to use new datasource field
- 17a82581: standardize date objects in `standardizeDateString`
- 3d28ff33: Added system path debug logs to sources
- ca7337ba: fix prerendering for all pages
- 1ed3fe07: Handle missing manifest more effectively
- cd57ba69: Add new interface for datasources for fine-grained control of output
- cb307da8: fix: 2nd param for query is optional
- efa96920: External SQL files now live in queries rather than sources
- 5be92c14: fix spelling mistake
- cad09993: improve source refresh experience
- 30304782: - Fix DuckDB vomiting when there is no manifest
  - Prevent stack traces from appearing in devmode when debug is not enabled
- 5bda8d53: Remove faulty error handling
- 78a8be8b: Schema Explorer now pulls columns by table AND schema, not just table
- ef2a9106: Sources are now segmented into schemas to prevent source name conflicts
- 6bf5003a: add bypass to SSR'd inputs bug
- 75fa47a3: styling for dropdown
- 4b6262d8: added `build:sources` filtration options to cli
- c29d827d: Add a query console page; improve usability of schema explorer
- 20127231: Bump all versions so version pinning works
- e9a63c71: Add loading states to DataTable and Chart
- 9b1ac9b7: make everything use a single connection
- 071da2b5: Add EVIDENCE_DISABLE_INCLUDE environment variable to prevent inclusion of evidence deps
- c8968ea3: Settings UI now creates a connector when testing, if it doesn't already exist. It also won't lock up in more cases
- e8b897e0: Prevent input store from masquarading as a QueryStore
- 29c149d6: added stricter types to db adapters
- Updated dependencies [689d9e2e]
- Updated dependencies [4ac6a688]
- Updated dependencies [5d280997]
- Updated dependencies [26ad2d2c]
- Updated dependencies [391282e5]
- Updated dependencies [5be92c14]
- Updated dependencies [0e3eec13]
- Updated dependencies [59938e50]
- Updated dependencies [aa34d0b3]
- Updated dependencies [f304fc1e]
- Updated dependencies [e23691d0]
- Updated dependencies [e6f550f3]
- Updated dependencies [b7d02a29]
- Updated dependencies [840d1195]
- Updated dependencies [b25a95d7]
- Updated dependencies [6064fbbf]
- Updated dependencies [4293e084]
- Updated dependencies [5247996b]
- Updated dependencies [fd74bd3c]
- Updated dependencies [6b7a132d]
- Updated dependencies [da6ba2eb]
- Updated dependencies [77d09b54]
- Updated dependencies [26ad2d2c]
- Updated dependencies [91034294]
- Updated dependencies [b3bdd91a]
- Updated dependencies [5e54e13e]
- Updated dependencies [71f0d481]
- Updated dependencies [0e3eec13]
- Updated dependencies [a192deb2]
- Updated dependencies [377abb4a]
- Updated dependencies [e134351d]
- Updated dependencies [e6b67b66]
- Updated dependencies [af4a8a1e]
- Updated dependencies [9132146b]
- Updated dependencies [239a18d7]
- Updated dependencies [d79a3014]
- Updated dependencies [7c4249c0]
- Updated dependencies [0ba78b67]
- Updated dependencies [e1174aa1]
- Updated dependencies [6eb93816]
- Updated dependencies [2aaef5fb]
- Updated dependencies [1235f278]
- Updated dependencies [9603c4e7]
- Updated dependencies [cb74406a]
- Updated dependencies [7c44653b]
- Updated dependencies [b5592a3f]
- Updated dependencies [9bd1cd29]
- Updated dependencies [130950d7]
- Updated dependencies [1dcb5afe]
- Updated dependencies [b6683ba0]
- Updated dependencies [b4de6d55]
- Updated dependencies [4d5735a2]
- Updated dependencies [d1265559]
- Updated dependencies [cfb0f248]
- Updated dependencies [9b1ac9b7]
- Updated dependencies [120d22e9]
- Updated dependencies [0a60b724]
- Updated dependencies [cb0fc468]
- Updated dependencies [77d09b54]
- Updated dependencies [be6cd88a]
- Updated dependencies [e49793e4]
- Updated dependencies [bf4a112a]
- Updated dependencies [17a82581]
- Updated dependencies [e7781efd]
- Updated dependencies [cff22ece]
- Updated dependencies [7c8a9f9d]
- Updated dependencies [ef3a66dc]
- Updated dependencies [ef4155ee]
- Updated dependencies [e1facffd]
- Updated dependencies [3708374d]
- Updated dependencies [69126c94]
- Updated dependencies [f38b8920]
- Updated dependencies [df9737fc]
- Updated dependencies [489a6069]
- Updated dependencies [4e288bc6]
- Updated dependencies [741885bf]
- Updated dependencies [88e1a5ee]
- Updated dependencies [e2162851]
- Updated dependencies [d7477a44]
- Updated dependencies [5928e45d]
- Updated dependencies [2d85508a]
- Updated dependencies [ca7337ba]
- Updated dependencies [5828c375]
- Updated dependencies [aea3be1a]
- Updated dependencies [bb8451c2]
- Updated dependencies [1ed3fe07]
- Updated dependencies [8f5d4ba8]
- Updated dependencies [cd57ba69]
- Updated dependencies [9da3812e]
- Updated dependencies [bbcd070e]
- Updated dependencies [64ab3074]
- Updated dependencies [17a2d5ee]
- Updated dependencies [0e3eec13]
- Updated dependencies [c4822852]
- Updated dependencies [8ffbb361]
- Updated dependencies [f5b06ca4]
- Updated dependencies [078fca3b]
- Updated dependencies [52e114cc]
- Updated dependencies [9e7ba37d]
- Updated dependencies [6fdfec28]
- Updated dependencies [e173ca9d]
- Updated dependencies [1097e5a9]
- Updated dependencies [efa96920]
- Updated dependencies [fe466b13]
- Updated dependencies [4d5735a2]
- Updated dependencies [ca1f90b3]
- Updated dependencies [f764cba4]
- Updated dependencies [6fbde887]
- Updated dependencies [afbb50fc]
- Updated dependencies [cad09993]
- Updated dependencies [60619a90]
- Updated dependencies [4a75c077]
- Updated dependencies [a20cd1e0]
- Updated dependencies [26ad2d2c]
- Updated dependencies [ca4c3b00]
- Updated dependencies [982a17c6]
- Updated dependencies [583cea9e]
- Updated dependencies [fe489a67]
- Updated dependencies [16a17086]
- Updated dependencies [15248699]
- Updated dependencies [3fb2ead5]
- Updated dependencies [e70a6a3e]
- Updated dependencies [ef2a9106]
- Updated dependencies [6bf5003a]
- Updated dependencies [130950d7]
- Updated dependencies [4053c976]
- Updated dependencies [043a302a]
- Updated dependencies [26ad2d2c]
- Updated dependencies [1c478a62]
- Updated dependencies [df9737fc]
- Updated dependencies [7d298d28]
- Updated dependencies [f62bd26e]
- Updated dependencies [75fa47a3]
- Updated dependencies [52d81ce2]
- Updated dependencies [90e152cb]
- Updated dependencies [f051417f]
- Updated dependencies [64921385]
- Updated dependencies [6505351f]
- Updated dependencies [4b6262d8]
- Updated dependencies [b1427173]
- Updated dependencies [e6091323]
- Updated dependencies [7a05f941]
- Updated dependencies [16a17086]
- Updated dependencies [2d2f774e]
- Updated dependencies [dbc69a59]
- Updated dependencies [d1ab5e62]
- Updated dependencies [4c6eae53]
- Updated dependencies [20127231]
- Updated dependencies [78a8be8b]
- Updated dependencies [e9a63c71]
- Updated dependencies [64d1405b]
- Updated dependencies [9b1ac9b7]
- Updated dependencies [20d2a785]
- Updated dependencies [0e3eec13]
- Updated dependencies [df7a8c5a]
- Updated dependencies [7a5225be]
- Updated dependencies [c8968ea3]
- Updated dependencies [120d22e9]
- Updated dependencies [ba0d6f50]
- Updated dependencies [0e3eec13]
- Updated dependencies [2371c8f1]
  - @evidence-dev/core-components@2.0.0
  - @evidence-dev/component-utilities@2.0.0
  - @evidence-dev/plugin-connector@2.0.0
  - @evidence-dev/preprocess@4.0.0
  - @evidence-dev/query-store@2.0.0
  - @evidence-dev/universal-sql@2.0.0
  - @evidence-dev/db-orchestrator@3.0.0
  - @evidence-dev/tailwind@1.0.0
  - @evidence-dev/telemetry@1.0.7

## 20.0.0-usql.73

### Patch Changes

- Updated dependencies [6fbde887]
  - @evidence-dev/plugin-connector@2.0.0-usql.43
  - @evidence-dev/db-orchestrator@3.0.0-usql.18
  - @evidence-dev/core-components@2.0.0-usql.46

## 20.0.0-usql.72

### Patch Changes

- 5bda8d53: Remove faulty error handling
- Updated dependencies [a20cd1e0]
  - @evidence-dev/plugin-connector@2.0.0-usql.42
  - @evidence-dev/db-orchestrator@3.0.0-usql.17
  - @evidence-dev/core-components@2.0.0-usql.46

## 20.0.0-usql.71

### Patch Changes

- dd11468b: Add --debug to build and build:strict
- Updated dependencies [d79a3014]
- Updated dependencies [f38b8920]
- Updated dependencies [f5b06ca4]
- Updated dependencies [2d2f774e]
  - @evidence-dev/core-components@2.0.0-usql.46
  - @evidence-dev/query-store@2.0.0-usql.24
  - @evidence-dev/component-utilities@2.0.0-usql.32
  - @evidence-dev/plugin-connector@2.0.0-usql.41

## 20.0.0-usql.70

### Patch Changes

- 0940b996: remove dummy page sql string collection
- Updated dependencies [741885bf]
- Updated dependencies [bb8451c2]
- Updated dependencies [7d298d28]
  - @evidence-dev/core-components@2.0.0-usql.45
  - @evidence-dev/plugin-connector@2.0.0-usql.41
  - @evidence-dev/preprocess@4.0.0-usql.29

## 20.0.0-usql.69

### Patch Changes

- Updated dependencies [2d85508a]
  - @evidence-dev/plugin-connector@2.0.0-usql.40
  - @evidence-dev/core-components@2.0.0-usql.44

## 20.0.0-usql.68

### Patch Changes

- 30304782: - Fix DuckDB vomiting when there is no manifest
  - Prevent stack traces from appearing in devmode when debug is not enabled
- Updated dependencies [1dcb5afe]
- Updated dependencies [e173ca9d]
- Updated dependencies [043a302a]
- Updated dependencies [7a05f941]
  - @evidence-dev/preprocess@4.0.0-usql.28
  - @evidence-dev/universal-sql@2.0.0-usql.25
  - @evidence-dev/core-components@2.0.0-usql.44
  - @evidence-dev/query-store@2.0.0-usql.23
  - @evidence-dev/plugin-connector@2.0.0-usql.39
  - @evidence-dev/component-utilities@2.0.0-usql.31

## 20.0.0-usql.67

### Patch Changes

- Updated dependencies [489a6069]
- Updated dependencies [20d2a785]
  - @evidence-dev/component-utilities@2.0.0-usql.30
  - @evidence-dev/preprocess@4.0.0-usql.27
  - @evidence-dev/core-components@2.0.0-usql.43
  - @evidence-dev/plugin-connector@2.0.0-usql.38

## 20.0.0-usql.66

### Patch Changes

- Updated dependencies [d1265559]
- Updated dependencies [be6cd88a]
- Updated dependencies [9da3812e]
  - @evidence-dev/core-components@2.0.0-usql.42
  - @evidence-dev/plugin-connector@2.0.0-usql.38

## 20.0.0-usql.65

### Patch Changes

- 071da2b5: Add EVIDENCE_DISABLE_INCLUDE environment variable to prevent inclusion of evidence deps
- Updated dependencies [1235f278]
- Updated dependencies [d7477a44]
- Updated dependencies [15248699]
- Updated dependencies [1c478a62]
  - @evidence-dev/core-components@2.0.0-usql.41
  - @evidence-dev/universal-sql@2.0.0-usql.24
  - @evidence-dev/plugin-connector@2.0.0-usql.37
  - @evidence-dev/query-store@2.0.0-usql.22
  - @evidence-dev/component-utilities@2.0.0-usql.29

## 20.0.0-usql.64

### Patch Changes

- Updated dependencies [af4a8a1e]
  - @evidence-dev/plugin-connector@2.0.0-usql.36
  - @evidence-dev/db-orchestrator@3.0.0-usql.16
  - @evidence-dev/core-components@2.0.0-usql.40

## 20.0.0-usql.63

### Patch Changes

- Updated dependencies [9603c4e7]
  - @evidence-dev/universal-sql@2.0.0-usql.23
  - @evidence-dev/plugin-connector@2.0.0-usql.35
  - @evidence-dev/query-store@2.0.0-usql.21
  - @evidence-dev/core-components@2.0.0-usql.40
  - @evidence-dev/component-utilities@2.0.0-usql.28

## 20.0.0-usql.62

### Patch Changes

- Updated dependencies [3708374d]
  - @evidence-dev/core-components@2.0.0-usql.39

## 20.0.0-usql.61

### Patch Changes

- Updated dependencies
  - @evidence-dev/query-store@2.0.0-usql.20
  - @evidence-dev/component-utilities@2.0.0-usql.27
  - @evidence-dev/core-components@2.0.0-usql.38

## 20.0.0-usql.60

### Patch Changes

- Updated dependencies [e2162851]
  - @evidence-dev/query-store@2.0.0-usql.19
  - @evidence-dev/component-utilities@2.0.0-usql.26
  - @evidence-dev/core-components@2.0.0-usql.37

## 20.0.0-usql.59

### Patch Changes

- Updated dependencies [689d9e2e]
- Updated dependencies [391282e5]
  - @evidence-dev/core-components@2.0.0-usql.36
  - @evidence-dev/component-utilities@2.0.0-usql.25
  - @evidence-dev/preprocess@4.0.0-usql.26
  - @evidence-dev/query-store@2.0.0-usql.18

## 20.0.0-usql.58

### Patch Changes

- Updated dependencies [df9737fc]
- Updated dependencies [df9737fc]
  - @evidence-dev/core-components@2.0.0-usql.35

## 20.0.0-usql.57

### Patch Changes

- Updated dependencies
  - @evidence-dev/core-components@2.0.0-usql.34

## 20.0.0-usql.56

### Patch Changes

- Updated dependencies
  - @evidence-dev/query-store@2.0.0-usql.17
  - @evidence-dev/component-utilities@2.0.0-usql.24
  - @evidence-dev/core-components@2.0.0-usql.33

## 20.0.0-usql.55

### Patch Changes

- Updated dependencies [16a17086]
- Updated dependencies [16a17086]
  - @evidence-dev/core-components@2.0.0-usql.32
  - @evidence-dev/query-store@2.0.0-usql.16
  - @evidence-dev/component-utilities@2.0.0-usql.23

## 20.0.0-usql.54

### Patch Changes

- Updated dependencies [f304fc1e]
- Updated dependencies [fe489a67]
  - @evidence-dev/core-components@2.0.0-usql.31
  - @evidence-dev/preprocess@4.0.0-usql.25

## 20.0.0-usql.53

### Patch Changes

- Updated dependencies [60619a90]
  - @evidence-dev/plugin-connector@2.0.0-usql.34
  - @evidence-dev/core-components@2.0.0-usql.30

## 20.0.0-usql.52

### Patch Changes

- 3d28ff33: Site no longer dies completely when manifest does not exist; allowing settings setup
- 3d28ff33: Added system path debug logs to sources
- 1ed3fe07: Handle missing manifest more effectively
- Updated dependencies [1ed3fe07]
  - @evidence-dev/plugin-connector@2.0.0-usql.33
  - @evidence-dev/core-components@2.0.0-usql.30

## 20.0.0-usql.51

### Patch Changes

- 9132146b: fix vite hard refreshes, fix dropdown flickering on ssr, fix null columns
- Updated dependencies [9132146b]
- Updated dependencies [4e288bc6]
- Updated dependencies [4c6eae53]
- Updated dependencies [ba0d6f50]
  - @evidence-dev/component-utilities@2.0.0-usql.22
  - @evidence-dev/core-components@2.0.0-usql.30
  - @evidence-dev/universal-sql@2.0.0-usql.22
  - @evidence-dev/preprocess@4.0.0-usql.24
  - @evidence-dev/query-store@2.0.0-usql.15
  - @evidence-dev/plugin-connector@2.0.0-usql.32

## 20.0.0-usql.50

### Patch Changes

- 75fa47a3: styling for dropdown
- e8b897e0: Prevent input store from masquarading as a QueryStore
- Updated dependencies [75fa47a3]
  - @evidence-dev/core-components@2.0.0-usql.29

## 20.0.0-usql.49

### Patch Changes

- Updated dependencies [5d280997]
- Updated dependencies [7a5225be]
  - @evidence-dev/component-utilities@2.0.0-usql.21
  - @evidence-dev/core-components@2.0.0-usql.28
  - @evidence-dev/query-store@2.0.0-usql.14
  - @evidence-dev/db-orchestrator@3.0.0-usql.15
  - @evidence-dev/plugin-connector@2.0.0-usql.31

## 20.0.0-usql.48

### Patch Changes

- Updated dependencies [71f0d481]
- Updated dependencies [ef4155ee]
- Updated dependencies [583cea9e]
- Updated dependencies [e70a6a3e]
  - @evidence-dev/component-utilities@2.0.0-usql.20
  - @evidence-dev/core-components@2.0.0-usql.27
  - @evidence-dev/query-store@2.0.0-usql.13

## 20.0.0-usql.47

### Patch Changes

- Updated dependencies [64921385]
  - @evidence-dev/core-components@2.0.0-usql.26

## 20.0.0-usql.46

### Patch Changes

- 0a60b724: Remove reduntant QueryStatus notifications
- Updated dependencies [4ac6a688]
- Updated dependencies [91034294]
- Updated dependencies [0a60b724]
- Updated dependencies [aea3be1a]
- Updated dependencies [bbcd070e]
- Updated dependencies [17a2d5ee]
  - @evidence-dev/component-utilities@2.0.0-usql.19
  - @evidence-dev/core-components@2.0.0-usql.25
  - @evidence-dev/preprocess@4.0.0-usql.23

## 20.0.0-usql.45

### Patch Changes

- Updated dependencies [90e152cb]
  - @evidence-dev/preprocess@4.0.0-usql.22

## 20.0.0-usql.44

### Patch Changes

- Updated dependencies [2aaef5fb]
  - @evidence-dev/universal-sql@2.0.0-usql.21
  - @evidence-dev/plugin-connector@2.0.0-usql.30
  - @evidence-dev/query-store@2.0.0-usql.12
  - @evidence-dev/core-components@2.0.0-usql.24
  - @evidence-dev/component-utilities@2.0.0-usql.18

## 20.0.0-usql.43

### Patch Changes

- Updated dependencies [e23691d0]
- Updated dependencies [cb74406a]
- Updated dependencies [982a17c6]
- Updated dependencies [dbc69a59]
- Updated dependencies [d1ab5e62]
  - @evidence-dev/plugin-connector@2.0.0-usql.29
  - @evidence-dev/universal-sql@2.0.0-usql.20
  - @evidence-dev/component-utilities@2.0.0-usql.17
  - @evidence-dev/db-orchestrator@3.0.0-usql.14
  - @evidence-dev/core-components@2.0.0-usql.23
  - @evidence-dev/query-store@2.0.0-usql.11

## 20.0.0-usql.42

### Patch Changes

- Fix schema explorer

## 20.0.0-usql.41

### Patch Changes

- Update package.json to use new datasource field
- Updated dependencies
  - @evidence-dev/component-utilities@2.0.0-usql.16
  - @evidence-dev/core-components@2.0.0-usql.22
  - @evidence-dev/db-orchestrator@3.0.0-usql.13
  - @evidence-dev/plugin-connector@2.0.0-usql.28
  - @evidence-dev/preprocess@4.0.0-usql.21
  - @evidence-dev/query-store@2.0.0-usql.10
  - @evidence-dev/tailwind@1.0.0-usql.3
  - @evidence-dev/telemetry@1.0.7-usql.0
  - @evidence-dev/universal-sql@2.0.0-usql.19

## 20.0.0-usql.40

### Patch Changes

- 78a8be8b: Schema Explorer now pulls columns by table AND schema, not just table
- Updated dependencies [377abb4a]
- Updated dependencies [78a8be8b]
  - @evidence-dev/plugin-connector@2.0.0-usql.27
  - @evidence-dev/universal-sql@2.0.0-usql.18
  - @evidence-dev/core-components@2.0.0-usql.21
  - @evidence-dev/query-store@2.0.0-usql.9
  - @evidence-dev/component-utilities@2.0.0-usql.15

## 20.0.0-usql.39

### Patch Changes

- 26ad2d2c: cli now has a --debug option on development commands for more-verbose logging
- Updated dependencies [26ad2d2c]
- Updated dependencies [840d1195]
- Updated dependencies [6064fbbf]
- Updated dependencies [26ad2d2c]
- Updated dependencies [e49793e4]
- Updated dependencies [e7781efd]
- Updated dependencies [26ad2d2c]
- Updated dependencies [26ad2d2c]
- Updated dependencies [6505351f]
- Updated dependencies [2371c8f1]
  - @evidence-dev/plugin-connector@2.0.0-usql.26
  - @evidence-dev/core-components@2.0.0-usql.20
  - @evidence-dev/query-store@2.0.0-usql.8
  - @evidence-dev/universal-sql@2.0.0-usql.17
  - @evidence-dev/preprocess@4.0.0-usql.20
  - @evidence-dev/component-utilities@2.0.0-usql.14
  - @evidence-dev/db-orchestrator@3.0.0-usql.12

## 20.0.0-usql.38

### Patch Changes

- 20722eab: build:sources is now sources
  build:sources outputs a deprecation notice to prevent immediate breakage of existing projects
- 6bf5003a: add bypass to SSR'd inputs bug
- Updated dependencies [b7d02a29]
- Updated dependencies [e134351d]
- Updated dependencies [b4de6d55]
- Updated dependencies [4d5735a2]
- Updated dependencies [88e1a5ee]
- Updated dependencies [6fdfec28]
- Updated dependencies [4d5735a2]
- Updated dependencies [4a75c077]
- Updated dependencies [6bf5003a]
  - @evidence-dev/plugin-connector@2.0.0-usql.25
  - @evidence-dev/core-components@2.0.0-usql.19
  - @evidence-dev/component-utilities@2.0.0-usql.13
  - @evidence-dev/universal-sql@2.0.0-usql.16
  - @evidence-dev/preprocess@4.0.0-usql.19
  - @evidence-dev/query-store@2.0.0-usql.7

## 20.0.0-usql.37

### Patch Changes

- Updated dependencies [59938e50]
- Updated dependencies [b25a95d7]
- Updated dependencies [5247996b]
- Updated dependencies [6b7a132d]
- Updated dependencies [77d09b54]
- Updated dependencies [77d09b54]
- Updated dependencies [8f5d4ba8]
- Updated dependencies [fe466b13]
- Updated dependencies [b1427173]
  - @evidence-dev/core-components@2.0.0-usql.18
  - @evidence-dev/component-utilities@2.0.0-usql.12
  - @evidence-dev/preprocess@4.0.0-usql.18
  - @evidence-dev/universal-sql@2.0.0-usql.15
  - @evidence-dev/plugin-connector@2.0.0-usql.24
  - @evidence-dev/query-store@2.0.0-usql.6
  - @evidence-dev/db-orchestrator@3.0.0-usql.11

## 20.0.0-usql.36

### Patch Changes

- c8968ea3: Settings UI now creates a connector when testing, if it doesn't already exist. It also won't lock up in more cases
- Updated dependencies [0e3eec13]
- Updated dependencies [fd74bd3c]
- Updated dependencies [0e3eec13]
- Updated dependencies [6eb93816]
- Updated dependencies [7c44653b]
- Updated dependencies [0e3eec13]
- Updated dependencies [0e3eec13]
- Updated dependencies [c8968ea3]
- Updated dependencies [0e3eec13]
  - @evidence-dev/core-components@2.0.0-usql.17
  - @evidence-dev/plugin-connector@2.0.0-usql.23
  - @evidence-dev/universal-sql@2.0.0-usql.14
  - @evidence-dev/preprocess@4.0.0-usql.17
  - @evidence-dev/query-store@2.0.0-usql.5
  - @evidence-dev/component-utilities@2.0.0-usql.11
  - @evidence-dev/db-orchestrator@3.0.0-usql.10

## 20.0.0-usql.35

### Patch Changes

- b5592a3f: Usability Improvements
- Updated dependencies [da6ba2eb]
- Updated dependencies [b5592a3f]
  - @evidence-dev/plugin-connector@2.0.0-usql.22
  - @evidence-dev/core-components@2.0.0-usql.16
  - @evidence-dev/universal-sql@2.0.0-usql.13
  - @evidence-dev/query-store@2.0.0-usql.4

## 20.0.0-usql.34

### Patch Changes

- 0ba78b67: polish working with sources
- cd57ba69: Add new interface for datasources for fine-grained control of output
- Updated dependencies [0ba78b67]
- Updated dependencies [cd57ba69]
  - @evidence-dev/plugin-connector@2.0.0-usql.21
  - @evidence-dev/universal-sql@2.0.0-usql.12
  - @evidence-dev/core-components@2.0.0-usql.15
  - @evidence-dev/query-store@2.0.0-usql.3
  - @evidence-dev/db-orchestrator@3.0.0-usql.9

## 20.0.0-usql.33

### Patch Changes

- Updated dependencies
  - @evidence-dev/preprocess@4.0.0-usql.16

## 20.0.0-usql.32

### Patch Changes

- Updated dependencies [b3bdd91a]
  - @evidence-dev/preprocess@4.0.0-usql.15

## 20.0.0-usql.31

### Patch Changes

- cb307da8: fix: 2nd param for query is optional

## 20.0.0-usql.30

### Minor Changes

- 52d81ce2: fix parameterized page prerendering

### Patch Changes

- 130950d7: revamp toast notifications
- Updated dependencies [9bd1cd29]
- Updated dependencies [130950d7]
- Updated dependencies [1097e5a9]
- Updated dependencies [3fb2ead5]
- Updated dependencies [130950d7]
- Updated dependencies [52d81ce2]
  - @evidence-dev/query-store@2.0.0-usql.2
  - @evidence-dev/component-utilities@2.0.0-usql.10
  - @evidence-dev/core-components@2.0.0-usql.14
  - @evidence-dev/preprocess@4.0.0-usql.14
  - @evidence-dev/universal-sql@2.0.0-usql.11
  - @evidence-dev/plugin-connector@2.0.0-usql.20

## 20.0.0-usql.29

### Patch Changes

- Updated dependencies
  - @evidence-dev/plugin-connector@2.0.0-usql.19

## 20.0.0-usql.28

### Patch Changes

- Updated dependencies
  - @evidence-dev/plugin-connector@2.0.0-usql.18
  - @evidence-dev/universal-sql@2.0.0-usql.10
  - @evidence-dev/db-orchestrator@3.0.0-usql.8

## 20.0.0-usql.27

### Patch Changes

- b6683ba0: Deploy screen now shows environment variables for USQL
- cad09993: improve source refresh experience
- Updated dependencies [b6683ba0]
- Updated dependencies [5828c375]
- Updated dependencies [cad09993]
- Updated dependencies [64d1405b]
  - @evidence-dev/core-components@2.0.0-usql.13
  - @evidence-dev/plugin-connector@2.0.0-usql.17
  - @evidence-dev/preprocess@4.0.0-usql.13
  - @evidence-dev/component-utilities@2.0.0-usql.9
  - @evidence-dev/query-store@2.0.0-usql.1

## 20.0.0-usql.26

### Major Changes

- e1facffd: Add QueryStore concept

  - Loads data as it is requested, rather than all at page-load / build
  - Uses duckdb to get data length / column data
  - Ties metadata, mutation queries, and data together to make component development easier
  - Provides information regarding loading (and query errors in the future)

### Patch Changes

- e9a63c71: Add loading states to DataTable and Chart
- Updated dependencies [e1facffd]
- Updated dependencies [078fca3b]
- Updated dependencies [e9a63c71]
  - @evidence-dev/preprocess@4.0.0-usql.12
  - @evidence-dev/query-store@2.0.0-usql.0
  - @evidence-dev/component-utilities@2.0.0-usql.8
  - @evidence-dev/core-components@2.0.0-usql.12

## 20.0.0-usql.25

### Patch Changes

- 5be92c14: fix spelling mistake
- Updated dependencies [5be92c14]
- Updated dependencies [239a18d7]
- Updated dependencies [52e114cc]
- Updated dependencies [ca1f90b3]
  - @evidence-dev/plugin-connector@2.0.0-usql.16
  - @evidence-dev/component-utilities@2.0.0-usql.7
  - @evidence-dev/universal-sql@2.0.0-usql.9
  - @evidence-dev/db-orchestrator@3.0.0-usql.7
  - @evidence-dev/core-components@2.0.0-usql.11

## 20.0.0-usql.24

### Patch Changes

- 20127231: Bump all versions so version pinning works
- Updated dependencies [7c4249c0]
- Updated dependencies [7c8a9f9d]
- Updated dependencies [afbb50fc]
- Updated dependencies [20127231]
  - @evidence-dev/component-utilities@2.0.0-usql.6
  - @evidence-dev/plugin-connector@2.0.0-usql.15
  - @evidence-dev/core-components@2.0.0-usql.10
  - @evidence-dev/db-orchestrator@3.0.0-usql.6
  - @evidence-dev/preprocess@4.0.0-usql.11
  - @evidence-dev/tailwind@1.0.0-usql.2
  - @evidence-dev/universal-sql@2.0.0-usql.8

## 20.0.0-usql.23

### Patch Changes

- Fix publish issue

## 20.0.0-usql.22

### Patch Changes

- 17a82581: standardize date objects in `standardizeDateString`
- efa96920: External SQL files now live in queries rather than sources
- 4b6262d8: added `build:sources` filtration options to cli
- 29c149d6: added stricter types to db adapters
- Updated dependencies [17a82581]
- Updated dependencies [efa96920]
- Updated dependencies [4b6262d8]
  - @evidence-dev/component-utilities@2.0.0-usql.5
  - @evidence-dev/preprocess@4.0.0-usql.10
  - @evidence-dev/plugin-connector@2.0.0-usql.14
  - @evidence-dev/core-components@2.0.0-usql.9
  - @evidence-dev/db-orchestrator@3.0.0-usql.5

## 20.0.0-usql.21

### Patch Changes

- Updated dependencies
  - @evidence-dev/core-components@2.0.0-usql.8

## 20.0.0-usql.20

### Patch Changes

- Add tailwind as peer dep

## 20.0.0-usql.19

### Patch Changes

- @evidence-dev/core-components@2.0.0-usql.7

## 20.0.0-usql.18

### Minor Changes

- 87aaf1c3: removed explore pages from built site

### Patch Changes

- 73cfef71: Removed legacy database settings UI
- Updated dependencies [69126c94]
  - @evidence-dev/universal-sql@2.0.0-usql.7
  - @evidence-dev/plugin-connector@2.0.0-usql.13

## 20.0.0-usql.17

### Patch Changes

- Clean up console logs
- Updated dependencies
  - @evidence-dev/preprocess@4.0.0-usql.9

## 20.0.0-usql.16

### Patch Changes

- Updated dependencies
  - @evidence-dev/component-utilities@2.0.0-usql.4
  - @evidence-dev/preprocess@4.0.0-usql.8
  - @evidence-dev/core-components@2.0.0-usql.6

## 20.0.0-usql.15

### Patch Changes

- Updated dependencies
  - @evidence-dev/preprocess@4.0.0-usql.7

## 20.0.0-usql.14

### Patch Changes

- Updated dependencies [64ab3074]
  - @evidence-dev/component-utilities@2.0.0-usql.3
  - @evidence-dev/preprocess@4.0.0-usql.6
  - @evidence-dev/core-components@2.0.0-usql.5

## 20.0.0-usql.13

### Patch Changes

- Updated dependencies
  - @evidence-dev/universal-sql@2.0.0-usql.6
  - @evidence-dev/plugin-connector@2.0.0-usql.12

## 20.0.0-usql.12

### Patch Changes

- Updated dependencies
  - @evidence-dev/universal-sql@2.0.0-usql.5
  - @evidence-dev/plugin-connector@2.0.0-usql.11

## 20.0.0-usql.11

### Patch Changes

- Updated dependencies
  - @evidence-dev/universal-sql@2.0.0-usql.4
  - @evidence-dev/plugin-connector@2.0.0-usql.10

## 20.0.0-usql.10

### Minor Changes

- cfb0f248: Respect component plugin's tailwind configuration

### Patch Changes

- Updated dependencies [cfb0f248]
- Updated dependencies [8ffbb361]
  - @evidence-dev/plugin-connector@2.0.0-usql.9

## 20.0.0-usql.9

### Patch Changes

- Updated dependencies [9ade9c88]
- Updated dependencies [e6f550f3]
- Updated dependencies [9f568270]
- Updated dependencies [9432c6e4]
- Updated dependencies [be1cc666]
  - @evidence-dev/core-components@2.0.0-usql.4
  - @evidence-dev/plugin-connector@2.0.0-usql.8
  - @evidence-dev/preprocess@4.0.0-usql.5

## 23.0.4

### Patch Changes

- Updated dependencies [8408cb82]
- Updated dependencies [d1cf6dc9]
- Updated dependencies [b4596313]
- Updated dependencies [551b036f]
- Updated dependencies [3462a045]
- Updated dependencies [336dec14]
- Updated dependencies [8ad23995]
- Updated dependencies [0f54d725]
- Updated dependencies [8ce5ce82]
  - @evidence-dev/core-components@2.1.4
  - @evidence-dev/telemetry@1.0.6
  - @evidence-dev/component-utilities@1.2.2
  - @evidence-dev/db-orchestrator@2.3.4

## 23.0.3

### Patch Changes

- 4243f3da: fix hard refresh on first project boot
- Updated dependencies [17e2b444]
- Updated dependencies [8ed2af44]
- Updated dependencies [75ac7240]
- Updated dependencies [c4d59109]
  - @evidence-dev/preprocess@3.2.1
  - @evidence-dev/component-utilities@1.2.1
  - @evidence-dev/core-components@2.1.3

## 23.0.2

### Patch Changes

- Updated dependencies [41df3c72]
  - @evidence-dev/core-components@2.1.2
  - @evidence-dev/db-orchestrator@2.3.3

## 23.0.1

### Patch Changes

- Updated dependencies [9d5c11e1]
  - @evidence-dev/core-components@2.1.1

## 23.0.0

### Minor Changes

- 9b8346f0: update core layout, tailwind config, align components to new layout, deprecate sticky alert

### Patch Changes

- 1752882a: Make logs more readable when executing queries
- Updated dependencies [d09a32ce]
- Updated dependencies [aafd7135]
- Updated dependencies [75e419f8]
- Updated dependencies [548d37ff]
- Updated dependencies [5f660a8d]
- Updated dependencies [56521bfb]
- Updated dependencies [29ec9735]
- Updated dependencies [410c1bc6]
- Updated dependencies [e986ed77]
- Updated dependencies [f8781d56]
- Updated dependencies [1f20c79d]
- Updated dependencies [e68a91f7]
- Updated dependencies [9b8346f0]
- Updated dependencies [614b9007]
- Updated dependencies [90258dec]
- Updated dependencies [71a77ca6]
  - @evidence-dev/core-components@2.1.0
  - @evidence-dev/component-utilities@1.2.0
  - @evidence-dev/preprocess@3.2.0
  - @evidence-dev/tailwind@1.1.0
  - @evidence-dev/db-orchestrator@2.3.2

## 22.0.1

### Patch Changes

- Updated dependencies [1e2fad14]
  - @evidence-dev/core-components@2.0.4
  - @evidence-dev/db-orchestrator@2.3.1

## 22.0.0

### Patch Changes

- c2540d2f: Add support for Trino as a data source
- Updated dependencies [5b5959f9]
- Updated dependencies [c2540d2f]
- Updated dependencies [7112f1b8]
  - @evidence-dev/db-orchestrator@2.3.0
  - @evidence-dev/core-components@2.0.3
  - @evidence-dev/component-utilities@1.1.3

## 21.0.3

### Patch Changes

- 6891c4ba: User projects can now extend svelte.config.js

## 21.0.2

### Patch Changes

- Updated dependencies [5d496a7b]
  - @evidence-dev/core-components@2.0.2

## 21.0.1

### Patch Changes

- Updated dependencies [4944f21c]
- Updated dependencies [287126fe]
- Updated dependencies [9673d6a4]
- Updated dependencies [54060ffc]
  - @evidence-dev/component-utilities@1.1.2
  - @evidence-dev/core-components@2.0.1

## 21.0.0

### Patch Changes

- ca551518: Markdown pages are now more specific before being converted to sveltekit page filepaths
- a1fa819e: bump vulnerable deps
- ca551518: Add support for markdown partials
- e7eb0ac2: Improved readability of 404 and 500 error pages
- b8b5633f: Added manifest.json endpoint
- Updated dependencies [798c0395]
- Updated dependencies [16112191]
- Updated dependencies [cdbd1773]
- Updated dependencies [883c9ebb]
- Updated dependencies [ef3ec286]
- Updated dependencies [86b94da9]
- Updated dependencies [b9d54140]
- Updated dependencies [80594acd]
- Updated dependencies [5639ac12]
- Updated dependencies [615a2498]
- Updated dependencies [4ff7dcac]
- Updated dependencies [a1fa819e]
- Updated dependencies [fc07d945]
- Updated dependencies [86635f53]
- Updated dependencies [a00c7c76]
- Updated dependencies [e7eb0ac2]
- Updated dependencies [ca551518]
- Updated dependencies [acd0be37]
  - @evidence-dev/core-components@2.0.0
  - @evidence-dev/component-utilities@1.1.1
  - @evidence-dev/db-orchestrator@2.2.5
  - @evidence-dev/preprocess@3.1.2

## 20.0.1

### Patch Changes

- Updated dependencies [9ade9c88]
- Updated dependencies [9f568270]
- Updated dependencies [9432c6e4]
- Updated dependencies [be1cc666]
  - @evidence-dev/core-components@1.2.1
  - @evidence-dev/preprocess@3.1.1
  - @evidence-dev/db-orchestrator@2.2.4

## 20.0.0

### Patch Changes

- Updated dependencies [78f2fab2]
- Updated dependencies [75560a31]
- Updated dependencies [de129514]
  - @evidence-dev/core-components@1.2.0
  - @evidence-dev/preprocess@3.1.0
  - @evidence-dev/db-orchestrator@2.2.3

## 20.0.0-usql.8

### Patch Changes

- e1174aa1: added profile function to note load and query times
- ca7337ba: fix prerendering for all pages
- Updated dependencies [e1174aa1]
- Updated dependencies [ca7337ba]
  - @evidence-dev/component-utilities@2.0.0-usql.2
  - @evidence-dev/preprocess@4.0.0-usql.4
  - @evidence-dev/universal-sql@2.0.0-usql.3
  - @evidence-dev/core-components@2.0.0-usql.3
  - @evidence-dev/plugin-connector@2.0.0-usql.7

## 20.0.0-usql.7

### Patch Changes

- @evidence-dev/db-orchestrator@3.0.0-usql.4

## 20.0.0-usql.6

### Patch Changes

- Updated dependencies [df7a8c5a]
  - @evidence-dev/plugin-connector@2.0.0-usql.5

## 20.0.0-usql.5

### Patch Changes

- Updated dependencies [cff22ece]
  - @evidence-dev/plugin-connector@2.0.0-usql.4
  - @evidence-dev/db-orchestrator@3.0.0-usql.3

## 20.0.0-usql.4

### Patch Changes

- 20aad351: Add universal-sql to excluded deps in vite configuration
- Updated dependencies [78f2fab2]
- Updated dependencies [de129514]
  - @evidence-dev/core-components@2.0.0-usql.2
  - @evidence-dev/preprocess@4.0.0-usql.3
  - @evidence-dev/db-orchestrator@3.0.0-usql.2

## 20.0.0-usql.3

### Patch Changes

- 9b1ac9b7: removed evidencemeta on the data object
- 9b1ac9b7: make everything use a single connection
- Updated dependencies [9b1ac9b7]
- Updated dependencies [9b1ac9b7]
  - @evidence-dev/preprocess@4.0.0-usql.2
  - @evidence-dev/universal-sql@2.0.0-usql.2
  - @evidence-dev/plugin-connector@2.0.0-usql.3

## 20.0.0-usql.2

### Minor Changes

- f62bd26e: prerenders clientside duckdb queries in their initial state to allow for some form of prerendering

### Patch Changes

- ef2a9106: Sources are now segmented into schemas to prevent source name conflicts
- c29d827d: Add a query console page; improve usability of schema explorer
- Updated dependencies [ef2a9106]
- Updated dependencies [4053c976]
- Updated dependencies [f62bd26e]
  - @evidence-dev/plugin-connector@2.0.0-usql.2
  - @evidence-dev/universal-sql@2.0.0-usql.1
  - @evidence-dev/component-utilities@2.0.0-usql.1
  - @evidence-dev/db-orchestrator@3.0.0-usql.1
  - @evidence-dev/preprocess@4.0.0-usql.1
  - @evidence-dev/core-components@2.0.0-usql.1

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

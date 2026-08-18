# Third-party notices

The `patches/` directory contains modifications to the following third-party packages, applied at install time via pnpm's `patchedDependencies`. Each patch is a derivative of the package it modifies and is distributed under that package's original license, not this repository's LICENSE.

| Package | License | Copyright |
| --- | --- | --- |
| [ssf](https://www.npmjs.com/package/ssf) | Apache-2.0 | SheetJS LLC |
| [echarts](https://www.npmjs.com/package/echarts) | Apache-2.0 | The Apache Software Foundation |
| [zrender](https://www.npmjs.com/package/zrender) | BSD-3-Clause | Baidu Inc. |

Per Apache-2.0 §4(b), the `ssf` and `echarts` patches carry notices of the changes made; see the patch files themselves for details. Full license texts ship with each package under `node_modules/<package>/LICENSE` after install.

import fs from "fs/promises";
import chalk from "chalk";

import { EvidencePackageSchema } from "./schemas/evidence-package.schema";

/**
 * Checks a directory to see if it is a package
 * and if it is a package, if it includes
 * the evidence block that marks it as a plugin
 * @param {string} path
 * @returns {Promise<false | EvidencePackage>}
 */
const isEvidencePackage = async (path) => {
  const s = await fs.stat(path);
  if (!s.isDirectory()) return false;
  const c = await fs.readdir(path);
  if (!c.includes("package.json")) return false;

  const packageContent = await fs.readFile(`${path}/package.json`).then(
    /** @param {Buffer} fileContent */
    (fileContent) => JSON.parse(fileContent.toString())
  );
  if ("evidence" in packageContent) {
    const zodResult = EvidencePackageSchema.safeParse(packageContent);
    if (zodResult.success) return zodResult.data;
    else {
      console.warn(
        chalk.yellow(
          `[!] ${chalk.bold(
            `"${path.split("node_modules/")[1]}"`
          )} is possibly intended to contain evidence plugins, but has a malformed evidence field in it's package.json!`
        )
      );
      return false;
    }
  } else {
    return false;
  }
};

/**
 * Traverses a node_modules directory.
 * Returns a set of qualified package names that have evidence in their package.json
 * @param {string} path
 * @returns {Promise<Set<{package: EvidencePackage, path: string}>>}
 */
const traverse = async (path) => {
  /** @type {Set<{package: EvidencePackage, path: string}>} */
  const output = new Set();

  // Iterate through node_modules
  for (const item of await fs.readdir(path)) {
    // Skip hidden files
    if (item.startsWith(".")) continue;
    const itemPath = `${path}/${item}`;

    // Folder contains organization / scoped moduless
    if (item.startsWith("@")) {
      const results = await traverse(itemPath);
      results.forEach((r) => {
        output.add({ ...r, path: `${item}/${r.package.name}` });
      });
      continue;
    }
    // Folder might be an evidence package
    const stat = await fs.stat(itemPath);
    if (stat.isDirectory()) {
      // First make sure it is a folder, then check if it is a plugin
      const packageContent = await isEvidencePackage(itemPath);
      if (packageContent) {
        output.add({ package: packageContent, path: item });
      }
    }
  }
  return output;
};

/**
 * Traverses node_modules to automatically discover evidence packages
 * Only includes first-level dependencies
 * 
 * @deprecated Configuration based discovery should be preferred
 * @example
 * In package.json:
 * {
 *    ...,
 *    "evidence": {
 *       "components": true
 *    },
 *    ...
 * }
 *
 * @param {string} start
 * @returns {Promise<EvidencePluginPackage[]>}
 */
export const discoverEvidencePackages = async (start) => {
  const node_modules = `${start}/node_modules`;
  // We don't _really_ care about the result of this
  // This is just a naive way to see if the directory exists
  try {
    const r = await fs.stat(node_modules);
    if (!r.isDirectory()) throw new Error("notdir");
  } catch (e) {
    // This is funky undefined behavior, but types
    if (!(e instanceof Error)) throw e;

    if (e.message === "notdir") {
      throw new Error(`${node_modules} is not a directory!`);
    }
    throw new Error(`${node_modules} does not exist!`);
  }
  // Node modules is now confirmed a directory; lets build a list of all packages
  const packages = await traverse(node_modules);
  return Array.from(packages);
};

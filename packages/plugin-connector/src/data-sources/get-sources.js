import fs from "fs/promises";
import path from "path";
import yaml from "yaml";
import chalk from "chalk";
import { DatasourceSpecFileSchema } from "./schemas/datasource-spec.schema";

/**
 * Returns the path to the sources directory, if it exists in the current directory.
 * If it doesn't exist, it logs a warning message and returns null.
 * @returns {Promise<string|null>} The path to the sources directory or null.
 */
export const getSourcesDir = async () => {
    // Get the absolute path to the current working directory
    const pwd = path.resolve("./");

    // Get the contents of the current directory
    const contents = await fs.readdir(pwd, { withFileTypes: true });

    // Find the sources directory in the contents
    const sourcesDir = contents.find(
        (c) => c.name === "sources" && c.isDirectory()
    );

    // If sources directory doesn't exist, log a warning message
    if (!sourcesDir) {
        console.warn(chalk.yellow("[!] No Sources Found!"));
        return null;
    }

    // Return the path to the sources directory
    return path.join(pwd, "sources");
};


/**
 * Get a list of all sources and their connection info
 * @param {string} sourcesDir The path to the sources directory
 * @returns {Promise<DatasourceSpec[]>} An array of DatasourceSpecs
 */
export const getSources = async (sourcesDir) => {
    const sourcesDirectories = await fs.readdir(sourcesDir);
    /** @type {DatasourceSpec[]} */
    const datasourceSpecs = await Promise.all(sourcesDirectories.map(async (dirName) => {
        const sourceDir = path.join(sourcesDir, dirName);
        const contents = await fs.readdir(sourceDir);
        // TODO: Check environment variables for options (or option overrides)
        const connParams = await getConnectionParams(sourceDir);
        const queries = await getQueries(sourceDir, contents);
        return {
            ...connParams,
            sourceDirectory: sourceDir,
            queries: queries,
        };
    })).then(r => r.filter(Boolean));

    return datasourceSpecs;
};

/**
 * Reads a YAML file containing connection parameters from the given source directory,
 * parses it, and returns a validated datasource specification.
 *
 * @param {string} sourceDir - The directory containing the connection.yaml file.
 * @return {Promise<DatasourceSpecFile>} A Promise that resolves to a validated datasource specification.
 */
async function getConnectionParams(sourceDir) {
    const connParamsRaw = await fs.readFile(path.join(sourceDir, "connection.yaml")).then(r => r.toString());
    const connParamsUnchecked = yaml.parse(connParamsRaw);
    return DatasourceSpecFileSchema.parse(connParamsUnchecked);
}

/**
 * Retrieves the contents of all query files in the source directory,
 * excluding the 'connection.yaml' file, and returns them as an array of
 * objects containing the filepath and content of each query file.
 *
 * @param {string} sourceDir - The path to the source directory.
 * @param {Array<string>} contents - An array of filenames in the source directory.
 * @return {Promise<DatasourceQuery[]>} - A promise that resolves to an array of objects
 * containing the filepath and content of each query file.
 */
async function getQueries(sourceDir, contents) {
    const queryFiles = contents.filter((s) => s !== "connection.yaml");
    const queries = await Promise.all(queryFiles.map(async (filename) => ({
        filepath: `${sourceDir}/${filename}`,
        content: await fs.readFile(`${sourceDir}/${filename}`).then(r => r.toString()),
    })));
    return queries;
}

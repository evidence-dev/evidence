const fs = require("fs")
const yaml = require("yaml")
const frontmatterRegex = /---((?:.|\s)+?)---/

/**
 * @param {string} content File Content
 * @returns {any}
 */
const parseFrontmatter = (content) => {
    // Sanity checking
    // if (!filepath.endsWith(".md")) console.warn("Attempting to extract frontmatter from a non-markdown file")
    // const stat = fs.statSync(filepath)
    // if (!stat.isFile()) throw new Error(`${filepath} is not a file`)

    // // Read File
    // const fileContent = fs.readFileSync(filepath).toString()

    // Run against regex
    const frontmatterMatches = frontmatterRegex.exec(content)

    // We have a match
    if (frontmatterMatches?.[1]) {
        const frontmatterContent = frontmatterMatches[1]
        return yaml.parse(frontmatterContent) ?? {}
    }
    // No match for frontmatter
    return undefined
}

module.exports = { parseFrontmatter }
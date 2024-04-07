import fs from 'fs/promises';
import path from 'path';

export const getPagesDir = async (/** @type {string} */ pagesDir) => {
  const content = await fs.readdir(pagesDir);
  console.log(path.resolve(pagesDir))

  const markdownPages = []
  for (const fileName of content) {
    const filePath = path.join(pagesDir, fileName)
    const fileStat = await fs.stat(filePath)

    if (fileStat.isFile() && path.extname(filePath) === ".md") {
      markdownPages.push(filePath)
    }
  }

  return markdownPages.length
}

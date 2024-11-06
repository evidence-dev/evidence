import fs from 'fs';
import path from 'path';

// Define the path to your components folder
const componentsDir = path.join(process.cwd(), 'components');

// Read all files in the components directory
fs.readdirSync(componentsDir).forEach(file => {
  const filePath = path.join(componentsDir, file);

  // Check if the item is a Markdown file and not a directory
  if (fs.statSync(filePath).isFile() && path.extname(file) === '.md') {
    const fileName = path.basename(file, '.md'); // Get the name without extension
    const newDirPath = path.join(componentsDir, fileName); // New folder path
    const newFilePath = path.join(newDirPath, 'index.md'); // New file path

    // Create the new directory
    if (!fs.existsSync(newDirPath)) {
      fs.mkdirSync(newDirPath);
    }

    // Move and rename the file to the new directory as index.md
    fs.renameSync(filePath, newFilePath);

    console.log(`Moved ${file} to ${newFilePath}`);
  }
});

console.log('Reorganization complete!');

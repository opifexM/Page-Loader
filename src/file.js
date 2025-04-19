import fs from 'fs';
import * as path from 'node:path';

/**
 * @param {string} filePath
 * @return {boolean}
 */
function isFileWritable(filePath) {
  const dir = path.dirname(filePath);

  try {
    if (fs.existsSync(filePath)) {
      fs.accessSync(filePath, fs.constants.W_OK);
    } else {
      fs.accessSync(dir, fs.constants.W_OK);
    }
    return true;
  } catch (error) {
    console.error(`Error writing access to a file '${filePath}': '${error}'`);
    return false;
  }
}

/**
 * @param {string} filePath
 * @param {string} content
 */
export function saveFile(filePath, content) {
  if (isFileWritable(filePath)) {
    try {
      fs.writeFileSync(filePath, content, 'utf8');
    } catch (error) {
      console.error(`Error writing to a file '${filePath}': '${error}'`);
      throw error;
    }
  }
}

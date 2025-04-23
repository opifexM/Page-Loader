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
 * @return {void}
 */
export function saveTextFile(filePath, content) {
  if (content && isFileWritable(filePath)) {
    try {
      fs.writeFileSync(filePath, content, 'utf8');
    } catch (error) {
      console.error(`Error writing to a file '${filePath}': '${error}'`);
      throw error;
    }
  }
}

/**
 * @param {string} filePath
 * @param {Blob} blob
 * @return {void}
 */
export function saveBlobFile(filePath, blob) {
  if (blob && isFileWritable(filePath)) {
    try {
      const buffer = Buffer.from(blob);
      fs.writeFileSync(filePath, buffer);
    } catch (error) {
      console.error(`Error writing to a blob file '${filePath}': '${error}'`);
      throw error;
    }
  }
}

/**
 * @param {string} path
 * @return {void}
 */
export function createDirectory(path) {
  try {
    fs.mkdirSync(path, { recursive: true });
  } catch (error) {
    console.error(`Error create directory '${path}': '${error}'`);
    throw error;
  }
}

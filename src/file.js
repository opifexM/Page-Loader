import fs from 'fs';
import * as path from 'node:path';
import debug from 'debug';

const log = debug('page-loader:file');

/**
 * @param {string} filePath
 * @return {boolean}
 */
function isFileWritable(filePath) {
  const dir = path.dirname(filePath);

  try {
    if (fs.existsSync(filePath)) {
      fs.accessSync(filePath, fs.constants.W_OK);
      log(`File '${filePath}' exists and is writable.`);
    } else {
      fs.accessSync(dir, fs.constants.W_OK);
      log(`Directory '${dir}' is writable. File '${filePath}' may be created.`);
    }
    return true;
  } catch (error) {
    log(`Error checking write access for file '${filePath}': ${error}`);
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
      log(`Successfully saved text file at '${filePath}'.`);
      console.log(`\x1b[32m✓ ${filePath}`);
    } catch (error) {
      log(`Error writing to file '${filePath}': ${error}`);
      throw error;
    }
  } else {
    log(`Content is empty or file '${filePath}' is not writable.`);
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
      log(`Successfully saved blob file at '${filePath}'.`);
      console.log(`\x1b[32m✓ ${filePath}`);
    } catch (error) {
      log(`Error writing to blob file '${filePath}': ${error}`);
      throw error;
    }
  } else {
    log(`Blob is empty or file '${filePath}' is not writable.`);
  }
}

/**
 * @param {string} dirPath
 * @return {void}
 */
export function createDirectory(dirPath) {
  try {
    fs.mkdirSync(dirPath, { recursive: true });
    log(`Directory '${dirPath}' created or already exists.`);
  } catch (error) {
    log(`Error creating directory '${dirPath}': ${error}`);
    throw error;
  }
}

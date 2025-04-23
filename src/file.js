import fs from 'fs';
import * as path from 'node:path';
import debug from 'debug';

const log = debug('page-loader:file');

/**
 * @param {string | Buffer<ArrayBufferLike> | URL} directoryPath
 */
export function checkDirectory(directoryPath) {
  log(`Check directory: '${directoryPath}'...`);
  if (!fs.existsSync(directoryPath)) {
    const error = new Error(
      `ENOENT: no such file or directory, access '${directoryPath}'`,
    );
    error.code = 'ENOENT';
    throw error;
  }
}

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
    log(
      `Error checking write access for file '${filePath}': ${error}`,
    );
    return false;
  }
}

/**
 * @param {string} filePath
 * @param {string} content
 * @return {void}
 */
export function saveTextFile(filePath, content) {
  console.log(filePath);
  if (!content || !isFileWritable(filePath)) {
    console.error(
      `Error: Unable to write file '${filePath}'. Check write permissions and ensure the directory exists.`,
    );
    throw new Error(
      `Unable to write file '${filePath}'. Check write permissions and ensure the directory exists.`,
    );
  }
  try {
    let data = content;
    if (path.extname(filePath) === '.css' && !content.startsWith('\uFEFF')) {
      data = `\uFEFF${content}`;
    }
    fs.writeFileSync(filePath, data, 'utf8');
    log(`Successfully saved text file at '${filePath}'.`);
  } catch (error) {
    log(`Error writing to file '${filePath}': ${error}`);
    console.error(`Error writing text file '${filePath}': ${error.message}`);
    throw error;
  }
}

/**
 * @param {string} filePath
 * @param {Blob} blob
 * @return {void}
 */
export function saveBlobFile(filePath, blob) {
  if (!blob || !isFileWritable(filePath)) {
    console.error(
      `Error: Unable to write blob file '${filePath}'. Check write permissions and ensure the directory exists.`,
    );
    throw new Error(
      `Unable to write file '${filePath}'. Check write permissions and ensure the directory exists.`,
    );
  }
  try {
    const buffer = Buffer.from(blob);
    fs.writeFileSync(filePath, buffer);
    log(`Successfully saved blob file at '${filePath}'.`);
  } catch (error) {
    log(`Error writing to blob file '${filePath}': ${error}`);
    console.error(`Error writing blob file '${filePath}': ${error.message}`);
    throw error;
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
    console.error(`Error creating directory '${dirPath}': ${error.message}`);
    throw error;
  }
}

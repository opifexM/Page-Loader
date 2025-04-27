import fs from 'fs/promises';
import * as path from 'node:path';
import debug from 'debug';

const log = debug('page-loader:file');

/**
 * @param {string} directoryPath
 * @return {Promise<void>}
 */
export function checkWorkDirectory(directoryPath) {
  log(`Check directory: '${directoryPath}'...`);
  return fs
    .access(directoryPath)
    .then(() => {})
    .catch(() => {
      const error = new Error(
        `ENOENT: no such file or directory, access '${directoryPath}'`
      );
      error.code = 'ENOENT';
      throw error;
    });
}

/**
 * @param {string} directoryPath
 * @returns {Promise<string>}
 * */
export function createDirectory(directoryPath) {
  return fs.mkdir(directoryPath, { recursive: true })
    .catch((error) => {
      console.error(
        `Error creating directory '${directoryPath}' : ${error}`,
      );
      throw error;
    });
}

/**
 * @param {string} filePath
 * @param {string|Buffer|ArrayBuffer|Blob} content
 * @returns {Promise<void>}
 */
export function saveFile(filePath, content) {
  const ext = path.extname(filePath).toLowerCase();
  const isString = typeof content === 'string';

  let data = content;
  //todo-test
  // if (isString && ext === '.css' && !content.startsWith('\uFEFF')) {
  //   data = '\uFEFF' + content;
  // }

  return fs
    .writeFile(filePath, data, isString ? 'utf8' : undefined)
    .then(() => {
      log(`Successfully saved file at '${filePath}'.`);
    })
    .catch((error) => {
      console.error(
        `Error saving file '${filePath}' : ${error}`,
      );
      throw error;
    });
}

import axios from 'axios';
import axiosDebugLog from 'axios-debug-log';
import debug from 'debug';
import { loadTextUrl } from './api.js';
import { isFileWritable, saveTextFile } from './file.js';
import { normalizeUrl, parseHtml } from './parser.js';

axiosDebugLog(axios);
const log = debug('page-loader');

/**
 * @param {string} inputUrl
 * @param {string} inputPath
 */
export default function loadWebSite(inputUrl, inputPath) {
  const workPath = inputPath ?? process.cwd();
  const websiteUrl = new URL(inputUrl);
  const normalizedHost = normalizeUrl(websiteUrl.hostname);
  const normalizedPath =
    websiteUrl.pathname === '/' ? '' : normalizeUrl(websiteUrl.pathname);

  return Promise.resolve()
    .then(() => {
      log(`Checking directory: '${workPath}'...`);
      if (!isFileWritable(workPath)) {
        const error = new Error(
          `ENOENT: no such file or directory, access '${workPath}'`
        );
        error.code = 'ENOENT';
        return Promise.reject(error);
      }
    })
    .then(() => {
      log(`Loading URL: '${websiteUrl}'...`);
      return loadTextUrl(websiteUrl.toString());
    })
    .then((textData) => {
      log(`Parsing URL: '${websiteUrl}'...`);
      return parseHtml(textData, websiteUrl, workPath);
    })
    .then((updatedHtmlContent) => {
      log(
        `Saving file: '${workPath}/${normalizedHost}${normalizedPath}.html'...`
      );
      saveTextFile(
        `${workPath}/${normalizedHost}${normalizedPath}.html`,
        updatedHtmlContent
      );
      console.log(
        `Page was successfully downloaded into '${workPath}/${normalizedHost}${normalizedPath}.html'`
      );

      return updatedHtmlContent;
    })
    .catch((error) => {
      log(`Error during program execution: ${error}`);
      throw error;
    });
}

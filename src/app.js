import axios from 'axios';
import axiosDebugLog from 'axios-debug-log';
import debug from 'debug';
import { loadTextUrl } from './api.js';
import {checkWorkDirectory, createDirectory, saveFile} from './file-utils.js';
import { normalizeUrl, parseHtml } from './parser.js';

axiosDebugLog(axios);
const log = debug('page-loader');

const FILE_IDENTIFIER = '_files';

/**
 * @param {string} inputUrl
 * @param {string} inputPath
 * @return {Promise<void>}
 */
export default function loadWebSite(inputUrl, inputPath) {
  const workPath = inputPath ?? process.cwd();
  const websiteUrl = new URL(inputUrl);
  const normalizedHost = normalizeUrl(websiteUrl.hostname);
  const normalizedPath = websiteUrl.pathname === '/' ? '' : normalizeUrl(websiteUrl.pathname);
  const resourceFilePath = `${normalizedHost}${normalizedPath}${FILE_IDENTIFIER}`;
  const fullResourcePath = `${workPath}/${resourceFilePath}`;


  return checkWorkDirectory(workPath)
    .then(() => {
      log(`Resource directory ensured at '${fullResourcePath}'.`);
      return createDirectory(fullResourcePath);
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
        `Saving file: '${workPath}/${normalizedHost}${normalizedPath}.html'...`,
      );
      return saveFile(
        `${workPath}/${normalizedHost}${normalizedPath}.html`,
        updatedHtmlContent,
      );
    })
    .catch((error) => {
      console.error(
        `Error during program execution : ${error}`,
      );
      throw error;
    });
}

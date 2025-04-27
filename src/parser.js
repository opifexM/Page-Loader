import * as cheerio from 'cheerio';
import debug from 'debug';
import { Listr } from 'listr2';
import path from 'path';
import { loadBlobUrl, loadTextUrl } from './api.js';
import { createDirectory, saveFile } from './file-utils.js';

const log = debug('page-loader:parser');
const FILE_IDENTIFIER = '_files';

/**
 * @param {string} filePath
 * @return {string}
 */
function extractFileNameWithoutExtension(filePath) {
  const parsed = path.parse(filePath);
  return path.join(parsed.dir, parsed.name);
}

/**
 * @param {string} url
 * @return {string}
 */
export function normalizeUrl(url) {
  return url.replace(/^https?:\/+/, '').replace(/[^a-zA-Zа-яА-ЯёЁ0-9]/g, '-');
}

/**
 * @param {string} url
 * @return {string}
 */
function normalizeResourceUrl(url) {
  const fileNameWithoutExt = extractFileNameWithoutExtension(url);
  const normalizedName = normalizeUrl(fileNameWithoutExt);
  const fileExtension = path.extname(url);

  return fileExtension
    ? `${normalizedName}${fileExtension}`
    : `${normalizedName}.html`;
}

/**
 * @param {string} str
 * @return {boolean}
 */
function isAbsoluteUrl(str) {
  try {
    const url = new URL(str);
    return Boolean(url.href);
  } catch (e) {
    return false;
  }
}

/**
 * @param {string} htmlCode
 * @param {URL} websiteUrl
 * @param {string} workPath
 * @return {Promise<string>}
 */
export function parseHtml(htmlCode, websiteUrl, workPath) {
  const websiteHost = websiteUrl.hostname;
  const websiteProtocol = websiteUrl.protocol;
  const normalizedHost = normalizeUrl(websiteHost);
  const normalizedPath = websiteUrl.pathname === '/' ? '' : normalizeUrl(websiteUrl.pathname);
  const resourceFilePath = `${normalizedHost}${normalizedPath}${FILE_IDENTIFIER}`;
  const fullResourcePath = `${workPath}/${resourceFilePath}`;

  // createDirectory(fullResourcePath).then(() {
  //     log(`Resource directory ensured at '${fullResourcePath}'.`);

  const tasks = new Listr([], {
    concurrent: false,
    exitOnError: true,
    rendererOptions: { collapse: false },
  });
  const $ = cheerio.load(htmlCode);
  $('img[src$=".png"], img[src$=".jpg"], script[src], link[href]').each(
    (i, element) => {
      let srcPath = null;
      let srcPathUrl = null;
      let loadUrl = null;
      let newSrcPath = null;

      const tag = element.tagName.toLowerCase();
      if (tag === 'link') {
        srcPath = $(element).attr('href');
      } else if (tag === 'script') {
        srcPath = $(element).attr('src');
      } else if (tag === 'img') {
        srcPath = $(element).attr('src');
      }

      if (!srcPath) {
        log('Skipping element as no source path found.');
        return;
      }
      if (isAbsoluteUrl(srcPath)) {
        srcPathUrl = new URL(srcPath);
        loadUrl = srcPathUrl.toString();
        newSrcPath = `${resourceFilePath}/${normalizeResourceUrl(srcPath)}`;
      } else {
        loadUrl = `${websiteProtocol}//${websiteHost}${srcPath}`;
        newSrcPath = `${resourceFilePath}/${normalizedHost}${normalizeResourceUrl(srcPath)}`;
      }
      if (srcPathUrl && srcPathUrl.hostname !== websiteHost) {
        log(`Skipping element with external hostname: '${srcPathUrl.hostname}'.`);
        return;
      }
      const finalWorkPath = `${workPath}/${newSrcPath}`;
      log(`Processing <${tag}> resource. Original URL: '${loadUrl}', New path: '${newSrcPath}'.`);

      tasks.add({
        title: loadUrl,
        task: () => {
          if (tag === 'link') {
            $(element).attr('href', newSrcPath);
            return loadTextUrl(loadUrl).then((textData) => {
              log(`Downloaded text resource from '${loadUrl}'.`);
              return saveFile(finalWorkPath, textData);
            });
          }
          if (tag === 'script') {
            $(element).attr('src', newSrcPath);
            return loadTextUrl(loadUrl).then((textData) => {
              log(`Downloaded script resource from '${loadUrl}'.`);
              return saveFile(finalWorkPath, textData);
            });
          }
          if (tag === 'img') {
            $(element).attr('src', newSrcPath);
            return loadBlobUrl(loadUrl).then((blobData) => {
              log(`Downloaded image resource from '${loadUrl}'.`);
              return saveFile(finalWorkPath, blobData);
            });
          }
        },
      });
    },
  );

  return tasks.run().then(() => $.html());
}

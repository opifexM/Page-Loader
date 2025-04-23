import * as cheerio from 'cheerio';
import debug from 'debug';
import { Listr } from 'listr2';
import { loadBlobUrl, loadTextUrl } from './api.js';
import { createDirectory, saveBlobFile, saveTextFile } from './file.js';

const log = debug('page-loader:parser');

const FILE_IDENTIFIER = `_files`;
const MIN_URL_PARTS_COUNT = 2;

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
  const normalizedPath =
    websiteUrl.pathname === '/' ? '' : normalizeUrl(websiteUrl.pathname);
  const resourceFilePath = `${normalizedHost}${normalizedPath}${FILE_IDENTIFIER}`;
  const fullResourcePath = `${workPath}/${resourceFilePath}`;

  createDirectory(fullResourcePath);
  log(`Resource directory ensured at '${fullResourcePath}'.`);

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

      const tag = element.tagName.toLowerCase();
      if (tag === 'link') {
        srcPath = $(element).attr('href');
      } else if (tag === 'script') {
        srcPath = $(element).attr('src');
      } else if (tag === 'img') {
        srcPath = $(element).attr('src');
      }

      if (!srcPath) {
        log(`Skipping element as no source path found.`);
        return;
      }
      if (isAbsoluteUrl(srcPath)) {
        srcPathUrl = new URL(srcPath);
        loadUrl = srcPathUrl.toString();
      } else {
        loadUrl = `${websiteProtocol}//${websiteHost}${srcPath}`;
      }
      if (srcPathUrl && srcPathUrl.hostname !== websiteHost) {
        log(
          `Skipping element with external hostname: '${srcPathUrl.hostname}'.`
        );
        return;
      }
      const newSrcPath = `${resourceFilePath}/${normalizedHost}${normalizeResourceUrl(srcPath)}`;
      const finalWorkPath = `${workPath}/${newSrcPath}`;

      log(
        `Processing <${tag}> resource. Original URL: '${loadUrl}', New path: '${newSrcPath}'.`
      );

      tasks.add({
        title: loadUrl,
        task: () => {
          if (tag === 'link') {
            $(element).attr('href', newSrcPath);
            return loadTextUrl(loadUrl).then((textData) => {
              log(`Downloaded text resource from '${loadUrl}'.`);
              saveTextFile(finalWorkPath, textData);
            });
          } else if (tag === 'script') {
            $(element).attr('src', newSrcPath);
            return loadTextUrl(loadUrl).then((textData) => {
              log(`Downloaded script resource from '${loadUrl}'.`);
              saveTextFile(finalWorkPath, textData);
            });
          } else if (tag === 'img') {
            $(element).attr('src', newSrcPath);
            return loadBlobUrl(loadUrl).then((blobData) => {
              log(`Downloaded image resource from '${loadUrl}'.`);
              saveBlobFile(finalWorkPath, blobData);
            });
          }
        },
      });
    }
  );

  return tasks.run().then(() => $.html());
}

/**
 * @param {string} url
 * @return {string}
 */
export function normalizeUrl(url) {
  return url.replace(/^https?:\/\//, '').replace(/[^a-zA-Zа-яА-ЯёЁ0-9]/g, '-');
}

/**
 * @param {string} url
 * @return {string}
 */
function normalizeResourceUrl(url) {
  const fileName = url.split('/').pop();
  const fileNameParts = fileName.split('.');

  const hasValidExtension = fileNameParts.length >= MIN_URL_PARTS_COUNT;
  if (!hasValidExtension) {
    return `${normalizeUrl(url)}.html`;
  }

  const fileExtension = fileNameParts.pop();
  const nameWithoutExtension = fileNameParts.join('.');

  return `${normalizeUrl(nameWithoutExtension)}.${fileExtension}`;
}

/**
 * @param {string} str - The string to be evaluated to determine if it is an absolute URL.
 * @return {boolean} Returns true if the string is an absolute URL, false otherwise.
 */
function isAbsoluteUrl(str) {
  try {
    new URL(str);
    return true;
  } catch (e) {
    return false;
  }
}

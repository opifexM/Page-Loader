import * as cheerio from 'cheerio';
import {loadBlobUrl, loadTextUrl} from './api.js';
import {createDirectory, saveBlobFile, saveTextFile} from './file.js';

const FILE_IDENTIFIER = `_files`;
const MIN_URL_PARTS_COUNT = 2;

/**
 * @param {string} htmlCode
 * @param {URL} websiteUrl
 * @param {string} workPath
 * @return {string}
 */
export function parseHtml(htmlCode, websiteUrl, workPath) {
  const websiteHost = websiteUrl.hostname;
  const websiteProtocol = websiteUrl.protocol;
  const normalizedHost = normalizeUrl(websiteHost);
  const normalizedPath =
    websiteUrl.pathname === '/' ? '' : normalizeUrl(websiteUrl.pathname);
  const resourceFilePath = `${normalizedHost}${normalizedPath}${FILE_IDENTIFIER}`;
  createDirectory(`${workPath}/${resourceFilePath}`);

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
      console.log(`- srcPath : ${srcPath}`);

      if (!srcPath) {
        return;
      }
      if (isAbsoluteUrl(srcPath)) {
        srcPathUrl = new URL(srcPath);
        loadUrl = srcPathUrl.toString();
      } else {
        loadUrl = `${websiteProtocol}//${websiteHost}${srcPath}`;
      }
      if (srcPathUrl && srcPathUrl.hostname !== websiteHost) {
        return;
      }
      const newSrcPath = `${resourceFilePath}/${normalizedHost}${normalizeResourceUrl(srcPath)}`;

      const finalWorkPath = `${workPath}/${newSrcPath}`;
      console.log(`newSrcPath: ${newSrcPath}`);
      console.log(`loadUrl: ${loadUrl}`);
      console.log(`finalWorkPath: ${finalWorkPath}`);

      // return;
      if (tag === 'link') {
        $(element).attr('href', newSrcPath);
        loadTextUrl(loadUrl).then((textData) =>
          saveTextFile(finalWorkPath, textData)
        );
      } else if (tag === 'script') {
        $(element).attr('src', newSrcPath);
        loadTextUrl(loadUrl).then((textData) =>
          saveTextFile(finalWorkPath, textData)
        );
      } else if (tag === 'img') {
        $(element).attr('src', newSrcPath);
        loadBlobUrl(loadUrl).then((blobData) =>
          saveBlobFile(finalWorkPath, blobData)
        );
      }
    }
  );

  return $.html();
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

import * as cheerio from 'cheerio';
import debug from 'debug';
import {Listr} from 'listr2';
import path from 'path';
import {loadBlobUrl, loadTextUrl} from './api.js';
import {createDirectory, saveBlobFile, saveTextFile} from './file.js';

const log = debug('page-loader:parser');

const FILE_IDENTIFIER = `_files`;

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
  // console.log(resourceFilePath);
  // console.log(normalizedHost);
  // console.log(workPath);

  const tasks = new Listr([], {
    concurrent: false,
    exitOnError: true,
    rendererOptions: {collapse: false},
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

      // console.log('--');
      if (!srcPath) {
        log(`Skipping element as no source path found.`);
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
      // console.log(srcPath);
      // console.log(websiteHost);
      if (srcPathUrl && srcPathUrl.hostname !== websiteHost) {
        log(
          `Skipping element with external hostname: '${srcPathUrl.hostname}'.`
        );
        return;
      }
      // const newSrcPath = `${resourceFilePath}/${normalizedHost}${normalizeResourceUrl(srcPath)}`;
      const finalWorkPath = `${workPath}/${newSrcPath}`;


      // console.log(`newSrcPath: ${newSrcPath}`);
      // console.log(`finalWorkPath: ${finalWorkPath}`);
      // console.log(`srcPath: ${srcPath}, websiteHost: ${websiteHost}`);
      // console.log(`resourceFilePath: ${resourceFilePath}, normalizedHost: ${normalizedHost}, workPath: ${workPath}`);

      log(
        `Processing <${tag}> resource. Original URL: '${loadUrl}', New path: '${newSrcPath}'.`
      );

      return;
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
  return url.replace(/^https?:\/+/, '').replace(/[^a-zA-Zа-яА-ЯёЁ0-9]/g, '-');
}

/**
 * @param {string} url
 * @return {string}
 */
function normalizeResourceUrl(url) {
  // console.log('== norm');
  // console.log(url);
  // console.log(normalizeUrl(url));
  // console.log(extractFileNameWithoutExtension(url));
  // console.log(`norm: ${normalizeUrl(extractFileNameWithoutExtension(url))}${path.extname(url)}`);


  return `${normalizeUrl(extractFileNameWithoutExtension(url))}${path.extname(url)}`;
}

/**
 * @param {string} filePath
 * @return {string}
 */
function extractFileNameWithoutExtension(filePath) {
  const parsed = path.parse(filePath);
  console.log('== parsed');
  console.log(path.join(parsed.dir, parsed.name));
  console.log('===');
  return path.join(parsed.dir, parsed.name);
}

/**
 * @param {string} str
 * @return {boolean}
 */
function isAbsoluteUrl(str) {
  try {
    new URL(str);
    return true;
  } catch (e) {
    return false;
  }
}

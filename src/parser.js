import * as cheerio from 'cheerio';
import debug from 'debug';
import { Listr } from 'listr2';
import path from 'path';
import { loadBlobUrl } from './api.js';
import { saveFile } from './file-utils.js';

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

const HTML_ATTRIBUTES = {
  link: 'href',
  script: 'src',
  img: 'src',
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
  }
  catch {
    return false;
  }
}

/**
 * @typedef {Object} ResourceInfo
 * @property {import('cheerio').CheerioElement} node
 * @property {string} tagName
 * @property {string} originalUrl
 * @property {string} [localPath]
 */

/**
 * @typedef {Object} ExtractedResources
 * @property {import('cheerio').CheerioAPI} dom
 * @property {ResourceInfo[]} resources
 */

/**
 * @param {string} html
 * @return {ExtractedResources}
 */
export function parseHtmlResources(html) {
  const dom = cheerio.load(html);
  const resources = dom('img[src$=".png"], img[src$=".jpg"], script[src], link[href]')
    .map((i, element) => {
      const tagName = element.tagName.toLowerCase();
      const originalUrl = dom(element).attr(HTML_ATTRIBUTES[tagName]);

      if (!originalUrl) {
        log(`Skipping element '${tagName}' as no source path found.`);
        return;
      }
      log(`Found resource <${tagName}>. Src: '${originalUrl}'`);

      return {
        node: element,
        tagName: tagName,
        originalUrl: originalUrl,
      };
    })
    .get();

  return {
    dom: dom,
    resources: resources,
  };
}

/**
 * @param {ExtractedResources} resourcesData
 * @param {URL} baseUrl
 * @return {ExtractedResources}
 */
export function updateResourceLinks(resourcesData, baseUrl) {
  const { dom, resources } = resourcesData;
  const host = baseUrl.hostname;
  const normalizedHost = normalizeUrl(host);
  const normalizedPath = baseUrl.pathname === '/' ? '' : normalizeUrl(baseUrl.pathname);
  const resourceFilePath = `${normalizedHost}${normalizedPath}${FILE_IDENTIFIER}`;

  const updatedResources = resources.reduce((acc, resource) => {
    const { node, tagName, originalUrl } = resource;
    let absolute;
    let localPath;

    if (isAbsoluteUrl(originalUrl)) {
      absolute = new URL(originalUrl);
      localPath = `${resourceFilePath}/${normalizeResourceUrl(originalUrl)}`;
    }
    else {
      absolute = null;
      localPath = `${resourceFilePath}/${normalizedHost}${normalizeResourceUrl(originalUrl)}`;
    }
    if (absolute && absolute.hostname !== host) {
      log(`Skipping element with external hostname: '${absolute.hostname}'.`);
      return acc;
    }

    dom(node).attr(HTML_ATTRIBUTES[tagName], localPath);
    log(`Rewrite resource <${tagName}>. Path: '${absolute}', New path: '${localPath}'.`);
    acc.push({
      node: node,
      tagName: tagName,
      originalUrl: originalUrl,
      localPath: localPath,
    });

    return acc;
  }, []);

  return {
    dom: dom,
    resources: updatedResources,
  };
}

/**
 * @param {ExtractedResources} resourcesData
 * @param {URL} baseUrl
 * @param {string} outputDir
 * @return {Promise<string>}
 */
export function downloadAndSaveResources(resourcesData, baseUrl, outputDir) {
  const { resources, dom } = resourcesData;
  const host = baseUrl.hostname;
  const protocol = baseUrl.protocol;

  const tasks = new Listr([], {
    concurrent: false,
    exitOnError: true,
    rendererOptions: { collapse: false },
  });

  resources.forEach((resource) => {
    const { originalUrl, localPath } = resource;

    let loadUrl = isAbsoluteUrl(originalUrl)
      ? originalUrl
      : `${protocol}//${host}${originalUrl}`;

    const filePath = `${outputDir}/${localPath}`;
    log(`New task for download resource URL: '${loadUrl}'`);
    console.log(`originalUrl: ${originalUrl}, localPath: ${localPath}`);
    console.log(`New task for download resource URL: '${loadUrl}'`);

    tasks.add({
      title: loadUrl,
      task: () =>
        loadBlobUrl(loadUrl)
          .then(data => saveFile(filePath, data)),
    });
  });

  return tasks
    .run()
    .then(() => dom.html());
}

// /**
//  * @param {string} htmlCode
//  * @param {URL} websiteUrl
//  * @param {string} workPath
//  * @return {Promise<string>}
//  */
// export function parseHtml(htmlCode, websiteUrl, workPath) {
//   const websiteHost = websiteUrl.hostname;
//   const websiteProtocol = websiteUrl.protocol;
//   const normalizedHost = normalizeUrl(websiteHost);
//   const normalizedPath = websiteUrl.pathname === '/' ? '' : normalizeUrl(websiteUrl.pathname);
//   const resourceFilePath = `${normalizedHost}${normalizedPath}${FILE_IDENTIFIER}`;
//
//   const tasks = new Listr([], {
//     concurrent: false,
//     exitOnError: true,
//     rendererOptions: { collapse: false },
//   });
//   const $ = cheerio.load(htmlCode);
//   $('img[src$=".png"], img[src$=".jpg"], script[src], link[href]').each(
//     (i, element) => {
//       let srcPathUrl = null;
//       let loadUrl = null;
//       let newSrcPath = null;
//
//       const tag = element.tagName.toLowerCase();
//       const srcPath = $(element).attr(HTML_ATTRIBUTES[tag]);
//
//       if (!srcPath) {
//         log('Skipping element as no source path found.');
//         return;
//       }
//       if (isAbsoluteUrl(srcPath)) {
//         srcPathUrl = new URL(srcPath);
//         loadUrl = srcPathUrl.toString();
//         newSrcPath = `${resourceFilePath}/${normalizeResourceUrl(srcPath)}`;
//       }
//       else {
//         loadUrl = `${websiteProtocol}//${websiteHost}${srcPath}`;
//         newSrcPath = `${resourceFilePath}/${normalizedHost}${normalizeResourceUrl(srcPath)}`;
//       }
//       if (srcPathUrl && srcPathUrl.hostname !== websiteHost) {
//         log(`Skipping element with external hostname: '${srcPathUrl.hostname}'.`);
//         return;
//       }
//       const finalWorkPath = `${workPath}/${newSrcPath}`;
//       log(`Processing <${tag}> resource. Original URL: '${loadUrl}', New path: '${newSrcPath}'.`);
//
//       tasks.add({
//         title: loadUrl,
//         task: () => {
//           $(element).attr(HTML_ATTRIBUTES[tag], newSrcPath);
//
//           return loadBlobUrl(loadUrl).then((textData) => {
//             log(`Downloaded resource from '${loadUrl}'.`);
//             return saveFile(finalWorkPath, textData);
//           });
//         },
//       });
//     },
//   );
//
//   return tasks.run().then(() => $.html());
// }

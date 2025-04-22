import * as cheerio from 'cheerio';
import { loadBlobUrl } from './api.js';
import { createDirectory, saveBlobFile } from './file.js';

const FILE_IDENTIFIER = `_files`;

/**
 * @param {string} htmlCode
 * @param {URL} websiteUrl
 * @param {string} workPath
 * @return {string}
 */
export function parseHtml(htmlCode, websiteUrl, workPath) {
  const websiteProtocol = websiteUrl.protocol;
  const websiteHost = websiteUrl.hostname;
  const normalizedHost = normalizeUrl(websiteHost);
  const normalizedPath =
    websiteUrl.pathname === '/' ? '' : normalizeUrl(websiteUrl.pathname);
  const resourceFilePath = `${normalizedHost}${normalizedPath}${FILE_IDENTIFIER}`;
  createDirectory(`${workPath}/${resourceFilePath}`);

  const $ = cheerio.load(htmlCode);
  $('img[src$=".png"], img[src$=".jpg"]').each((i, imgSelector) => {
    const imageSrc = $(imgSelector).attr('src');
    const normalizedImageSrc = normalizeSrcUrl(imageSrc);
    const newImageSrc = `${resourceFilePath}/${normalizedHost}${normalizedImageSrc}`;
    $(imgSelector).attr('src', newImageSrc);
    console.log(`oldimageSrc : ${imageSrc}`);
    console.log(`newImagePath: ${newImageSrc}`);

    loadBlobUrl(`${websiteProtocol}//${websiteHost}${imageSrc}`).then((blob) =>
      saveBlobFile(`${workPath}/${newImageSrc}`, blob)
    );
  });

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
export function normalizeSrcUrl(url) {
  const splitUrl = url.split('.');
  const urlWithoutExtension = splitUrl.slice(0, -1).join('.');
  const fileExtension = splitUrl.pop();

  return `${normalizeUrl(urlWithoutExtension)}.${fileExtension}`;
}

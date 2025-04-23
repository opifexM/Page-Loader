import { loadTextUrl } from './api.js';
import { saveTextFile } from './file.js';
import { normalizeUrl, parseHtml } from './parser.js';

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
      console.log(`Loading url: '${websiteUrl}'...`);
      return loadTextUrl(websiteUrl.toString());
    })
    .then((textData) => {
      console.log(`Parsing url: '${websiteUrl}'...`);
      return parseHtml(textData, websiteUrl, workPath);
    })
    .then((updatedHtmlContent) => {
      console.log(
        `Saving file: '${workPath}/${normalizedHost}${normalizedPath}.html'...`
      );
      saveTextFile(
        `${workPath}/${normalizedHost}${normalizedPath}.html`,
        updatedHtmlContent
      );
      return updatedHtmlContent;
    })
    .catch((error) => {
      console.log(`Error program execution: ${error}`);
    });
}

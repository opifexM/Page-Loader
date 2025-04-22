import { loadHtmlUrl } from './api.js';
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

  console.log(websiteUrl.toString());
  console.log(workPath);
  console.log(normalizedHost);
  console.log(normalizedPath);

  const tmp = `
    <!DOCTYPE html>
    <html lang="ru">
      <head>
        <meta charset="utf-8">
        <title>Курсы по программированию Хекслет</title>
      </head>
      <body>
        <img class="tn-atom__img" src="/tp/versions/11743678305/tild3735-3835-4630-b231-373863343365__frontend.png" alt="" imgfield="tn_img_1681905914165" loading="lazy">
        <h3>
          <a href="/professions/nodejs">Node.js-программист</a>
        </h3>
      </body>
    </html>
  `;

  return Promise.resolve()
    .then(() => {
      console.log(`Loading url: '${websiteUrl}'...`);
      return loadHtmlUrl(websiteUrl.toString());
      // return tmp;
    })
    .then((htmlCode) => {
      console.log(`Parsing url: '${websiteUrl}'...`);
      return parseHtml(htmlCode, websiteUrl, workPath);
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

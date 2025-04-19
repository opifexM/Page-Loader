import { loadUrl } from './api.js';
import { saveFile } from './file.js';

/**
 * @param {string} urlPath
 * @param {string} dirPath
 */
export default function loadWebSite(urlPath, dirPath) {
  console.log(dirPath);
  const formattedPath = dirPath ?? process.cwd();
  const formattedUrl =
    urlPath
      .replace('http://', '')
      .replace('https://', '')
      .replace(/[^a-zA-Zа-яА-ЯёЁ0-9]/g, '-') + '.html';

  console.log(formattedUrl);
  console.log(dirPath);

  return loadUrl(urlPath)
    .then((content) => {
      saveFile(`${formattedPath}/${formattedUrl}`, content);
      console.log(`${formattedPath}/${formattedUrl}`);
    })
    .catch(() => {
      console.log('Error program execution');
    });
}

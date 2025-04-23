import axios from 'axios';
import debug from 'debug';

const log = debug('page-loader:api');

/**
 * @param {string} url
 * @return {Promise<string>}
 */
export function loadTextUrl(url) {
  return axios
    .get(url)
    .then((response) => String(response.data))
    .catch((error) => {
      log(`Error downloading HTML from url '${url}': ${error}`);
    });
}

/**
 * @param {string} url
 * @return {Promise<Blob>}
 */
export function loadBlobUrl(url) {
  return axios
    .request({
      method: 'GET',
      url: url,
      responseType: 'arraybuffer',
    })
    .then((response) => response.data)
    .catch((error) => {
      log(`Error downloading Blob from url '${url}': ${error}`);
    });
}

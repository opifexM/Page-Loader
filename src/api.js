import axios from 'axios';

/**
 * @param {string} url
 * @return {Promise<string>}
 */
export function loadTextUrl(url) {
  return axios
    .get(url)
    .then((response) => String(response.data))
    .catch((error) => {
      console.error(`Url '${url}' html download error: '${error}'`);
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
      console.error(`Url '${url}' blob download error: '${error}'`);
    });
}

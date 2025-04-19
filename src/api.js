import axios from 'axios';

/**
 * @param {string} url
 * @return {Promise<string>}
 */
export function loadUrl(url) {
  return axios
    .get(url)
    .then((response) => String(response.data))
    .catch((error) => {
      console.error(`Url '${url}' download error: '${error}'`);
      throw error;
    });
}

import axios from 'axios'

/**
 * @param {string} url
 * @returns {Promise<string>}
 */
export function loadHtml(url) {
  return axios
    .get(url)
    .then((response) => {
      if (response.status !== 200) {
        console.error(`Error: Resource '${url}' returned status ${response.status}`);
        throw new Error(`HTTP ${response.status} for ${url}`);
      }
      return String(response.data);
    })
    .catch((error) => {
      if (error.response) {
        console.error(`Error downloading HTML from url '${url}': HTTP ${error.response.status}`);
      }
      else if (error.request) {
        console.error(`Error downloading HTML from url '${url}': No response received`);
      }
      else {
        console.error(`Error downloading HTML from url '${url}': ${error.message}`);
      }
      throw error;
    });
}

/**
 * @param {string} url
 * @returns {Promise<Blob>}
 */
export function loadBinary(url) {
  return axios
    .get(url, { responseType: 'arraybuffer' })
    .then((response) => {
      if (response.status !== 200) {
        console.error(`Error: Resource '${url}' returned status ${response.status}`);
        throw new Error(`HTTP ${response.status} for ${url}`);
      }
      return response.data;
    })
    .catch((error) => {
      if (error.response) {
        console.error(`Error downloading Blob from url '${url}': HTTP ${error.response.status}`);
      }
      else if (error.request) {
        console.error(`Error downloading Blob from url '${url}': No response received`);
      }
      else {
        console.error(`Error downloading Blob from url '${url}': ${error.message}`);
      }
      throw error;
    });
}

import axios from 'axios'
import axiosDebugLog from 'axios-debug-log'
import debug from 'debug'
import { loadHtml } from './api.js'
import { verifyDirectory, createDirectory, saveFile } from './file-utils.js'
import { downloadAndSaveResources, parseHtmlResources, normalizeUrl, updateResourceLinks } from './parser.js'

axiosDebugLog(axios)
const log = debug('page-loader')

export const FILE_IDENTIFIER = '_files'

/**
 * @param {string} inputUrl
 * @param {string} inputPath
 * @returns {Promise<void>}
 */
export default function loadWebSite(inputUrl, inputPath) {
  const outputDir = inputPath ?? process.cwd()
  const baseUrl = new URL(inputUrl)
  const normalizedHost = normalizeUrl(baseUrl.hostname)
  const normalizedPath = baseUrl.pathname === '/' ? '' : normalizeUrl(baseUrl.pathname)
  const resourceFilePath = `${normalizedHost}${normalizedPath}${FILE_IDENTIFIER}`
  const fullResourcePath = `${outputDir}/${resourceFilePath}`

  return verifyDirectory(outputDir)
    .then(() => {
      log(`Resource directory ensured at '${fullResourcePath}'.`)
      return createDirectory(fullResourcePath)
    })
    .then(() => {
      log(`Loading URL: '${baseUrl}'...`)
      return loadHtml(baseUrl.toString())
    })
    .then((html) => {
      log(`Extract html resources from URL: '${baseUrl}'...`)
      return parseHtmlResources(html)
    })
    .then((resourcesData) => {
      log(`Rewrite html resources for URL: '${baseUrl}'...`)
      return updateResourceLinks(resourcesData, baseUrl)
    })
    .then((resourcesData) => {
      log('Download extracted resources...')
      return downloadAndSaveResources(resourcesData, baseUrl, outputDir)
    })
    .then((updatedHtml) => {
      log(`Saving URL file: '${outputDir}/${normalizedHost}${normalizedPath}.html'...`)
      return saveFile(`${outputDir}/${normalizedHost}${normalizedPath}.html`, updatedHtml)
    })
    .catch((error) => {
      console.error(
        `Error during program execution : ${error}`,
      )
      throw error
    })
}

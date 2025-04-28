import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
} from '@jest/globals'
import { existsSync } from 'fs'
import fs from 'fs/promises'
import nock from 'nock'
import os from 'os'
import path from 'path'
import { fileURLToPath } from 'url'
import loadWebSite from '../src/app.js'

describe('PageLoader functionality', () => {
  let tempDir
  let fixturesDir
  let html
  let expectedHtml
  let css
  let courses
  let png

  beforeAll(async () => {
    fixturesDir = path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      '..',
      '__fixtures__',
    );
    [html, expectedHtml, css, courses, png] = await Promise.all([
      fs.readFile(path.join(fixturesDir, 'example.html'), 'utf8'),
      fs.readFile(path.join(fixturesDir, 'example-com.html'), 'utf8'),
      fs.readFile(path.join(fixturesDir, 'application.css'), 'utf8'),
      fs.readFile(path.join(fixturesDir, 'courses.html'), 'utf8'),
      fs.readFile(path.join(fixturesDir, 'nodejs.png')),
    ])

    nock.disableNetConnect()
  })

  afterAll(() => {
    nock.enableNetConnect()
  })

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'))
    nock.cleanAll()

    nock('https://example.com').get('/').reply(200, html)
    nock('https://example.com')
      .get('/assets/application.css')
      .reply(200, css)
    nock('https://example.com').get('/courses').reply(200, courses)
    nock('https://example.com')
      .get('/assets/professions/nodejs.png')
      .reply(200, png)
  })

  afterEach(async () => {
    await fs.rm(tempDir, {
      recursive: true,
      force: true,
    })
  })

  test('successfully downloads and saves', async () => {
    const url = 'https://example.com'
    await loadWebSite(url, tempDir)
    const filePath = path.join(tempDir, 'example-com.html')
    const fileContent = await fs.readFile(filePath, 'utf8')

    expect(fileContent).toBe(expectedHtml)
  })

  test('loadUrl throws an error on HTTP error', async () => {
    const url = 'https://example.com/not-found'
    nock('https://example.com').get('/not-found').reply(404)

    await expect(loadWebSite(url, tempDir)).rejects.toThrow()
  })

  test('logs an error when the target directory does not exist', async () => {
    const url = 'https://example.com'
    const nonExistentDir = path.join(tempDir, 'non-existent')
    const filePath = path.join(nonExistentDir, 'test.html')

    await expect(loadWebSite(url, nonExistentDir)).rejects.toThrow()
    expect(existsSync(filePath)).toBe(false)
  })
})

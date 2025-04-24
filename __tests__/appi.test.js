import fs from 'fs/promises';
import { existsSync } from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

import nock from 'nock';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  jest,
  test,
} from '@jest/globals';

import { loadBlobUrl, loadTextUrl } from '../src/api.js';
import loadWebSite from '../src/app.js';
import { saveTextFile } from '../src/file.js';

describe('PageLoader functionality', () => {
  let tempDir;

  beforeAll(() => {
    nock.disableNetConnect();
  });

  afterAll(() => {
    nock.cleanAll();
    nock.enableNetConnect();
  });

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
    nock.cleanAll();
  });

  afterEach(async () => {
    await fs.rm(tempDir, {
      recursive: true,
      force: true,
    });
  });

  test('successfully downloads and saves', async () => {
    const fixturesPath = path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      '..',
      '__fixtures__',
    );
    const url = 'https://example.com';
    const content = await fs.readFile(
      path.join(fixturesPath, 'example.html'),
      'utf8',
    );
    const expectedContent = await fs.readFile(
      path.join(fixturesPath, 'example-com.html'),
      'utf8',
    );
    const cssContent = await fs.readFile(
      path.join(fixturesPath, 'application.css'),
      'utf8',
    );
    const htmlContent = await fs.readFile(
      path.join(fixturesPath, 'courses.html'),
      'utf8',
    );
    const pngContent = await fs.readFile(
      path.join(fixturesPath, 'nodejs.png'),
    );

    nock('https://example.com').get('/').reply(200, content);
    nock('https://example.com')
      .get('/assets/application.css')
      .reply(200, cssContent);
    nock('https://example.com').get('/courses').reply(200, htmlContent);
    nock('https://example.com')
      .get('/assets/professions/nodejs.png')
      .reply(200, pngContent);

    await loadWebSite(url, tempDir);

    const filePath = path.join(tempDir, 'example-com.html');
    const fileContent = await fs.readFile(filePath, 'utf8');

    expect(fileContent).toBe(expectedContent);
  });

  test('loadUrl throws an error on HTTP error', async () => {
    const url = 'https://example.com/not-found';

    nock('https://example.com').get('/not-found').reply(404);
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    await expect(loadTextUrl(url)).rejects.toThrow();
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  test('saveFile logs an error when the target directory does not exist', async () => {
    const nonExistentDir = path.join(tempDir, 'non-existent');
    const filePath = path.join(nonExistentDir, 'test.html');
    const content = '<html lang="en"><body>Test content</body></html>';

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    try {
      saveTextFile(filePath, content);
    } catch (error) {
      // An error is expected
    }

    expect(consoleSpy).toHaveBeenCalled();
    expect(existsSync(filePath)).toBe(false);

    consoleSpy.mockRestore();
  });

  test('loadBlobUrl handles error on HTTP error', async () => {
    const url = 'https://example.com/blob-error';

    nock('https://example.com').get('/blob-error').reply(500);

    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    await expect(loadBlobUrl(url)).rejects.toThrow();
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});

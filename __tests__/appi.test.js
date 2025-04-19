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
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { existsSync } from 'fs';
import nock from 'nock';
import { loadUrl } from '../src/api.js';
import { saveFile } from '../src/file.js';
import { loadWebSite } from '../src/app.js';

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
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  test('successfully downloads and saves', async () => {
    const url = 'https://example.com';
    const content = '<html lang="en"><body>Example page</body></html>';

    nock('https://example.com').get('/').reply(200, content);

    await loadWebSite(url, tempDir);

    const filePath = path.join(tempDir, 'example-com.html');
    console.log(filePath);
    const fileContent = await fs.readFile(filePath, 'utf8');

    expect(fileContent).toBe(content);
  });

  test('loadUrl throws an error on HTTP error', async () => {
    const url = 'https://example.com/not-found';

    nock('https://example.com').get('/not-found').reply(404);
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    await expect(loadUrl(url)).rejects.toThrow();
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  test('saveFile logs an error when the target directory does not exist', async () => {
    const nonExistentDir = path.join(tempDir, 'non-existent');
    const filePath = path.join(nonExistentDir, 'test.html');
    const content = '<html lang="en"><body>Test content</body></html>';

    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    saveFile(filePath, content);

    expect(consoleSpy).toHaveBeenCalled();
    expect(existsSync(filePath)).toBe(false);

    consoleSpy.mockRestore();
  });
});

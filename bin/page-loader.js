#!/usr/bin/env node

import { Command } from 'commander';
import loadWebSite from '../src/app.js';

const program = new Command();
program
  .name('page-loader')
  .description(
    '  A command-line utility that downloads pages from the Internet and saves them on a computer.',
  )
  .version('1.0.0')
  .option(
    '-o, --output [dir]',
    'output dir (for example: "/home/user/current-dir")',
  )
  .arguments('<url>')
  .action((url, options) => {
    return loadWebSite(url, options.output)
      .then(() => {
        console.log(`Page '${url}' was successfully downloaded.'`);
      })
      .catch(() => {
        process.exit(1);
      })
  });

program.parseAsync();

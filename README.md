[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=opifexM_Page-Loader&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=opifexM_Page-Loader)
[![Bugs](https://sonarcloud.io/api/project_badges/measure?project=opifexM_Page-Loader&metric=bugs)](https://sonarcloud.io/summary/new_code?id=opifexM_Page-Loader)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=opifexM_Page-Loader&metric=coverage)](https://sonarcloud.io/summary/new_code?id=opifexM_Page-Loader)
[![Actions Status](https://github.com/opifexM/fullstack-javascript-project-4/workflows/hexlet-check/badge.svg)](https://github.com/opifexM/fullstack-javascript-project-4/actions)
[![Node CI](https://github.com/opifexM/Page-Loader/actions/workflows/nodejs.yml/badge.svg)](https://github.com/opifexM/Page-Loader/actions/workflows/nodejs.yml)

# PageLoader

**PageLoader** is a command-line utility that downloads web pages from the internet and saves them locally, along with all external resources such as images, stylesheets, and JavaScript files. This allows users to view the pages offline, similar to how browsers save pages for offline use.

## Description

PageLoader is a practical project designed to provide hands-on experience with asynchronous programming in JavaScript using Node.js. The project aims to build a deep understanding of asynchronous operations including promises, `async/await`, error handling, and filesystem interaction.

This utility not only demonstrates how to perform HTTP requests and file downloads asynchronously, but also teaches how to structure robust, testable, and maintainable asynchronous code. Users will work with tools like `axios` for HTTP, `cheerio` for DOM parsing and manipulation, and `nock` for HTTP request mocking in tests.

The page loader extracts all resource links from the downloaded HTML using DOM selectors and replaces them with local paths after downloading the assets. This provides a seamless offline experience when opening the saved page.

## Features
- Downloads HTML pages and saves them to a local directory.
- Parses and downloads all linked resources (CSS, JS, images).
- Rewrites resource links to point to local files.
- Supports async/await for efficient asynchronous operations.
- Logs the execution process for better traceability.
- Provides clear error handling for I/O and HTTP operations.

## Usage

Command Format:

`pageloader <url> [output-path]`

Example:

`pageloader https://example.com ./downloaded`

## Technologies Used

### Core
- **Node.js** — JavaScript runtime environment for executing code outside the browser.
- **Axios** — Promise-based HTTP client for making network requests.
- **Cheerio** — Server-side jQuery-like library for parsing and manipulating HTML.
- **Commander** — CLI helper for parsing arguments and creating commands.
- **Listr2** — Task list library for organizing asynchronous CLI operations.
- **Debug** — Lightweight debugging utility.
- **axios-debug-log** — Middleware for detailed Axios request logging.

### Testing
- **Jest** — Testing framework for JavaScript with support for asynchronous testing.
- **Nock** — HTTP server mocking library, used for testing axios requests without actual network calls.

## License

PageLoader is licensed under the ISC license.

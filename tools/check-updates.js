#!/usr/bin/env node
/**
 * Checks data/updates.js before a commit. Node only, no dependencies.
 *
 * WHAT: loads the data the way the browser does (as a script that sets window.GTS_UPDATES), then
 * runs the shared rules in js/validate.js with the icon names from js/icons.js and a real
 * file-exists check for every screenshot.
 * WHEN: after pasting a new week, before `git commit` (README.md, "Post a week").
 *
 * Usage, from the repository root or anywhere:
 *   node tools/check-updates.js
 *
 * @example // clean data
 *   $ node tools/check-updates.js
 *   updates: 1 weeks — problems: 0                          (exit code 0)
 * @example // a typo in an icon and a missing screenshot
 *   $ node tools/check-updates.js
 *     - weeks[0] (2026-10-11) highlights[1].icon: unknown icon "rocket" (see js/icons.js)
 *     - weeks[0] (2026-10-11) gallery[0]: file not found: assets/updates/2026-10-11/otp.jpg
 *   updates: 2 weeks — problems: 2                          (exit code 1)
 * @example // a syntax error in the data file
 *   updates: could not load data/updates.js — Unexpected token '}'   (exit code 1)
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

/** The repository root: this file lives in <root>/tools/. */
const ROOT = path.resolve(__dirname, '..');
const DATA_FILE = path.join(ROOT, 'data', 'updates.js');
const ICONS_FILE = path.join(ROOT, 'js', 'icons.js');

const { validateUpdates } = require(path.join(ROOT, 'js', 'validate.js'));

/**
 * Runs a browser script in a sandbox with an empty `window` and returns that window.
 *
 * @param {string} file Absolute path of the script.
 * @returns {object} The sandbox's window after the script ran.
 * @example runBrowserScript(DATA_FILE).GTS_UPDATES.weeks.length;  // -> 1
 * @example runBrowserScript(ICONS_FILE).GTS.icons.contentNames;    // -> ['van', 'radar', ...]
 */
function runBrowserScript(file) {
  const window = {};
  const sandbox = { window };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(file, 'utf8'), sandbox, { filename: file });
  return window;
}

/**
 * True when a screenshot path from the data names a real file under the repository root.
 *
 * @example fileExists('assets/updates/2026-10-04/trip-arrived-dark.jpg');  // -> true
 * @example fileExists('assets/updates/2026-10-04/missing.jpg');            // -> false
 * @example fileExists('assets/updates/2026-10-04');                        // -> false  a folder
 */
function fileExists(src) {
  const full = path.join(ROOT, src);
  return fs.existsSync(full) && fs.statSync(full).isFile();
}

/**
 * Loads, validates and prints the summary line; sets the exit code to 1 on any problem.
 */
function main() {
  let data;
  let knownIcons;
  try {
    data = runBrowserScript(DATA_FILE).GTS_UPDATES;
    knownIcons = runBrowserScript(ICONS_FILE).GTS.icons.contentNames;
  } catch (error) {
    console.log(`updates: could not load data/updates.js or js/icons.js — ${error.message}`);
    process.exitCode = 1;
    return;
  }

  const problems = validateUpdates(data, { knownIcons, fileExists });
  for (const problem of problems) {
    console.log(`  - ${problem}`);
  }
  const weekCount = data && Array.isArray(data.weeks) ? data.weeks.length : 0;
  console.log(`updates: ${weekCount} weeks — problems: ${problems.length}`);
  process.exitCode = problems.length === 0 ? 0 : 1;
}

main();

/**
 * Copyright 2017 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

const inquirer = require('inquirer');
const nodeDir = require('node-dir');
const path = require('path');

const errors = require('../errors');
const {ignoredDirectories} = require('../constants');

// The key used for the question/answer.
const name = 'globPatterns';

/**
 * @param {string} globDirectory The directory used for the root of globbing.
 * @return {Promise<[string]>} The unique file extensions corresponding to all
 * of the files under globDirectory.
 */
async function getAllFileExtensions(globDirectory) {
  const substringsToIgnore = ignoredDirectories.map(
    (directory) => `${path.sep}${directory}${path.sep}`);

  const allFiles = await nodeDir.promiseFiles(globDirectory, 'file',
    {shortName: false, recursive: true});

  const filteredFiles = allFiles.filter(
    (filePath) => substringsToIgnore.every(
      (substring) => !filePath.includes(substring))
  );

  const extensions = new Set();
  for (const file of filteredFiles) {
    const extension = path.extname(file);
    if (extension) {
      // Get rid of the leading . character.
      extensions.add(extension.replace(/^\./, ''));
    }
  }

  return [...extensions];
}

/**
 * @param {string} globDirectory The directory used for the root of globbing.
 * @return {Promise<Object>} The answers from inquirer.
 */
async function askQuestion(globDirectory) {
  const fileExtensions = await getAllFileExtensions(globDirectory);

  if (fileExtensions.length === 0) {
    throw new Error(errors['no-file-extensions-found']);
  }

  return inquirer.prompt([{
    name,
    message: 'Which file types would you like to precache?',
    type: 'checkbox',
    choices: fileExtensions,
    default: fileExtensions,
  }]);
}

module.exports = async (globDirectory) => {
  const answers = await askQuestion(globDirectory);
  const extensions = answers[name];
  if (extensions.length === 0) {
    throw new Error(errors['no-file-extensions-selected']);
  }

  return [`**/*.{${extensions.join(',')}}`];
};

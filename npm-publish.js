#!/usr/bin/env node
import { readPackageUpSync } from 'read-pkg-up';
import { getParams, shouldBuildVersion, getNewVersion, createNewVersion, pushToGitRepo, setupGit } from "./utils.js";

/**
 * Publish package
 * This module handles the publishing of the new version of the library.
 */
const {
  message: fullMessage,
  branch: fullBranch,
  publishBranches,
  wildcardBeta,
  wildcardMajor,
  wildcardMinor,
  wildcardNoPublish,
  gitEmail,
  gitName,
  commitMessage,
  tagName,
  registry,
} = getParams();

const message = fullMessage.split(/\\n|\n/)[0]; // Get just the first line of the message
const parentPackage = readPackageUpSync().packageJson;
const buildBeta = message.toLowerCase().includes(wildcardBeta);
// This exists since GITHUB_REF provided by GitHub Actions, unlike
// DRONE_BRANCH, CIRCLE_BRANCH, etc contains the `refs/heads/` prefix
const branch = fullBranch.replace('refs/heads/', '');

console.info('-------------------------------------------');
console.info('-------------   NPM PUBLISH   -------------');
console.info('-------------------------------------------');
console.info(`BRANCH: ${branch}`);
console.info(`MESSAGE: "${message}"`);
console.info(`WILDCARD_MAJOR: "${wildcardMajor}"`);
console.info(`WILDCARD_MINOR: "${wildcardMinor}"`);
console.info(`WILDCARD_BETA: "${wildcardBeta}"`);
console.info(`WILDCARD_NO_PUBLISH: "${wildcardNoPublish}"`);
console.info(`PUBLISH BRANCHES: ${publishBranches}\n`);

// 1. Check if we should build the version
if (!shouldBuildVersion(publishBranches, branch, message, wildcardNoPublish, buildBeta)) {
  console.info('[NPM-PUBLISH] Exit: No need to build the version');
  process.exit(0);
}

// 2. Define new version
const newVersion = getNewVersion(parentPackage.version, message, wildcardMinor, wildcardMajor, buildBeta);
console.info('-----------  VERSION  ------------');
console.info(`Creating version: ${newVersion}`);
console.info('Install it by running:');
console.info(`npm i --save ${parentPackage.name}@${newVersion}`);
console.info('---------------------------------\n');

// 3. Set up GIT
console.info('[NPM-PUBLISH] Reset changes & config git');
setupGit(branch, gitEmail, gitName);

// 4. Create and publish new version
console.info('[NPM-PUBLISH] Creating new version');
try {
  createNewVersion(newVersion, buildBeta, registry);
} catch (e) {
  console.info('[NPM-PUBLISH] Problem publishing dependency');
  console.info(e);
  process.exit(1);
}

// 5. Push changes to Git repository
if (!buildBeta) {
  console.info(`[NPM-PUBLISH] Pushing tag & commit to repository`);
  pushToGitRepo(branch, parentPackage.name, newVersion, commitMessage, tagName);
}

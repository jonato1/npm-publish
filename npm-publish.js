#!/usr/bin/env node
import { readPackageUpSync } from 'read-pkg-up';
import { params, shouldPublish, increment, betaVersion, create, publish, push, clean } from "./utils.js";

/**
 * Publish package
 * This module handles the publishing of the new version of the library.
 */
const {
  message: fullMessage,
  branch: fullBranch,
  mode,
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
} = params();

const message = fullMessage.split(/\\n|\n/)[0]; // Get just the first line of the message
const parentPackage = readPackageUpSync().packageJson;
const buildBeta = message.toLowerCase().includes(wildcardBeta);
// This exists since GITHUB_REF provided by GitHub Actions contains `refs/heads/`
// prefix in the branch name.  unlike DRONE_BRANCH, CIRCLE_BRANCH, etc 
const branch = fullBranch.replace('refs/heads/', '');

console.info('-------------------------------------------');
console.info('-------------   NPM PUBLISH   -------------');
console.info('-------------------------------------------');
console.info(`BRANCH: ${branch}`);
console.info(`MESSAGE: "${message}"`);
console.info(`MODE: ${mode}`);
console.info(`WILDCARD_MAJOR: "${wildcardMajor}"`);
console.info(`WILDCARD_MINOR: "${wildcardMinor}"`);
console.info(`WILDCARD_BETA: "${wildcardBeta}"`);
console.info(`WILDCARD_NO_PUBLISH: "${wildcardNoPublish}"`);
console.info(`PUBLISH BRANCHES: ${publishBranches}\n`);

// 1. Check if we should create the new version
if (!shouldPublish(publishBranches, branch, message, wildcardNoPublish, buildBeta)) {
  console.info('[NPM-PUBLISH] Exit: No need to publish the version');
  process.exit(0);
}

// 2. Create new version
if (mode === "create-version" || mode === "create-and-publish") {
  clean(branch); // We need a clean tree to be able to generate the version
  const newIncrement = increment(message, wildcardMinor, wildcardMajor);
  let newVersion = create(newIncrement);
  if (buildBeta) {
    const beta = betaVersion(newVersion);
    newVersion = create(beta);
  }
  console.info('----------------  VERSION  ----------------');
  console.info(`Version created: ${newVersion.trim()}`);
  console.info('Install it once published by running:');
  console.info(`npm i --save ${parentPackage.name}@${newVersion}`);
  console.info('-------------------------------------------\n');
}

// 3. Publish new version & push to git repository
if (mode === "publish" || mode === "create-and-publish") {
  // 3a. Publish new version
  try {
    console.info('[NPM-PUBLISH] Publishing new version');
    publish(buildBeta, registry);
  } catch (e) {
    console.info('[NPM-PUBLISH] Problem publishing dependency');
    console.info(e);
    process.exit(1);
  }

  // 3b. Push changes to Git repository
  if (!buildBeta) {
    console.info(`\n[NPM-PUBLISH] Pushing tag & commit to repository`);
    const updatedParentPackage = readPackageUpSync().packageJson;
    push(branch, updatedParentPackage, commitMessage, tagName, gitEmail, gitName);
  }
}

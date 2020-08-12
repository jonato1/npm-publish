#!/usr/bin/env node
const { execSync } = require('child_process');
const yargs = require('yargs');
const paramsJson = require('./params.json');
const readPkgUp = require('read-pkg-up');

/**
 * Publish package
 * This module handles the publishing of the new version of the library.
 */
const params = yargs
.scriptName("npm-publish")
.pkgConf('npm-publish')
.usage('$0 -b branch -m message')
.help();

// Initialize params
Object.keys(paramsJson).forEach(name => {
  params.option(name, {
    ...paramsJson[name],
  });
});
const {
  message: fullMessage,
  branch,
  publishBranches,
  wildcardBeta,
  wildcardMajor,
  wildcardMinor,
  wildcardNoPublish,
  gitEmail,
  gitName,
  commitMessage,
} = params.argv;

const message = fullMessage.split(/\\n|\n/)[0]; // Get just the first line of the message
const parentPackage = readPkgUp.sync().packageJson;
const buildBeta = message.toLowerCase().includes(wildcardBeta);
const betaVersion = `${parentPackage.version}-beta.${(Math.random() * 100).toFixed(0)}`;

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

if (!publishBranches.includes(branch) && !buildBeta) {
  console.info('[NPM-PUBLISH] Exit: No need to build the version');
  process.exit(0);
}

if (buildBeta) {
  console.info('--------   BETA VERSION  --------');
  console.info(`Creating beta version: ${betaVersion}`);
  console.info('Install it by running:');
  console.info(`npm i --save ${parentPackage.name}@${betaVersion}`);
  console.info('---------------------------------\n');
}

// Do not publish package if commit message contains [nopublish]
if (message.toLowerCase().includes(wildcardNoPublish)) {
  console.info(`[NPM-PUBLISH] Exit: ${wildcardNoPublish} present`);
  process.exit(0);
}

// Set git credentials
console.info('[NPM-PUBLISH] Config GIT');
try {
  execSync('command -v git');
} catch (e) {
  console.info('[NPM-PUBLISH] GIT not present, installing');
  execSync('apt install git');
}
if (gitEmail) {
  execSync(`git config --global user.email "${gitEmail}"`);
}
if (gitName) {
  execSync(`git config --global user.name "${gitName}"`);
}
execSync('git fetch');
execSync(`git checkout ${branch}`);
execSync('git reset --hard');

// Set type of version increment
let version = 'patch';
if (message.toLowerCase().includes(wildcardMinor)) {
  version = 'minor';
} else if (message.toLowerCase().includes(wildcardMajor)) {
  version = 'major';
}
if (buildBeta) {
  version = betaVersion;
}

try {
  console.info(`[NPM-PUBLISH] Creating new version with param: [${version}]`);
  execSync('npm config set unsafe-perm true');
  execSync(`npm version ${version} -m "${commitMessage}"`);
  execSync('npm config set unsafe-perm false');

  console.info(`[NPM-PUBLISH] Publish dependency ${buildBeta ? 'with --tag beta' : ''}`);
  execSync(`npm publish${buildBeta ? ' --tag beta' : ''}`);
} catch (e) {
  console.info('[NPM-PUBLISH] Problem publishing dependency');
  console.info(e);
  process.exit(1);
}

if (!buildBeta) {
  console.info(`[NPM-PUBLISH] Push changes to ${branch}`);
  execSync(`git push --tags --set-upstream origin ${branch}`);
}

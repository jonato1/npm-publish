import fs from "fs";
import path from 'path';
import yargs from 'yargs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { hideBin } from 'yargs/helpers';
import { findUpSync } from 'find-up';
import { readPackageUpSync } from 'read-pkg-up';

/**
 * Get's all the parameters based on the config or arguments passed.
 * @returns {object} object with all parameters
 */
export const getParams = () => {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const paramsJson = JSON.parse(fs.readFileSync(path.resolve(__dirname, "./params.json")));
  const configPath = findUpSync(['.npm-publish', '.npm-publish.json']);
  const config = configPath ? JSON.parse(fs.readFileSync(configPath)) : {};
  const argv = yargs(hideBin(process.argv));
  const params = argv
  .scriptName("npm-publish")
  .config(config)
  .pkgConf('npm-publish')
  .usage('$0 -b branch -m message')
  .help();

  // Initialize params
  Object.keys(paramsJson).forEach(name => {
    params.option(name, {
      ...paramsJson[name],
    });
  });

  return params.argv;
}

/**
 * Determines if we should create a new version or not, based on the message,
 * branch and the rest of the parameters
 * @returns {boolean} true|false
 */
export const shouldBuildVersion = (publishBranches, branch, message, wildcardNoPublish, buildBeta) => {
  const isPublishBranch = publishBranches.includes(branch);
  const isNoPublishPresent = message.toLowerCase().includes(wildcardNoPublish);
  return (isPublishBranch || buildBeta) && !isNoPublishPresent;
}

/**
 * Get the new version increment based on the commit message and the params
 * @returns patch | minor | major | 1.0.0-beta.xxx
 */
export const getVersionIncrement = (actualVersion, message, wildcardMinor, wildcardMajor, buildBeta) => {
  if (buildBeta) {
    const betaVersion = `${actualVersion}-beta.${(Math.random() * 100).toFixed(0)}`;
    return betaVersion;
  }
  if (message.toLowerCase().includes(wildcardMinor)) {
    return "minor";
  }
  if (message.toLowerCase().includes(wildcardMajor)) {
    return "major";
  }
  return "patch";
}

/**
 * Creates the new desired version updating the package.json and returns the new number
 * @param {string} version patch | minor | major | specific number (ex. 1.0.5)
 * @returns the new version number
 */
export const createNewVersion = (version) => {
  execSync('npm config set unsafe-perm true');
  execSync(`npm --no-git-tag-version version ${version}`);
  execSync('npm config set unsafe-perm false');
  const updatedPackage = readPackageUpSync().packageJson;
  return updatedPackage.version;
}

/**
 * Publish the new version to the 
 * @param {string} version patch | minor | major | specific number (ex. 1.0.5)
 * @returns the new version number
 */
export const publishNewVersion = (buildBeta, registry) => {
  execSync(`npm publish${buildBeta ? ' --tag beta' : ''}${registry ? ` --registry=${registry}` : ''}`);
}

/**
 * Creates a new commit and a tag and pushes to the git repository
 */
export const pushToGitRepo = (branch, parentPackage, commitMessage, tagName, gitEmail, gitName) => {
  const message = commitMessage.replace("%v", parentPackage.version).replace("%p", parentPackage.name)
  execSync("git add .");
  const author = gitEmail && gitName ? ` --author="${gitName} <${gitEmail}>"` : "";
  execSync(`git commit -m "${message}"${author}`);
  const gitTag = tagName.replace("%v", parentPackage.version).replace("%p", parentPackage.name);
  execSync(`git tag "${gitTag}"`);
  execSync(`git push --tags --set-upstream origin ${branch}`);
}

/**
 * Install git if it is not present
 */
export const installGit = () => {
  try {
    execSync('command -v git');
  } catch (e) {
    console.info('[NPM-PUBLISH] GIT not present, installing');
    execSync('apt install git');
  }
}

/**
 * Clean untracked changes. i.e. package-lock.json generated after npm i
 */
export const cleanChanges = () => {
  installGit();
  execSync(`git checkout . &>/dev/null`);
}
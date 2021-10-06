import fs from "fs";
import path from 'path';
import yargs from 'yargs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { hideBin } from 'yargs/helpers';

export const getParams = () => {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const paramsJson = JSON.parse(fs.readFileSync(path.resolve(__dirname, "./params.json")));
  const argv = yargs(hideBin(process.argv));
  const params = argv
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

  return params.argv;
}

export const shouldBuildVersion = (publishBranches, branch, message, wildcardNoPublish, buildBeta) => {
  const isPublishBranch = publishBranches.includes(branch);
  const isNoPublishPresent = message.toLowerCase().includes(wildcardNoPublish);
  return (isPublishBranch || buildBeta) && !isNoPublishPresent;
}

export const getNewVersion = (actualVersion, message, wildcardMinor, wildcardMajor, buildBeta) => {
  if (buildBeta) {
    const betaVersion = `${actualVersion}-beta.${(Math.random() * 100).toFixed(0)}`;
    return betaVersion;
  }
  if (message.toLowerCase().includes(wildcardMinor)) {
    return "minor";
  }
  if (message.toLowerCase().includes(wildcardMajor)) {
    version = "major";
  }
  return "patch";
}

export const createNewVersion = (version, buildBeta, registry) => {
  execSync('npm config set unsafe-perm true');
  execSync(`npm --no-git-tag-version version ${version}`);
  execSync('npm config set unsafe-perm false');
  execSync(`npm publish${buildBeta ? ' --tag beta' : ''}${registry ? ` --registry=${registry}` : ''}`);
}

export const pushToGitRepo = (branch, parentPackage, commitMessage, tagName) => {
  const message = commitMessage.replace("%v", parentPackage.version).replace("%p", parentPackage.name)
  execSync("git add .");
  execSync(`git commit -m "${message}"`);
  const gitTag = tagName.replace("%v", parentPackage.version).replace("%p", parentPackage.name);
  execSync(`git tag "${gitTag}"`);
  execSync(`git push --tags --set-upstream origin ${branch}`);
}

export const setupGit = (branch, gitEmail, gitName) => {
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
}
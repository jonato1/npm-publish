# GetYourGuide - npm publish
> CLI tool to handle publishing modules, detecting the version increment from the commit message, generating the tags and pushing to github.

### Features
- Allow to define increment (patch, minor, major) based on commit message.
- Allow to create beta versions based on the message.
- Increase automatically version in `package.json` creating a tag and pushing to your repo.
- Define branchs in which you want to publish and which ones to omit it.

### Workflow
- Push commits to a publish branch `[default: master]` using any of the wildcards as part of your message `[minor] ...` `[major] ...` and the library will generate a version for you. If it doesn't detect any wildcard, it will do a `patch`.
- Pushing commits to no-publish branches will omit the version generation.
- If you're in any branch and you would like to generate a beta version, just commit with `[beta] ...`

## Getting Started
```shell
npm install --save-dev @getyourguide/npm-publish
```

### Usage with Drone or Github Actions
1. Create a npm script in your `package.json`
```json
{
  "scripts": {
    "npm-publish": "npm-publish"
  }
}
```

2. Add a step to publish your module

**Drone**  
```yml
publish-package:
  image: node:12-buster
  commands:
    - npm run npm-publish -- -b ${DRONE_BRANCH} -m "$${DRONE_COMMIT_MESSAGE}"
```

**Github Actions**  
```yml
- name: Publish library
  run: npm run npm-publish -- -b "${{ github.ref }}" -m "${{ github.event.head_commit.message }}"
```
[workflow.yml full example](./docs/github-workflow-example.yml)  

## CLI Params
Run with `--help` to get a full list of params
```sh
npm-publish --help

Options:                                   
  --help                                                    
  --branch, -b           branch name                                         [required]
  --message, -m          commit message                                      [required]
  --publish-branches     branches where it should publish   [array] [default: "master"]
  --wildcard-minor       wildcard to identify a minor commit       [default: "[minor]"]
  --wildcard-major       wildcard to identify a major commit       [default: "[major]"]
  --wildcard-beta        wildcard to identify a beta commit         [default: "[beta]"]
  --wildcard-no-publish  wildcard to identify a nopublish commit    [default: "[beta]"]
  --git-email            git email to create the comit.   [default: "local git config"]
  --git-name             git name to create the commit.   [default: "local git config"]
  --registry             force npm registry to publish.   [default: ignore]
  --commit-message       commit message. Use %v to specify the version and %p for package
                                       [default: "[npm-publish] %p@%v [ci skip]"]
  --tag-name             git tag name. Use %v to specify the version and %p for package
                                       [default: "v%v"]
```

### Add config in package.json
You can also specify the params in your `package.json`. Add a section `npm-publish`
```json
{
  "npm-publish": {
    "publishBranches": ["master", "develop"],
    "wildcardMinor": "[custom-minor]",
    "wildcardMajor": "[custom-major]",
    "gitEmail": "it@mycompany.com",
    "gitName": "IT - MyCompany",
    "...": "..."
  }
}
```

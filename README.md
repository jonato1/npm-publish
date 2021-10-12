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
    - npm run npm-publish -- --branch ${DRONE_BRANCH} --message "$${DRONE_COMMIT_MESSAGE}"
```

**Github Actions**  
```yml
- name: Publish library
  run: npm run npm-publish -- --branch "${{ github.ref }}" --message "${{ github.event.head_commit.message }}"
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

### Configuration
There are 3 ways of specifing the configuration.  

#### 1. Passing directly params
```sh
npm-publish --branch test --message test --registry "test.com"
```

#### 2. Add config in package.json
You can also specify the params in your `package.json`. Add a section `npm-publish`.  
Params should be specified in camelCase.
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

#### 3. Add config in an external file
Create a file called `.npm-publish` and it will automatically be read by the library
```json
{
  "publishBranches": ["master", "develop"],
  "wildcardMinor": "[custom-minor]",
  "wildcardMajor": "[custom-major]",
  "gitEmail": "it@mycompany.com",
  "gitName": "IT - MyCompany",
  "...": "..."
}
```

#### Combining different config methods
You can combine the above methods according to your needs.  
They are listed in order of priority, so if you define the same parameter in the 3 places, first it will try to get it from the command line, if it doesn't exists then from the `package.json` section, and if it's also not there, it will try to get it from the `.npm-publish` file.

Suppose the existing configuration: 
```js
npm publish --branch cmd-branch

// package.json
{
  "npm-publish": {
    "branch": "pkg-branch",
    "registry": "pkg-registry",
  },
}

// .npm-publish
{
  "branch": "file-branch",
  "registry": "file-registry",
  "gitName": "file-git-name",
}

// Result: branch:cmd-branch registry:pkg-registry git-name:file-git-name
```

### Using the mode option
By default, the library will create a new version and publish it right away.  
There could be cases where you need only one of these actions or where you need to execute something between the version generation and the publish of the library.

#### using --mode create-version
This mode will just detect (based on the message and the params) what's the next version to generate,  
and it will update the package.json with the new version.  
Notice that it won't publish the library
```
npm-publish --mode create-version --branch test --message test
```

#### using --mode publish
This mode will publish a previous generated version, create the tag for the new version and push a commit to your github repo.  
Notice that you'll need to update the package version previously.  
```
npm version patch
npm-publish --mode publish --branch test --message test
```

#### Running command between version generation and publish
```yml
create-version:
  image: node:12-buster
  commands:
    - npm run npm-publish -- --mode create-version --branch ${DRONE_BRANCH} --message "$${DRONE_COMMIT_MESSAGE}"
custom-command:
  image: node:12-buster
  commands:
    - Run a command with the updated package.json version number
publish-version:
  image: node:12-buster
  commands:
    - npm run npm-publish -- --mode publish --branch ${DRONE_BRANCH} --message "$${DRONE_COMMIT_MESSAGE}"
```

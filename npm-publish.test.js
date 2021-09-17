const mockExecSync = jest.fn();
let mockParams = {};
global.console = { info: jest.fn() };
jest.mock("child_process", () => ( { execSync: mockExecSync }));
jest.mock('yargs', () => ({
  scriptName: () => ({
    pkgConf: () => ({
      usage: () => ({
        help: () => ({
          argv: {
            commitMessage: "[npm-publish] %p@%v [ci skip]",
            tagName: "v1.0.8",
            ...mockParams,
          },
          option: jest.fn(),
        })
      })
    })
  })
}));
jest.mock('read-pkg-up', () => ({
  sync: () => ({
    packageJson: {
      version: "1.0.0",
      name: "parent-package",
    }
  })
}));

const commonExecCalls = [
  ['command -v git'],
  ['git fetch'],
  ['git checkout master'],
  ['git reset --hard'],
  ['npm config set unsafe-perm true'],
]

describe('npm-publish', () => {
  afterEach(() => {
    global.console.info.mockClear();
    mockExecSync.mockClear();
    jest.resetModules();
  });
  
  test('should exit on a non publish branch', () => {
    mockParams = {
      message: 'TEST',
      branch: 'no-publish-branch',
      publishBranches: ['master'],
    }
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});
    require('./npm-publish');
    expect(mockExit).toHaveBeenCalledWith(0);
  });

  test('should publish patch version', () => {
    mockParams = {
      message: 'TEST',
      branch: 'master',
      publishBranches: ['master'],
      commitMessage: 'COMMIT-MESSAGE',
    }
    require('./npm-publish');
    expect(mockExecSync.mock.calls).toEqual([
      ...commonExecCalls,
      ['npm --no-git-tag-version version patch'],
      ['npm config set unsafe-perm false'],
      ['npm publish'],
      ['git add .'],
      ['git commit -m "COMMIT-MESSAGE"'],
      ['git tag "v1.0.8"'],
      ['git push --tags --set-upstream origin master'],
    ]);
  });

  test('should publish minor version', () => {
    mockParams = {
      message: '[minor] TEST',
      branch: 'master',
      publishBranches: ['master'],
      commitMessage: 'COMMIT-MESSAGE',
      wildcardMinor: '[minor]',
    }
    require('./npm-publish');
    expect(mockExecSync.mock.calls).toEqual([
      ...commonExecCalls,
      ['npm --no-git-tag-version version minor'],
      ['npm config set unsafe-perm false'],
      ['npm publish'],
      ['git add .'],
      ['git commit -m "COMMIT-MESSAGE"'],
      ['git tag "v1.0.8"'],
      ['git push --tags --set-upstream origin master'],
    ]);
  });

  test('should publish beta version', () => {
    mockParams = {
      message: '[beta] TEST',
      branch: 'any-branch',
      publishBranches: ['master'],
      commitMessage: 'COMMIT-MESSAGE',
      wildcardBeta: '[beta]',
    }
    require('./npm-publish');
    expect(mockExecSync).toHaveBeenLastCalledWith('npm publish --tag beta');
  });

  test('should publish using a different publish branch', () => {
    mockParams = {
      message: 'TEST',
      branch: 'master-v2',
      publishBranches: ['master', 'master-v2'],
      commitMessage: 'COMMIT-MESSAGE',
    }
    require('./npm-publish');
    expect(mockExecSync.mock.calls).toEqual([
      ['command -v git'],
      ['git fetch'],
      ['git checkout master-v2'],
      ['git reset --hard'],
      ['npm config set unsafe-perm true'],  
      ['npm --no-git-tag-version version patch'],
      ['npm config set unsafe-perm false'],
      ['npm publish'],
      ['git add .'],
      ['git commit -m "COMMIT-MESSAGE"'],
      ['git tag "v1.0.8"'],
      ['git push --tags --set-upstream origin master-v2'],
    ]);
  });

  test('branch detection should work using a github ref', () => {
    mockParams = {
      message: 'TEST',
      branch: 'refs/heads/master',
      publishBranches: ['master'],
      commitMessage: 'COMMIT-MESSAGE',
    }
    require('./npm-publish');
    expect(mockExecSync.mock.calls).toEqual([
      ...commonExecCalls,
      ['npm --no-git-tag-version version patch'],
      ['npm config set unsafe-perm false'],
      ['npm publish'],
      ['git add .'],
      ['git commit -m "COMMIT-MESSAGE"'],
      ['git tag "v1.0.8"'],
      ['git push --tags --set-upstream origin master'],
    ]);
  });
});
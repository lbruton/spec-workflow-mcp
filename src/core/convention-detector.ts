import { readFile, readdir, stat, mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { PathUtils } from './path-utils.js';

export interface ProjectConventions {
  schemaVersion: 1;
  detectedAt: string;
  testing: {
    framework: string | null;
    command: string | null;
    configFile: string | null;
    testDir: string | null;
    hasBrowserbase: boolean;
  };
  versioning: {
    hasVersionLock: boolean;
    lockFile: string | null;
    packageVersion: string | null;
    userDeclinedSetup: boolean;
  };
  changelog: {
    hasChangelog: boolean;
    file: string | null;
    format: string | null;
    docvaultFallback: boolean;
  };
}

/** Safely read a file, returning null on any error. */
async function safeReadFile(filePath: string): Promise<string | null> {
  try {
    return await readFile(filePath, 'utf-8');
  } catch {
    return null;
  }
}

/** Check if a path exists and is a directory. */
async function isDirectory(dirPath: string): Promise<boolean> {
  try {
    const s = await stat(dirPath);
    return s.isDirectory();
  } catch {
    return false;
  }
}

/** Check if a file exists. */
async function fileExists(filePath: string): Promise<boolean> {
  try {
    const s = await stat(filePath);
    return s.isFile();
  } catch {
    return false;
  }
}

/** Find the first existing file from a list of candidates. Returns the relative path or null. */
async function findFirstFile(projectPath: string, candidates: string[]): Promise<string | null> {
  for (const candidate of candidates) {
    if (await fileExists(join(projectPath, candidate))) {
      return candidate;
    }
  }
  return null;
}

/** Detect testing framework, command, config file, test directory, and browserbase usage. */
async function detectTesting(projectPath: string): Promise<ProjectConventions['testing']> {
  let framework: string | null = null;
  let command: string | null = null;
  let configFile: string | null = null;
  let testDir: string | null = null;
  let hasBrowserbase = false;

  // --- Framework detection (priority order) ---

  // Vitest
  const vitestConfigs = [
    'vitest.config.ts', 'vitest.config.js', 'vitest.config.mts', 'vitest.config.mjs',
  ];
  const vitestConfig = await findFirstFile(projectPath, vitestConfigs);
  if (vitestConfig) {
    framework = 'vitest';
    command = 'npx vitest';
    configFile = vitestConfig;
  }

  // Jest (only if vitest not found)
  if (!framework) {
    const jestConfigs = [
      'jest.config.ts', 'jest.config.js', 'jest.config.mjs', 'jest.config.cjs', 'jest.config.json',
    ];
    const jestConfig = await findFirstFile(projectPath, jestConfigs);
    if (jestConfig) {
      framework = 'jest';
      command = 'npx jest';
      configFile = jestConfig;
    }
  }

  // Pytest
  if (!framework) {
    const pytestConfigs = ['pytest.ini', 'pyproject.toml', 'setup.cfg'];
    for (const candidate of pytestConfigs) {
      const content = await safeReadFile(join(projectPath, candidate));
      if (content !== null) {
        // For pyproject.toml and setup.cfg, check for pytest section
        if (candidate === 'pytest.ini') {
          framework = 'pytest';
          command = 'pytest';
          configFile = candidate;
          break;
        }
        if (candidate === 'pyproject.toml' && content.includes('[tool.pytest')) {
          framework = 'pytest';
          command = 'pytest';
          configFile = candidate;
          break;
        }
        if (candidate === 'setup.cfg' && content.includes('[tool:pytest]')) {
          framework = 'pytest';
          command = 'pytest';
          configFile = candidate;
          break;
        }
      }
    }
  }

  // Mocha (check package.json devDependencies or config files)
  if (!framework) {
    const mochaConfigs = ['.mocharc.yml', '.mocharc.yaml', '.mocharc.js', '.mocharc.json', '.mocharc.cjs'];
    const mochaConfig = await findFirstFile(projectPath, mochaConfigs);
    if (mochaConfig) {
      framework = 'mocha';
      command = 'npx mocha';
      configFile = mochaConfig;
    }
  }

  // package.json scripts.test fallback
  if (!framework) {
    const pkgContent = await safeReadFile(join(projectPath, 'package.json'));
    if (pkgContent) {
      try {
        const pkg = JSON.parse(pkgContent);
        const testScript: string | undefined = pkg?.scripts?.test;
        if (testScript) {
          // Infer framework from test script content
          if (testScript.includes('vitest')) {
            framework = 'vitest';
            configFile = 'package.json';
          } else if (testScript.includes('jest')) {
            framework = 'jest';
            configFile = 'package.json';
          } else if (testScript.includes('mocha')) {
            framework = 'mocha';
            configFile = 'package.json';
          } else if (testScript.includes('pytest')) {
            framework = 'pytest';
            configFile = 'package.json';
          }
          command = testScript.startsWith('npm') ? testScript : `npm test`;
        }
      } catch {
        // Invalid JSON — ignore
      }
    }
  }

  // --- Browserbase / bb-test detection ---
  const runbookDir = join(projectPath, 'tests', 'runbook');
  if (await isDirectory(runbookDir)) {
    hasBrowserbase = true;
    if (!framework) {
      framework = 'bb-test';
      testDir = 'tests/runbook/';
      // Count runbook sections for the command hint
      try {
        const entries = await readdir(runbookDir);
        const sections = entries.filter(e => !e.startsWith('.')).length;
        command = `/bb-test sections=${sections}`;
      } catch {
        command = '/bb-test';
      }
    }
  }

  // Check CLAUDE.md for bb-test references
  if (!hasBrowserbase) {
    const claudeMd = await safeReadFile(join(projectPath, 'CLAUDE.md'));
    if (claudeMd && (claudeMd.includes('/bb-test') || claudeMd.includes('bb-test'))) {
      hasBrowserbase = true;
    }
  }

  // --- Test directory detection ---
  if (!testDir) {
    const testDirCandidates = [
      'src/__tests__',
      'tests/',
      'test/',
      '__tests__/',
    ];
    for (const candidate of testDirCandidates) {
      const candidatePath = join(projectPath, candidate.replace(/\/$/, ''));
      if (await isDirectory(candidatePath)) {
        testDir = candidate;
        break;
      }
    }
  }

  return { framework, command, configFile, testDir, hasBrowserbase };
}

/** Detect versioning conventions. */
async function detectVersioning(projectPath: string): Promise<ProjectConventions['versioning']> {
  let hasVersionLock = false;
  let lockFile: string | null = null;
  let packageVersion: string | null = null;
  const userDeclinedSetup = false;

  // Check devops/version.lock
  const versionLockPath = join(projectPath, 'devops', 'version.lock');
  if (await fileExists(versionLockPath)) {
    hasVersionLock = true;
    lockFile = 'devops/version.lock';
  }

  // Check package.json version
  const pkgContent = await safeReadFile(join(projectPath, 'package.json'));
  if (pkgContent) {
    try {
      const pkg = JSON.parse(pkgContent);
      if (pkg?.version && typeof pkg.version === 'string') {
        packageVersion = pkg.version;
      }
    } catch {
      // Invalid JSON — ignore
    }
  }

  // Check .version file
  if (!hasVersionLock && !packageVersion) {
    const dotVersionPath = join(projectPath, '.version');
    const dotVersion = await safeReadFile(dotVersionPath);
    if (dotVersion !== null) {
      hasVersionLock = true;
      lockFile = '.version';
    }
  }

  return { hasVersionLock, lockFile, packageVersion, userDeclinedSetup };
}

/** Detect changelog presence and format. */
async function detectChangelog(projectPath: string): Promise<ProjectConventions['changelog']> {
  let hasChangelog = false;
  let file: string | null = null;
  let format: string | null = null;
  const docvaultFallback = false;

  const changelogCandidates = ['CHANGELOG.md', 'CHANGES.md', 'HISTORY.md'];
  for (const candidate of changelogCandidates) {
    const content = await safeReadFile(join(projectPath, candidate));
    if (content !== null) {
      hasChangelog = true;
      file = candidate;
      format = detectChangelogFormat(content);
      break;
    }
  }

  return { hasChangelog, file, format, docvaultFallback };
}

/** Detect changelog format from file content (reads first ~20 lines). */
function detectChangelogFormat(content: string): string {
  const lines = content.split('\n').slice(0, 20);
  const header = lines.join('\n');

  // keepachangelog: has ## [Unreleased] or ## [X.Y.Z] with Added/Changed/Fixed sections
  const hasVersionHeaders = /## \[(Unreleased|\d+\.\d+\.\d+)]/i.test(header);
  const hasSections = /(### (Added|Changed|Deprecated|Removed|Fixed|Security))/i.test(header);
  if (hasVersionHeaders && hasSections) {
    return 'keepachangelog';
  }
  // Also match keepachangelog if just the version header pattern is present with the right title
  if (hasVersionHeaders && /keep.?a.?changelog/i.test(header)) {
    return 'keepachangelog';
  }

  // conventional-changelog: typically starts with # followed by version + date and has commit-style entries
  if (/^#+ \d+\.\d+\.\d+/m.test(header) && /\* \*\*\w+:\*\*/m.test(header)) {
    return 'conventional';
  }

  // If it has version headers but doesn't match the above patterns
  if (hasVersionHeaders) {
    return 'keepachangelog';
  }

  return 'custom';
}

/**
 * Scan a project directory and detect its testing, versioning, and changelog conventions.
 *
 * All filesystem errors are handled gracefully — missing files produce null values, never throw.
 * Works on any project directory, including empty ones.
 */
export async function detectConventions(projectPath: string): Promise<ProjectConventions> {
  const [testing, versioning, changelog] = await Promise.all([
    detectTesting(projectPath),
    detectVersioning(projectPath),
    detectChangelog(projectPath),
  ]);

  return {
    schemaVersion: 1,
    detectedAt: new Date().toISOString(),
    testing,
    versioning,
    changelog,
  };
}

/**
 * Write detected conventions to the workflow root.
 *
 * When DocVault is configured: writes to DocVault specflow root.
 * Otherwise: writes to local `.specflow/`.
 */
export async function writeConventions(projectPath: string, conventions: ProjectConventions): Promise<void> {
  // Use DocVault workflow root when configured, otherwise local .specflow/
  const dir = PathUtils.isDocVaultConfigured()
    ? PathUtils.getWorkflowRoot(projectPath)
    : join(projectPath, '.specflow');
  try {
    await mkdir(dir, { recursive: true });
  } catch {
    // Directory may already exist — ignore
  }
  const filePath = join(dir, 'project-conventions.json');
  await writeFile(filePath, JSON.stringify(conventions, null, 2) + '\n', 'utf-8');
}

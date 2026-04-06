import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { Stats } from 'fs';
import type { ProjectConventions } from '../convention-detector.js';

const __dirname_test = dirname(fileURLToPath(import.meta.url));

// Mock fs/promises before importing the module under test
vi.mock('fs/promises', () => ({
  readFile: vi.fn(),
  mkdir: vi.fn(),
  writeFile: vi.fn(),
  stat: vi.fn(),
}));

import { readFile, mkdir, writeFile, stat } from 'fs/promises';
import { generateUserTemplates, writeUserTemplates } from '../template-generator.js';

const mockReadFile = vi.mocked(readFile);
const mockMkdir = vi.mocked(mkdir);
const mockWriteFile = vi.mocked(writeFile);
const mockStat = vi.mocked(stat);

/** Helper: create a fake Stats for a file. */
function fakeFileStat(): Stats {
  return { isFile: () => true, isDirectory: () => false } as unknown as Stats;
}

/** Minimal design template with a Testing Strategy section. */
const MOCK_DESIGN_TEMPLATE = `# Design

## Architecture
[Architecture details]

## Testing Strategy
[Default testing strategy placeholder]

## Rollback Plan
[Rollback details]
`;

/** Minimal tasks template with a Standard Closing Tasks section. */
const MOCK_TASKS_TEMPLATE = `# Tasks

- [ ] 1. First task
  - Do the thing

## Standard Closing Tasks

- [ ] 6. Default closing task
  - Default details
`;

/** Build a conventions object with sensible defaults and overrides. */
function makeConventions(overrides: {
  testing?: Partial<ProjectConventions['testing']>;
  versioning?: Partial<ProjectConventions['versioning']>;
  changelog?: Partial<ProjectConventions['changelog']>;
} = {}): ProjectConventions {
  return {
    schemaVersion: 1,
    detectedAt: '2026-04-03T00:00:00.000Z',
    testing: {
      framework: null,
      command: null,
      configFile: null,
      testDir: null,
      hasBrowserbase: false,
      ...overrides.testing,
    },
    versioning: {
      hasVersionLock: false,
      lockFile: null,
      packageVersion: null,
      userDeclinedSetup: false,
      ...overrides.versioning,
    },
    changelog: {
      hasChangelog: false,
      file: null,
      format: null,
      docvaultFallback: false,
      ...overrides.changelog,
    },
  };
}

beforeEach(() => {
  vi.resetAllMocks();
  const enoent = Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
  mockStat.mockRejectedValue(enoent);
  mockReadFile.mockRejectedValue(enoent);
});

/**
 * Set up readFile to serve mock templates.
 * readDefaultTemplate checks project .specflow/templates/ first, then bundled.
 * We simulate the bundled fallback by matching on the path containing 'markdown/templates/'.
 */
function setupTemplateReads() {
  mockReadFile.mockImplementation(async (p) => {
    const path = String(p);
    if (path.includes('markdown/templates/design-template.md')) return MOCK_DESIGN_TEMPLATE;
    if (path.includes('markdown/templates/tasks-template.md')) return MOCK_TASKS_TEMPLATE;
    throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
  });
}

describe('generateUserTemplates', () => {
  it('should generate browserbase-specific templates', async () => {
    setupTemplateReads();
    const conventions = makeConventions({
      testing: { hasBrowserbase: true, framework: 'bb-test', testDir: 'tests/runbook/' },
    });

    const result = await generateUserTemplates('/fake/project', conventions);

    // Design template should contain Runbook E2E Tests section
    expect(result.designTemplate).toContain('Runbook E2E Tests');
    expect(result.designTemplate).toContain('tests/runbook/');

    // Tasks template should contain /bb-test references AND verification.md
    expect(result.tasksTemplate).toContain('/bb-test');
    expect(result.tasksTemplate).toContain('runbook');
    expect(result.tasksTemplate).toContain('verification.md');
  });

  it('should generate vitest-specific templates', async () => {
    setupTemplateReads();
    const conventions = makeConventions({
      testing: { framework: 'vitest', command: 'npx vitest', configFile: 'vitest.config.ts' },
    });

    const result = await generateUserTemplates('/fake/project', conventions);

    // Should reference vitest
    expect(result.designTemplate).toContain('vitest');
    expect(result.tasksTemplate).toContain('npx vitest');

    // Should contain verification.md and log-implementation gate
    expect(result.tasksTemplate).toContain('verification.md');
    expect(result.tasksTemplate).toContain('log-implementation');

    // Should NOT contain upstream TypeScript/React/Express sample references
    expect(result.tasksTemplate).not.toContain('TypeScript');
    expect(result.tasksTemplate).not.toContain('IFeatureService');
    expect(result.tasksTemplate).not.toContain('BaseComponent');

    // Should NOT contain browserbase references
    expect(result.designTemplate).not.toContain('bb-test');
    expect(result.designTemplate).not.toContain('runbook');
    expect(result.tasksTemplate).not.toContain('bb-test');
    expect(result.tasksTemplate).not.toContain('Runbook');
  });

  it('should use generic fallbacks when all testing fields are null', async () => {
    setupTemplateReads();
    const conventions = makeConventions(); // all defaults (null)

    const result = await generateUserTemplates('/fake/project', conventions);

    // Should use generic fallback values
    expect(result.designTemplate).toContain('npm test');
    expect(result.designTemplate).toContain('tests/');
    expect(result.tasksTemplate).toContain('npm test');

    // Should contain the HARD GATE and verification artifacts
    expect(result.tasksTemplate).toContain('HARD GATE');
    expect(result.tasksTemplate).toContain('verification.md');
    expect(result.tasksTemplate).toContain('log-implementation');

    // Should NOT contain upstream TypeScript/React/Express sample references
    expect(result.tasksTemplate).not.toContain('TypeScript');
    expect(result.tasksTemplate).not.toContain('IFeatureService');
    expect(result.tasksTemplate).not.toContain('BaseComponent');

    // Should NOT contain browserbase references
    expect(result.designTemplate).not.toContain('bb-test');
    expect(result.tasksTemplate).not.toContain('bb-test');
  });
});

describe('bundled tasks-template.md', () => {
  it('should contain MANDATORY GATES comment and no upstream sample references', () => {
    // Read the source template directly from disk
    const templatePath = join(__dirname_test, '..', '..', 'markdown', 'templates', 'tasks-template.md');
    const content = readFileSync(templatePath, 'utf-8');

    // Must contain the MANDATORY GATES HTML comment
    expect(content).toContain('MANDATORY GATES');

    // Must NOT contain upstream Pimzino TypeScript/React/Express sample references
    expect(content).not.toContain('TypeScript');
    expect(content).not.toContain('React');
    expect(content).not.toContain('Express');
    expect(content).not.toContain('IFeatureService');
    expect(content).not.toContain('BaseComponent');
  });
});

describe('writeUserTemplates', () => {
  it('should not overwrite existing user-template files', async () => {
    // Simulate that the design template already exists
    mockStat.mockImplementation(async (p) => {
      const path = String(p);
      if (path.endsWith('user-templates/design-template.md')) return fakeFileStat();
      throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
    });

    const templates = {
      designTemplate: '# New design',
      tasksTemplate: '# New tasks',
    };

    await writeUserTemplates('/fake/project', templates);

    // Should NOT have written anything since a user-template already exists
    expect(mockWriteFile).not.toHaveBeenCalled();
    expect(mockMkdir).not.toHaveBeenCalled();
  });

  it('should write templates when no user-templates exist', async () => {
    // All stat calls reject (no existing files) — default from beforeEach
    mockMkdir.mockResolvedValue(undefined);
    mockWriteFile.mockResolvedValue(undefined);

    const templates = {
      designTemplate: '# Generated design',
      tasksTemplate: '# Generated tasks',
    };

    await writeUserTemplates('/fake/project', templates);

    expect(mockMkdir).toHaveBeenCalledWith(
      '/fake/project/.specflow/user-templates',
      { recursive: true },
    );
    expect(mockWriteFile).toHaveBeenCalledTimes(2);
    expect(mockWriteFile).toHaveBeenCalledWith(
      '/fake/project/.specflow/user-templates/design-template.md',
      '# Generated design',
      'utf-8',
    );
    expect(mockWriteFile).toHaveBeenCalledWith(
      '/fake/project/.specflow/user-templates/tasks-template.md',
      '# Generated tasks',
      'utf-8',
    );
  });
});

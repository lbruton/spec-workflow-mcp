import { describe, it, expect, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, chmodSync } from 'fs';
import { join, resolve } from 'path';
import { tmpdir } from 'os';
import {
  loadConfig,
  createDefaultConfig,
  loadOrCreateConfig,
} from '../config-loader.js';

describe('loadConfig', () => {
  let tempDir: string;

  afterEach(() => {
    if (tempDir) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  function setupProject(
    config: Record<string, unknown>,
    opts?: { createDocVault?: boolean },
  ): void {
    tempDir = mkdtempSync(join(tmpdir(), 'specflow-cfg-'));
    const specflowDir = join(tempDir, '.specflow');
    mkdirSync(specflowDir, { recursive: true });
    writeFileSync(
      join(specflowDir, 'config.json'),
      JSON.stringify(config, null, 2),
    );
    if (opts?.createDocVault !== false) {
      // Create the DocVault directory that the config points to
      const dvPath = config.docvault as string;
      const abs = resolve(tempDir, dvPath);
      mkdirSync(abs, { recursive: true });
    }
  }

  it('returns correct ResolvedConfig with valid config.json', async () => {
    setupProject({
      project: 'MyProject',
      docvault: '../DocVault',
      issue_prefix: 'MP',
    });

    const result = await loadConfig(tempDir);
    expect(result.project).toBe('MyProject');
    expect(result.docvault).toBe('../DocVault');
    expect(result.issue_prefix).toBe('MP');
    expect(result.docvaultAbsolute).toBe(resolve(tempDir, '../DocVault'));
    expect(result.specflowRoot).toBe(
      join(resolve(tempDir, '../DocVault'), 'specflow', 'MyProject'),
    );
    expect(result.globalTemplatesPath).toBe(
      join(resolve(tempDir, '../DocVault'), 'specflow', 'templates'),
    );
  });

  it('resolves relative docvault path against projectPath', async () => {
    setupProject({
      project: 'TestApp',
      docvault: '../DocVault',
      issue_prefix: 'TA',
    });

    const result = await loadConfig(tempDir);
    expect(result.docvaultAbsolute).toBe(resolve(tempDir, '../DocVault'));
  });

  it('resolves absolute docvault path as-is', async () => {
    tempDir = mkdtempSync(join(tmpdir(), 'specflow-cfg-'));
    const absDocVault = mkdtempSync(join(tmpdir(), 'specflow-dv-'));
    const specflowDir = join(tempDir, '.specflow');
    mkdirSync(specflowDir, { recursive: true });
    writeFileSync(
      join(specflowDir, 'config.json'),
      JSON.stringify({
        project: 'AbsTest',
        docvault: absDocVault,
        issue_prefix: 'AT',
      }),
    );

    const result = await loadConfig(tempDir);
    expect(result.docvaultAbsolute).toBe(absDocVault);

    // Clean up extra temp dir
    rmSync(absDocVault, { recursive: true, force: true });
  });

  it('throws on missing config.json (ENOENT)', async () => {
    tempDir = mkdtempSync(join(tmpdir(), 'specflow-cfg-'));
    // No .specflow/ directory at all
    await expect(loadConfig(tempDir)).rejects.toThrow();
  });

  it('throws on invalid project name', async () => {
    setupProject({
      project: 'My Project!',
      docvault: '../DocVault',
      issue_prefix: 'MP',
    });

    await expect(loadConfig(tempDir)).rejects.toThrow(/Invalid project name/);
  });

  it('throws on empty project field', async () => {
    setupProject({
      project: '',
      docvault: '../DocVault',
      issue_prefix: 'MP',
    });

    await expect(loadConfig(tempDir)).rejects.toThrow(/Invalid project name/);
  });

  it('throws on empty docvault field', async () => {
    setupProject({
      project: 'TestApp',
      docvault: '',
      issue_prefix: 'TA',
    });

    await expect(loadConfig(tempDir)).rejects.toThrow(
      /docvault path must be a non-empty string/,
    );
  });

  it('throws on empty issue_prefix field', async () => {
    setupProject({
      project: 'TestApp',
      docvault: '../DocVault',
      issue_prefix: '',
    });

    await expect(loadConfig(tempDir)).rejects.toThrow(/Invalid issue_prefix/);
  });

  it('throws on inaccessible docvault path', async () => {
    setupProject(
      {
        project: 'TestApp',
        docvault: '../NonExistent',
        issue_prefix: 'TA',
      },
      { createDocVault: false },
    );

    await expect(loadConfig(tempDir)).rejects.toThrow(
      /DocVault path does not exist/,
    );
  });
});

describe('createDefaultConfig', () => {
  let tempDir: string;
  let parentDir: string;

  afterEach(() => {
    if (parentDir) {
      rmSync(parentDir, { recursive: true, force: true });
    } else if (tempDir) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('auto-detects project name from dirname', async () => {
    parentDir = mkdtempSync(join(tmpdir(), 'specflow-parent-'));
    const projectDir = join(parentDir, 'MyProject');
    const docVaultDir = join(parentDir, 'DocVault');
    mkdirSync(projectDir, { recursive: true });
    mkdirSync(docVaultDir, { recursive: true });

    tempDir = projectDir;
    const result = await createDefaultConfig(projectDir);
    expect(result.project).toBe('MyProject');
  });

  it('detects ../DocVault sibling', async () => {
    parentDir = mkdtempSync(join(tmpdir(), 'specflow-parent-'));
    const projectDir = join(parentDir, 'TestApp');
    const docVaultDir = join(parentDir, 'DocVault');
    mkdirSync(projectDir, { recursive: true });
    mkdirSync(docVaultDir, { recursive: true });

    tempDir = projectDir;
    const result = await createDefaultConfig(projectDir);
    expect(result.docvault).toBe('../DocVault');
    expect(result.docvaultAbsolute).toBe(resolve(projectDir, '../DocVault'));
  });

  it('throws when no DocVault found', async () => {
    parentDir = mkdtempSync(join(tmpdir(), 'specflow-parent-'));
    const projectDir = join(parentDir, 'Lonely');
    mkdirSync(projectDir, { recursive: true });

    tempDir = projectDir;
    await expect(createDefaultConfig(projectDir)).rejects.toThrow(
      /Could not auto-detect DocVault/,
    );
  });
});

describe('loadOrCreateConfig', () => {
  let parentDir: string;

  afterEach(() => {
    if (parentDir) {
      rmSync(parentDir, { recursive: true, force: true });
    }
  });

  it('loads existing config', async () => {
    parentDir = mkdtempSync(join(tmpdir(), 'specflow-parent-'));
    const projectDir = join(parentDir, 'ExistingProject');
    const docVaultDir = join(parentDir, 'DocVault');
    mkdirSync(projectDir, { recursive: true });
    mkdirSync(docVaultDir, { recursive: true });
    const specflowDir = join(projectDir, '.specflow');
    mkdirSync(specflowDir, { recursive: true });
    writeFileSync(
      join(specflowDir, 'config.json'),
      JSON.stringify({
        project: 'ExistingProject',
        docvault: '../DocVault',
        issue_prefix: 'EP',
      }),
    );

    const result = await loadOrCreateConfig(projectDir);
    expect(result.project).toBe('ExistingProject');
    expect(result.issue_prefix).toBe('EP');
  });

  it('creates config when none exists', async () => {
    parentDir = mkdtempSync(join(tmpdir(), 'specflow-parent-'));
    const projectDir = join(parentDir, 'NewProject');
    const docVaultDir = join(parentDir, 'DocVault');
    mkdirSync(projectDir, { recursive: true });
    mkdirSync(docVaultDir, { recursive: true });

    const result = await loadOrCreateConfig(projectDir);
    expect(result.project).toBe('NewProject');
    expect(result.docvault).toBe('../DocVault');
  });
});

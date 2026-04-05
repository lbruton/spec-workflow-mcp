import { describe, it, expect, afterEach } from 'vitest';
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  rmSync,
  existsSync,
  readFileSync,
  readdirSync,
} from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { needsMigration, migrateToDocVault } from '../migration.js';
import type { ResolvedConfig } from '../config-loader.js';

function makeConfig(
  tempDir: string,
  specflowRoot: string,
): ResolvedConfig {
  return {
    project: 'TestProject',
    docvault: '../DocVault',
    issue_prefix: 'TP',
    docvaultAbsolute: join(tempDir, 'DocVault'),
    specflowRoot,
    globalTemplatesPath: join(tempDir, 'DocVault', 'specflow', 'templates'),
  };
}

describe('needsMigration', () => {
  let tempDir: string;

  afterEach(() => {
    if (tempDir) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('returns true when .specflow/ has specs/', async () => {
    tempDir = mkdtempSync(join(tmpdir(), 'specflow-mig-'));
    const specsDir = join(tempDir, '.specflow', 'specs');
    mkdirSync(specsDir, { recursive: true });
    writeFileSync(join(specsDir, 'some-spec.md'), '# Spec');

    const config = makeConfig(tempDir, join(tempDir, 'DocVault', 'specflow', 'TestProject'));
    expect(await needsMigration(tempDir, config)).toBe(true);
  });

  it('returns true when .specflow/ has steering/', async () => {
    tempDir = mkdtempSync(join(tmpdir(), 'specflow-mig-'));
    const steeringDir = join(tempDir, '.specflow', 'steering');
    mkdirSync(steeringDir, { recursive: true });
    writeFileSync(join(steeringDir, 'product.md'), '# Product');

    const config = makeConfig(tempDir, join(tempDir, 'DocVault', 'specflow', 'TestProject'));
    expect(await needsMigration(tempDir, config)).toBe(true);
  });

  it('returns false when .specflow/ is empty (only config.json)', async () => {
    tempDir = mkdtempSync(join(tmpdir(), 'specflow-mig-'));
    const specflowDir = join(tempDir, '.specflow');
    mkdirSync(specflowDir, { recursive: true });
    writeFileSync(join(specflowDir, 'config.json'), '{}');

    const config = makeConfig(tempDir, join(tempDir, 'DocVault', 'specflow', 'TestProject'));
    expect(await needsMigration(tempDir, config)).toBe(false);
  });

  it('returns false when .specflow/ does not exist', async () => {
    tempDir = mkdtempSync(join(tmpdir(), 'specflow-mig-'));

    const config = makeConfig(tempDir, join(tempDir, 'DocVault', 'specflow', 'TestProject'));
    expect(await needsMigration(tempDir, config)).toBe(false);
  });
});

describe('migrateToDocVault', () => {
  let tempDir: string;

  afterEach(() => {
    if (tempDir) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  function setupLocalSpecflow(dirs: Record<string, Record<string, string>>): void {
    for (const [dirName, files] of Object.entries(dirs)) {
      const dirPath = join(tempDir, '.specflow', dirName);
      mkdirSync(dirPath, { recursive: true });
      for (const [fileName, content] of Object.entries(files)) {
        writeFileSync(join(dirPath, fileName), content);
      }
    }
  }

  it('copies all 5 directories correctly', async () => {
    tempDir = mkdtempSync(join(tmpdir(), 'specflow-mig-'));
    const specflowRoot = join(tempDir, 'DocVault', 'specflow', 'TestProject');

    setupLocalSpecflow({
      steering: { 'product.md': '# Product' },
      specs: { 'spec-1.md': '# Spec 1' },
      'user-templates': { 'tmpl.md': '# Template' },
      approvals: { 'approval.md': '# Approval' },
      archive: { 'old.md': '# Old' },
    });

    const config = makeConfig(tempDir, specflowRoot);
    const result = await migrateToDocVault(tempDir, config);

    expect(result.migratedDirs).toContain('steering');
    expect(result.migratedDirs).toContain('specs');
    expect(result.migratedDirs).toContain('user-templates');
    expect(result.migratedDirs).toContain('approvals');
    expect(result.migratedDirs).toContain('archive');
    expect(result.errors).toHaveLength(0);

    // Verify files were actually copied
    expect(readFileSync(join(specflowRoot, 'steering', 'product.md'), 'utf-8')).toBe('# Product');
    expect(readFileSync(join(specflowRoot, 'specs', 'spec-1.md'), 'utf-8')).toBe('# Spec 1');
    expect(readFileSync(join(specflowRoot, 'approvals', 'approval.md'), 'utf-8')).toBe('# Approval');
    expect(readFileSync(join(specflowRoot, 'archive', 'old.md'), 'utf-8')).toBe('# Old');
  });

  it('renames user-templates/ to templates/ in destination', async () => {
    tempDir = mkdtempSync(join(tmpdir(), 'specflow-mig-'));
    const specflowRoot = join(tempDir, 'DocVault', 'specflow', 'TestProject');

    setupLocalSpecflow({
      'user-templates': { 'custom.md': '# Custom Template' },
    });

    const config = makeConfig(tempDir, specflowRoot);
    await migrateToDocVault(tempDir, config);

    // Should be at templates/, not user-templates/
    expect(
      readFileSync(join(specflowRoot, 'templates', 'custom.md'), 'utf-8'),
    ).toBe('# Custom Template');
    expect(existsSync(join(specflowRoot, 'user-templates'))).toBe(false);
  });

  it('skips destinations that already have content', async () => {
    tempDir = mkdtempSync(join(tmpdir(), 'specflow-mig-'));
    const specflowRoot = join(tempDir, 'DocVault', 'specflow', 'TestProject');

    // Create existing content at destination
    const destSpecs = join(specflowRoot, 'specs');
    mkdirSync(destSpecs, { recursive: true });
    writeFileSync(join(destSpecs, 'existing.md'), '# Existing');

    setupLocalSpecflow({
      specs: { 'new-spec.md': '# New Spec' },
    });

    const config = makeConfig(tempDir, specflowRoot);
    const result = await migrateToDocVault(tempDir, config);

    expect(result.skippedDirs).toContain('specs');
    expect(result.migratedDirs).not.toContain('specs');
    // Original destination content should be preserved
    expect(readFileSync(join(destSpecs, 'existing.md'), 'utf-8')).toBe('# Existing');
  });

  it('handles missing source dirs gracefully', async () => {
    tempDir = mkdtempSync(join(tmpdir(), 'specflow-mig-'));
    const specflowRoot = join(tempDir, 'DocVault', 'specflow', 'TestProject');
    mkdirSync(join(tempDir, '.specflow'), { recursive: true });

    const config = makeConfig(tempDir, specflowRoot);
    const result = await migrateToDocVault(tempDir, config);

    // Nothing to migrate, nothing should error
    expect(result.migratedDirs).toHaveLength(0);
    expect(result.skippedDirs).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
  });

  it('returns accurate MigrationResult', async () => {
    tempDir = mkdtempSync(join(tmpdir(), 'specflow-mig-'));
    const specflowRoot = join(tempDir, 'DocVault', 'specflow', 'TestProject');

    // Pre-populate one destination
    const destSteering = join(specflowRoot, 'steering');
    mkdirSync(destSteering, { recursive: true });
    writeFileSync(join(destSteering, 'existing.md'), '# Existing');

    setupLocalSpecflow({
      steering: { 'product.md': '# Product' },
      specs: { 'spec.md': '# Spec' },
    });

    const config = makeConfig(tempDir, specflowRoot);
    const result = await migrateToDocVault(tempDir, config);

    expect(result.migratedDirs).toEqual(['specs']);
    expect(result.skippedDirs).toEqual(['steering']);
    expect(result.errors).toHaveLength(0);
  });
});

import { describe, it, expect, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { ensureIndexExists, addSpecToIndex, removeSpecFromIndex } from '../index-updater.js';
import type { ResolvedConfig } from '../config-loader.js';

function makeConfig(specflowRoot: string): ResolvedConfig {
  return {
    project: 'TestProject',
    docvault: '../DocVault',
    issue_prefix: 'TP',
    docvaultAbsolute: join(specflowRoot, '..', '..'),
    specflowRoot,
    globalTemplatesPath: join(specflowRoot, '..', 'templates'),
  };
}

describe('ensureIndexExists', () => {
  let tempDir: string;

  afterEach(() => {
    if (tempDir) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('creates _Index.md with heading and table', async () => {
    tempDir = mkdtempSync(join(tmpdir(), 'specflow-idx-'));
    const dir = join(tempDir, 'specs');

    await ensureIndexExists(dir, 'Specs');

    const content = readFileSync(join(dir, '_Index.md'), 'utf-8');
    expect(content).toContain('# Specs');
    expect(content).toContain('| Page | Description |');
    expect(content).toContain('|------|-------------|');
  });

  it('is idempotent — does not overwrite existing', async () => {
    tempDir = mkdtempSync(join(tmpdir(), 'specflow-idx-'));
    const dir = join(tempDir, 'specs');
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, '_Index.md'), '# Custom Content\n');

    await ensureIndexExists(dir, 'Specs');

    const content = readFileSync(join(dir, '_Index.md'), 'utf-8');
    expect(content).toBe('# Custom Content\n');
  });
});

describe('addSpecToIndex', () => {
  let tempDir: string;

  afterEach(() => {
    if (tempDir) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('adds table row with wikilink', async () => {
    tempDir = mkdtempSync(join(tmpdir(), 'specflow-idx-'));
    const specflowRoot = join(tempDir, 'specflow', 'TestProject');
    const specsDir = join(specflowRoot, 'specs');
    mkdirSync(specsDir, { recursive: true });
    writeFileSync(
      join(specsDir, '_Index.md'),
      '# Specs\n\n| Page | Description |\n|------|-------------|\n',
    );

    const config = makeConfig(specflowRoot);
    await addSpecToIndex(config, 'SWF-1-auth', 'Authentication feature');

    const content = readFileSync(join(specsDir, '_Index.md'), 'utf-8');
    expect(content).toContain('| [[SWF-1-auth]] | Authentication feature |');
  });

  it('does not duplicate existing entries', async () => {
    tempDir = mkdtempSync(join(tmpdir(), 'specflow-idx-'));
    const specflowRoot = join(tempDir, 'specflow', 'TestProject');
    const specsDir = join(specflowRoot, 'specs');
    mkdirSync(specsDir, { recursive: true });
    writeFileSync(
      join(specsDir, '_Index.md'),
      '# Specs\n\n| Page | Description |\n|------|-------------|\n| [[SWF-1-auth]] | Auth |\n',
    );

    const config = makeConfig(specflowRoot);
    await addSpecToIndex(config, 'SWF-1-auth', 'Updated description');

    const content = readFileSync(join(specsDir, '_Index.md'), 'utf-8');
    const matches = content.match(/\[\[SWF-1-auth\]\]/g);
    expect(matches).toHaveLength(1);
  });

  it('creates index if missing', async () => {
    tempDir = mkdtempSync(join(tmpdir(), 'specflow-idx-'));
    const specflowRoot = join(tempDir, 'specflow', 'TestProject');

    const config = makeConfig(specflowRoot);
    await addSpecToIndex(config, 'SWF-2-dashboard', 'Dashboard feature');

    const specsDir = join(specflowRoot, 'specs');
    expect(existsSync(join(specsDir, '_Index.md'))).toBe(true);
    const content = readFileSync(join(specsDir, '_Index.md'), 'utf-8');
    expect(content).toContain('[[SWF-2-dashboard]]');
  });
});

describe('removeSpecFromIndex', () => {
  let tempDir: string;

  afterEach(() => {
    if (tempDir) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('removes the correct entry', async () => {
    tempDir = mkdtempSync(join(tmpdir(), 'specflow-idx-'));
    const specflowRoot = join(tempDir, 'specflow', 'TestProject');
    const specsDir = join(specflowRoot, 'specs');
    mkdirSync(specsDir, { recursive: true });
    writeFileSync(
      join(specsDir, '_Index.md'),
      '# Specs\n\n| Page | Description |\n|------|-------------|\n| [[SWF-1-auth]] | Auth |\n| [[SWF-2-dash]] | Dashboard |\n',
    );

    const config = makeConfig(specflowRoot);
    await removeSpecFromIndex(config, 'SWF-1-auth');

    const content = readFileSync(join(specsDir, '_Index.md'), 'utf-8');
    expect(content).not.toContain('[[SWF-1-auth]]');
    expect(content).toContain('[[SWF-2-dash]]');
  });

  it('is a no-op when spec not found', async () => {
    tempDir = mkdtempSync(join(tmpdir(), 'specflow-idx-'));
    const specflowRoot = join(tempDir, 'specflow', 'TestProject');
    const specsDir = join(specflowRoot, 'specs');
    mkdirSync(specsDir, { recursive: true });
    const original =
      '# Specs\n\n| Page | Description |\n|------|-------------|\n| [[SWF-1-auth]] | Auth |\n';
    writeFileSync(join(specsDir, '_Index.md'), original);

    const config = makeConfig(specflowRoot);
    await removeSpecFromIndex(config, 'SWF-99-missing');

    const content = readFileSync(join(specsDir, '_Index.md'), 'utf-8');
    expect(content).toBe(original);
  });

  it('is a no-op when file does not exist', async () => {
    tempDir = mkdtempSync(join(tmpdir(), 'specflow-idx-'));
    const specflowRoot = join(tempDir, 'specflow', 'TestProject');

    const config = makeConfig(specflowRoot);
    // Should not throw
    await expect(removeSpecFromIndex(config, 'SWF-1-auth')).resolves.toBeUndefined();
  });
});

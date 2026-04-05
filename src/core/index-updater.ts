// ---------------------------------------------------------------------------
// DocVault _Index.md manager — creates and maintains Obsidian index tables
// for spec lifecycle events.
// ---------------------------------------------------------------------------

import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import type { ResolvedConfig } from './config-loader.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Safely read a file, returning null if it doesn't exist or can't be read.
 */
async function safeRead(filePath: string): Promise<string | null> {
  try {
    return await readFile(filePath, 'utf-8');
  } catch {
    return null;
  }
}

/**
 * Build the initial content for a new _Index.md file.
 */
function indexSkeleton(heading: string): string {
  return `# ${heading}\n\n| Page | Description |\n|------|-------------|\n`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Ensure an _Index.md file exists in the given directory.
 * If it already exists, this is a no-op (idempotent).
 */
export async function ensureIndexExists(
  dirPath: string,
  heading: string,
): Promise<void> {
  const indexPath = join(dirPath, '_Index.md');
  const existing = await safeRead(indexPath);
  if (existing !== null) return;

  // Create the directory tree if it doesn't exist yet.
  try {
    await mkdir(dirPath, { recursive: true });
  } catch {
    // Directory may already exist — ignore.
  }

  await writeFile(indexPath, indexSkeleton(heading), 'utf-8');
}

/**
 * Add a spec entry to the specs/_Index.md under the project's specflowRoot.
 * Skips silently if the spec is already listed (no duplicates).
 */
export async function addSpecToIndex(
  config: ResolvedConfig,
  specName: string,
  description?: string,
): Promise<void> {
  const specsDir = join(config.specflowRoot, 'specs');
  const indexPath = join(specsDir, '_Index.md');

  // Ensure the index file exists before we try to read-modify-write.
  await ensureIndexExists(specsDir, 'Specs');

  const content = await safeRead(indexPath);
  if (content === null) return; // Should not happen after ensureIndexExists, but be safe.

  // Check for existing entry — look for the wikilink anywhere in the file.
  if (content.includes(`[[${specName}]]`)) return;

  const desc = description ?? '';
  const newRow = `| [[${specName}]] | ${desc} |\n`;

  await writeFile(indexPath, content + newRow, 'utf-8');
}

/**
 * Remove a spec entry from the specs/_Index.md.
 * If the file doesn't exist or the spec isn't listed, this is a no-op.
 */
export async function removeSpecFromIndex(
  config: ResolvedConfig,
  specName: string,
): Promise<void> {
  const specsDir = join(config.specflowRoot, 'specs');
  const indexPath = join(specsDir, '_Index.md');

  const content = await safeRead(indexPath);
  if (content === null) return;

  const wikilink = `[[${specName}]]`;

  // Filter out any line containing the wikilink.
  const lines = content.split('\n');
  const filtered = lines.filter((line) => !line.includes(wikilink));

  // Only write back if we actually removed something.
  if (filtered.length < lines.length) {
    await writeFile(indexPath, filtered.join('\n'), 'utf-8');
  }
}

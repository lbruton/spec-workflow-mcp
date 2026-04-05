/**
 * Config loader for .specflow/config.json
 *
 * Reads, validates, and auto-creates project-level configuration
 * that maps a project to its DocVault location.
 */

import { readFile, writeFile, access, mkdir } from 'fs/promises';
import { join, resolve, basename } from 'path';
import { constants } from 'fs';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SpecflowConfig {
  project: string;
  docvault: string;
  issue_prefix: string;
}

export interface ResolvedConfig extends SpecflowConfig {
  docvaultAbsolute: string;
  specflowRoot: string;
  globalTemplatesPath: string;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const PROJECT_RE = /^[A-Za-z0-9_-]+$/;
const ISSUE_PREFIX_RE = /^[A-Z0-9]+$/;

function validateConfig(config: SpecflowConfig, projectPath: string): void {
  if (!config.project || !PROJECT_RE.test(config.project)) {
    throw new Error(
      `Invalid project name "${config.project}": must match ${PROJECT_RE.source}`
    );
  }

  if (!config.issue_prefix || !ISSUE_PREFIX_RE.test(config.issue_prefix)) {
    throw new Error(
      `Invalid issue_prefix "${config.issue_prefix}": must be non-empty uppercase alphanumeric (${ISSUE_PREFIX_RE.source})`
    );
  }

  if (!config.docvault || typeof config.docvault !== 'string') {
    throw new Error('docvault path must be a non-empty string');
  }
}

async function validateDocvaultPath(
  docvaultAbsolute: string
): Promise<void> {
  // Existence check
  try {
    await access(docvaultAbsolute, constants.F_OK);
  } catch {
    throw new Error(
      `DocVault path does not exist: ${docvaultAbsolute}`
    );
  }

  // Writable check
  try {
    await access(docvaultAbsolute, constants.W_OK);
  } catch {
    throw new Error(
      `DocVault path is not writable: ${docvaultAbsolute}`
    );
  }
}

// ---------------------------------------------------------------------------
// Path resolution (shared by load and create)
// ---------------------------------------------------------------------------

function resolvePaths(
  config: SpecflowConfig,
  projectPath: string
): ResolvedConfig {
  const docvaultAbsolute = resolve(projectPath, config.docvault);

  // Reject resolved paths that still contain ".."
  if (docvaultAbsolute.includes('..')) {
    throw new Error(
      `Resolved docvault path contains "..": ${docvaultAbsolute}`
    );
  }

  return {
    ...config,
    docvaultAbsolute,
    specflowRoot: join(docvaultAbsolute, 'specflow', config.project),
    globalTemplatesPath: join(docvaultAbsolute, 'specflow', 'templates'),
  };
}

// ---------------------------------------------------------------------------
// Auto-detection helpers (for createDefaultConfig)
// ---------------------------------------------------------------------------

function deriveProjectName(projectPath: string): string {
  const name = basename(resolve(projectPath));
  if (!PROJECT_RE.test(name)) {
    throw new Error(
      `Cannot derive a valid project name from path "${projectPath}" (got "${name}")`
    );
  }
  return name;
}

async function detectDocvaultPath(projectPath: string): Promise<string> {
  const candidate = resolve(projectPath, '..', 'DocVault');
  try {
    await access(candidate, constants.F_OK);
    return '../DocVault';
  } catch {
    throw new Error(
      `Could not auto-detect DocVault: expected sibling directory at ${candidate}`
    );
  }
}

async function detectIssuePrefix(
  projectPath: string,
  projectName: string
): Promise<string> {
  // Try .claude/project.json first
  const claudeProjectPath = join(projectPath, '.claude', 'project.json');
  try {
    const raw = await readFile(claudeProjectPath, 'utf-8');
    const parsed = JSON.parse(raw);
    if (
      parsed.issuePrefix &&
      typeof parsed.issuePrefix === 'string' &&
      ISSUE_PREFIX_RE.test(parsed.issuePrefix)
    ) {
      return parsed.issuePrefix;
    }
  } catch {
    // File doesn't exist or isn't parseable — fall through
  }

  // Derive from project name: uppercase first 3-4 chars
  const upper = projectName.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  if (upper.length === 0) {
    throw new Error(
      `Cannot derive issue_prefix from project name "${projectName}"`
    );
  }
  return upper.length <= 4 ? upper : upper.slice(0, 4);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Read and validate an existing .specflow/config.json.
 * Throws on missing file, invalid JSON, or failed validation.
 */
export async function loadConfig(
  projectPath: string
): Promise<ResolvedConfig> {
  const configPath = join(projectPath, '.specflow', 'config.json');
  const raw = await readFile(configPath, 'utf-8'); // throws ENOENT naturally
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`Invalid JSON in ${configPath}`);
  }

  const config = parsed as SpecflowConfig;
  validateConfig(config, projectPath);

  const resolved = resolvePaths(config, projectPath);
  await validateDocvaultPath(resolved.docvaultAbsolute);

  return resolved;
}

/**
 * Auto-detect values, write .specflow/config.json, and return resolved config.
 * Throws if DocVault sibling directory does not exist.
 */
export async function createDefaultConfig(
  projectPath: string
): Promise<ResolvedConfig> {
  const project = deriveProjectName(projectPath);
  const docvault = await detectDocvaultPath(projectPath);
  const issue_prefix = await detectIssuePrefix(projectPath, project);

  const config: SpecflowConfig = { project, docvault, issue_prefix };
  validateConfig(config, projectPath);

  const resolved = resolvePaths(config, projectPath);
  await validateDocvaultPath(resolved.docvaultAbsolute);

  // Ensure .specflow/ directory exists
  const specflowDir = join(projectPath, '.specflow');
  try {
    await access(specflowDir, constants.F_OK);
  } catch {
    await mkdir(specflowDir, { recursive: true });
  }

  const configPath = join(specflowDir, 'config.json');
  await writeFile(configPath, JSON.stringify(config, null, 2) + '\n', 'utf-8');

  return resolved;
}

/**
 * Load existing config, or create one with auto-detected defaults on ENOENT.
 */
export async function loadOrCreateConfig(
  projectPath: string
): Promise<ResolvedConfig> {
  try {
    return await loadConfig(projectPath);
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      (error as NodeJS.ErrnoException).code === 'ENOENT'
    ) {
      return createDefaultConfig(projectPath);
    }
    throw error;
  }
}

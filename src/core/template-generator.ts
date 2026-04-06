import { readFile, mkdir, writeFile, stat } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { ProjectConventions } from './convention-detector.js';
import { PathUtils } from './path-utils.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export interface GeneratedTemplates {
  designTemplate: string;
  tasksTemplate: string;
}

/**
 * Safely read a file, returning null on any error.
 */
async function safeReadFile(filePath: string): Promise<string | null> {
  try {
    return await readFile(filePath, 'utf-8');
  } catch {
    return null;
  }
}

/**
 * Check if a file exists.
 */
async function fileExists(filePath: string): Promise<boolean> {
  try {
    const s = await stat(filePath);
    return s.isFile();
  } catch {
    return false;
  }
}

/**
 * Read a default template by name using tiered precedence.
 *
 * When DocVault is configured (3-tier):
 *   1. Project-level DocVault override  ({workflowRoot}/templates/)
 *   2. Global DocVault templates        (globalTemplatesPath/)
 *   3. Bundled emergency fallback       (dist/markdown/templates/)
 *
 * When DocVault is NOT configured (legacy 2-tier):
 *   1. Project's local .specflow/templates/
 *   2. Bundled emergency fallback
 */
async function readDefaultTemplate(projectPath: string, templateName: string): Promise<string> {
  if (PathUtils.isDocVaultConfigured()) {
    // Tier 1: Project-level DocVault override
    const projectTemplate = join(PathUtils.getWorkflowRoot(projectPath), 'templates', `${templateName}.md`);
    const projectContent = await safeReadFile(projectTemplate);
    if (projectContent !== null) return projectContent;

    // Tier 2: Global DocVault templates
    const globalTemplate = join(PathUtils.getGlobalTemplatesPath(), `${templateName}.md`);
    const globalContent = await safeReadFile(globalTemplate);
    if (globalContent !== null) return globalContent;
  } else {
    // Legacy: project's local .specflow/templates/
    const projectTemplate = join(projectPath, '.specflow', 'templates', `${templateName}.md`);
    const content = await safeReadFile(projectTemplate);
    if (content !== null) return content;
  }

  // Tier 3 / Fallback: bundled source templates (compiled to dist/core/, so go up to dist/markdown/templates/)
  const bundledTemplate = join(__dirname, '..', 'markdown', 'templates', `${templateName}.md`);
  const bundledContent = await safeReadFile(bundledTemplate);
  if (bundledContent !== null) return bundledContent;

  throw new Error(`Template not found: ${templateName}`);
}

/**
 * Generate the Testing Strategy section for browserbase projects.
 */
function generateBrowserbaseTestingStrategy(): string {
  return `### Runbook E2E Tests (Primary)
- Identify affected \`tests/runbook/\` section(s): [01-page-load, 02-crud, 03-backup-restore, 04-import-export, 05-market, 06-ui-ux, 07-activity-log, 08-spot-prices]
- New test blocks to write (TDD — before implementation): [describe tests]
- Run via \`/bb-test sections=NN\` against PR preview URL

### Manual Verification
- [Any flows that require manual testing]`;
}

/**
 * Generate the Testing Strategy section for non-browserbase projects.
 */
function generateGenericTestingStrategy(conventions: ProjectConventions): string {
  const framework = conventions.testing.framework || 'Not detected — identify manually';
  const command = conventions.testing.command || 'npm test';
  const testDir = conventions.testing.testDir || 'tests/';

  return `### Automated Tests
- **Test Framework:** ${framework}
- **Test Command:** \`${command}\`
- **Test Directory:** \`${testDir}\`
- **New tests to write (TDD — before implementation):** [describe tests using ${framework}]
- **Run via:** \`${command}\` after implementation

### Manual Verification
- [Any flows that require manual testing beyond the automated test suite]`;
}

/**
 * Replace the Testing Strategy section in the design template with project-specific content.
 */
function replaceDesignTestingStrategy(template: string, conventions: ProjectConventions): string {
  const replacement = conventions.testing.hasBrowserbase
    ? generateBrowserbaseTestingStrategy()
    : generateGenericTestingStrategy(conventions);

  // Match the ## Testing Strategy section up to the next ## heading or end of file
  const sectionRegex = /## Testing Strategy\n[\s\S]*?(?=\n## |\n$|$)/;
  if (sectionRegex.test(template)) {
    return template.replace(sectionRegex, `## Testing Strategy\n\n${replacement}`);
  }

  // If no Testing Strategy section found, append it
  return template + `\n\n## Testing Strategy\n\n${replacement}\n`;
}

/**
 * Generate the Standard Closing Tasks section for browserbase projects.
 * Uses the 7-step closing flow (C1–C7) with runbook-specific test commands.
 */
function generateBrowserbaseClosingTasks(): string {
  return `## Standard Closing Tasks

- [ ] C1. Establish test baseline
  - File: (no file changes — testing only)
  - Run \`/bb-test sections=NN\` to establish a passing baseline before any implementation changes
  - If no runbook tests exist for the affected sections, flag this to the user
  - Purpose: Record the starting state so regressions can be detected
  - _Leverage: tests/runbook/*.md section files, /bb-test skill, /browserbase-test-maintenance skill_
  - _Requirements: All_
  - _Prompt: Implement the task for spec {{spec-name}}, first run spec-workflow-guide to get the workflow guide then implement the task: Role: QA Engineer | Task: Identify affected runbook sections and run \`/bb-test sections=NN\` to verify a passing baseline before implementation. Record the number of passing/failing/skipped tests. If no runbook tests exist for the affected sections, flag this to the user. | Restrictions: Use the project's existing runbook test framework — do not introduce a new one. Do not modify any source files. | Success: Runbook test suite runs and baseline results (pass/fail/skip counts) are recorded. PREREQUISITE: This is a verification-only task — no worktree changes needed. BLOCKING: After recording baseline, you MUST call the log-implementation tool with the test results before marking [x]. Do NOT mark [x] until the log-implementation tool call succeeds._

- [ ] C2. Write failing tests for new behavior (TDD — BEFORE implementation)
  - File: [test file paths — determined by affected runbook sections]
  - Write failing runbook test blocks in \`tests/runbook/*.md\` for all new behavior described in requirements.md
  - Use the \`/browserbase-test-maintenance\` skill for the standard 7-field format
  - Tests should map to acceptance criteria — one or more tests per AC
  - Purpose: TDD — tests define the expected behavior before code is written
  - _Leverage: tests/runbook/*.md, /browserbase-test-maintenance skill, requirements.md acceptance criteria_
  - _Requirements: All_
  - _Prompt: Implement the task for spec {{spec-name}}, first run spec-workflow-guide to get the workflow guide then implement the task: Role: QA Automation Engineer | Task: Write failing runbook test blocks in tests/runbook/*.md for all new behavior described in requirements.md acceptance criteria. Use the /browserbase-test-maintenance skill for the standard 7-field format (Test name, Added, Preconditions, Steps, Pass criteria, Tags, Section). Each acceptance criterion should have at least one corresponding test. Tests MUST fail before implementation (red phase of TDD) and pass after (green phase). | Restrictions: Use the standard runbook format, append to section files (never modify existing tests), act steps must be atomic. No Playwright, no browserless. Do not write implementation code in this task. | Success: Failing runbook tests exist for every acceptance criterion in requirements.md. Running /bb-test shows the new tests fail (expected) while existing tests still pass. PREREQUISITE: Before writing any code, verify you are in the correct working context. If the project uses version.lock, confirm \`git branch --show-current\` returns patch/VERSION. If not, STOP and run /release patch first. Mark task as [-] in tasks.md before starting. BLOCKING: After writing tests, you MUST call the log-implementation tool with test file paths and AC mapping before marking [x]. Do NOT mark [x] until the log-implementation tool call succeeds._

- [ ] C3. Implement — make tests pass
  - File: [implementation file paths — determined by design.md]
  - Write the minimum code needed to make all failing tests from C2 pass
  - Follow existing project patterns and conventions
  - Purpose: Green phase of TDD — implementation is driven by tests
  - _Leverage: design.md architecture decisions, existing project patterns_
  - _Requirements: All_
  - _Prompt: Implement the task for spec {{spec-name}}, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Senior Developer | Task: Write the implementation code to make all failing tests from task C2 pass. Follow the architecture and patterns described in design.md. Use existing project utilities and patterns — do not reinvent. Keep changes minimal and focused on making tests green. | Restrictions: Do not modify test files from C2 to make them pass — fix the implementation instead. Do not introduce new dependencies without justification. Follow existing code style and patterns. | Success: All tests from C2 now pass. No existing tests regress. Code follows project conventions. PREREQUISITE: Before writing any code, verify you are in the correct working context. If the project uses version.lock, confirm \`git branch --show-current\` returns patch/VERSION. If not, STOP and run /release patch first. Mark task as [-] in tasks.md before starting. BLOCKING: After implementation, you MUST call the log-implementation tool with full artifacts before marking [x]. Do NOT mark [x] until the log-implementation tool call succeeds._

- [ ] C4. Run full test suite — zero regressions
  - File: (no file changes — testing only)
  - Run \`/bb-test sections=NN\` after all implementation is done
  - All new tests must pass; no existing tests may regress from the C1 baseline
  - Purpose: Verify implementation is complete and nothing is broken
  - _Leverage: /bb-test skill, baseline results from C1_
  - _Requirements: All_
  - _Prompt: Implement the task for spec {{spec-name}}, first run spec-workflow-guide to get the workflow guide then implement the task: Role: QA Engineer | Task: Run \`/bb-test sections=NN\` for the full runbook test suite. Compare results against the baseline from task C1. All new tests from C2 must pass. No existing tests may have regressed. If any test fails, diagnose and fix before proceeding — do not skip or disable failing tests. | Restrictions: Do not skip or disable any tests. Do not modify tests to make them pass unless they have a genuine bug. | Success: Full runbook test suite passes. New test count matches C2. Zero regressions from C1 baseline. PREREQUISITE: This is a verification-only task — no file changes expected unless fixing regressions. BLOCKING: After test run, you MUST call the log-implementation tool with pass/fail/skip counts and comparison to C1 baseline before marking [x]. Do NOT mark [x] until the log-implementation tool call succeeds._

- [ ] C5. Log implementation — HARD GATE
  - File: (no file changes — logging only)
  - Call the \`log-implementation\` MCP tool with a comprehensive summary of ALL implementation work done across all tasks in this spec
  - Include: all functions added/modified, all files changed, all tests written, all endpoints created
  - Purpose: Create a permanent record of what was implemented for future reference and audit
  - _Leverage: Implementation logs from individual tasks, git diff_
  - _Requirements: All_
  - _Prompt: Implement the task for spec {{spec-name}}, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Project Coordinator | Task: Call the log-implementation MCP tool with a comprehensive summary covering all implementation tasks in this spec. Aggregate: (1) all functions added or modified with file paths, (2) all files created or changed, (3) all test files and test counts, (4) any new endpoints, routes, or APIs, (5) any configuration changes. This is the consolidated implementation record. | Restrictions: Do not skip any task's artifacts. Do not mark this task [x] until the log-implementation tool call succeeds. | Success: log-implementation MCP tool call succeeds with full artifact listing. BLOCKING: This IS the logging gate. Do NOT mark [x] until the log-implementation tool call succeeds._

- [ ] C6. Generate verification.md
  - File: \`DocVault/specflow/{{projectName}}/specs/{{spec-name}}/verification.md\`
  - Generate a verification checklist in the spec directory
  - List every requirement and acceptance criterion from requirements.md as a checklist item
  - For each item: mark \`[x]\` with \`file:line\` code evidence, OR mark \`[ ]\` with a gap description
  - Purpose: Prove every requirement is met with traceable evidence — no hand-waving
  - _Leverage: requirements.md, implementation logs, git diff_
  - _Requirements: All_
  - _Prompt: Implement the task for spec {{spec-name}}, first run spec-workflow-guide to get the workflow guide then implement the task: Role: QA Engineer | Task: Generate verification.md in the spec directory. Read requirements.md and list every requirement and acceptance criterion as a markdown checklist. For each item, search the codebase for the implementing code and mark [x] with file:line evidence (e.g., "src/core/parser.ts:142 — validates input format"). If any criterion cannot be verified, mark [ ] with a description of the gap. Run /vault-update to update any DocVault pages affected by this spec's changes. Close all linked DocVault issues. Run /verification-before-completion for a final check. | Restrictions: Do not mark [x] without concrete file:line evidence. Do not fabricate evidence. If a gap exists, document it honestly. | Success: verification.md exists with every requirement/AC listed. All items marked [x] with evidence, OR [ ] items have gap descriptions. /vault-update completed. Linked issues closed. /verification-before-completion passed. BLOCKING: After generating verification.md, you MUST call the log-implementation tool before marking [x]. Do NOT mark [x] until the log-implementation tool call succeeds._

- [ ] C7. Loop or complete
  - File: (no file changes — decision gate only)
  - IF verification.md has ANY unchecked \`[ ]\` items → return to task C2 and write tests for the gaps, then implement (C3), test (C4), log (C5), and re-verify (C6)
  - ONLY when ALL items in verification.md are \`[x]\` → proceed to PR/commit
  - Purpose: Enforce the verification loop — specs are not complete until every requirement is proven
  - _Leverage: verification.md from C6_
  - _Requirements: All_
  - _Prompt: Implement the task for spec {{spec-name}}, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Project Coordinator | Task: Read verification.md from task C6. Count unchecked [ ] items. IF any exist: list the gaps, return to task C2 to write tests targeting those gaps, then re-execute C3 through C6. Repeat until verification.md has zero unchecked items. ONLY when all items are [x]: proceed to create the PR or commit. | Restrictions: Do NOT proceed to PR/commit if ANY [ ] items remain in verification.md. Do NOT remove unchecked items to force completion. Each loop iteration must go through C2→C6 in order. | Success: verification.md has zero unchecked items. All requirements are proven with code evidence. PR/commit may proceed. BLOCKING: After confirming all items are verified, you MUST call the log-implementation tool with the final verification status before marking [x]. Do NOT mark [x] until the log-implementation tool call succeeds._`;
}

/**
 * Generate the Standard Closing Tasks section for non-browserbase projects.
 * Uses the 7-step closing flow (C1–C7) with the generic test command from detected conventions.
 */
function generateGenericClosingTasks(conventions: ProjectConventions): string {
  const command = conventions.testing.command || 'npm test';
  const framework = conventions.testing.framework || 'the project test framework';

  return `## Standard Closing Tasks

- [ ] C1. Establish test baseline
  - File: (no file changes — testing only)
  - Run \`${command}\` to establish a passing baseline before any implementation changes
  - If no test suite exists, flag this to the user and discuss whether to set one up
  - Purpose: Record the starting state so regressions can be detected
  - _Leverage: Project test configuration (package.json scripts, vitest.config, jest.config, etc.)_
  - _Requirements: All_
  - _Prompt: Implement the task for spec {{spec-name}}, first run spec-workflow-guide to get the workflow guide then implement the task: Role: QA Engineer | Task: Identify and run the project's established test suite (\`${command}\`) to verify a passing baseline before implementation. Record the number of passing/failing/skipped tests. If no test suite exists, flag this to the user and ask whether to set one up before proceeding. | Restrictions: Use the project's existing test framework — do not introduce a new one. Do not modify any source files. | Success: Test suite runs and baseline results (pass/fail/skip counts) are recorded. PREREQUISITE: This is a verification-only task — no worktree changes needed. BLOCKING: After recording baseline, you MUST call the log-implementation tool with the test results before marking [x]. Do NOT mark [x] until the log-implementation tool call succeeds._

- [ ] C2. Write failing tests for new behavior (TDD — BEFORE implementation)
  - File: [test file paths — determined by project conventions]
  - Write failing tests using ${framework} for all new behavior described in requirements.md
  - Tests should map to acceptance criteria — one or more tests per AC
  - Purpose: TDD — tests define the expected behavior before code is written
  - _Leverage: Project test framework (${framework}), requirements.md acceptance criteria_
  - _Requirements: All_
  - _Prompt: Implement the task for spec {{spec-name}}, first run spec-workflow-guide to get the workflow guide then implement the task: Role: QA Engineer | Task: Write failing tests for all new behavior described in requirements.md acceptance criteria. Use ${framework} and the project's existing test conventions. Each acceptance criterion should have at least one corresponding test. Tests MUST fail before implementation (red phase of TDD) and pass after (green phase). | Restrictions: Use the project's existing test framework — do not introduce a new one. Tests must be runnable with \`${command}\`. Do not write implementation code in this task. | Success: Failing tests exist for every acceptance criterion in requirements.md. Running \`${command}\` shows the new tests fail (expected) while existing tests still pass. PREREQUISITE: Before writing any code, verify you are in the correct working context. If the project uses version.lock, confirm \`git branch --show-current\` returns patch/VERSION. If not, STOP and run /release patch first. Mark task as [-] in tasks.md before starting. BLOCKING: After writing tests, you MUST call the log-implementation tool with test file paths and AC mapping before marking [x]. Do NOT mark [x] until the log-implementation tool call succeeds._

- [ ] C3. Implement — make tests pass
  - File: [implementation file paths — determined by design.md]
  - Write the minimum code needed to make all failing tests from C2 pass
  - Follow existing project patterns and conventions
  - Purpose: Green phase of TDD — implementation is driven by tests
  - _Leverage: design.md architecture decisions, existing project patterns_
  - _Requirements: All_
  - _Prompt: Implement the task for spec {{spec-name}}, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Senior Developer | Task: Write the implementation code to make all failing tests from task C2 pass. Follow the architecture and patterns described in design.md. Use existing project utilities and patterns — do not reinvent. Keep changes minimal and focused on making tests green. | Restrictions: Do not modify test files from C2 to make them pass — fix the implementation instead. Do not introduce new dependencies without justification. Follow existing code style and patterns. | Success: All tests from C2 now pass. No existing tests regress. Code follows project conventions. PREREQUISITE: Before writing any code, verify you are in the correct working context. If the project uses version.lock, confirm \`git branch --show-current\` returns patch/VERSION. If not, STOP and run /release patch first. Mark task as [-] in tasks.md before starting. BLOCKING: After implementation, you MUST call the log-implementation tool with full artifacts before marking [x]. Do NOT mark [x] until the log-implementation tool call succeeds._

- [ ] C4. Run full test suite — zero regressions
  - File: (no file changes — testing only)
  - Run \`${command}\` after all implementation is done
  - All new tests must pass; no existing tests may regress from the C1 baseline
  - Purpose: Verify implementation is complete and nothing is broken
  - _Leverage: Project test command (\`${command}\`), baseline results from C1_
  - _Requirements: All_
  - _Prompt: Implement the task for spec {{spec-name}}, first run spec-workflow-guide to get the workflow guide then implement the task: Role: QA Engineer | Task: Run \`${command}\` for the full test suite. Compare results against the baseline from task C1. All new tests from C2 must pass. No existing tests may have regressed. If any test fails, diagnose and fix before proceeding — do not skip or disable failing tests. | Restrictions: Do not skip or disable any tests. Do not modify tests to make them pass unless they have a genuine bug. | Success: Full test suite passes. New test count matches C2. Zero regressions from C1 baseline. PREREQUISITE: This is a verification-only task — no file changes expected unless fixing regressions. BLOCKING: After test run, you MUST call the log-implementation tool with pass/fail/skip counts and comparison to C1 baseline before marking [x]. Do NOT mark [x] until the log-implementation tool call succeeds._

- [ ] C5. Log implementation — HARD GATE
  - File: (no file changes — logging only)
  - Call the \`log-implementation\` MCP tool with a comprehensive summary of ALL implementation work done across all tasks in this spec
  - Include: all functions added/modified, all files changed, all tests written, all endpoints created
  - Purpose: Create a permanent record of what was implemented for future reference and audit
  - _Leverage: Implementation logs from individual tasks, git diff_
  - _Requirements: All_
  - _Prompt: Implement the task for spec {{spec-name}}, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Project Coordinator | Task: Call the log-implementation MCP tool with a comprehensive summary covering all implementation tasks in this spec. Aggregate: (1) all functions added or modified with file paths, (2) all files created or changed, (3) all test files and test counts, (4) any new endpoints, routes, or APIs, (5) any configuration changes. This is the consolidated implementation record. | Restrictions: Do not skip any task's artifacts. Do not mark this task [x] until the log-implementation tool call succeeds. | Success: log-implementation MCP tool call succeeds with full artifact listing. BLOCKING: This IS the logging gate. Do NOT mark [x] until the log-implementation tool call succeeds._

- [ ] C6. Generate verification.md
  - File: \`DocVault/specflow/{{projectName}}/specs/{{spec-name}}/verification.md\`
  - Generate a verification checklist in the spec directory
  - List every requirement and acceptance criterion from requirements.md as a checklist item
  - For each item: mark \`[x]\` with \`file:line\` code evidence, OR mark \`[ ]\` with a gap description
  - Purpose: Prove every requirement is met with traceable evidence — no hand-waving
  - _Leverage: requirements.md, implementation logs, git diff_
  - _Requirements: All_
  - _Prompt: Implement the task for spec {{spec-name}}, first run spec-workflow-guide to get the workflow guide then implement the task: Role: QA Engineer | Task: Generate verification.md in the spec directory. Read requirements.md and list every requirement and acceptance criterion as a markdown checklist. For each item, search the codebase for the implementing code and mark [x] with file:line evidence (e.g., "src/core/parser.ts:142 — validates input format"). If any criterion cannot be verified, mark [ ] with a description of the gap. Run /vault-update to update any DocVault pages affected by this spec's changes. Close all linked DocVault issues. Run /verification-before-completion for a final check. | Restrictions: Do not mark [x] without concrete file:line evidence. Do not fabricate evidence. If a gap exists, document it honestly. | Success: verification.md exists with every requirement/AC listed. All items marked [x] with evidence, OR [ ] items have gap descriptions. /vault-update completed. Linked issues closed. /verification-before-completion passed. BLOCKING: After generating verification.md, you MUST call the log-implementation tool before marking [x]. Do NOT mark [x] until the log-implementation tool call succeeds._

- [ ] C7. Loop or complete
  - File: (no file changes — decision gate only)
  - IF verification.md has ANY unchecked \`[ ]\` items → return to task C2 and write tests for the gaps, then implement (C3), test (C4), log (C5), and re-verify (C6)
  - ONLY when ALL items in verification.md are \`[x]\` → proceed to PR/commit
  - Purpose: Enforce the verification loop — specs are not complete until every requirement is proven
  - _Leverage: verification.md from C6_
  - _Requirements: All_
  - _Prompt: Implement the task for spec {{spec-name}}, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Project Coordinator | Task: Read verification.md from task C6. Count unchecked [ ] items. IF any exist: list the gaps, return to task C2 to write tests targeting those gaps, then re-execute C3 through C6. Repeat until verification.md has zero unchecked items. ONLY when all items are [x]: proceed to create the PR or commit. | Restrictions: Do NOT proceed to PR/commit if ANY [ ] items remain in verification.md. Do NOT remove unchecked items to force completion. Each loop iteration must go through C2→C6 in order. | Success: verification.md has zero unchecked items. All requirements are proven with code evidence. PR/commit may proceed. BLOCKING: After confirming all items are verified, you MUST call the log-implementation tool with the final verification status before marking [x]. Do NOT mark [x] until the log-implementation tool call succeeds._`;
}

/**
 * Replace the Standard Closing Tasks section in the tasks template with project-specific content.
 */
function replaceTasksClosingSection(template: string, conventions: ProjectConventions): string {
  const replacement = conventions.testing.hasBrowserbase
    ? generateBrowserbaseClosingTasks()
    : generateGenericClosingTasks(conventions);

  // Match the ## Standard Closing Tasks section to end of file
  const sectionRegex = /## Standard Closing Tasks\n[\s\S]*$/;
  if (sectionRegex.test(template)) {
    return template.replace(sectionRegex, replacement.replace(/^## Standard Closing Tasks\n/, '## Standard Closing Tasks\n'));
  }

  // If no Standard Closing Tasks section found, append it
  return template + '\n\n' + replacement + '\n';
}

/**
 * Generate project-specific user-templates from detected conventions.
 *
 * Reads the current default templates (from .specflow/templates/ or bundled fallback),
 * then replaces the Testing Strategy and Standard Closing Tasks sections with
 * project-specific content based on the detected conventions.
 */
export async function generateUserTemplates(
  projectPath: string,
  conventions: ProjectConventions,
): Promise<GeneratedTemplates> {
  const [designRaw, tasksRaw] = await Promise.all([
    readDefaultTemplate(projectPath, 'design-template'),
    readDefaultTemplate(projectPath, 'tasks-template'),
  ]);

  const designTemplate = replaceDesignTestingStrategy(designRaw, conventions);
  const tasksTemplate = replaceTasksClosingSection(tasksRaw, conventions);

  return { designTemplate, tasksTemplate };
}

/**
 * Write generated user-templates to `.specflow/user-templates/`.
 *
 * IMPORTANT: If user-templates already exist, this function returns early
 * without overwriting them. Users own their user-templates once created.
 */
export async function writeUserTemplates(
  projectPath: string,
  templates: GeneratedTemplates,
): Promise<void> {
  const userTemplatesDir = join(projectPath, '.specflow', 'user-templates');
  const designPath = join(userTemplatesDir, 'design-template.md');
  const tasksPath = join(userTemplatesDir, 'tasks-template.md');

  // Check if either user-template already exists — if so, do not overwrite
  if (await fileExists(designPath) || await fileExists(tasksPath)) {
    return;
  }

  // Create directory if needed
  await mkdir(userTemplatesDir, { recursive: true });

  // Write both templates
  await Promise.all([
    writeFile(designPath, templates.designTemplate, 'utf-8'),
    writeFile(tasksPath, templates.tasksTemplate, 'utf-8'),
  ]);
}

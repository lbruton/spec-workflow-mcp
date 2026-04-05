import { readFile, mkdir, writeFile, stat } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { ProjectConventions } from './convention-detector.js';

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
 * Read a default template by name, checking the project's .specflow/templates/
 * first, then falling back to the bundled src/markdown/templates/.
 */
async function readDefaultTemplate(projectPath: string, templateName: string): Promise<string> {
  // Primary: project's copied templates
  const projectTemplate = join(projectPath, '.specflow', 'templates', `${templateName}.md`);
  const content = await safeReadFile(projectTemplate);
  if (content !== null) {
    return content;
  }

  // Fallback: bundled source templates (compiled to dist/core/, so go up to dist/markdown/templates/)
  const bundledTemplate = join(__dirname, '..', 'markdown', 'templates', `${templateName}.md`);
  const bundledContent = await safeReadFile(bundledTemplate);
  if (bundledContent !== null) {
    return bundledContent;
  }

  throw new Error(`Could not find default template "${templateName}.md" in project or bundled sources`);
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
 * Reproduces the runbook-specific tasks from the StakTrakr-era template.
 */
function generateBrowserbaseClosingTasks(): string {
  return `## Standard Closing Tasks

- [ ] 6. Integration and testing
  - Plan integration approach and identify affected runbook sections for TDD test authoring
  - _Leverage: tests/runbook/*.md, /browserbase-test-maintenance skill_
  - _Requirements: 6.0_
  - _Prompt: Role: Integration Engineer with expertise in system integration and testing strategies | Task: Plan comprehensive integration approach following requirement 6.0. Identify which tests/runbook/ section files are affected by this spec and write new runbook test blocks BEFORE implementation tasks begin (TDD). Use the /browserbase-test-maintenance skill for format guidance and section mapping. | Restrictions: Must consider all system components, ensure proper test coverage, write tests in the standard 7-field runbook format | Success: Integration plan is comprehensive, runbook test blocks are written for all new user-facing behavior, tests are appended to the correct section files_

- [ ] 6.1 Write end-to-end runbook tests (TDD — write BEFORE implementation)
  - Write runbook test blocks in tests/runbook/*.md for new user-facing behavior
  - Use the /browserbase-test-maintenance skill for the standard 7-field format
  - Map implementation changes to the correct runbook section file
  - _Leverage: /browserbase-test-maintenance skill, tests/runbook/*.md section files_
  - _Requirements: All_
  - _Prompt: Role: QA Automation Engineer with expertise in Browserbase/Stagehand natural-language browser automation | Task: Write runbook test blocks in tests/runbook/*.md for all new user-facing behavior using the /browserbase-test-maintenance skill. Each test block must use the 7-field format (Test name, Added, Preconditions, Steps, Pass criteria, Tags, Section). Map changes to the correct section file. After implementation, verify by running /bb-test sections=NN against the PR preview URL. | Restrictions: Use the standard runbook format, append to section files (never modify existing tests), act steps must be atomic. No Playwright, no browserless. | Success: All new user-facing behavior has corresponding runbook test blocks, tests pass when run via /bb-test against the PR preview URL_

- [ ] 6.2 Verify tests against PR preview
  - Run /bb-test sections=NN against PR preview URL to verify all new tests pass
  - _Leverage: /bb-test skill, PR preview URL from gh pr checks_
  - _Requirements: All_
  - _Prompt: Role: QA Automation Engineer | Task: Run /bb-test sections=NN against the PR preview URL to verify all new runbook tests pass. Get the preview URL with: gh pr checks <PR_NUMBER> --json name,state,targetUrl. For 1-3 tests, consider manual verification via Chrome DevTools instead of a full Browserbase session. | Restrictions: Do NOT use Playwright or browserless. | Success: All new tests pass against the PR preview URL_

- [ ] 6.3 Final integration and cleanup
  - Integrate all components
  - Fix any integration issues
  - Clean up code and documentation
  - _Leverage: src/utils/cleanup.ts, docs/templates/_
  - _Requirements: All_
  - _Prompt: Role: Senior Developer with expertise in code quality and system integration | Task: Complete final integration of all components and perform comprehensive cleanup covering all requirements, using cleanup utilities and documentation templates | Restrictions: Must not break existing functionality, ensure code quality standards are met, maintain documentation consistency | Success: All components are fully integrated and working together, code is clean and well-documented, system meets all requirements and quality standards_`;
}

/**
 * Generate the Standard Closing Tasks section for non-browserbase projects.
 * Uses the generic test command from detected conventions.
 */
function generateGenericClosingTasks(conventions: ProjectConventions): string {
  const command = conventions.testing.command || 'npm test';
  const framework = conventions.testing.framework || 'the project test framework';

  return `## Standard Closing Tasks

- [ ] 6. Run project test suite and verify baseline
  - Run \`${command}\` to establish a passing baseline before changes
  - If no test suite exists, flag this and discuss with the user
  - _Leverage: Project test configuration (package.json scripts, vitest.config, jest.config, etc.)_
  - _Requirements: All_
  - _Prompt: Role: QA Engineer | Task: Run the project's established test suite (\`${command}\`) to verify a passing baseline before implementation. If no test suite exists, flag this to the user. | Restrictions: Use the project's existing test framework, do not introduce a new one. | Success: Test suite runs and baseline results are recorded._

- [ ] 6.1 Write tests for new behavior (TDD — write BEFORE implementation)
  - Write failing tests using ${framework} for all new behavior
  - Tests should cover the acceptance criteria from requirements.md
  - _Leverage: Project test framework, requirements.md acceptance criteria_
  - _Requirements: All_
  - _Prompt: Role: QA Engineer | Task: Write failing tests for all new behavior described in requirements.md using ${framework}. Follow TDD - tests must fail before implementation, pass after. | Restrictions: Use the project's existing test framework. Tests must be runnable with \`${command}\`. | Success: Failing tests exist for all new acceptance criteria._

- [ ] 6.2 Verify all tests pass after implementation
  - Run \`${command}\` after all implementation tasks are complete
  - All new tests must pass; no existing tests may regress
  - _Leverage: Project test command_
  - _Requirements: All_
  - _Prompt: Role: QA Engineer | Task: Run \`${command}\`. Verify all new tests pass and no existing tests regressed. | Restrictions: Do not skip or disable failing tests. | Success: Full test suite passes with zero regressions._

- [ ] 6.3 Final integration and cleanup
  - Integrate all components
  - Verify no lint or type errors
  - Clean up temporary code and documentation
  - _Leverage: Project lint/build commands_
  - _Requirements: All_
  - _Prompt: Role: Senior Developer | Task: Complete final integration of all components and perform comprehensive cleanup. Run lint and type checks. Remove any temporary code or debug statements. | Restrictions: Must not break existing functionality. Ensure code quality standards are met. | Success: All components integrated, no lint or type errors, code is clean._`;
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

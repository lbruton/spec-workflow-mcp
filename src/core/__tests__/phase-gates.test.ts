import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  validatePhaseGates,
  checkApprovalStatus,
  checkTestChecklistGate,
  checkTddPreflight,
} from '../phase-gates.js';

// ── Test helpers ──────────────────────────────────────────────────────────────

const APPROVED_SNAPSHOT_FOR = (filePath: string) =>
  JSON.stringify({
    filePath,
    currentVersion: 1,
    snapshots: [
      {
        version: 1,
        filename: 'snapshot-001.json',
        timestamp: '2026-01-01T00:00:00Z',
        trigger: 'approved',
        approvalId: 'test',
        approvalTitle: 'test',
      },
    ],
  });

const PENDING_SNAPSHOT_FOR = (filePath: string) =>
  JSON.stringify({
    filePath,
    currentVersion: 1,
    snapshots: [
      {
        version: 1,
        filename: 'snapshot-001.json',
        timestamp: '2026-01-01T00:00:00Z',
        trigger: 'pending',
        approvalId: 'test',
        approvalTitle: 'test',
      },
    ],
  });

function writeApprovalSnapshot(
  workflowRoot: string,
  specName: string,
  docType: string,
  approved: boolean,
): void {
  const snapshotDir = join(
    workflowRoot,
    'approvals',
    specName,
    '.snapshots',
    `${docType}.md`,
  );
  mkdirSync(snapshotDir, { recursive: true });
  const filePath = `specs/${specName}/${docType}.md`;
  writeFileSync(
    join(snapshotDir, 'metadata.json'),
    approved ? APPROVED_SNAPSHOT_FOR(filePath) : PENDING_SNAPSHOT_FOR(filePath),
  );
}

function writeSpecFile(
  workflowRoot: string,
  specName: string,
  fileName: string,
  content: string,
): void {
  const specDir = join(workflowRoot, 'specs', specName);
  mkdirSync(specDir, { recursive: true });
  writeFileSync(join(specDir, fileName), content);
}

describe('validatePhaseGates', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'specflow-gates-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  describe('G1 — issue ID pattern', () => {
    it('rejects specName without issue ID pattern', async () => {
      const result = await validatePhaseGates({
        specName: 'no-issue-prefix',
        documentType: 'requirements',
        workflowRoot: tempDir,
      });

      expect(result.passed).toBe(false);
      expect(result.gate).toBe('G1');
    });

    it('accepts valid specName with issue ID for requirements', async () => {
      const result = await validatePhaseGates({
        specName: 'STAK-123-feature',
        documentType: 'requirements',
        workflowRoot: tempDir,
      });

      expect(result.passed).toBe(true);
    });
  });

  describe('G2 — discovery requires approved requirements', () => {
    it('rejects discovery when requirements.md is missing', async () => {
      const result = await validatePhaseGates({
        specName: 'STAK-123-feature',
        documentType: 'discovery',
        workflowRoot: tempDir,
      });

      expect(result.passed).toBe(false);
      expect(result.gate).toBe('G2');
    });

    it('rejects discovery when requirements.md exists but unapproved', async () => {
      // Create spec dir with requirements but no approval snapshot
      const specDir = join(tempDir, 'specs', 'STAK-123-feature');
      mkdirSync(specDir, { recursive: true });
      writeFileSync(join(specDir, 'requirements.md'), '# Requirements\n');

      const result = await validatePhaseGates({
        specName: 'STAK-123-feature',
        documentType: 'discovery',
        workflowRoot: tempDir,
      });

      expect(result.passed).toBe(false);
      expect(result.gate).toBe('G2');
    });

    it('allows discovery when requirements.md is approved', async () => {
      // Create the spec document file
      const specDir = join(tempDir, 'specs', 'STAK-123-feature');
      mkdirSync(specDir, { recursive: true });
      writeFileSync(join(specDir, 'requirements.md'), '# Requirements');

      // Create approved requirements snapshot
      const snapshotDir = join(
        tempDir,
        'approvals',
        'STAK-123-feature',
        '.snapshots',
        'requirements.md',
      );
      mkdirSync(snapshotDir, { recursive: true });
      writeFileSync(
        join(snapshotDir, 'metadata.json'),
        JSON.stringify({
          filePath: 'specs/STAK-123-feature/requirements.md',
          currentVersion: 1,
          snapshots: [
            {
              version: 1,
              filename: 'snapshot-001.json',
              timestamp: '2026-01-01T00:00:00Z',
              trigger: 'approved',
              approvalId: 'test',
              approvalTitle: 'test',
            },
          ],
        }),
      );

      const result = await validatePhaseGates({
        specName: 'STAK-123-feature',
        documentType: 'discovery',
        workflowRoot: tempDir,
      });

      expect(result.passed).toBe(true);
    });
  });

  describe('G3 — design requires approved requirements (and discovery if present)', () => {
    it('rejects design when requirements.md is missing', async () => {
      const result = await validatePhaseGates({
        specName: 'STAK-123-feature',
        documentType: 'design',
        workflowRoot: tempDir,
      });

      expect(result.passed).toBe(false);
      expect(result.gate).toBe('G3');
    });

    it('rejects design when requirements.md exists but unapproved', async () => {
      const specDir = join(tempDir, 'specs', 'STAK-123-feature');
      mkdirSync(specDir, { recursive: true });
      writeFileSync(join(specDir, 'requirements.md'), '# Requirements\n');

      const result = await validatePhaseGates({
        specName: 'STAK-123-feature',
        documentType: 'design',
        workflowRoot: tempDir,
      });

      expect(result.passed).toBe(false);
      expect(result.gate).toBe('G3');
    });

    it('rejects design when discovery.md exists but is unapproved', async () => {
      // Approved requirements
      const reqSnapshotDir = join(
        tempDir,
        'approvals',
        'STAK-123-feature',
        '.snapshots',
        'requirements.md',
      );
      mkdirSync(reqSnapshotDir, { recursive: true });
      writeFileSync(
        join(reqSnapshotDir, 'metadata.json'),
        JSON.stringify({
          filePath: 'specs/STAK-123-feature/requirements.md',
          currentVersion: 1,
          snapshots: [
            {
              version: 1,
              filename: 'snapshot-001.json',
              timestamp: '2026-01-01T00:00:00Z',
              trigger: 'approved',
              approvalId: 'test',
              approvalTitle: 'test',
            },
          ],
        }),
      );

      // Unapproved discovery — exists on disk but no approval snapshot
      const specDir = join(tempDir, 'specs', 'STAK-123-feature');
      mkdirSync(specDir, { recursive: true });
      writeFileSync(join(specDir, 'discovery.md'), '# Discovery\n');

      const result = await validatePhaseGates({
        specName: 'STAK-123-feature',
        documentType: 'design',
        workflowRoot: tempDir,
      });

      expect(result.passed).toBe(false);
      expect(result.gate).toBe('G3');
    });

    it('allows design when requirements.md is approved and no discovery exists', async () => {
      // Create the spec document file
      const specDir = join(tempDir, 'specs', 'STAK-123-feature');
      mkdirSync(specDir, { recursive: true });
      writeFileSync(join(specDir, 'requirements.md'), '# Requirements');

      const reqSnapshotDir = join(
        tempDir,
        'approvals',
        'STAK-123-feature',
        '.snapshots',
        'requirements.md',
      );
      mkdirSync(reqSnapshotDir, { recursive: true });
      writeFileSync(
        join(reqSnapshotDir, 'metadata.json'),
        JSON.stringify({
          filePath: 'specs/STAK-123-feature/requirements.md',
          currentVersion: 1,
          snapshots: [
            {
              version: 1,
              filename: 'snapshot-001.json',
              timestamp: '2026-01-01T00:00:00Z',
              trigger: 'approved',
              approvalId: 'test',
              approvalTitle: 'test',
            },
          ],
        }),
      );

      const result = await validatePhaseGates({
        specName: 'STAK-123-feature',
        documentType: 'design',
        workflowRoot: tempDir,
      });

      expect(result.passed).toBe(true);
    });

    it('allows design when both requirements and discovery are approved', async () => {
      // Create the spec document files
      const specDir = join(tempDir, 'specs', 'STAK-123-feature');
      mkdirSync(specDir, { recursive: true });
      writeFileSync(join(specDir, 'requirements.md'), '# Requirements');
      writeFileSync(join(specDir, 'discovery.md'), '# Discovery');

      // Approved requirements
      const reqSnapshotDir = join(
        tempDir,
        'approvals',
        'STAK-123-feature',
        '.snapshots',
        'requirements.md',
      );
      mkdirSync(reqSnapshotDir, { recursive: true });
      writeFileSync(
        join(reqSnapshotDir, 'metadata.json'),
        JSON.stringify({
          filePath: 'specs/STAK-123-feature/requirements.md',
          currentVersion: 1,
          snapshots: [
            {
              version: 1,
              filename: 'snapshot-001.json',
              timestamp: '2026-01-01T00:00:00Z',
              trigger: 'approved',
              approvalId: 'test',
              approvalTitle: 'test',
            },
          ],
        }),
      );

      // Approved discovery
      const discSnapshotDir = join(
        tempDir,
        'approvals',
        'STAK-123-feature',
        '.snapshots',
        'discovery.md',
      );
      mkdirSync(discSnapshotDir, { recursive: true });
      writeFileSync(
        join(discSnapshotDir, 'metadata.json'),
        JSON.stringify({
          filePath: 'specs/STAK-123-feature/discovery.md',
          currentVersion: 1,
          snapshots: [
            {
              version: 1,
              filename: 'snapshot-001.json',
              timestamp: '2026-01-01T00:00:00Z',
              trigger: 'approved',
              approvalId: 'test',
              approvalTitle: 'test',
            },
          ],
        }),
      );

      const result = await validatePhaseGates({
        specName: 'STAK-123-feature',
        documentType: 'design',
        workflowRoot: tempDir,
      });

      expect(result.passed).toBe(true);
    });
  });

  describe('G4 — tasks requires approved design', () => {
    it('rejects tasks when design.md is unapproved', async () => {
      // Approved requirements (prerequisite)
      const reqSnapshotDir = join(
        tempDir,
        'approvals',
        'STAK-123-feature',
        '.snapshots',
        'requirements.md',
      );
      mkdirSync(reqSnapshotDir, { recursive: true });
      writeFileSync(
        join(reqSnapshotDir, 'metadata.json'),
        JSON.stringify({
          filePath: 'specs/STAK-123-feature/requirements.md',
          currentVersion: 1,
          snapshots: [
            {
              version: 1,
              filename: 'snapshot-001.json',
              timestamp: '2026-01-01T00:00:00Z',
              trigger: 'approved',
              approvalId: 'test',
              approvalTitle: 'test',
            },
          ],
        }),
      );

      // Unapproved design — on disk but no snapshot
      const specDir = join(tempDir, 'specs', 'STAK-123-feature');
      mkdirSync(specDir, { recursive: true });
      writeFileSync(join(specDir, 'design.md'), '# Design\n');

      const result = await validatePhaseGates({
        specName: 'STAK-123-feature',
        documentType: 'tasks',
        workflowRoot: tempDir,
      });

      expect(result.passed).toBe(false);
      expect(result.gate).toBe('G4');
    });

    it('allows tasks when design.md is approved', async () => {
      // Create the spec document files
      const specDir = join(tempDir, 'specs', 'STAK-123-feature');
      mkdirSync(specDir, { recursive: true });
      writeFileSync(join(specDir, 'requirements.md'), '# Requirements');
      writeFileSync(join(specDir, 'design.md'), '# Design');

      // Approved requirements
      const reqSnapshotDir = join(
        tempDir,
        'approvals',
        'STAK-123-feature',
        '.snapshots',
        'requirements.md',
      );
      mkdirSync(reqSnapshotDir, { recursive: true });
      writeFileSync(
        join(reqSnapshotDir, 'metadata.json'),
        JSON.stringify({
          filePath: 'specs/STAK-123-feature/requirements.md',
          currentVersion: 1,
          snapshots: [
            {
              version: 1,
              filename: 'snapshot-001.json',
              timestamp: '2026-01-01T00:00:00Z',
              trigger: 'approved',
              approvalId: 'test',
              approvalTitle: 'test',
            },
          ],
        }),
      );

      // Approved design
      const designSnapshotDir = join(
        tempDir,
        'approvals',
        'STAK-123-feature',
        '.snapshots',
        'design.md',
      );
      mkdirSync(designSnapshotDir, { recursive: true });
      writeFileSync(
        join(designSnapshotDir, 'metadata.json'),
        JSON.stringify({
          filePath: 'specs/STAK-123-feature/design.md',
          currentVersion: 1,
          snapshots: [
            {
              version: 1,
              filename: 'snapshot-001.json',
              timestamp: '2026-01-01T00:00:00Z',
              trigger: 'approved',
              approvalId: 'test',
              approvalTitle: 'test',
            },
          ],
        }),
      );

      const result = await validatePhaseGates({
        specName: 'STAK-123-feature',
        documentType: 'tasks',
        workflowRoot: tempDir,
      });

      expect(result.passed).toBe(true);
    });
  });
});

describe('checkApprovalStatus', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'specflow-approval-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('handles malformed metadata.json gracefully', async () => {
    const snapshotDir = join(
      tempDir,
      'approvals',
      'STAK-123-feature',
      '.snapshots',
      'requirements.md',
    );
    mkdirSync(snapshotDir, { recursive: true });
    writeFileSync(join(snapshotDir, 'metadata.json'), '{not valid json!!!');

    const result = await checkApprovalStatus(tempDir, 'STAK-123-feature', 'requirements');

    expect(result.exists).toBe(true);
    expect(result.approved).toBe(false);
  });
});

// ── G5 — test-checklist requires approved tasks ──────────────────────────────
// (SFLW-17: cover the existing G5 phase gate for test-checklist documents.)

describe('validatePhaseGates G5 — test-checklist requires approved tasks', () => {
  let tempDir: string;
  const SPEC = 'STAK-123-feature';

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'specflow-g5-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('rejects test-checklist when tasks.md is missing', async () => {
    const result = await validatePhaseGates({
      specName: SPEC,
      documentType: 'test-checklist',
      workflowRoot: tempDir,
    });
    expect(result.passed).toBe(false);
    expect(result.gate).toBe('G5');
  });

  it('rejects test-checklist when tasks.md exists but is unapproved', async () => {
    writeSpecFile(tempDir, SPEC, 'tasks.md', '# Tasks\n');
    const result = await validatePhaseGates({
      specName: SPEC,
      documentType: 'test-checklist',
      workflowRoot: tempDir,
    });
    expect(result.passed).toBe(false);
    expect(result.gate).toBe('G5');
  });

  it('allows test-checklist when tasks.md is approved', async () => {
    writeSpecFile(tempDir, SPEC, 'tasks.md', '# Tasks\n');
    writeApprovalSnapshot(tempDir, SPEC, 'tasks', true);
    const result = await validatePhaseGates({
      specName: SPEC,
      documentType: 'test-checklist',
      workflowRoot: tempDir,
    });
    expect(result.passed).toBe(true);
    expect(result.gate).toBe('none');
  });
});

// ── checkTestChecklistGate — post-hoc completion gate ─────────────────────────
// (SFLW-17: cover the existing post-hoc gate that fires from log-implementation.)

describe('checkTestChecklistGate', () => {
  let tempDir: string;
  const SPEC = 'STAK-123-feature';

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'specflow-tcg-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('rejects when test-checklist has no approval record', async () => {
    const result = await checkTestChecklistGate(tempDir, SPEC, '1');
    expect(result.passed).toBe(false);
    expect(result.gate).toBe('TEST_CHECKLIST');
    expect(result.message).toContain('no approval record');
  });

  it('rejects when test-checklist exists but is unapproved', async () => {
    writeApprovalSnapshot(tempDir, SPEC, 'test-checklist', false);
    const result = await checkTestChecklistGate(tempDir, SPEC, '1');
    expect(result.passed).toBe(false);
    expect(result.gate).toBe('TEST_CHECKLIST');
    expect(result.message).toContain('not been approved');
  });

  it('passes silently when task section does not exist (non-TDD task)', async () => {
    writeApprovalSnapshot(tempDir, SPEC, 'test-checklist', true);
    writeSpecFile(
      tempDir,
      SPEC,
      'test-checklist.md',
      ['---', `spec: ${SPEC}`, '---', '', '# Test Checklist', ''].join('\n'),
    );
    const result = await checkTestChecklistGate(tempDir, SPEC, '99');
    expect(result.passed).toBe(true);
  });

  it('passes when approved and all items in task section are [x]', async () => {
    writeApprovalSnapshot(tempDir, SPEC, 'test-checklist', true);
    writeSpecFile(
      tempDir,
      SPEC,
      'test-checklist.md',
      [
        '---',
        `spec: ${SPEC}`,
        '---',
        '',
        '# Test Checklist',
        '',
        '## Task 1: example',
        '',
        '- [x] first test (`src/foo.test.ts:1`)',
        '- [x] second test (`src/foo.test.ts:5`)',
        '',
      ].join('\n'),
    );
    const result = await checkTestChecklistGate(tempDir, SPEC, '1');
    expect(result.passed).toBe(true);
  });

  it('rejects when section has incomplete [ ] items', async () => {
    writeApprovalSnapshot(tempDir, SPEC, 'test-checklist', true);
    writeSpecFile(
      tempDir,
      SPEC,
      'test-checklist.md',
      [
        '---',
        `spec: ${SPEC}`,
        '---',
        '',
        '# Test Checklist',
        '',
        '## Task 1: example',
        '',
        '- [x] first test (`src/foo.test.ts:1`)',
        '- [ ] second test (`src/foo.test.ts:5`)',
        '',
      ].join('\n'),
    );
    const result = await checkTestChecklistGate(tempDir, SPEC, '1');
    expect(result.passed).toBe(false);
    expect(result.gate).toBe('TEST_CHECKLIST');
  });
});

// ── checkTddPreflight — green-phase entry gate (SFLW-18) ──────────────────────

describe('checkTddPreflight', () => {
  let tempDir: string;
  const SPEC = 'STAK-123-feature';

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'specflow-preflight-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  describe('bypass for Phase 0 tasks', () => {
    it.each(['0', '0.1', '0.2', '0.3', '0.4', '0.5'])(
      'passes for Phase 0 taskId "%s" even with no checklist',
      async (taskId) => {
        const result = await checkTddPreflight(tempDir, SPEC, taskId);
        expect(result.passed).toBe(true);
        expect(result.gate).toBe('none');
        expect(result.message).toContain('Bypassed');
      },
    );

    it('does NOT bypass tasks that merely contain "0" elsewhere (e.g., "10")', async () => {
      const result = await checkTddPreflight(tempDir, SPEC, '10');
      expect(result.passed).toBe(false);
      expect(result.gate).toBe('TDD_PREFLIGHT');
    });
  });

  describe('rejection paths', () => {
    it('rejects when test-checklist.md does not exist', async () => {
      const result = await checkTddPreflight(tempDir, SPEC, '1');
      expect(result.passed).toBe(false);
      expect(result.gate).toBe('TDD_PREFLIGHT');
      expect(result.message).toContain('test-checklist.md not found');
    });

    it('rejects when checklist exists but has no approval record', async () => {
      writeSpecFile(tempDir, SPEC, 'test-checklist.md', '# Test Checklist\n');
      const result = await checkTddPreflight(tempDir, SPEC, '1');
      expect(result.passed).toBe(false);
      expect(result.gate).toBe('TDD_PREFLIGHT');
      expect(result.message).toContain('no approval record');
    });

    it('rejects when checklist has approval snapshot but is unapproved', async () => {
      writeSpecFile(tempDir, SPEC, 'test-checklist.md', '# Test Checklist\n');
      writeApprovalSnapshot(tempDir, SPEC, 'test-checklist', false);
      const result = await checkTddPreflight(tempDir, SPEC, '1');
      expect(result.passed).toBe(false);
      expect(result.gate).toBe('TDD_PREFLIGHT');
      expect(result.message).toContain('not been approved');
    });

    it('rejects when checklist is approved but has no section for the task', async () => {
      writeSpecFile(
        tempDir,
        SPEC,
        'test-checklist.md',
        [
          '---',
          `spec: ${SPEC}`,
          '---',
          '',
          '# Test Checklist',
          '',
          '## Task 1: only-task-one',
          '',
          '- [ ] some test (`src/a.test.ts:1`)',
          '',
        ].join('\n'),
      );
      writeApprovalSnapshot(tempDir, SPEC, 'test-checklist', true);
      const result = await checkTddPreflight(tempDir, SPEC, '2');
      expect(result.passed).toBe(false);
      expect(result.gate).toBe('TDD_PREFLIGHT');
      expect(result.message).toContain('no section for task "2"');
    });
  });

  describe('pass paths', () => {
    it('passes when approved and section exists with all [ ] items (red phase complete, green not started)', async () => {
      writeSpecFile(
        tempDir,
        SPEC,
        'test-checklist.md',
        [
          '---',
          `spec: ${SPEC}`,
          '---',
          '',
          '# Test Checklist',
          '',
          '## Task 1: example',
          '',
          '- [ ] failing test one (`src/foo.test.ts:1`)',
          '- [ ] failing test two (`src/foo.test.ts:5`)',
          '',
        ].join('\n'),
      );
      writeApprovalSnapshot(tempDir, SPEC, 'test-checklist', true);
      const result = await checkTddPreflight(tempDir, SPEC, '1');
      expect(result.passed).toBe(true);
      expect(result.gate).toBe('none');
    });

    it('passes when approved and section has mix of [x] and [ ] (green phase mid-flight)', async () => {
      writeSpecFile(
        tempDir,
        SPEC,
        'test-checklist.md',
        [
          '---',
          `spec: ${SPEC}`,
          '---',
          '',
          '# Test Checklist',
          '',
          '## Task 1: example',
          '',
          '- [x] passing test (`src/foo.test.ts:1`)',
          '- [ ] still-failing test (`src/foo.test.ts:5`)',
          '',
        ].join('\n'),
      );
      writeApprovalSnapshot(tempDir, SPEC, 'test-checklist', true);
      const result = await checkTddPreflight(tempDir, SPEC, '1');
      expect(result.passed).toBe(true);
    });

    it('passes for dotted taskId (e.g., 1.2) when section matches', async () => {
      writeSpecFile(
        tempDir,
        SPEC,
        'test-checklist.md',
        [
          '---',
          `spec: ${SPEC}`,
          '---',
          '',
          '# Test Checklist',
          '',
          '## Task 1.2: nested task',
          '',
          '- [ ] some test (`src/foo.test.ts:1`)',
          '',
        ].join('\n'),
      );
      writeApprovalSnapshot(tempDir, SPEC, 'test-checklist', true);
      const result = await checkTddPreflight(tempDir, SPEC, '1.2');
      expect(result.passed).toBe(true);
    });
  });
});

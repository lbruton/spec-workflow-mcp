---
description: "Update tasks.md when requirements or design change during implementation. Preserves completed work while aligning pending tasks with current spec."
argument-hint: "<specName> [description of changes]"
---

$ARGUMENTS

Refresh the task list for a specification because requirements or design have changed.

Parse arguments: first argument is specName, remainder describes what changed.

---

## Source of Truth
- Requirements come ONLY from requirements.md — not from existing tasks
- Design decisions come ONLY from design.md — not from existing tasks
- Tasks implement requirements; they don't define them
- If a feature exists in tasks but NOT in requirements.md/design.md, it has been REMOVED

## Three-Pass Validation

### PASS 1: Validate Existing Tasks Against Current Spec
For each existing task, verify the feature still exists in requirements/design.

- PENDING tasks: KEEP if still in spec, REMOVE if cut
- COMPLETED/IN-PROGRESS tasks: ALWAYS PRESERVE exactly as written. If feature removed, add a note.

### PASS 2: Gap Analysis
For each requirement/design element, verify task coverage exists.
- ADD new tasks for uncovered requirements
- ADD migration tasks when architecture changes affect completed work
- UPDATE pending tasks that need alignment

### PASS 3: Create Updated Task List
If NO changes needed: report "Task list is already aligned" and STOP.

If changes needed, build new tasks.md preserving:
1. All completed `[x]` tasks exactly as written
2. All in-progress `[-]` tasks exactly as written
3. Migration tasks for architecture changes affecting completed work
4. Only pending `[ ]` tasks backed by current requirements
5. New tasks for missing requirements

## Task Format
```
- [ ] 1.1 Create user authentication interface
  - File: src/auth/UserAuth.ts
  - Purpose: Enable user account management
  - _Leverage: src/components/BaseForm.tsx_
  - _Requirements: 1.1, 1.2_
```

## Critical Rules
- ALWAYS preserve completed and in-progress tasks exactly
- ALWAYS add migration tasks when architecture changes affect completed work
- ALWAYS reference specific requirements
- Use progressive migration strategy for major architecture changes

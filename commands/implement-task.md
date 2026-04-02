---
description: "Implement the next pending task (or a specific task) from a spec's tasks.md. Reads _Prompt guidance, dispatches subagents, logs implementation."
argument-hint: "<specName> [taskId]"
---

$ARGUMENTS

Implement a task from the spec-workflow tasks document.

Parse arguments: first argument is specName, optional second is taskId. If no taskId, implement the next pending task.

---

## Implementation Workflow

### 1. Check Current Status
- Use the **spec-status** MCP tool with the specName to see overall progress
- Read `.spec-workflow/specs/<specName>/tasks.md` to see all tasks
- Identify the target task (specific taskId or next pending `[ ]`)

### 2. Start the Task
- Edit tasks.md: change `[ ]` to `[-]` for the task you're starting
- Only one task should be in-progress at a time

### 3. Read Task Guidance
- Look for the `_Prompt` field — it contains Role, Task, Restrictions, Success criteria
- Note `_Leverage` fields for files/utilities to use
- Check `_Requirements` fields for which requirements this implements

### 4. Discover Existing Implementations (CRITICAL)
Before writing any code, search implementation logs:
```bash
grep -r "GET\|POST\|PUT\|DELETE" ".spec-workflow/specs/<specName>/Implementation Logs/"
grep -r "ComponentName" ".spec-workflow/specs/<specName>/Implementation Logs/"
```
- Don't create duplicate API endpoints
- Don't reimplement existing components/functions
- Follow established patterns

### 5. Implement the Task (dispatch subagent)
- Dispatch a fresh subagent (Agent tool) with the full task text, _Prompt guidance, and _Leverage file paths
- Template: `.spec-workflow/templates/implementer-prompt-template.md`
- The subagent implements, tests, commits, and self-reviews
- Main context stays clean for orchestration

### 5.5. Spec Compliance Review (dispatch reviewer subagent)
- Reviewer reads actual code and compares to task requirements line by line
- Template: `.spec-workflow/templates/spec-reviewer-template.md`
- If issues found: implementer fixes, then re-review
- Do NOT proceed until spec review passes

### 5.6. Code Quality Review (dispatch reviewer subagent)
- Only after spec compliance passes
- Template: `.spec-workflow/templates/code-quality-reviewer-template.md`
- Fix Critical and Important issues, re-review until approved

### 6. Log Implementation (MANDATORY — before marking task done)
**STOP: Do NOT mark the task [x] until this step succeeds.**

Call the **log-implementation** MCP tool with ALL of:
- `specName`, `taskId`, `summary`, `filesModified`, `filesCreated`
- `statistics: {linesAdded, linesRemoved}`
- `artifacts: {apiEndpoints, components, functions, classes, integrations}`

### 7. Complete the Task (only after step 6 succeeds)
- Confirm log-implementation returned success
- Verify all success criteria from _Prompt are met
- Run relevant tests
- Edit tasks.md: change `[-]` to `[x]`

---

## Rules

- Always mark a task as in-progress `[-]` before starting work
- **ALWAYS call log-implementation BEFORE marking a task [x]** — this is the most-skipped step
- If a task has subtasks (e.g., 4.1, 4.2), complete them in order
- Context budget: ~80-100 task dispatches with reviews on 1M context models
- After 60+ tasks, consider handoff to a fresh session

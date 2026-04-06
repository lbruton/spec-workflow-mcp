---
description: "Get status overview of spec documents, tasks, and approval workflows. Shows all specs or a specific one."
argument-hint: "[specName] [--detailed]"
---

$ARGUMENTS

Get status overview of specifications in this project.

Parse arguments: optional specName to filter to one spec, optional --detailed flag for task breakdown.

---

## Instructions

If a specName is provided:
1. Use the **spec-status** MCP tool with that specName
2. If --detailed, also read `specs/<specName>/tasks.md` under the resolved workflow root for full task breakdown
3. Check for pending approvals using the **approvals** MCP tool with `action:'status'`

If no specName:
1. Use the **spec-list** MCP tool to see all specifications
2. Use the **spec-status** MCP tool for each specification
3. Provide a consolidated overview of project progress

## Status Information Includes

- **Document Status**: Which documents exist (requirements, design, tasks)
- **Task Progress**: Completion status and remaining work
- **Approval Status**: Pending, approved, or rejected approvals
- **Workflow Stage**: Current phase (Planning → Design → Implementation → Review → Complete)

## Workflow Stages

1. **Planning**: Requirements document created and approved
2. **Design**: Design document created and approved
3. **Implementation**: Tasks defined and implementation in progress
4. **Review**: Implementation complete, awaiting final approval
5. **Complete**: All tasks complete and approved

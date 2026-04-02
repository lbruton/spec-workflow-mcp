---
description: "Create a spec document (requirements, design, or tasks) for a feature using the spec-workflow methodology."
argument-hint: "<ISSUE-ID-kebab-title> <requirements|design|tasks> [description]"
---

$ARGUMENTS

Create a spec document using the spec-workflow methodology.

Parse arguments: first argument is the specName (e.g., STAK-123-user-authentication), second is the documentType (requirements, design, or tasks), remainder is an optional description.

---

## Instructions

1. Read the template at: `.spec-workflow/templates/<documentType>-template.md`
2. Follow the template structure exactly — this ensures consistency
3. Create comprehensive content following spec-driven development best practices
4. Include all required sections from the template
5. Create the document at: `.spec-workflow/specs/<specName>/<documentType>.md`
6. After creating, use the **approvals** MCP tool with `action:'request'` to get user approval

## Document Types

- **requirements** — defines WHAT needs to be built
- **design** — defines HOW it will be built
- **tasks** — breaks down implementation into actionable steps
- Each document builds upon the previous one in sequence

## Special Instructions for Tasks Documents

- For each task, generate a `_Prompt` field with structured AI guidance
- Format: `_Prompt: Role: [role] | Task: [description] | Restrictions: [constraints] | Success: [criteria]`
- Include `_Leverage` fields pointing to existing code to reuse
- Include `_Requirements` fields showing which requirements each task implements
- Tasks should be atomic (1-3 files each) and in logical order

## Implementation Logging

When implementing tasks, developers use the `log-implementation` MCP tool to record what was done. Implementation logs appear in the dashboard's "Logs" tab. Good task descriptions help developers write better implementation summaries.

---
description: "Create a project steering document (product, tech, or structure). These provide high-level project guidance."
argument-hint: "<product|tech|structure> [scope]"
---

$ARGUMENTS

Create a steering document for the project.

Parse arguments: first argument is docType (product, tech, or structure), optional second is scope.

---

## Instructions

1. Read the template at: `.spec-workflow/templates/<docType>-template.md`
2. Check if steering docs exist at: `.spec-workflow/steering/`
3. Create comprehensive content following the template structure
4. Create the document at: `.spec-workflow/steering/<docType>.md`
5. After creating, use the **approvals** MCP tool with `action:'request'` to get user approval

## Steering Document Types

- **product**: Defines project vision, goals, and user outcomes
- **tech**: Documents technology decisions and architecture patterns
- **structure**: Maps codebase organization and conventions

## Key Principles

- Be specific and actionable
- Include examples where helpful
- Consider both technical and business requirements
- Provide clear guidance for future development

**Note:** Steering documents are NOT part of the standard spec workflow. They are project-level guidance documents that should only be created when explicitly requested.

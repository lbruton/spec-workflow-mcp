---
description: "Inject the steering document workflow guide into context. Instructions for creating product.md, tech.md, structure.md."
---

Load and inject the steering document workflow guide into this conversation.

## Instructions

1. Use the **steering-guide** MCP tool to retrieve the full guide content
2. Only proceed if the user explicitly requested steering document creation
3. Follow the sequence: product.md -> tech.md -> structure.md
4. Read templates from the resolved workflow root `templates/` directory
5. Create documents in the resolved workflow root `steering/` directory
6. Request approval after each document using the **approvals** MCP tool

## Important

- Steering documents are NOT part of the standard spec workflow
- They are project-level guidance documents for established codebases
- Only create when explicitly requested by the user

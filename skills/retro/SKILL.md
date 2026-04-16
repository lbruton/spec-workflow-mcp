---
name: retro
description: >
  End-of-session retrospective that extracts prescriptive lessons from the current
  conversation and saves them to mem0 as structured retro-learning memories. Unlike
  digest-session (descriptive — what happened), retro is prescriptive — what to do
  differently next time. Triggers on "/retro", "session retro", "what did we learn".
---

# Retro

Conduct a structured retrospective on the current session and save concrete, actionable
lessons to mem0 so future sessions don't repeat the same mistakes.

## The Core Distinction

- **digest-session** → descriptive: "Today we did X, worked on Y, finished Z"
- **retro** → prescriptive: "Next time, do X before Y" / "Never edit A without checking B"

## Step 1: Detect current project

```bash
git rev-parse --show-toplevel 2>/dev/null | xargs basename
```

Map to project tag using the same logic as mem0-session-start.py:
StakTrakr → staktrakr, HexTrackr → hextrackr, etc.

## Step 2: Reflect on the conversation

Scan the full conversation for:
- Mistakes that cost time or required backtracking
- Assumptions that turned out to be wrong
- Approaches that worked particularly well
- Things the user explicitly liked or pushed back on
- Gotchas or edge cases discovered in the codebase
- Process steps that were done in the wrong order
- Tools or patterns that solved problems cleanly

**Target:** 3-8 high-signal lessons. Skip anything obvious or trivial.

## Step 3: Classify and write each lesson to mem0

For each lesson, call `mcp__mem0__add_memory` with:

```
mcp__mem0__add_memory(
  text: "<single prescriptive sentence — action verb or 'When X, do Y' format>",
  user_id: "$USER",
  agent_id: "<project tag>",
  metadata: {
    "type": "retro-learning",
    "category": "<see categories below>",
    "source": "retro",
    "project": "<project tag>"
  }
)
```

**Critical (SWF-90):** Always set `metadata.project: "<tag>"` — this is the only project-scoping
field mem0 v1 API actually persists as queryable. The top-level `agent_id` parameter is silently
dropped (records have `agent_id: null`). Setting both is fine — `agent_id` is a harmless intent
signal, but `metadata.project` is what makes the record findable.

The "Alice" placeholder bug is a SEPARATE issue caused by passing `messages=[{role: "user"}]`
instead of `text=`. Always use `text=`.

### Categories

| Category | Use when | Example format |
|---|---|---|
| `error` | A mistake made that cost time or caused a bug | "When editing events.js, always check api.js for duplicate definitions first." |
| `pattern` | A successful approach worth repeating | "Use `context-percentage-usable` widget, not `context-percentage` — it's buffer-corrected." |
| `preference` | Something the user explicitly liked or rejected | "User prefers 2-3 row statusline layouts over 5+ row verbose layouts." |
| `improvement` | A process step that should change order or method | "Run /wiki-update BEFORE pushing — committing wiki after PR creation orphans the changes." |
| `warning` | A codebase gotcha or anti-pattern | "Never edit runtime JS files on dev main worktree — always create a worktree branch first." |
| `win` | Something that worked really well and should be repeated | "The block-bar.py custom-command approach for ccstatusline works cleanly — use for future custom widgets." |

### Writing style rules

- Start with an action verb or "When [condition],"
- Be concrete and specific — include file names, tool names, command names
- One lesson per memory call (do NOT batch multiple lessons into one memory)
- 1-2 sentences max per memory
- **Actor attribution:** Always use explicit subjects — never leave the actor ambiguous:
  - Things the **user** did/prefers → start with "your-username ..." (e.g., "lbruton prefers 2-3 row layouts")
  - Things **Claude** did/should do → start with "Claude should ..." or "When Claude ..." (e.g., "Claude should run /wiki-update BEFORE pushing")
  - Codebase facts → use passive voice or name the component (e.g., "The events.js file contains duplicate definitions")
  - **NEVER** use "User", "Alice", "Bob", or any placeholder name — use your username for the user and "Claude" for the agent

## Step 4: Present summary

After all mem0 writes complete, show a formatted summary:

```
## Session Retro — <project> (<date>)

Saved <N> lessons to mem0:

🔴 errors (<count>)
  • <lesson text>

🟡 warnings (<count>)
  • <lesson text>

🟢 wins (<count>)
  • <lesson text>

🔵 patterns (<count>)
  • <lesson text>

⚙️  improvements (<count>)
  • <lesson text>

💜 preferences (<count>)
  • <lesson text>
```

Only show categories that have at least one entry.

## When to run

**End-of-session:** `/wrap` runs retro inline automatically — no need to run `/retro`
separately before wrapping. `/wrap` checks for recent retro-learning entries in mem0
(within 60 minutes) and skips its inline retro if you already ran `/retro`.

**Standard end-of-session flow:**

```
With PR merged:   /pr-cleanup → /wrap
Without PR:       /wrap
```

**Standalone mid-session use (the primary reason `/retro` still exists):**
- After a spec completes (capture implementation lessons before moving on)
- After a debugging session that required backtracking
- Anytime you find yourself thinking "I should remember this for next time"
- After significant decisions where the rationale should survive to next session

## Integration

Retro learnings are surfaced automatically at the start of future sessions via the
`mem0-session-start.py` hook (which searches recent memories). The `retro-recall.py`
PreToolUse hook also surfaces relevant retro learnings before skill executions.

`/wrap` detects recent retro-learning entries in mem0 (within 60 minutes) and skips
its inline retro step automatically — no duplication.

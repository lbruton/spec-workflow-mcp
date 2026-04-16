---
name: start
description: >
  Lightweight session reorientation — queries session-rag + mem0 for recent session
  context, checks git state, and surfaces 5 most recent open issues. Fast alternative
  to /prime for continuing same-day work or resuming after a short break. No indexing,
  no code search, no agent dispatch.
  Triggers: "start", "quick start", "resume", "orient me", "where were we".
---

# Start

Lightweight session reorientation. Use this when you're continuing recent work and just
need to know where you left off — not when you need a full environment boot.

**Under 15 seconds.** No code indexing, no agent dispatch. Two fast MCP calls
(session-rag + mem0) replace the old digest file read.

---

## When to use /start vs /prime

| Situation | Use |
|---|---|
| Continuing same-day work in a new terminal | `/start` |
| Coming back after a short break (< 1 day) | `/start` |
| Starting fresh after days away | `/prime` |
| First session on a new project | `/prime` |
| Need full code indexing (Milvus/CGC) | `/prime` |
| Need comprehensive mem0 search | `/prime` |
| Just need context from last session | `/start` |

---

## The Flow

### Step 0 — Verify project identity (MUST run first, blocking)

```bash
cat .claude/project.json 2>/dev/null
pwd
```

If `.claude/project.json` is missing OR cwd differs from the expected project root (e.g.,
launched from a subdir whose parent is a different git repo — common when a project like
Devops/ sits inside an outer workspace repo), STOP the flow and warn prominently:

```
⚠ project.json missing or cwd mismatch
  cwd: <pwd output>
  project.json: <found path or "none">
  Likely cause: .claude/ is gitignored; file dropped during a merge/reset/worktree switch.
  Fix: create .claude/project.json with name/tag/issuePrefix, or cd to correct project root.
```

Offer to create `.claude/project.json` from a nearby sibling's template (read
`../<sibling>/.claude/project.json`, adjust `name`/`tag`/`issuePrefix`, write). Do not
continue to Steps 1-3 until resolved — otherwise digest paths and project scoping break
silently (the digest lands under `Root/` instead of the real project folder).

### Step 1 — Retrieve recent session context (session-rag + mem0)

Query session-rag and mem0 in parallel for recent session context. These are the only
MCP calls /start makes — both are fast (<2s each).

**1a — session-rag** (recent turns, project-scoped):

**IMPORTANT:** Do NOT pass filesystem paths as `project_root` — silently returns empty.
Omit `project_root` (defaults to current project via HTTP header) or use `"*"` for
cross-project search. Include the project name in the query for relevance.

```
mcp__session-rag__search_all_sessions(
  query="last session summary recent work decisions next steps <project-name>",
  n=5
)
```

Extract from results: what was worked on, decisions made, next steps noted, handoff items.

**1b — mem0** (curated episodic memory):

```
mcp__mem0__search_memories(
  query="recent work decisions handoffs",
  limit=10
)
```

Post-filter results by `metadata.project` matching the project tag (case-insensitive).
Merge with session-rag findings — mem0 adds retro learnings and cross-session decisions
that verbatim turns don't capture.

**Degradation:** If session-rag is unreachable (port 7102 down), use mem0 results only
and append a warning: `⚠ session-rag unavailable — context from mem0 only`.
If both are unavailable, note "No recent session context available" and continue.

### Step 2 — Git state snapshot

```bash
git status --short
git branch --show-current
git log --oneline -10
git worktree list
```

Surface:
- Current branch
- Last 10 commits (quick orientation on recent work)
- Uncommitted changes (if any)
- Active worktrees (if any beyond main)

### Step 3 — Recent open issues

Find the 5 most recently updated open issues from the vault:

```bash
ISSUES_DIR="/Volumes/DATA/GitHub/DocVault/Issues"
# Filter open issues first, then sort by modification time, take 5
# (truncating before filtering can return zero results if the top 5 are all closed)
grep -rl 'status:.*\(open\|backlog\|todo\|in-progress\|in-review\)' "$ISSUES_DIR" 2>/dev/null \
  | grep -v '_Index' | xargs ls -t 2>/dev/null | head -5
```

For each file, read the frontmatter to extract: `id`, `title`, `status`, `updated`.
Display as a compact list.

If there is no vault Issues directory or no open issues, note it briefly and move on.
Also check the project-specific Issues path if the global one is empty:
`/Volumes/DATA/GitHub/DocVault/Projects/{ProjectName}/Issues/`

---

## Output Format

Print a compact orientation report:

```
## Session Start — <ProjectName> (<date>)

### Last Session
<3-5 sentence recap synthesized from session-rag turns + mem0 memories — what was worked on, decisions made, next steps>

**Handoff:** <Any handoff/next-session items surfaced from session-rag or mem0 — omit if none>

---

### Git State
- **Branch:** <current branch>
- **Recent commits:** <last 3-5, one-liners>
- **Uncommitted:** <count or "clean">
- **Worktrees:** <list or "none">

---

### Open Issues (5 most recent)
- [<ID>] <title> — <status>
- [<ID>] <title> — <status>
- ...

---

_Use /prime for full environment boot with code indexing and comprehensive mem0 search._
```

Keep the whole output under 50 lines. If session context or issues are missing, compress
those sections to a single "none found" line rather than expanding on the absence.

**REQUIRED:** The final line of every /start report MUST be exactly:
`_Use /prime for full environment boot with code indexing and comprehensive mem0 search._`
Do not replace it with a custom summary or action item. It must always appear.

---

## Rules

- **session-rag + mem0 MCP calls only.** No indexing MCPs (Milvus, CGC, Codacy). No agent dispatch.
- **No code indexing.** Do not trigger claude-context, CGC, or any indexing operation.
- **Read-only.** Do not write, commit, or modify anything.
- **If /start would take > 20 seconds, something is wrong.** The two MCP calls + git
  commands + issue scan should complete in under 10 seconds total.

## What this skill does NOT do

- Full environment indexing (use /prime)
- Code health analysis or security scans (use /prime)
- DocVault page reading (use /prime)
- Agent dispatch of any kind (use /prime)
- Retro, wrap, or any write operations

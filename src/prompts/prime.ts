import { Prompt, PromptMessage } from '@modelcontextprotocol/sdk/types.js';
import { PromptDefinition } from './types.js';
import { ToolContext } from '../types.js';

const prompt: Prompt = {
  name: 'prime',
  title: 'Session Boot',
  description: 'Universal session boot. Gathers git history, open issues (priority-ranked), active specs, index health, Codacy findings, security reviews, session context from mem0, and writes a full prime report to DocVault. Incremental mode activates automatically when a report exists within 24h. Use "prime full" to force a complete refresh.',
  arguments: [
    {
      name: 'mode',
      description: '"full" forces a complete prime run regardless of recent prime report (default: auto — incremental if <24h, full if not)',
      required: false
    }
  ]
};

async function handler(args: Record<string, any>, context: ToolContext): Promise<PromptMessage[]> {
  const forceFullMode = args.mode === 'full';
  return buildPrimeMessages(context, forceFullMode);
}

function buildPrimeMessages(context: ToolContext, forceFull: boolean): PromptMessage[] {
  return [
    {
      role: 'user',
      content: {
        type: 'text',
        text: `Session boot. Gather full project status, write a prime report to DocVault, and display a terminal summary.

**Context:**
- Project: ${context.projectPath}
${context.dashboardUrl ? `- Dashboard: ${context.dashboardUrl}` : ''}
${forceFull ? '- Mode: FULL (forced — skip 24h delta check, run complete pipeline)' : ''}

---

## Phase 0: Project Discovery (instant, main context)

### Step 0.1: Read project identity
\`\`\`bash
cat .claude/project.json 2>/dev/null
\`\`\`
Extract: \`name\`, \`tag\`, \`issuePrefix\`. If no project.json, infer from git:
\`\`\`bash
basename "$(git remote get-url origin 2>/dev/null)" .git
\`\`\`
Set \`tag\` to lowercase repo name, \`issuePrefix\` to empty if absent.

Also extract \`owner\` and \`repo\` from git remote for Codacy API calls:
\`\`\`bash
git remote get-url origin 2>/dev/null
# Parse: git@github.com:lbruton/<repo>.git → owner=lbruton, repo=<repo>
\`\`\`

### Step 0.2: Detect capabilities (run in parallel)
\`\`\`bash
[ -d ".spec-workflow/specs/" ] && echo "hasSpecs=true" || echo "hasSpecs=false"
[ -f "devops/version.lock" ] && echo "hasVersionLock=true" || echo "hasVersionLock=false"
docker ps --filter "name=cgc" --format "{{.Names}}" 2>/dev/null | grep -q cgc && echo "hasCGC=true" || echo "hasCGC=false"
[ -d "/Volumes/DATA/GitHub/DocVault/Projects/<name>/Security Reviews" ] && echo "hasSecurityReviews=true" || echo "hasSecurityReviews=false"
git remote get-url origin 2>/dev/null
\`\`\`

### Step 0.3: Check for recent prime report
\`\`\`bash
PRIME_DIR="/Volumes/DATA/GitHub/DocVault/Projects/<name>/prime"
LATEST=$(ls -t "$PRIME_DIR"/*.md 2>/dev/null | head -1)
[ -n "$LATEST" ] && echo "latest_prime=$LATEST" && echo "latest_prime_ts=$(basename "$LATEST" .md)"
\`\`\`
Compare the filename timestamp to current time. If the most recent prime report is **less than 24 hours old**, set \`recentPrimeExists=true\`.

---

## Incremental vs Full Prime

${forceFull ? `**FORCED FULL RUN** — skip the 24h check, proceed directly to Phase 1.` : `After Phase 0, check \`recentPrimeExists\`:
- **\`recentPrimeExists=true\`** → run **Incremental Prime** (Phase I below)
- **\`recentPrimeExists=false\`** → run **Full Prime** (Phase 1 below)`}

---

## Incremental Prime (delta since last run — skip if full)

When a prime report exists within 24h, skip the agent pipeline and produce a lightweight delta.

### Step I.1: Read previous prime report
Read the most recent prime report file to establish baseline (commit hashes, PR count, issue count, Codacy state).

### Step I.2: Gather delta (parallel, main context)
\`\`\`bash
# New commits since last prime
git log --oneline --since="<last_prime_date> <last_prime_time>" --no-merges
# Current git status
git status --short
\`\`\`
\`\`\`bash
# Open PRs
gh pr list --state open --json number,title,headRefName,isDraft 2>/dev/null
\`\`\`
\`\`\`bash
# New/changed vault issues since last prime
find /Volumes/DATA/GitHub/DocVault/Projects/<name>/Issues/ -name "*.md" -newer "<latest_prime_file>" 2>/dev/null
\`\`\`
\`\`\`bash
# New security reviews since last prime
find "/Volumes/DATA/GitHub/DocVault/Projects/<name>/Security Reviews/" -name "*.md" -newer "<latest_prime_file>" 2>/dev/null
\`\`\`

### Step I.3: Codacy delta check (parallel with I.2)
\`\`\`
mcp__codacy__codacy_search_repository_srm_items(
  provider="gh", organization="<owner>", repository="<repo>",
  options={"statuses": ["OnTrack", "DueSoon", "Overdue"], "priorities": ["Critical", "High"]},
  limit=25
)
\`\`\`
Compare against previous prime's Codacy section. Identify net-new findings.

### Step I.4: Quick mem0 check
\`\`\`
mcp__mem0__search_memories(query="latest session <name>", filters={"AND": [{"agent_id": "<tag>"}]}, limit=3)
\`\`\`

### Step I.5: Write delta report to DocVault and display summary

Write to: \`/Volumes/DATA/GitHub/DocVault/Projects/<name>/prime/<YYYY-MM-DD>-<HHMMSS>.md\`

**Delta Report Template:**
\`\`\`markdown
---
tags: [prime-report, prime-delta, <tag>]
project: <name>
date: <YYYY-MM-DD>
branch: <branch>
version: <from version.lock or "n/a">
delta_from: <previous prime filename>
---

# Prime Delta — <name> (<date>)
Branch: <branch> | Status: <clean/dirty> | Version: <version>
Delta from: <previous prime date/time>

## New Commits Since Last Prime
| Date | Commit | Message |
|------|--------|---------|
<Commits since last prime. If none: "No new commits.">

## Changes
- **New commits**: N since last prime
- **Open PRs**: N (list any new/closed since last prime)
- **New/changed issues**: N (list titles)
- **Git status**: clean/dirty (list dirty files if any)

## Security Reviews
<If new review found: summarize. If no new review: "No new security reviews since last prime.">

## Codacy Findings (live)
- **N** open SRM findings (Critical: N, High: N) | **N** Overdue
- **Net new since last prime:** N findings (list titles if any)
<If no new findings: "No change in Codacy findings since last prime.">

## Session Context (mem0)
<2-3 sentences. If no results: "No recent session context found.">

## Suggested Next Steps
1. <based on new commits and open work>
2. <based on issues/PRs>
3. <based on security findings if any>
\`\`\`

**Delta Terminal Summary (displayed to user):**
\`\`\`
# <name> — <date> (delta)
Branch: \`<branch>\` | Version: \`<version>\` | Since: <last prime time>

## What Changed
- **N** new commits since last prime
- **N** open PRs
- **N** new/changed issues
<If new security review: "New security review — N High, N Medium, N Low">
<Codacy: N Critical, N High | N Overdue, or "No change">

## Session Context
<2-3 sentences from mem0>

## Suggested Next Steps
1. <highest priority>
2. <next>
3. <next>

---
Delta report saved to: DocVault/Projects/<name>/prime/<filename>.md
Full prime last ran: <previous prime date/time> — run \`/prime full\` to force a complete refresh
\`\`\`

**Stop here** — do not proceed to Phase 1 for incremental runs.

---

## Phase 1: Agent Dispatch (full prime only)

Fire ALL of the following agents simultaneously. Agents A and C run in background (non-blocking). Agent D runs in foreground — Phase 1.5 depends on its results.

### Agent A: Session Digest (background, skip if no undigested logs)

Check for undigested logs first:
\`\`\`bash
LOGDIR="$HOME/.claude/iterm2"
PROCESSED="$LOGDIR/.processed"
touch "$PROCESSED"
find "$LOGDIR" -maxdepth 1 -name "*.log" -newer "$PROCESSED" -type f 2>/dev/null | head -3
\`\`\`

If undigested logs exist, dispatch \`session-digest\` agent (background) for each (max 3):
\`\`\`
Process this iTerm2 session log into mem0 memories:
- logFile: <undigested .log path>
- project: <name>
- tag: <tag>
\`\`\`

### Agent C: Code Oracle (background)

Dispatch \`code-oracle\` agent (background):
\`\`\`
Run a startup health check on the codebase:
- query: "dead code, complexity hotspots, convention violations, stale patterns"
- mode: analyze
- workingDir: <absolute path to project root>
- project: <name>

Focus on:
1. Dead code detection (CGC if available)
2. Top 5 most complex functions (CGC if available)
3. Convention violations in files changed in the last 7 days

Keep the report compact — tables only, max 15 findings.
\`\`\`

### Agent D: Prime Status (foreground — WAIT for results)

Dispatch \`prime-status\` agent and **wait** for it to complete before proceeding to Phase 1.5:
\`\`\`
Gather a full project status report for:
- repo: <name>
- tag: <tag>
- issuePrefix: <issuePrefix or "none">
- workingDir: <absolute path>
- hasSpecs: <true/false>
- hasVersionLock: <true/false>
- hasSecurityReviews: <true/false>

Return only the synthesized report.
\`\`\`

---

## Phase 1.5: Keyword-Informed Context Enrichment (after Agent D returns)

### Step 1.5.1: Extract keywords from Agent D results
Parse the prime-status report to extract:
- Commit keywords: significant nouns from last 15 commit messages (strip fix/feat/chore prefixes)
- PR keywords: titles of open PRs
- Issue keywords: titles of active/todo vault issues
- Spec keywords: names of active specs

Select the **top 10-15 most distinctive domain terms** — skip generic words (update, fix, change, add, remove).

### Step 1.5.2: Dispatch targeted searches (parallel)

**Targeted mem0 searches (main context — fast):**
\`\`\`
mcp__mem0__search_memories(query="<keyword group 1 — feature/component names>", filters={"AND": [{"agent_id": "<tag>"}]}, limit=5)
mcp__mem0__search_memories(query="<keyword group 2 — bug/issue terms>", filters={"AND": [{"agent_id": "<tag>"}]}, limit=5)
\`\`\`
If project tag yields <2 results, also retry without agent_id filter.

Keep only memories that add context beyond git/issues: verbal decisions, rationale, planned next steps, blockers.

**Session-oracle agent (background):**
\`\`\`
Search for the most recent session context for this project:
- query: "last session for <name>: <top 5-8 keywords from step 1.5.1>"
- project: <name>
- dateRange: "last 7 days"

Focus on: decisions made, rationale, next steps discussed, blockers.
Return a 3-5 sentence recap of where we left off.
\`\`\`

---

## Phase 2: Indexing + Security (run during Phase 1 and 1.5)

Run these in main context while waiting for agents.

### Step 2.1: claude-context index
\`\`\`
mcp__claude-context__get_indexing_status(path="${context.projectPath}")
\`\`\`
If stale (>24h) or missing:
\`\`\`
mcp__claude-context__index_codebase(path="${context.projectPath}")
\`\`\`

### Step 2.2: CGC index (if hasCGC=true)
First check if project is indexed:
\`\`\`
mcp__code-graph-context__list_indexed_repositories()
\`\`\`
If listed, check health:
\`\`\`
mcp__code-graph-context__get_repository_stats(repo_path="/workspace/<name>")
\`\`\`
If not listed or function count suspiciously low (<50):
\`\`\`
mcp__code-graph-context__add_code_to_graph(path="/workspace/<name>")
\`\`\`
Poll \`check_job_status\` until complete. If Neo4j error, note it and continue — **do not restart containers**.

### Step 2.3: Codacy SRM + Critical Issues (parallel, main context)
\`\`\`
mcp__codacy__codacy_search_repository_srm_items(
  provider="gh", organization="<owner>", repository="<repo>",
  options={"statuses": ["OnTrack", "DueSoon", "Overdue"], "priorities": ["Critical", "High"]},
  limit=25
)
\`\`\`
\`\`\`
mcp__codacy__codacy_list_repository_issues(
  provider="gh", organization="<owner>", repository="<repo>",
  options={"levels": ["Error"], "categories": ["security", "errorprone"]},
  limit=25
)
\`\`\`
Extract: SRM count by priority (Critical/High), overdue count, critical quality issue count.
If Codacy fails: note "Codacy unavailable" and continue — never block prime on Codacy.

---

## Phase 3: Synthesis & DocVault Archive

Wait for ALL agents (Phase 1 + 1.5) to return. Combine results and produce the full report.

Data sources:
- **Agent D (prime-status)** → commits, PRs, hot files, issues, specs (ground truth)
- **Phase 1.5 mem0** → verbal decisions, rationale, planned next steps
- **Phase 1.5 session-oracle** → where we left off, next steps
- **Agent C (code-oracle)** → dead code, complexity, conventions
- **Step 2.3 Codacy** → SRM findings, critical issues, overdue items
- **Agent A (session-digest)** → logs processed
- **Steps 2.1/2.2** → index health

### Step 3.1: Write Full Report to DocVault

Write to: \`/Volumes/DATA/GitHub/DocVault/Projects/<name>/prime/<YYYY-MM-DD>-<HHMMSS>.md\`

Create the directory if needed (\`mkdir -p\`). Use this template exactly:

\`\`\`markdown
---
tags: [prime-report, <tag>]
project: <name>
date: <YYYY-MM-DD>
branch: <branch>
version: <from version.lock or "n/a">
---

# Prime Report — <name> (<date>)
Branch: <branch> | Status: <clean/dirty> | Version: <version>

## Recent Activity (ground truth from git + GitHub)

### Recent Commits
| Date | Commit | Message |
|------|--------|---------|
<Last 15 commits from Agent D>

### Open PRs
<"No open PRs." if none, else: PR# | Title | Branch | Draft>

### Hot Files (most-changed in 7 days)
| Changes | File |
|---------|------|
<Top 10 from Agent D>

### This Week by the Numbers
| Metric | Count |
|--------|-------|
| Issues completed | **N** |
| GitHub issues closed | **N** |
| Commits (7d) | **N** |
| Version range | <vX.Y.Z range or "n/a"> |

## Where We Left Off (keyword-targeted session-oracle + mem0)
<3-5 sentence recap from Phase 1.5 session-oracle + mem0>
<If no results: "No recent session history found.">

## Session Logs Digested
<Results from Agent A. If skipped: "All logs already processed.">

## Index Health
| Tool | Status | Details |
|------|--------|---------|
| claude-context | <Fresh/Stale/Indexing/Error> | <N files or error> |
| CGC (Neo4j) | <Running/Down/Error> | <N files, N functions or error> |

## Code Health (code-oracle)

### Dead Code
| Symbol | File:Line | Notes |
|--------|-----------|-------|
<From Agent C. If none: "No dead code detected." If agent timed out: "Code-oracle agent timed out — run /audit for code health.">

### Complexity Hotspots
| Function | File:Line | CCN | Rating |
|----------|-----------|-----|--------|
<Top 5 from Agent C. If unavailable: omit.>

### Convention Issues
| File:Line | Issue | Convention |
|-----------|-------|------------|
<From Agent C. If none: "All conventions followed.">

## Security Reviews
<If hasSecurityReviews=true and review found:>
### Latest Review: <date>
| Severity | Count | Key Findings |
|----------|-------|--------------|
| High | **N** | <one-line per finding or "None"> |
| Medium | **N** | <one-line per finding or "None"> |
| Low | **N** | <one-line per finding or "None"> |

Overall: <summary posture line>
<If review >30 days old: "⚠ Review is stale — consider scheduling a new scan.">
<If hasSecurityReviews=false: "No security reviews on file.">

## Codacy Findings (live scan)

### Security (SRM)
| Priority | Count | Category | Scan Type | Finding Pattern |
|----------|-------|----------|-----------|-----------------|
<From Step 2.3. If none: "No open security findings.">

**Summary:** **N** Critical, **N** High | **N** Overdue
<If Overdue items: "⚠ Overdue items need immediate attention.">

### Critical Code Quality Issues
<From Step 2.3. If none: "No critical code quality issues.">
<If Codacy unavailable: "Codacy MCP unavailable — skipping live security scan.">

## Project Status

### Active Specs
| Spec | Phase | Tasks | Status |
|------|-------|-------|--------|
<From Agent D. If hasSpecs=false: omit section.>

### Pending Approvals
<From Agent D. If none: "No pending approvals.">

### Open Bugs (by priority)
| Priority | Issue | Summary |
|----------|-------|---------|
<Bug-type open issues sorted by priority>

### Open Features / In-Progress
| Priority | Issue | Summary |
|----------|-------|---------|
<Feature/enhancement open issues sorted by priority>

### Backlog
| Issue | Summary |
|-------|---------|
<Lower-priority items not actively in progress>
<If issuePrefix is "none": omit vault issue sections, show GitHub issues only>

## Suggested Session Plan
1. <highest priority actionable item>
2. <next priority>
3. <next priority>
4. <next>
5. <next>
\`\`\`

### Step 3.2: Terminal Summary (displayed to user)

Display this — the full report lives in DocVault, not the terminal:

\`\`\`
# <name> — <date>
Branch: \`<branch>\` | Version: \`<version>\` | Status: <clean/dirty>

## Where We Left Off
<3-5 sentences from Phase 1.5 session-oracle + mem0>

## This Week
| Metric | Count |
|--------|-------|
| Issues completed | **N** |
| Commits (7d) | **N** |

## Open Issues (urgency ranked)
| Priority | Issue | Title | Status |
|----------|-------|-------|--------|
<One row per open issue. Sort: P1→P2→P3, then in-progress→todo→backlog within each tier.
Show ALL open issues — no row limit.
MANDATORY table format — never collapse to a bullet list.
If no open issues: single row with "—" in all columns.>

## Code Health
<One-line per category: dead code (N found), top complexity offender, conventions (clean/N issues).
If code-oracle timed out: "Code health scan in progress — run /audit for results.">

## Security
<Latest review date + posture, or "No reviews on file.">
Codacy: <N Critical, N High | N Overdue, or "Clean", or "Unavailable">

## Suggested Session Plan
1. <highest priority>
2. <next>
3. <next>

---
Full report: DocVault/Projects/<name>/prime/<filename>.md
\`\`\`

---

## Graceful Degradation

| Missing | Behavior |
|---------|----------|
| No \`issuePrefix\` | Skip vault issue queries, show GitHub issues only |
| No CGC (Docker down) | Skip CGC stats, note in Index Health |
| CGC MCP disconnected | Note "CGC MCP unavailable" — do NOT restart containers |
| CGC index job fails | Note error in Index Health, continue |
| No .spec-workflow/ | Omit spec sections |
| No version.lock | Show "n/a" for version |
| No undigested logs | Skip session-digest, note "All logs processed" |
| Agent timeout | Note which agent timed out, continue with available data |
| No security reviews | "No security reviews on file" |
| Codacy MCP down | "Codacy MCP unavailable — skipping" |
| Recent prime (<24h) | Incremental mode — skip full agents |

---

## Rules

- **Always write to DocVault.** Both full and delta runs produce a report file.
- **Agents A and C run in background.** Do not block on them.
- **Agent D runs in foreground.** Phase 1.5 depends on its results.
- **Full report goes to DocVault only.** Display only the terminal summary template.
- **Terminal summary under 40 lines.** Concise, actionable, scannable.
- **Issues table is mandatory.** Never collapse to a bullet list.
- **mkdir -p the prime/ directory** before writing — it may not exist.
- **DocVault path uses the project \`name\`**, not the tag.
- **Timestamp format for filenames:** \`YYYY-MM-DD-HHMMSS\` (local time, no colons).
- **Incremental prime skips Phases 1, 1.5, 2** — main context only, no agents.
- **\`/prime full\` forces a complete refresh** regardless of recent prime existence.
- **After the terminal summary, the session is ready for work.** Do not prompt to run prime again.`
      }
    }
  ];
}

export const primePrompt: PromptDefinition = {
  prompt,
  handler
};

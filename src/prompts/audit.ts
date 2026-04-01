import { Prompt, PromptMessage } from '@modelcontextprotocol/sdk/types.js';
import { PromptDefinition } from './types.js';
import { ToolContext } from '../types.js';

const prompt: Prompt = {
  name: 'audit',
  title: 'Project Health Audit',
  description: 'On-demand project health check covering code quality (CGC dead code, complexity), security posture (Codacy SRM), instruction file drift (CLAUDE.md vs Agents.md vs Gemini.md), issue landscape, and index health. Run when you want a thorough assessment — not needed every session.',
  arguments: [
    {
      name: 'focus',
      description: 'Focus the audit on a specific area: "code" (dead code, complexity), "security" (Codacy, SRM), "drift" (instruction file consistency), "issues" (stale/orphan issues), or "all" (default)',
      required: false
    }
  ]
};

async function handler(args: Record<string, any>, context: ToolContext): Promise<PromptMessage[]> {
  const focus = args.focus || 'all';

  const sections = {
    code: focus === 'all' || focus === 'code',
    security: focus === 'all' || focus === 'security',
    drift: focus === 'all' || focus === 'drift',
    issues: focus === 'all' || focus === 'issues',
  };

  const messages: PromptMessage[] = [
    {
      role: 'user',
      content: {
        type: 'text',
        text: `Run a project health audit. Focus: ${focus}.

**Context:**
- Project: ${context.projectPath}
${context.dashboardUrl ? `- Dashboard: ${context.dashboardUrl}` : ''}

---

## Phase 0: Project Identity

\`\`\`bash
cat .claude/project.json 2>/dev/null
git remote get-url origin 2>/dev/null
\`\`\`

Extract: \`name\`, \`tag\`, \`issuePrefix\`, \`owner\`, \`repo\` (parse from git remote).

---

## Phase 1: Parallel Scans

Dispatch ALL applicable scans simultaneously. Use agents for heavy work, main context for fast MCP calls.

${sections.code ? `### 1.1: Code Health (Agent: code-oracle, background)

Dispatch a \`code-oracle\` agent:
\`\`\`
Run a full code health audit:
- workingDir: ${context.projectPath}

Checks:
1. Dead code detection via CGC (mcp__code-graph-context__find_dead_code)
2. Top 10 most complex functions via CGC (mcp__code-graph-context__find_most_complex_functions)
3. Convention violations in files changed in the last 14 days
4. If CGC unavailable, fall back to grep-based analysis of unused exports

Output format: tables only, no prose. Max 20 findings per category.
\`\`\`
` : '<!-- code scan skipped -->'}
${sections.security ? `### 1.2: Security Posture (main context, parallel)

**Codacy SRM findings:**
\`\`\`
mcp__codacy__codacy_search_repository_srm_items(
  provider="gh", organization="<owner>", repository="<repo>",
  options={"statuses": ["OnTrack", "DueSoon", "Overdue"], "priorities": ["Critical", "High"]},
  limit=25
)
\`\`\`

**Critical code quality issues:**
\`\`\`
mcp__codacy__codacy_list_repository_issues(
  provider="gh", organization="<owner>", repository="<repo>",
  options={"levels": ["Error"], "categories": ["security", "errorprone"]},
  limit=25
)
\`\`\`

**DocVault security reviews — staleness check:**
\`\`\`bash
ls -t "/Volumes/DATA/GitHub/DocVault/Projects/<name>/Security Reviews/"*.md 2>/dev/null | head -1
\`\`\`
If the most recent review is older than 30 days, flag it as stale.

**GitHub security alerts:**
\`\`\`bash
gh api repos/<owner>/<repo>/vulnerability-alerts 2>/dev/null || echo "alerts-unavailable"
\`\`\`
` : '<!-- security scan skipped -->'}
${sections.drift ? `### 1.3: Instruction File Drift (main context, parallel)

Check consistency across agent instruction files. Read ALL three files that exist for this project:

\`\`\`bash
# Find instruction files
cat "${context.projectPath}/CLAUDE.md" 2>/dev/null | head -200
cat "${context.projectPath}/.codex/config.toml" 2>/dev/null || cat "${context.projectPath}/Agents.md" 2>/dev/null | head -200
cat "${context.projectPath}/Gemini.md" 2>/dev/null || cat "${context.projectPath}/.gemini/config.md" 2>/dev/null | head -200
\`\`\`

Also check the global instruction files:
\`\`\`bash
cat ~/.claude/CLAUDE.md 2>/dev/null | head -100
cat ~/.codex/config.toml 2>/dev/null | head -100
\`\`\`

**Extract factual claims** from each file:
- Tools/MCP servers referenced
- Services referenced (Linear, GitHub, Jira, etc.)
- Infrastructure references (IPs, ports, hostnames)
- Project names and repo paths
- Retired/deprecated items mentioned
- Workflow steps or mandatory gates

**Compare across files.** Report contradictions:
- Tool X mentioned in CLAUDE.md but not in Agents.md
- Service Y marked as "retired" in one file but still referenced in another
- Different IPs or ports for the same service
- Workflow steps that differ between agents

**Format findings as a table:**
| Claim | CLAUDE.md | Agents.md | Gemini.md | Issue |
|-------|-----------|-----------|-----------|-------|
| Linear usage | "retired 2026-03-13" | "track in INGEST project" | not mentioned | Stale reference in Agents.md |
` : '<!-- drift check skipped -->'}
${sections.issues ? `### 1.4: Issue Landscape (main context, parallel)

**Vault issues:**
\`\`\`bash
# All open issues
grep -rl "status: backlog\\|status: todo\\|status: in-progress" /Volumes/DATA/GitHub/DocVault/Projects/<name>/Issues/*.md 2>/dev/null
\`\`\`

For each open issue, read frontmatter to extract: id, title, status, priority, created date.

**GitHub issues:**
\`\`\`bash
gh issue list --repo <owner>/<repo> --state open --json number,title,labels,createdAt --limit 30 2>/dev/null
\`\`\`

**Cross-reference with recent work:**
\`\`\`bash
git log --oneline -30 --no-merges
\`\`\`

Identify:
- **Stale issues**: open for >30 days with no recent commits referencing them
- **Done but not closed**: issues whose work appears in git log but status is still open
- **Orphan GitHub issues**: GitHub issues with no corresponding vault issue (or vice versa)
` : '<!-- issue scan skipped -->'}

### 1.5: Index Health (always runs)

\`\`\`
mcp__claude-context__get_indexing_status(path="${context.projectPath}")
\`\`\`

If stale (>24h), trigger re-index:
\`\`\`
mcp__claude-context__index_codebase(path="${context.projectPath}")
\`\`\`

Check CGC:
\`\`\`
mcp__code-graph-context__get_repository_stats(repo_path="/workspace/<name>")
\`\`\`

If CGC function count seems low (<50 for medium+ projects), flag for re-index.

---

## Phase 2: Synthesis

Wait for all scans to complete. Combine results into a structured report.

### Terminal Summary (display to user, <40 lines)

\`\`\`
# Audit — <ProjectName> (<date>)

${sections.code ? `## Code Health
| Category | Count | Top Finding |
|----------|-------|-------------|
| Dead code | N | <most impactful unused symbol> |
| Complexity | N hotspots | <highest CCN function> |
| Conventions | N issues | <most common violation> |
` : ''}
${sections.security ? `## Security
**Codacy SRM:** N Critical, N High | N Overdue
<List Critical/Overdue items if any>
**Code Quality:** N Error-level issues
**Last Review:** <date> (<N days ago>)
<If >30 days: "⚠ Stale — schedule a new security review">
` : ''}
${sections.drift ? `## Instruction File Drift
<N contradictions found across CLAUDE.md / Agents.md / Gemini.md>
<List each contradiction as a one-liner>
<If clean: "All instruction files consistent.">
` : ''}
${sections.issues ? `## Issues
| Status | Count |
|--------|-------|
| In Progress | N |
| Backlog | N |
| Stale (>30d) | N |
| Done-not-closed | N |
` : ''}
## Index Health
| Tool | Status | Details |
|------|--------|---------|
| claude-context | Fresh/Stale | N files |
| CGC | Running/Down | N functions |

## Recommended Actions
1. <highest priority action>
2. <next>
3. <next>
\`\`\`

### Full Report (write to DocVault)

Write the complete report to:
\`\`\`
/Volumes/DATA/GitHub/DocVault/Projects/<name>/audit/<YYYY-MM-DD>-<HHMMSS>.md
\`\`\`

Include YAML frontmatter:
\`\`\`yaml
---
tags: [audit-report, <tag>]
project: <name>
date: <YYYY-MM-DD>
focus: ${focus}
---
\`\`\`

The full report includes all raw findings (not just the summary). Commit to DocVault:
\`\`\`bash
cd /Volumes/DATA/GitHub/DocVault && mkdir -p "Projects/<name>/audit" && git add "Projects/<name>/audit/" && git commit -m "audit: <project> <date>" && git push origin main
\`\`\`

---

## Rules

- **Parallel by default.** All scans that can run simultaneously should.
- **Graceful degradation.** If CGC is down, Codacy fails, or a file is missing — note it and continue. Never block the audit on a single failing check.
- **Facts, not opinions.** Report what the tools find. Don't editorialize.
- **Actionable output.** Every finding should map to a concrete next step.
- **Don't fix during audit.** The audit reports; the user decides what to fix. Exception: if the user says "fix it" after seeing results, then proceed.
- **Instruction drift is advisory.** Report contradictions but don't auto-sync files — each agent reads slightly different formats.`
      }
    }
  ];

  return messages;
}

export const auditPrompt: PromptDefinition = {
  prompt,
  handler
};

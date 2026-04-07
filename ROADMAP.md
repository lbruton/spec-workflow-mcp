# specflow Roadmap

_Last updated: 2026-04-06_

> Auto-generated from [DocVault issues](../DocVault/Projects/Specflow/Issues/). Source of truth lives there — edit issues, not this file.

## Active (18)

- [[SWF-2]]: Epic: DocVault consolidation — migrate all spec-workflow artifacts [p1, in-progress]
- [[SWF-12]]: .specflow/config.json — project-level DocVault pointer [p1]
- [[SWF-77]]: Slim /prime to fast boot (<60s) — remove stale wiki refs, defer scans to /audit [p1]
- [[SWF-79]]: Formalize lifecycle chain gates: chat → issue → discover → spec [p1]
- [[SWF-83]]: Approvals tool resolves filePath relative to project root, ignoring DocVault workflow root [p1]
- [[SWF-89]]: Approval dashboard shows blank document for DocVault-hosted projects [p1]
- [[SWF-17]]: Ship DocVault scaffold and sample project in repo [p2]
- [[SWF-56]]: Review /spec command port to plugin — verify full workflow parity [p2]
- [[SWF-71]]: Dashboard: project card view with sort options [p2]
- [[SWF-72]]: Dashboard: sidebar branding with SpecFlow logo [p2]
- [[SWF-75]]: Create /vault-reconcile skill for DocVault index maintenance [p2]
- [[SWF-76]]: Create /incident skill for structured workflow incident reporting [p2]
- [[SWF-78]]: Add wikilink formatting to /wrap session digests saved to DocVault [p2]
- [[SWF-81]]: Generate _Index.md when specs are created or archived [p2]
- [[SWF-85]]: Centralized templates still reference legacy .spec-workflow paths [p2]
- [[SWF-73]]: Dashboard: add personal site link and GitHub sponsor button [p3]
- [[SWF-74]]: Verify dashboard notification sounds work through NPM reverse proxy [p3]
- [[SWF-82]]: Clean stale plugin permission entries from settings files [p3]

## Backlog (13)

- [[SWF-20]]: Integration smoke test gate (Phase 4.5) [p2]
- [[SWF-21]]: MDX-safe task prompt linting in dashboard [p2]
- [[SWF-26]]: Secrets and seed data sanitization gate [p2]
- [[SWF-28]]: Dynamic GitHub repo link on dashboard [p2]
- [[SWF-34]]: DocVault runbook section for SpecFlow users [p2]
- [[SWF-54]]: Document startup hooks in specflow setup guide [p2]
- [[SWF-68]]: Rebuild SpecFlow lifecycle canvas for the current workflow [p2]
- [[SWF-87]]: Migration does not clean up old .spec-workflow/ directories, fails silently [p2]
- [[SWF-22]]: Project auto-registration on first spec init [p3]
- [[SWF-88]]: Wrap skill needs phase transition banners and visible gate checklist [p3]
- [[SWF-91]]: mem0 SessionStart hook: 7-day lookback too aggressive for stale projects [p3]
- [[SWF-92]]: /prime: surface mem0 recall count visibly in report header [p3]
- [[SWF-93]]: /wrap calls spec-status with no args; spec-status crashes on missing specName [p3]

## Completed (61)

- [[SWF-1]]: Remove wiki links from dashboard
- [[SWF-3]]: Sync steering docs to DocVault after approval
- [[SWF-4]]: Remove hardcoded project-specific links from dashboard
- [[SWF-5]]: Configurable custom links per project
- [[SWF-6]]: Rebrand to SpecFlow 1.0
- [[SWF-7]]: Rename GitHub repo to SpecFlow
- [[SWF-8]]: Create roadmap and changelog
- [[SWF-9]]: Collapsible annotation/comments drawer in approval preview
- [[SWF-10]]: Logo design and new README
- [[SWF-11]]: Add .claude-plugin/plugin.json manifest
- [[SWF-13]]: specflow init — interactive setup CLI wizard
- [[SWF-14]]: Skills directory infrastructure and bundling
- [[SWF-15]]: Port core workflow skills to plugin (chat, discover, spec, retro)
- [[SWF-16]]: Port supporting skills to plugin (gsd, issue, vault-update) + audit spec-workflow-guide
- [[SWF-18]]: CONTRIBUTING.md — how to fork, add skills, submit PRs
- [[SWF-19]]: npm publish pipeline + 1.0.0 public release
- [[SWF-23]]: Idempotency constraint in task prompt templates
- [[SWF-24]]: Post-spec context brief generation
- [[SWF-25]]: QA regression feedback loop into next spec
- [[SWF-27]]: Port memory pipeline skills to plugin (digest-session, remember, session-oracle, handoff)
- [[SWF-29]]: Merge /chat and /discover into unified Phase 0 with background research subagents
- [[SWF-30]]: Project-specific subagent infrastructure (frontend, backend, codereview)
- [[SWF-31]]: /launch command — Phase 1 decision gate with workflow routing
- [[SWF-32]]: Steering doc maintenance skill — auto-sync with codebase truth
- [[SWF-33]]: Global agent context sync skill
- [[SWF-35]]: Prerequisites: Playground and Ralph Loop in README
- [[SWF-36]]: DocVault viewer and editor in dashboard (v3.0)
- [[SWF-37]]: UI framework research and dashboard refresh (v3.0)
- [[SWF-38]]: Implement drift detection for DocVault
- [[SWF-39]]: Promote retro lessons to deterministic pattern files
- [[SWF-40]]: Post-commit hook for DocVault staleness warnings
- [[SWF-41]]: Add SPEC_WORKFLOW_PROJECT_ROOT env var to filter project registration
- [[SWF-42]]: Epic: Skill Migration — User-Level to Plugin-Level
- [[SWF-43]]: Port lifecycle bookend skills (prime, goodnight, handoff)
- [[SWF-44]]: Port development quality skills (debug, tdd, verify, worktrees)
- [[SWF-45]]: Port search skills (code-oracle, codebase-search, web-search)
- [[SWF-46]]: Port meta skills (skill-creator, workflow-architecture, writing-skills)
- [[SWF-47]]: Create infrastructure basics skills (obsidian, docker, portainer, homelab)
- [[SWF-48]]: Upgrade Fastify 4→5 to resolve CVE-2026-25223 and CVE-2026-25224
- [[SWF-49]]: Replace iTerm dispatch with Codex task delegation in Phase 4
- [[SWF-50]]: Build /wrap skill — end-of-session orchestrator
- [[SWF-51]]: Build /audit skill — on-demand project health check
- [[SWF-52]]: Slim /prime to quick-start (no agents, 15 seconds)
- [[SWF-53]]: mem0 quality cleanup — purge low-signal entries
- [[SWF-55]]: Update README and GitHub landing page for lifecycle redesign
- [[SWF-58]]: Invert template hierarchy — generic defaults with project-specific test overrides
- [[SWF-59]]: Spec workflow lacks project-specific test suite awareness
- [[SWF-60]]: Version bump + npm publish after SWF-58 template inversion is validated
- [[SWF-61]]: Prime prompt does not write prime log or use established prime template
- [[SWF-62]]: Retire /handoff skill — merge into /wrap --handoff
- [[SWF-63]]: DocVault Index Tree — hierarchical _Index.md + master INDEX.md + shrink CLAUDE.md
- [[SWF-64]]: YouTube transcript extraction skill (out of scope, closed)
- [[SWF-65]]: Simplify distribution — deprecate marketplace, standardize on npm + git clone
- [[SWF-66]]: Do not show worktree sessions as separate projects in dashboard
- [[SWF-67]]: Dashboard: deduplicate projects, live session indicator, at-a-glance status
- [[SWF-69]]: Add www.lbruton.cc portfolio link to footer/about page
- [[SWF-70]]: Re-author global default templates with mandatory quality gates
- [[SWF-80]]: Rename .specflow to .specflow across codebase and all projects
- [[SWF-84]]: SpecFlow MCP plugin fails to load in Gemini and Codex when launched from GitHub root
- [[SWF-86]]: Complete DocVault migration sweep and retire VS Code extension
- [[SWF-90]]: mem0 pipeline cleanup: agent_id field not persisted, project tag drift, missing entities

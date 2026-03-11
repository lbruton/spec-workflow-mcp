# Fork Changelog

Changes made in the [lbruton/spec-workflow-mcp](https://github.com/lbruton/spec-workflow-mcp) fork, diverging from [Pimzino/spec-workflow-mcp](https://github.com/Pimzino/spec-workflow-mcp).

Fork point: upstream commit `de43598` (2026-02-27). Upstream CHANGELOG preserved separately in [CHANGELOG.md](CHANGELOG.md).

## 2026-03-09

### Fixed

- **Project registry persistence** -- keep projects in the registry when all MCP instances disconnect, preventing ghost state on reconnect (`project-registry.ts`)
- **Rate limit raised to 600 req/min** -- local dashboard was hitting the 120 req/min ceiling during normal use (`multi-server.ts`)
- **Approval annotator text color** -- use explicit CSS variable instead of `inherit`, fixing invisible text in some themes (`ApprovalsAnnotator.tsx`)
- **Phase approved status in dashboard** -- both parsers now read snapshot metadata to correctly report approval state instead of re-parsing the raw markdown (`parser.ts`, `dashboard/parser.ts`)

## 2026-03-07

### Added

- **Phase 5.2 User QA Session** -- new post-implementation phase for manual QA before wiki/PR. Restructured Phase 5 into 5.1 (E2E tests), 5.2 (QA), 5.3 (Wiki + PR) (`spec-workflow-guide.ts`, templates)
- **Artifacts folder in spec structure** -- specs now include an `artifacts/` directory for prototypes, mockups, and design assets. Prototype enforcement strengthened in Phase 3.5 and Phase 4 (`tasks-template.md`, `design-template.md`)

### Fixed

- **Phase 5 ordering** -- wiki update moved after QA session to match the 5.1/5.2/5.3 restructure

## 2026-03-06

### Added

- **Phase 3.9 Implementation Readiness Gate** -- mandatory gate between task planning and implementation. Includes tri-modal concerns status (approve with concerns, request revision, reject) and adversarial bug-fix pre-check (`spec-workflow-guide.ts`, `approvals.ts`)
- **Implementation log audit in spec-status** -- `spec-status` now reports logged vs unlogged tasks, catching missing `log-implementation` calls before spec completion (`spec-status.ts`)
- **Phase 5 post-implementation flow** -- formalized E2E testing, wiki update, and PR creation as tracked phases (`spec-workflow-guide.ts`)
- **Spec reviewer and code quality reviewer templates** -- new markdown templates for structured review prompts (`spec-reviewer-template.md`, `code-quality-reviewer-template.md`)
- **Implementer prompt template** -- ready-to-paste prompt template for dispatching implementation to subagents (`implementer-prompt-template.md`)

### Fixed

- **Readiness gate tracking in dashboard** -- spec viewer dropdown now includes readiness reports; phase tracking accounts for Phase 3.9 (`multi-server.ts`, `SpecViewerPage.tsx`)
- **Concerns approval action** -- "Concerns" button now works correctly for all approval types (`approvals.ts`)

## 2026-03-01

### Added

- **GitHub PR links in dashboard** -- sidebar and header show PR links for the active spec. Links open in a chrome-stripped popup window (`PageNavigationSidebar.tsx`, `App.tsx`)
- **Phase 5 wiki + E2E steps in workflow guide** -- spec-workflow-guide now includes wiki update and E2E testing as explicit post-implementation steps (`spec-workflow-guide.ts`)
- **Tests artifact type** -- `log-implementation` now accepts `tests` as an artifact category (`log-implementation.ts`)
- **SRPI execution mechanics** -- merged Structured Research-Plan-Implement pattern into Phase 4, giving the implementer a codebase research step before coding (`spec-workflow-guide.ts`)

### Fixed

- **Version display** -- dashboard reads version from local `package.json` instead of querying the NPM registry, which returned the upstream version (`multi-server.ts`)
- **Phase 5 E2E testing** -- switched from generic browser testing to Browserbase/Stagehand with PR preview URLs (`spec-workflow-guide.ts`)

## 2026-02-27 -- Fork Created

### Added

- **DevOps Hub page** -- project-aware hub with embedded dashboards, quick links, and project switcher. New `DevOpsHubPage.tsx` component and `/hub` route (`App.tsx`, `PageNavigationSidebar.tsx`)
- **README fork notice** -- header noting this is a customized fork with link to upstream

### Changed

- **Navigation sidebar overhaul** -- refactored `PageNavigationSidebar.tsx` to support Hub, Specs, Approvals, and Logs as top-level routes with project context
- **Localization expanded** -- all 11 locale files updated with new keys for Hub, PR links, Phase 5, and readiness gate strings

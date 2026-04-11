---
name: react-frontend-code-quality-review
description: "Review React/TypeScript frontend code quality for SRP, component boundaries, state/store design, duplication, verbosity, and extensibility. Use when auditing Thesis-MultiAgents/src pages/components, reviewing PRs, or planning low-risk refactors."
argument-hint: "Scope to review, e.g. full src, src/pages/ProductionLine, or changed files in a PR"
user-invocable: true
---

# React Frontend Code Quality Review

## What This Skill Produces
This skill performs a structured quality review of a React + TypeScript frontend and returns:
- Severity-ranked findings with concrete evidence.
- Refactor proposals that do not increase maintenance burden.
- A folder-aware diagnosis (architecture issues, not only local code style issues).
- A practical action list split into quick wins and deeper refactors.

## When To Use
Use this skill when you need to:
- Check whether components follow Single Responsibility Principle.
- Decide whether scattered component logic should move into a store.
- Decide whether large components should be split into smaller modules.
- Identify redundant code and missed extraction opportunities.
- Improve flexibility/extensibility without over-engineering.

## Project Folder Responsibility Map (Thesis-MultiAgents/src)
Use this map before evaluating quality. Judge code against the role of its folder.

- `src/pages`: Route-level composition/orchestration. Should focus on page wiring, not deep domain logic.
- `src/pages/*/components`: Feature-specific UI modules for each page. Prefer focused components with clear boundaries.
- `src/components/ui`: Shared UI primitives (shadcn-style wrappers). Should stay generic and reusable.
- `src/components/layout`: Global shell/navigation components.
- `src/components/3D` and `src/components/assets`: Cross-page specialized visual components.
- `src/stores`: Cross-component or cross-panel state (Zustand). Keep domain boundaries explicit.
- `src/api`: Typed request/response contracts and API calls. Keep transport concerns here, not UI behavior.
- `src/hooks`: Reusable behavior hooks; avoid turning hooks into hidden god-services.
- `src/utils`: Pure helpers/parsers/transformations; avoid UI side-effects.
- `src/types`: Shared type contracts and domain typing.
- `src/assets`: Static resources only.

## Review Procedure

### 1. Scope And Baseline
1. Identify review scope (full frontend, feature folder, or PR diff).
2. Record key entry points first (`App.tsx`, page index files, store files, API modules).
3. Build a quick dependency map: pages -> feature components -> stores/api/utils.

### 2. Folder-Role Alignment Check
For each touched file, ask:
- Does this file contain logic that belongs to another folder role?
- Is a page file doing component internals, data parsing, or store-like orchestration?
- Is an API module leaking view-state decisions?
- Is a utility file carrying mutable UI behavior?

Flag any role drift as an architectural finding.

### 3. Component SRP Check
For each component, classify responsibilities:
- View rendering
- Data fetching
- State orchestration
- Domain transformation/parsing
- Side-effects/events

Decision:
- If one component owns 3+ concerns, mark as SRP violation candidate.
- If concerns are tightly coupled and tiny, keep as-is and note "acceptable coupling".

### 4. Store Consolidation And State Placement
Use this decision tree:
- If state is used by multiple sibling components/panels and has lifecycle beyond one component -> consider store.
- If state is purely local UI ephemeral state (hover, one dialog toggle, one form field) -> keep local.
- If multiple components duplicate the same derived state + mutation rules -> centralize in store or dedicated hook.
- If a store holds unrelated domains (assets + chat + scene physics mixed) -> split by domain boundary.

Constraint:
- Do not move logic into a store if it adds indirection with no real reuse.

### 5. Component Size And Splitting Check
Evaluate whether a component is too large by impact, not only line count.

Heuristics (soft thresholds):
- > 220 lines, or
- > 12 props, or
- > 3 distinct UI regions with separate interactions, or
- many unrelated `useEffect` blocks.

Split only when all are true:
- Extracted part has a clear name and responsibility.
- Parent becomes easier to read.
- Data flow does not become harder to trace.

### 6. Duplication, Verbosity, And Reuse Check
Look for:
- Repeated JSX blocks with tiny variations.
- Repeated status/error handling strings and patterns.
- Similar parsing/formatting code in multiple files.
- Repeated action handlers that differ only by constants.

Prefer extracting:
- Shared view primitives to `src/components` (or feature-shared component).
- Shared business rules to `src/utils` or `src/stores` action helpers.
- Shared request patterns to `src/api` utility wrappers.

### 7. Extensibility And Changeability Check
Ask "What breaks if we add one more feature variant?"

Red flags:
- Hard-coded branching in page components.
- Feature behavior encoded in UI text parsing without abstraction.
- No typed boundary between API payload and UI model.
- Tight coupling of rendering and mutation logic.

### 8. React And Project Conventions Check
- Functional components only.
- Keep React Compiler friendly: avoid manual `React.memo`, `useMemo`, `useCallback` unless justified.
- Keep typed API contracts.
- Keep components small and decoupled.
- Keep implementation practical and simple.

### 9. Output Findings In Review Format
Return findings first, ordered by severity:
- Severity: Critical / High / Medium / Low
- Location: file and symbol
- Evidence: why this is a quality issue
- Risk: maintenance/performance/feature risk
- Recommendation: minimal-change fix first

Then provide:
- Quick wins (can apply immediately)
- Refactor backlog (higher-impact, staged)

## Quality Criteria (Pass/Fail)
A review is complete only when all checks are explicitly answered:
- Folder role alignment checked.
- SRP reviewed for major components in scope.
- Store placement decisions documented with reasoning.
- Oversized component split candidates evaluated with trade-offs.
- Duplication and verbosity hotspots listed.
- Extensibility risks identified.
- Recommendations avoid unnecessary complexity.

## Suggested Review Output Template
Use this structure for consistency:

1. Scope reviewed
2. Architecture summary by folder role
3. Findings by severity
4. Store consolidation decisions
5. Component split decisions
6. Quick wins
7. Refactor backlog
8. Residual risks

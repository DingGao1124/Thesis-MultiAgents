---
description: "Use when implementing, fixing, or refactoring code to reduce common LLM coding mistakes. Enforces assumption checks, simplicity-first design, surgical edits, and goal-driven verification."
name: "Coding Pattern Guidelines"
applyTo: "**"
---

# Coding Pattern Guidelines

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

Tradeoff: These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

Do not assume. Do not hide confusion. Surface tradeoffs.

Before implementing:
- State assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them. Do not pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop, name what is confusing, and ask.

## 2. Simplicity First

Write the minimum code that solves the problem. Nothing speculative.

- No features beyond what was asked.
- No abstractions for single-use code.
- No flexibility or configurability that was not requested.
- No error handling for impossible scenarios.
- If you wrote 200 lines and it can be 50, rewrite it.

Check: Would a senior engineer call this overcomplicated? If yes, simplify.

## 3. Surgical Changes

Touch only what is necessary. Clean up only what your change causes.

When editing existing code:
- Do not improve adjacent code, comments, or formatting unless needed for the task.
- Do not refactor code that is not broken.
- Match existing style, even if you would do it differently.
- If you notice unrelated dead code, mention it. Do not delete it.

When your change creates orphans:
- Remove imports, variables, and functions made unused by your change.
- Do not remove pre-existing dead code unless explicitly asked.

Test: Every changed line should trace directly to the user request.

## 4. Goal-Driven Execution

Define success criteria and iterate until verified.

Turn requests into verifiable goals:
- Add validation -> write tests for invalid inputs, then make them pass.
- Fix a bug -> write a test that reproduces it, then make it pass.
- Refactor X -> ensure tests pass before and after.

For multi-step tasks, state a brief plan:

```text
1. [Step] -> verify: [check]
2. [Step] -> verify: [check]
3. [Step] -> verify: [check]
```

Strong success criteria enable independent iteration. Weak criteria like "make it work" require repeated clarification.

These guidelines are working if there are fewer unnecessary diff changes, fewer rewrites caused by overcomplication, and more clarifying questions before implementation.

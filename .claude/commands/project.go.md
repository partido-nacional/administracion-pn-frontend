# Command: /project.go

**Description**: Express mode - orchestrates the complete workflow using standard commands

**Usage**:
- `/project.go "feature-name"` → Full automatic workflow with explicit name
- `/project.go "feature description"` → Auto-derives name from description
- `/project.go --resume` → Resume interrupted express workflow

---

## Quick Help

> `/project.go help` → Shows this summary

**Syntax**: `/project.go "feature-name" [flags]`

| Flag | Description |
|------|-------------|
| `"feature-name"` | Full automatic workflow with explicit name |
| `"description"` | Auto-derives name from description |
| `--resume` | Resume interrupted express workflow |

**Flow**: start → spec → plan → build → finish (3-5 questions total)

**Examples**:
```bash
/project.go "payment-gateway"    # Full express workflow
/project.go "add user auth"      # Auto-derives name: user-auth
```

---

## Architecture: Orchestrator Pattern

> **CRITICAL**: `/project.go` is an **orchestrator**, NOT a standalone implementation.
> It invokes standard commands with express mode rules. **DO NOT duplicate logic here.**

**Flow**: `/project.start --express` → `/project.spec` → `/project.plan` → `/project.build` → `/project.finish`

**Express Rules**:
- 3-5 critical questions only
- Auto-advance between steps
- Predefined defaults

---

## Purpose

One-command feature development for simple, well-understood features.

**Good for**: Simple features, quick prototypes, clear requirements
**Not for**: Complex integrations, extensive design decisions, unclear requirements

---

## Express Rules

### 1. Consolidated Questions (3-5 only)

| # | Question | Purpose | Triggers |
|---|----------|---------|----------|
| 1 | What's the main feature? | Problem statement | Always |
| 2 | Who uses it? | User context | Always |
| 3 | Technical constraints? | Architecture decisions | Always |
| 4 | External integrations? | Dependencies | If mentioned |
| 5 | Security requirements? | Security design | If sensitive data |

### 2. Predefined Defaults

| Decision | Express Default |
|----------|-----------------|
| Execution strategy | Batched |
| Test coverage target | 80% |
| Template | Full (not Lite) |

### 3. Auto-Advance Behavior

- No confirmation prompts between steps
- No "proceed?" questions — just continue
- Pause only on: errors, missing info, security decisions, consolidated questions

---

## Execution Flow

| Step | Command | Override |
|------|---------|----------|
| 0 | Input validation | Derive name if description |
| 1 | `/project.start "<name>" --express` | — |
| 2 | `/project.spec` | Consolidated questions |
| 3 | `/project.plan` | Auto-select Batched |
| 4 | `/project.build` | Auto-retry 2x max |
| 5 | `/project.finish` | All validations mandatory |

---

## AI Agent Instructions

### Help Flag Detection

**WHEN** the user runs `/project.go help`:
1. Output ONLY the "Quick Help" section (not full documentation)
2. Do NOT execute go logic
3. Keep response concise (~15 lines)

### CRITICAL: Orchestrator Implementation

When `/project.go` is invoked:
1. **DO NOT implement each step from scratch**
2. **DO reference and execute the standard commands**
3. **DO apply express rules as overrides**

### Step 0: Input Validation

If input is valid kebab-case name → use directly
If input is description → derive name (extract key nouns, kebab-case), DO NOT ask confirmation

### Step 1: Initialize

Execute `/project.start "<feature-name>" --express`

Includes: scaffolding, git branch, meta.md with `execution_mode: express`

### Step 2: Specifications

Execute `/project.spec` (reads `execution_mode: express` from meta.md)

> **How express mode propagates**: `/project.start --express` writes `execution_mode: express` into `meta.md`. Every subsequent command (`spec`, `plan`, `build`, `finish`) reads that field and adjusts behavior automatically — fewer questions, no confirmations, auto-advance. This is why `/project.go` doesn't need to pass flags to each command explicitly.

**Override**: Use consolidated questions instead of full interview.

### Step 3: Task Planning

Execute `/project.plan` (reads mode from meta.md)

**Override**: Auto-select "Batched" strategy, no confirmation.

### Step 4: Implementation

Execute `/project.build` (reads mode from meta.md)

**Override**: On task failure, auto-invoke `/project.fix` with the error output (retry 1). If the fix resolves it, **re-read specs and tasks.json before continuing** — the fix may have updated them. If it fails again, invoke `/project.fix` once more (retry 2), re-reading specs again afterward. After 2 failed fix attempts on the same task, pause and surface the error to the user — do not retry further.

### Step 5: Finalization

Execute `/project.finish` (reads mode from meta.md)

All validations mandatory (tests, code review, security, performance).

---

## Error Handling

If any step fails, show error details and options:
- (a) Fix and retry with appropriate command
- (b) Continue in standard mode: `/project.check`
- (c) Abort: `/project.cancel`

---

## Resume

`/project.go --resume` resumes an interrupted express workflow:

1. Find the current feature in `project/wip/` (using the feature resolution logic from `bash-patterns.md`)
2. Read `meta.md` → `Current Stage` to determine the last completed step
3. Map stage to the next command in the express flow:

| `Current Stage` | `stages.[stage].status` | Resume from |
|----------------|------------------------|-------------|
| `functional` | `in-progress` | `/project.spec` (functional) |
| `technical` | `in-progress` | `/project.spec` (technical) |
| `tasks` | `in-progress` or `pending` | `/project.plan` |
| `implementation` | `in-progress` | `/project.build --resume` |

4. Continue applying express rules (no confirmations, auto-advance) from that step onward

---

## Comparison with Standard

| Aspect | /project.go | Standard |
|--------|-------------|----------|
| Commands | 1 (orchestrates 5) | 5 separate |
| Questions | 3-5 critical | Full interviews |
| Confirmations | None | At each phase |

---

## Key Principle

> **Standard commands are the single source of truth.**
> `/project.go` only defines: express rules, orchestration flow, error handling.
> For implementation details, read the corresponding command file.

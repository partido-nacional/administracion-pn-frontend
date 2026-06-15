# Command: /project.check

**Description**: View feature status, run consistency checks, and validate compliance

**Usage**:
- `/project.check` → Current feature status overview
- `/project.check [feature]` → Specific feature status (by name, number, or full name)
- `/project.check --sync` → Check consistency between specs/tasks/code + propose fixes
- `/project.check --compliance` → Check build/tests/lint compliance + propose fixes
- `/project.check --compact` → Compressed single-line status summary (saves context)
- `/project.check task TASK-XXX` → Specific task details
- `/project.check --resume` → List all resumable sessions across features
- `/project.check --resume --last` → Resume last interrupted session

**Feature Reference Formats**:
- By number: `/project.check 003`
- By name: `/project.check user-auth`
- By full name: `/project.check 003-user-auth`

---

## Quick Help

> `/project.check help` → Shows this summary

**Syntax**: `/project.check [target] [flags]`

| Flag | Description |
|------|-------------|
| (none) | Current feature status overview |
| `[feature]` | Specific feature status |
| `--sync` | Check specs/tasks/code consistency |
| `--compliance` | Check build/tests/lint compliance |
| `--compact` | Show compressed status summary (saves context) |
| `task TASK-XXX` | Specific task details |
| `--resume` | List resumable sessions |

**Examples**:
```bash
/project.check                 # Current feature status
/project.check --sync          # Check consistency + propose fixes
/project.check 003             # Check feature 003 status
```

---

## Resolving the Current Feature

Many check operations target the "current" feature. Resolve it in this order:

1. If `[feature]` arg provided → use it (by number, name, or full name)
2. If only one folder exists in `project/wip/` → use it
3. If current git branch matches a feature (`feature/[name]`) → use that feature
4. If multiple wip folders exist with no clear match → use AskUserQuestion to let the user pick

Never assume a feature silently. If ambiguous, ask.

---

## Purpose

Unified command for:
1. **Status** — View feature progress and metrics
2. **Sync** — Validate consistency between all framework layers (specs ↔ tasks ↔ code)
3. **Compliance** — Validate technical requirements (build, tests, linting)

---

## Quick Reference

| Command | What it does |
|---------|--------------|
| `/project.check` | Status overview (read-only) |
| `/project.check --sync` | Consistency validation + fixes (y/n) |
| `/project.check --compliance` | Technical validation + fixes (y/n) |
| `/project.check --compact` | Compressed status summary (saves context) |
| `/project.check task TASK-XXX` | Task details |
| `/project.check --resume` | List all resumable sessions |
| `/project.check --resume --last` | Resume last interrupted session |

---

## `/project.check` - Status Overview

### Standard Mode (default)

Shows detailed status with metrics:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Feature Status: payment-gateway
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Feature Number: 042
Created: 2025-11-20
Current Stage: implementation (Phase 4/4)
Mode: standard

────────────────────────────────────────
📈 Phase Progress
────────────────────────────────────────

Phase 1: Functional Spec    ✅ Completed (2025-11-20)
Phase 2: Technical Spec     ✅ Completed (2025-11-21)
Phase 3: Task Planning      ✅ Completed (2025-11-22)
Phase 4: Implementation     🔄 In Progress

────────────────────────────────────────
⚙️ Implementation Progress
────────────────────────────────────────

Progress: ████████████░░░░░░░░ 72% (13/18 tasks)

By Status:
✅ Completed:    13 tasks
🔄 In Progress:  2 tasks
⏸️ Blocked:      0 tasks
⏳ Pending:      3 tasks

────────────────────────────────────────
📊 Quality Metrics
────────────────────────────────────────

• Tests: 67/67 passing (100%)
• Coverage: 89%
• Linter: 0 errors

────────────────────────────────────────
🎯 Next Actions
────────────────────────────────────────

1. Complete in-progress tasks (TASK-014, TASK-015)
2. Start pending tasks (TASK-016, TASK-017, TASK-018)
3. When done: /project.finish

────────────────────────────────────────
📋 Backlog Summary
────────────────────────────────────────

5 items in backlog:
  └── 2 High priority pending
  └── Use /project.backlog to view details
```

> **Note**: Backlog summary only shown if `project/backlog.md` exists and has items.

---

## `/project.check --sync` - Consistency Validation

Validates bidirectional consistency between all framework layers based on current phase.

### Phase-Aware Validation

| Current Phase | Layers Checked |
|---------------|----------------|
| `functional` | Only Functional Spec (nothing to compare) |
| `technical` | Functional ↔ Technical |
| `tasks` | Functional ↔ Technical ↔ Tasks |
| `implementation` | Functional ↔ Technical ↔ Tasks ↔ Code |

### Workflow

1. Read meta.md → detect current phase and identify existing layers
2. Validate bidirectional consistency for each layer pair (see below)
3. Generate inconsistency report with evidence
4. Propose specific fixes
5. Apply fixes with y/n confirmation

### Consistency Checks by Layer Pair

#### Functional ↔ Technical

**Functional → Technical:**
- Each User Story has endpoint/service implementing it
- Each Acceptance Criteria has technical validation/behavior
- Each NFR has implementation strategy

**Technical → Functional:**
- Each endpoint traces to a User Story (detect scope creep)
- Each data model traces to a requirement
- Each external integration is mentioned in functional

#### Technical ↔ Tasks

**Technical → Tasks:**
- Each endpoint has task(s) to implement it
- Each model has task to create it
- Each integration has configuration task

**Tasks → Technical:**
- Each task has technical spec backing it
- No orphan tasks without spec

#### Tasks ↔ Code (implementation phase only)

**Tasks → Code:**
- Each acceptance criteria has implementing code
- Each completed task has modified files

**Code → Tasks:**
- Each new function/class is documented in tasks
- No undocumented code

### Output Example

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔄 SYNC: Consistency Check
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Feature: payment-gateway
Phase: implementation
Checking: Functional ↔ Technical ↔ Tasks ↔ Code

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 Functional ↔ Technical
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Functional → Technical: 100% coverage
⚠️ Technical → Functional: 1 issue found

   SCOPE CREEP DETECTED:
   - Technical spec: "Admin audit logging"
     └── No corresponding functional requirement found

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔧 Technical ↔ Tasks
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Technical → Tasks: 100% coverage
✅ Tasks → Technical: 100% coverage

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 Tasks ↔ Code
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ Tasks → Code: 2 issues found

   MISSING IMPLEMENTATION:
   - TASK-014 AC-2: "Validate card expiry date"
     └── No validation found in PaymentValidator.ts

❌ Code → Tasks: 1 issue found

   UNDOCUMENTED CODE:
   - src/utils/currency.ts: formatCurrency()
     └── No task documents this utility

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Summary: 4 issues found
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔧 Proposed Fixes

1. [SCOPE CREEP] Either add "Admin audit logging" to Functional Spec, or remove from Technical Spec
2. [MISSING IMPL] Add expiry validation to PaymentValidator.ts per TASK-014 AC-2
3. [UNDOCUMENTED] Add formatCurrency() to relevant task acceptance criteria

Apply fixes? (y/n)
```

### If All Consistent

```
✅ Functional ↔ Technical: Consistent
✅ Technical ↔ Tasks: Consistent
✅ Tasks ↔ Code: Consistent

✅ All layers are consistent
```

---

## `/project.check --compliance` - Technical Validation

Validates build, tests, and linting, then proposes fixes.

### What It Checks

1. **Build**
   - Project compiles/builds without errors
   - All dependencies resolve

2. **Secrets**
   - No hardcoded passwords, API keys, or tokens in source code
   - No credentials in configuration files

3. **Tests**
   - All tests passing
   - Coverage meets threshold (default: 80%)
   - No skipped tests without justification

4. **Linting**
   - No linter errors
   - No linter warnings (configurable)

5. **Dependencies**
   - No vulnerable dependencies (if auditing tool available)

**Build commands by technology**: see [`references/bash-patterns.md`](../references/bash-patterns.md#build--test-commands-by-technology).

### Output Example

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔒 COMPLIANCE: Technical Validation
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Feature: payment-gateway

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔐 Secrets Check
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ No hardcoded passwords detected
⚠️ Potential secret found:
   src/config/database.ts:15
   └── `password: "dev-password"` - Possible hardcoded password
   Fix: Use environment variable instead

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧪 Tests
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Tests passing: 67/67
⚠️ Coverage: 78% (threshold: 80%)

   Files below threshold:
   - src/services/PaymentService.ts: 65%

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 Linting
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ No errors
⚠️ 2 warnings
   - src/utils/currency.ts:12 — Unused variable 'temp'
   - src/services/PaymentService.ts:89 — Complex function

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔧 Proposed Fixes
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. [SECRETS] Replace hardcoded password with environment variable
2. [COVERAGE] Add tests for PaymentService.processPayment()
3. [LINT] Remove unused 'temp' variable

Apply fixes? (y/n)
```

---

## `/project.check --compact` - Compressed Status

Shows a single-screen summary optimized for saving context during long build sessions:

```
Feature: 003-payment-gateway | Stage: implementation | 72% (13/18)
Pending: TASK-015 TASK-016 TASK-017 | In progress: TASK-014
Last commit: feat(payment-gateway): TASK-013 - Add retry logic
Sync: ✅ consistent | Compliance: ✅ passing
Next: /project.build
```

Use this instead of the full status view when context is above 50%.

---

## `/project.check task TASK-XXX` - Task Details

Shows full detail for a specific task:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 TASK-005: Implement PaymentService
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Status: pending | Layer: 1 | Complexity: High
Depends on: TASK-003, TASK-004
References: US-2, US-3

Files:
  src/services/PaymentService.ts (create)
  src/services/PaymentService.test.ts (create)

Acceptance Criteria:
  AC-1: processPayment() validates card data before charging
  AC-2: Returns PAYMENT_DECLINED with reason on failure
  AC-3: Emits PaymentProcessed event on success
  GATE: npm test passes with ≥80% coverage on this file
```

---

## `/project.check --resume` - Resumable Sessions

Lists features with interrupted sessions (in-progress tasks or uncommitted changes):

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔄 Resumable Sessions
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. 003-payment-gateway
   Stage: implementation | Last active: 2025-12-10
   In progress: TASK-005 (Implement PaymentService)
   Resume: /project.build task TASK-005

2. 004-user-notifications
   Stage: technical spec | Last active: 2025-12-08
   Resume: /project.spec technical
```

**"Last active" resolution order** (used by `--resume --last`):
1. Feature with a task in `status: in_progress` in `tasks.json` → highest priority
2. Feature with the most recent git commit on its branch (`git log -1 --format=%ct`)
3. Feature with the most recent `meta.md` modification timestamp

`--resume --last` skips the list and directly resumes the most recently active feature using the above order.

---

## AI Agent Instructions

### Help Flag Detection

**WHEN** the user runs `/project.check help`:
1. Output ONLY the "Quick Help" section (not full documentation)
2. Do NOT execute check logic
3. Keep response concise (~15 lines)

### Key Rules

0. **Project directory guard** — Before anything else, verify `project/wip/` exists. If not, show SDD setup message (see `references/bash-patterns.md#project-directory-guard`)
1. **Read meta.md first** — Always detect current phase before any validation
2. **Phase-aware validation** — Only validate layers that EXIST at current phase
3. **--sync is read + propose** — Always show proposed fixes and ask for confirmation
4. **--compliance runs builds** — Execute actual build and test commands
5. **Backlog summary** — Only show if `project/backlog.md` exists with items

---

## Related Commands

- `/project.fix` — Fix errors with horizontal propagation
- `/project.build` — Continue implementation
- `/project.finish` — Finalize and archive completed feature
- `/project.backlog` — View backlog items

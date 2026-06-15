# Command: /project.build

**Description**: Implement feature tasks following approved execution strategy

**Usage**:
- `/project.build` → Implement all tasks (behavior based on mode)
- `/project.build task TASK-XXX` → Implement specific task (expert mode)
- `/project.build --layer N` → Implement up to layer N (1=implementation, 2=quality)
- `/project.build --resume` → Resume interrupted build session
- `/project.build --next` → Auto-continue with next pending task

---

## Quick Help

> `/project.build help` → Shows this summary

**Syntax**: `/project.build [target] [flags]`

| Flag | Description |
|------|-------------|
| (none) | Implement all tasks based on mode |
| `task TASK-XXX` | Implement specific task only |
| `--layer N` | Implement up to layer N (1=implementation, 2=quality) |
| `--resume` | Resume interrupted session |
| `--next` | Auto-continue with next pending task |

**Examples**:
```bash
/project.build                 # Implement all pending tasks
/project.build task TASK-005   # Implement only TASK-005
/project.build --layer 1       # Implement layer 1 (implementation) only
```

---

## Plan Mode Integration (Opt-In)

> **CRITICAL**: Claude Code Plan Mode for complex tasks. **OPT-IN** — disabled by default.
> Most users want uninterrupted implementation flow.

### Platform Availability

| Platform | Plan Mode Available |
|----------|---------------------|
| Claude Code (CLI) | ✅ Yes (`EnterPlanMode`/`ExitPlanMode`) |
| Other editors | ❌ No (use fallback) |

### Trigger Conditions

Enter Plan Mode when **ANY** of these are true:
- Task complexity is "High" OR files affected > 5
- Completing Layer 1 → Layer 2 transition with context > 50% and 10+ tasks in next layer

### Plan Mode Flow

```
IF trigger_conditions_met AND EnterPlanMode available:
    1. EnterPlanMode()
    2. Explore: Read related files, analyze patterns, identify dependencies
    3. Design: Create implementation approach, list files to modify, identify risks
    4. Present plan to user, wait for approval
    5. ExitPlanMode()
    6. Implement approved plan

ELSE (Fallback):
    1. Explore codebase inline
    2. Design plan inline in chat
    3. AskUserQuestion: "Approve this approach?"
    4. Implement approved plan
```

### Mode-Based Behavior

| Mode | Plan Mode |
|------|-----------|
| Express | Skip (auto-implement) |
| Standard | Use when triggers met |
| Expert | Use when triggers met |

---

## Quality Checks (MANDATORY)

> **BLOCKING**: Quality checks after EACH task, not just at the end.

**Per-Task Cycle**:

```
┌─────────────────────────────────────────────────────────────────┐
│  1. IMPLEMENT → Write production code                           │
│         ↓                                                       │
│  2. TEST → Run unit/integration tests (skip for prototype)      │
│         ↓                                                       │
│  3. REVIEW → Self-review for obvious issues                     │
│         ↓                                                       │
│  4. FIX → Address any findings                                  │
│         ↓                                                       │
│  5. COMPLETE → Mark done, commit                                │
└─────────────────────────────────────────────────────────────────┘
```

**You MUST fix ALL findings** — minor issues accumulate into technical debt.

---

## Behavior by Mode

| Mode | Behavior |
|------|----------|
| **Express** | Implement all, minimal pauses, auto-fix errors, auto-advance |
| **Standard** | Report progress, pause on errors, ask user |
| **Expert** | Only implement what's requested, full control |

---

## Workflow (Steps in Order)

### Step 1: Phase Detection

Read `meta.md` and verify current stage is `implementation`:

```bash
current_stage=$(grep "Current Stage:" project/wip/[feature]/meta.md | cut -d: -f2 | tr -d ' ')

if [ "$current_stage" != "implementation" ]; then
    echo "❌ Tasks not approved. Run /project.plan --approve first."
    exit 1
fi
```

Check context level:
- Normal (<50%): Proceed inline
- Elevated (50-70%): Be efficient with reads; suggest `/compact` between layers
- Critical (>70%): Run `/compact` before starting — tell the user: "Context is high. Run `/compact` in the Claude Code CLI to compress the conversation, then resume with `/project.build --resume`"

### Step 2: Read Task Source

Verify `tasks.json` exists before reading:

```bash
TASKS_FILE="project/wip/[feature]/3-tasks/tasks.json"

if [ ! -f "$TASKS_FILE" ]; then
    echo "❌ tasks.json not found. Task planning may have been interrupted."
    echo "   Run /project.plan to generate and approve tasks first."
    exit 1
fi

# Find pending tasks
jq '.tasks[] | select(.status == "pending")' "$TASKS_FILE"
```

### Step 3: Layer-Based Execution

Execute tasks by LAYER first, then by dependency level:

```
LAYER 1 (Implementation)
├─ Execute all Layer 1 tasks (in dependency order)
├─ Validate gates pass (build, local tests, lint)
├─ git commit "feat([feature]): layer 1 complete"
└─ Run /compact if context is elevated (see below)

LAYER 2 (Quality)
├─ Execute all quality tasks (code review, performance, security)
├─ All reviews pass (0 findings)
└─ git commit "feat([feature]): layer 2 complete"

# All tasks complete — proceed to /project.finish
```

#### Layer Completion Protocol

After completing all tasks in a layer:

1. **Validate layer**: All tasks pass gates
2. **Commit**: Natural checkpoint for the layer
3. **Run `/compact` if needed** (see thresholds below)
4. **Proceed to next layer**

**When to run `/compact` between layers**:
- Context > 50% after completing Layer 1 → Suggest: "Recommend running `/compact` before Layer 2"
- Context > 70% → Require: "Run `/compact` now, then resume with `/project.build --resume`"
- Large feature (10+ tasks in Layer 1) → Always suggest `/compact`

> Thresholds used consistently across all commands: suggest at >50%, require at >70%.

> `/compact` is a built-in Claude Code CLI command that compresses the conversation history to free up context while preserving the essential state of the current session.

#### After Layer Completion — Interactive Next Steps

**(Standard/Expert modes only — Express auto-continues)**

Use AskUserQuestion: "Layer [N] complete. Continue?"
- Options:
  1. "/project.build (Recommended)" — Continue to next layer
  2. "/project.check --sync" — Verify spec-code consistency
  3. "/project.check" — Review current status

### Step 4: Per-Task Implementation

For each pending task:

1. Read task details from `tasks.json`
2. Read referenced spec sections
3. Read existing related code
4. Implement the code
5. Write/update tests (unless prototype)
6. Run build + tests
7. Self-review for quality issues
8. Fix any findings
9. Update task status in `tasks.json`
10. Commit changes

**Commit format**: `feat([feature]): TASK-XXX - [task title]`

### Step 5: Quality Gate per Task

After each Layer 1 task:

1. Run build command
2. Run test suite
3. Run linter
4. Check for obvious issues (hardcoded secrets, N+1 queries, unsafe patterns)
5. If issues found: fix before marking complete

**Gate commands by technology**: see [`references/bash-patterns.md`](../references/bash-patterns.md#build--test-commands-by-technology).

### Step 6: Layer 2 — Quality Tasks

Execute quality review tasks:

#### Code Review Task
- Read all modified files
- Check for: code smells, naming issues, missing abstractions, dead code
- Fix ALL findings (critical and minor)
- Document findings and resolutions

#### Performance Review Task
- Check for: N+1 queries, missing indexes, inefficient algorithms, unnecessary loops
- Check for: missing pagination on list endpoints
- Fix any identified issues

#### Security Review Task
- Check for: OWASP Top 10 vulnerabilities
- Check for: hardcoded secrets, SQL injection risks, XSS vectors
- Check for: missing input validation, missing auth checks
- Fix ALL findings before proceeding

### Step 7: Final Validation

After ALL tasks complete:

| Step | Action | On Failure |
|------|--------|------------|
| A | Build passes | FIX |
| B | All tests pass + coverage ≥ 80% | FIX |
| C | Linter clean | FIX |
| D | Security check clean | FIX |
| E | Final sync check | FIX gaps |

### Step 8: Final Sync Validation

After all quality gates pass:

```
/project.check --sync
```

**Verdict Handling**:

| Verdict | Action |
|---------|--------|
| `APPROVED` | Ready for `/project.finish` |
| `CAN_PROCEED_WITH_WARNINGS` | Proceed, document warnings |
| `CANNOT_PROCEED` | Fix gaps before finishing |

### Step 9: Interactive Next Steps

**Express mode**: Auto-invoke `/project.finish` without asking.

**Standard/Expert mode**: Use AskUserQuestion: "All tasks complete. Finalize feature?"
- Options:
  1. "/project.finish (Recommended)" — Archive and finalize
  2. "/project.check --sync" — Run final consistency check
  3. "/project.check" — Review final status

---

## Output Format

Progress output per task:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔨 TASK-003: Implement REST endpoints
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Layer: 1 | Complexity: Medium
Files: src/controllers/UserController.ts

Implementing...

✅ Build: PASS
✅ Tests: 12 passing
✅ Lint: clean
✅ Review: 0 findings

TASK-003 → completed
Commit: feat(user-auth): TASK-003 - Implement REST endpoints
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Progress header at start of each layer:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔨 LAYER 1: Implementation (4 tasks)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Progress: ░░░░░░░░░░░░░░░░░░░░ 0% (0/4)
```

---

## AI Agent Instructions

### Help Flag Detection

**WHEN** the user runs `/project.build help`:
1. Output ONLY the "Quick Help" section
2. Do NOT execute build logic
3. Keep response concise (~15 lines)

### Key Rules

0. **Project directory guard** — Before anything else, verify `project/wip/` exists. If not, show SDD setup message (see `references/bash-patterns.md#project-directory-guard`)
1. **Verify implementation phase** — Always check meta.md first
2. **Layer order is MANDATORY** — Never skip to Layer 2 before Layer 1 is complete
3. **Gates per task** — Build + test after EVERY task, not just at the end
4. **Commit per layer** — Natural checkpoints, clean history
5. **Fix ALL findings** — No "minor" exceptions
6. **Update tasks.json** — Keep status current after each task
7. **Offer backlog capture** — If improvement spotted during implementation, offer to add to backlog

---

## Related Commands

- `/project.check --sync` — Verify spec-code consistency
- `/project.fix` — Fix errors with horizontal propagation
- `/project.finish` — Finalize and archive when all tasks complete
- `/project.backlog` — Capture improvements found during build

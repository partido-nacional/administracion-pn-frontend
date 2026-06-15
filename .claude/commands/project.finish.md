# Command: /project.finish

**Description**: Validate, finalize, and archive completed feature

**Usage**:
- `/project.finish` → Validate and archive (behavior based on mode)

---

## Quick Help

> `/project.finish help` → Shows this summary

**Syntax**: `/project.finish [flags]`

| Flag | Description |
|------|-------------|
| (none) | Validate and archive completed feature |
| `--force` | Skip certain validation checks |
| `--skip-tests` | Skip test re-run (not recommended) |

**Pre-requisite**: All tasks must be completed and `/project.build` FINAL VALIDATION must pass first.

**Example**:
```bash
/project.finish            # Validate, archive, move to project/features/
```

---

## Context Advisory

> **Before finalizing**: Finish phase should require minimal context if build was completed properly.

`/project.finish` is lightweight:
- Validation was already done in `/project.build`
- Just runs final double-check
- Generates summary and archives

If arriving at `/project.finish` with high context (>80%), run `/compact` first, then retry `/project.finish`. The command is lightweight enough to complete after compaction without losing state.

---

## Purpose

Final step in feature workflow. Runs comprehensive validation, generates summary documentation, and archives the feature from `project/wip/` to `project/features/`.

---

## Behavior by Mode

### Express Mode

**What happens**:
1. Runs all validators automatically
2. Auto-generates summary documentation
3. Archives feature without confirmation
4. Shows brief success message

**Interaction**: None (unless validation fails)

### Standard Mode (default)

**What happens**:
1. Runs all validators
2. Shows validation results
3. Asks for confirmation before archiving
4. Generates documentation
5. Archives and shows summary

**Standard Mode Flow**:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Finalizing Feature (/project.finish)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Running validations...

✅ All tasks completed (18/18)
✅ Tests passing: 100% (87/87)
✅ Coverage: 91% (threshold: 80%)
✅ Linter: 0 errors

────────────────────────────────────────
📚 Knowledge Management
────────────────────────────────────────

Checking progress.md for generalizable learnings...

Found patterns that may apply to other features:
  • Retry logic with exponential backoff pattern
  • Consistent error response format across endpoints

[AskUserQuestion: "Promote these to project/PATTERNS.md?"] → User: Yes

✅ Learnings promoted to project/PATTERNS.md

[AskUserQuestion: "Ready to archive feature?"] → User: Yes

Generating documentation...
Archiving to project/features/...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎉 Feature Complete!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📁 Archived to: project/features/042-payment-gateway/

📊 Final Stats:
• Duration: 5 days (planned: 7)
• Tasks: 18/18
• Coverage: 91%
```

────────────────────────────────────────
📋 Backlog Resolution
────────────────────────────────────────

This feature addressed these backlog items:
  • TODO-001: Refactor payment validation

[AskUserQuestion: "Mark as resolved?"] → User: Yes

✅ TODO-001 → RESOLVED
   Resolution: Completed
   Resolved in: payment-gateway

> **Note**: Backlog resolution only shown if feature has `from_backlog` in meta.md or mentions backlog items.

---

## Validation Checks

### Required Validations (BLOCKING)

#### 0. Phase Verification

Read meta.md and verify `Current Stage: implementation`. If not in implementation phase, return error.

#### 0.5. Build & Test Execution (MANDATORY — FIRST CHECK)

> **CRITICAL**: Build/test must pass first. All other validations are meaningless if code doesn't work.

See [`references/bash-patterns.md`](../references/bash-patterns.md#build--test-commands-by-technology) for commands by technology.

**Validation Flow**: Build → Test → Continue (FAIL at any step = STOP, use `/project.fix`)

#### 1. Task Completion

- All tasks must be "completed" status
- No tasks can be "in_progress" or "blocked"

#### 2. Test Validation (MANDATORY)

Read `project_type` from meta.md first — requirements vary:

| project_type | Tests Required | Coverage |
|--------------|----------------|----------|
| prototype | None | N/A |
| mvp | Unit tests (critical paths) | N/A |
| production | Unit + integration tests | ≥80% |

- [ ] All existing tests passing
- [ ] Coverage meets threshold for project_type
- [ ] (production only) Integration tests exist

#### 3. Code Quality

- [ ] No linter errors
- [ ] No open TODOs in code

```bash
# Detect open TODOs in source code
grep -rn "TODO\|FIXME\|HACK\|XXX" \
  --include="*.java" --include="*.go" --include="*.ts" --include="*.js" \
  --include="*.py" --include="*.cs" \
  src/ && echo "⚠️  Open TODOs found — resolve or move to /project.backlog" || echo "✅ No open TODOs"
```

#### 4. Secrets Check (MANDATORY)

> **BLOCKER**: Hardcoded secrets should never be committed.

See secrets scan command in [`references/bash-patterns.md`](../references/bash-patterns.md#secrets-scan).

Checklist:
- [ ] No hardcoded passwords in code
- [ ] No API keys in source files
- [ ] No tokens in configuration
- [ ] All secrets reference environment variables or secrets manager

#### 5. Final Consistency Check (MANDATORY)

Before archiving, run full sync validation:

```
/project.check --sync
```

**Verdict Handling**:

| Verdict | Action |
|---------|--------|
| `APPROVED` | Proceed to archive |
| `CAN_PROCEED_WITH_WARNINGS` | Archive with documented gaps |
| `CANNOT_PROCEED` | **BLOCKING** — Do NOT archive, fix issues first |

**If sync fails with CANNOT_PROCEED**:
1. Review the inconsistencies reported
2. Use `/project.fix` or manual edits to resolve
3. Re-run `/project.check --sync`
4. Retry `/project.finish` when sync passes

---

## Validation Failure Handling

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ Validation Failed
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Issues found:

🔴 BLOCKING:
• Tests: 3 failing tests
• Coverage: 78% (below 80% threshold)

🟡 Warnings:
• 2 TODO comments in code

How to fix:
1. Fix failing tests
2. Add tests to improve coverage

Then retry: /project.finish
```

---

## Archive Step (Explicit)

After all validations pass and user confirms, execute:

```bash
FEATURE_PATH=$(find project/wip -maxdepth 1 -type d -name "[NNN-feature-name]" | head -1)
FOLDER_NAME=$(basename "$FEATURE_PATH")
DEST="project/features/$FOLDER_NAME"

mkdir -p "$DEST"

# Detect template mode
TEMPLATE_MODE=$(grep "template_mode:" "$FEATURE_PATH/meta.md" | cut -d: -f2 | tr -d ' ')

if [ "$TEMPLATE_MODE" = "lite" ]; then
    # Lite: single combined spec — copy as spec.md (canonical name for lite archives)
    cp "$FEATURE_PATH/spec.md" "$DEST/spec.md"
else
    # Full: copy and flatten from subdirectory structure
    cp "$FEATURE_PATH/1-functional/spec.md" "$DEST/functional-spec.md"
    cp "$FEATURE_PATH/2-technical/spec.md"  "$DEST/technical-spec.md"
fi

cp "$FEATURE_PATH/3-tasks/tasks.json"   "$DEST/tasks.json"
cp "$FEATURE_PATH/meta.md"              "$DEST/meta.md"

# Generate and copy docs
cp "$FEATURE_PATH/progress/README.md"                 "$DEST/README.md"                 2>/dev/null || true
cp "$FEATURE_PATH/progress/implementation-summary.md" "$DEST/implementation-summary.md" 2>/dev/null || true

# Remove from wip
rm -rf "$FEATURE_PATH"

echo "✅ Archived to: $DEST"
```

---

## Generated Documentation

### README.md

Written by the agent **during `/project.finish`** (not during build). Summarize: what was built, key components, API endpoints, test coverage. Save to `project/wip/[feature]/progress/README.md` before archiving, then the archive step copies it to `project/features/[feature]/README.md`.

### implementation-summary.md

Also generated **during `/project.finish`** from `tasks.json` data. Include: total duration (created_at to today), tasks completed, complexity breakdown, coverage achieved. Save alongside README before archiving.

---

## Brownfield: System Spec Merge

For brownfield projects, offers to merge changes back to system specs:

```
This feature modified existing system specifications.

Affected specs (from meta.md):
• project/specs/api-contracts/auth-api.yaml
• project/specs/architecture.md

Merge changes back? [Y/n/manual]
```

- **Y**: Semi-automatic merge with AI assistance
- **n**: Skip (manual later)
- **manual**: Show merge instructions

---

## Archive Structure

**Full template** (default):
```
project/features/[XXX-feature-name]/
├── README.md                  # Feature summary
├── meta.md                    # Final metadata (NEVER DELETE)
├── functional-spec.md         # What was built (or changed)
├── technical-spec.md          # How it was built (or changed)
├── tasks.json                 # Task list executed
└── implementation-summary.md  # Execution metrics
```

**Lite template** (`--lite`):
```
project/features/[XXX-feature-name]/
├── README.md                  # Feature summary
├── meta.md                    # Final metadata (NEVER DELETE)
├── spec.md                    # Combined functional + technical spec
├── tasks.json                 # Task list executed
└── implementation-summary.md  # Execution metrics
```

When reading archived specs (e.g. for `/project.check` or conflict detection), always check `meta.md → template_mode` to know which file(s) to read.

**Feature Numbering**:
- The full directory name (including number prefix) is preserved when moving from `wip/` to `features/`
- Example: `project/wip/003-user-auth/` → `project/features/003-user-auth/`
- Numbers are NEVER reused, even if a feature is cancelled

**CRITICAL**: `meta.md` must be moved INTACT. It contains the complete history. NEVER delete it.

---

## AI Agent Instructions

### Help Flag Detection

**WHEN** the user runs `/project.finish help`:
1. Output ONLY the "Quick Help" section (not full documentation)
2. Do NOT execute finish logic
3. Keep response concise (~15 lines)

### Key Rules

0. **Project directory guard** — Before anything else, verify `project/wip/` exists. If not, show SDD setup message (see `references/bash-patterns.md#project-directory-guard`)
1. **Verify implementation phase** — Check meta.md before anything else
2. **Build + test first** — If code doesn't build or tests fail, stop immediately
3. **Blocking validations** — Coverage, secrets, consistency check are ALL blockers
4. **Never skip consistency check** — Always run `/project.check --sync` before archiving
5. **Preserve meta.md** — Move intact, never delete
6. **Offer backlog resolution** — If feature has `from_backlog` in meta.md
7. **Promote patterns** — Check progress.md for generalizable learnings

---

## Related Commands

- `/project.check` — View current status
- `/project.check --sync` — Consistency validation
- `/project.fix` — Fix issues before finishing
- `/project.build` — Continue implementation

# Command: /project.cancel

**Purpose**: Gracefully cancel a feature in progress, preserving work for potential future resumption.

---

## Usage

```
/project.cancel [feature-name] [reason]
```

**Parameters**:
- `feature-name`: Name of the feature to cancel (required)
- `reason`: Brief explanation for cancellation (required)

---

## Quick Help

> `/project.cancel help` → Shows this summary

**Syntax**: `/project.cancel [feature-name] [reason]`

| Argument | Description |
|----------|-------------|
| `feature-name` | Name of feature to cancel (required) |
| `reason` | Cancellation reason (required) |

**Valid Reasons**: `priorities-changed`, `requirements-invalid`, `technical-blocker`, `scope-too-large`, `resource-constraints`, `duplicate-effort`, `stakeholder-decision`

**Examples**:
```bash
/project.cancel user-auth priorities-changed
/project.cancel payment-integration scope-too-large
```

---

## When to Use

### Valid Cancellation Reasons

| Reason | Description |
|--------|-------------|
| `priorities-changed` | Business priorities shifted |
| `requirements-invalid` | Requirements no longer valid |
| `technical-blocker` | Insurmountable technical obstacle |
| `resource-constraints` | Team/time/budget constraints |
| `scope-too-large` | Feature needs to be split |
| `duplicate-effort` | Similar feature exists/in-progress |
| `stakeholder-decision` | Explicit stakeholder decision |

### NOT Valid for Cancellation

- ❌ Temporary blocks (use task blocking instead)
- ❌ Waiting for dependencies (pause, don't cancel)
- ❌ Code review feedback (iterate, don't cancel)
- ❌ Test failures (fix tests, don't cancel)

---

## Execution Steps

### Step 0: Resolve Feature Name (if not provided)

If the user runs `/project.cancel` without arguments, use AskUserQuestion:
- Question: "Which feature do you want to cancel?"
- List the features currently in `project/wip/` as options
- If `project/wip/` is empty or doesn't exist: show error "No active features found. Use /project.list to verify." and stop.

Do the same if `reason` is missing — ask with AskUserQuestion:
- Question: "Why are you cancelling this feature?"
- Options: `priorities-changed` / `requirements-invalid` / `technical-blocker` / `scope-too-large` / `resource-constraints` / `duplicate-effort` / `stakeholder-decision`

### Step 1: Validate Feature Exists

Resolve the feature folder (supports bare name, number, or full numbered name):

```bash
# Try exact match first (NNN-feature-name)
FEATURE_PATH=$(find project/wip -maxdepth 1 -type d -name "[feature-name]" 2>/dev/null | head -1)

# If not found, try prefix search (by number or partial name)
if [ -z "$FEATURE_PATH" ]; then
    FEATURE_PATH=$(find project/wip -maxdepth 1 -type d -name "*[feature-name]*" 2>/dev/null | head -1)
fi

if [ -z "$FEATURE_PATH" ] || [ ! -d "$FEATURE_PATH" ]; then
    echo "❌ Error: Feature '[feature-name]' not found in project/wip/"
    echo "   Use /project.list to see active features"
    exit 1
fi
echo "✓ Found: $FEATURE_PATH"
```

### Step 2: Capture Current State

The goal of archiving (vs deleting) is to leave a trail that lets you — or someone else — resume this feature months later without reconstructing all the context from scratch. The cancellation record is that trail.

Document the current state before cancellation:

```markdown
## Cancellation Record

**Feature**: [feature-name]
**Cancelled Date**: YYYY-MM-DD
**Reason**: [reason]

### State at Cancellation

**Phase**: [current phase from meta.md]
**Progress**: [X/Y tasks completed]
**Last Activity**: [date]

### Work Completed

- [x] Functional Spec: [status]
- [x] Technical Spec: [status]
- [ ] Tasks: [X completed, Y pending]
- [ ] Implementation: [% complete]

### Files Created

[List of files that were created during implementation]

### Decisions Made

[Key decisions documented during this feature]

### Reason Details

[Detailed explanation of why feature is being cancelled]

### Resumption Notes

[What would be needed to resume this feature later]
```

### Step 3: Update meta.md

```yaml
# Add to meta.md
status: cancelled
cancelled_date: YYYY-MM-DD
cancellation_reason: [reason]
resumable: true   # Always true — work is archived, never deleted
```

> **Note**: `resumable` is always `true`. It exists as an explicit signal that the archived feature can be moved back to `project/wip/` at any time. It is never set to `false`.

### Step 4: Move to Cancelled Directory

```bash
# Create cancelled directory if not exists
mkdir -p project/cancelled

# Use the resolved $FEATURE_PATH from Step 1
FOLDER_NAME=$(basename "$FEATURE_PATH")
DATESTAMP=$(date +%Y%m%d)
mv "$FEATURE_PATH" "project/cancelled/${FOLDER_NAME}_${DATESTAMP}"
echo "📁 Archived to: project/cancelled/${FOLDER_NAME}_${DATESTAMP}"
```

**Feature Numbering**:
- The number prefix is preserved in the cancelled folder
- Numbers are NEVER reused — the `.feature-counter` is not decremented
- This ensures chronological ordering is maintained across all features

### Step 5: Clean Up (Optional)

If feature created branches or resources, use AskUserQuestion:

```
Branch found: feature/[feature-name]
```

- Question: "Delete the feature branch?"
- Options:
  1. "Yes, delete it" — runs `git branch -d feature/[feature-name]`
  2. "No, keep it" — skip, branch remains

**Never delete the branch without this explicit confirmation.**

### Step 6: Generate Cancellation Report

Create `project/cancelled/[feature-name]_YYYYMMDD/CANCELLATION_REPORT.md`:

```markdown
# Cancellation Report: [Feature Name]

## Summary

| Field | Value |
|-------|-------|
| Feature | [feature-name] |
| Started | [start date from meta.md] |
| Cancelled | [today] |
| Duration | [X days] |
| Phase Reached | [phase] |
| Effort Invested | [estimate] |

## Reason for Cancellation

[Detailed reason]

## Impact Assessment

### Work Lost
- [Effort that cannot be reused]

### Work Preserved
- [Specs, decisions, code that can be reused]

### Dependencies Affected
- [Other features affected by cancellation]

## Lessons Learned

- [What we learned from this attempt]
- [What would we do differently]

## Resumption Guide

### Prerequisites for Resumption
- [What needs to be true to resume]

### Complexity to Resume
- [Effort/scope to get back to current state]

### Recommended Changes
- [What should change if resumed]

## Sign-off

- [ ] Stakeholders notified
- [ ] Related tickets/issues updated
- [ ] Documentation archived
```

---

## Output Example

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🛑 CANCELLING FEATURE: user-preferences
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 Current State:
   Phase: Implementation (Phase 4)
   Tasks Completed: 5/12
   Implementation: ~40%

📁 Archiving to: project/cancelled/007-user-preferences_20251127

📝 Creating cancellation report...

✅ Cancellation Complete

Files preserved:
  • Functional Spec: ✓
  • Technical Spec: ✓
  • Task List: ✓
  • Progress Notes: ✓
  • Partial Implementation: ✓

⚠️  Action Required:
  • Notify stakeholders of cancellation
  • Update related tickets/issues
  • Consider splitting feature if scope was issue

📂 Archived to: project/cancelled/007-user-preferences_20251127/

To resume later:
  mv project/cancelled/007-user-preferences_20251127 project/wip/007-user-preferences
  /project.check 007
```

---

## Cancellation vs Other Actions

| Situation | Action | Command |
|-----------|--------|---------|
| Temporary block | Block task | Update progress.md |
| Need more info | Clarify | `/project.spec --include` |
| Wrong approach | Revise spec | Update spec + re-validate |
| Scope too big | Split feature | Create new features |
| Won't do ever | Cancel | `/project.cancel` |
| Pause temporarily | Pause | Update meta.md status |

---

## Resuming a Cancelled Feature

To resume a previously cancelled feature:

```bash
# 1. Move back to WIP
mv project/cancelled/[feature-name]_YYYYMMDD project/wip/[feature-name]

# 2. Update meta.md
#    - Remove cancelled status
#    - Update resumed_date
#    - Document why resuming

# 3. Review cancellation report
#    - Address issues that caused cancellation
#    - Update specs if requirements changed

# 4. Re-validate current state
/project.check --validate

# 5. Continue from current phase
/project.check
```

---

## Best Practices

1. **Always document thoroughly** — Future you will thank present you
2. **Notify stakeholders** — Don't let cancellation be a surprise
3. **Preserve learnings** — Document what was learned
4. **Consider alternatives** — Is splitting better than cancelling?
5. **Clean up responsibly** — Don't leave orphaned branches/resources

---

## AI Agent Instructions

### Help Flag Detection

**WHEN** the user runs `/project.cancel help`:
1. Output ONLY the "Quick Help" section (not full documentation)
2. Do NOT execute cancel logic
3. Keep response concise (~15 lines)

### Key Rules
1. **Always require reason** — Don't cancel without documented reason
2. **Preserve all work** — Never delete, always archive
3. **Generate report** — Create comprehensive cancellation report
4. **Suggest alternatives** — Consider if split/pause is better

---

## Related Commands

- `/project.list` — View all features
- `/project.check` — Check feature status

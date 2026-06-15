# Command: /project.list

**Description**: List all features (WIP and completed)

**Usage**: `/project.list`

---

## Quick Help

> `/project.list help` → Shows this summary

**Syntax**: `/project.list [flags]`

| Flag | Description |
|------|-------------|
| (none) | List all features (WIP + completed) |
| `--status <S>` | Filter by status (wip/completed/functional/technical/tasks/impl) |
| `--format <F>` | Output format (table/compact) |
| `--fix-conflicts` | Detect and fix duplicate feature numbers |

**Example**:
```bash
/project.list                # List all features
/project.list --status wip   # Only in-progress features
```

---

## Purpose

Shows overview of all features in the project:
- Features in progress (`project/wip/`)
- Completed features (`project/features/`)
- Stats and recommendations

---

## Workflow

### Step 1 — Check for Unnumbered Features

Before listing, check if any features need migration to the numbering system:

```bash
unnumbered_wip=$(ls -1 project/wip/ 2>/dev/null | grep -vE '^[0-9]{3}-')
unnumbered_features=$(ls -1 project/features/ 2>/dev/null | grep -vE '^[0-9]{3}-')

if [ -n "$unnumbered_wip" ] || [ -n "$unnumbered_features" ]; then
    echo "⚠️  Features without number detected. Migrating automatically..."
fi
```

**Migration logic**:
1. List all unnumbered features (wip + completed)
2. Sort by creation date (from `meta.md` or directory timestamp)
3. Assign sequential numbers starting from 001 (or next available)
4. Rename directories with prefix
5. Update `project/.feature-counter`

```
⚠️  Features without number detected. Migrating automatically...

Migrating features by creation date:
  user-auth (2025-01-01) → 001-user-auth
  payment   (2025-01-03) → 002-payment

✅ 2 features migrated. Counter updated to 002.
```

---

### Step 2 — Check for Duplicate Feature Numbers

After migration, detect duplicates (common after merging branches):

```bash
all_features=$(ls -1 project/wip project/features 2>/dev/null | grep -oE '^[0-9]{3}' | sort)
duplicates=$(echo "$all_features" | uniq -d)

if [ -n "$duplicates" ]; then
    echo "⚠️  Duplicate feature numbers detected:"
    for num in $duplicates; do
        echo "   • $num: $(ls -1 project/wip project/features 2>/dev/null | grep "^$num-")"
    done
    echo "Run: /project.list --fix-conflicts"
fi
```

**Why duplicates happen**: Two developers start features from the same branch state — both read the same `.feature-counter` value, get the same number, then merge.

---

### Step 3 — Scan Features

Read all feature metadata from `meta.md` files:

```bash
# For each folder in project/wip/ and project/features/:
# - Extract feature number from directory name
# - Read meta.md for: stage, created_at, completed_at, task progress
# - Aggregate stats
```

**Missing or invalid `meta.md` handling**:

For each feature folder found, check if `meta.md` exists and is valid before reading it:

```bash
# For each feature folder:
if [ ! -f "project/wip/[feature]/meta.md" ]; then
    echo "⚠️  [feature]: meta.md not found — skipped"
fi
```

If **any** feature folder is missing `meta.md`, show this warning after the scan:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  Non-SDD Features Detected
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The following folders are not in SDD format (missing meta.md):

  • project/wip/old-feature/
  • project/wip/legacy-auth/

These features were skipped from the list.

To register an existing feature into SDD:
  → /project.import <folder-name>

To start a new feature from scratch:
  → /project.start "feature description"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

If **all** features are missing `meta.md` (or no `project/wip/` or `project/features/` folder exists at all):

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  This project is not set up in SDD format
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

No SDD features were found in this project.

To start using the SDD framework:
  → /project.start "your first feature"

If you have existing work to bring in:
  → /project.import <folder-name>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Metadata extracted per feature** (only for valid SDD features):
- Feature number and name
- Current stage (`functional` / `technical` / `tasks` / `impl`)
- Task progress (completed/total tasks)
- Creation and completion dates
- Project type (prototype/mvp/production)

---

### Step 4 — Display WIP Features

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔄 Features In Progress
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┌───────┬──────────────────────┬─────────────┬───────────────────┐
│ #     │ Feature              │ Stage       │ Progress          │
├───────┼──────────────────────┼─────────────┼───────────────────┤
│ 003   │ user-authentication  │ impl        │ 42% (7/17 tasks)  │
│ 004   │ payment-integration  │ technical   │ Spec in review    │
│ 005   │ notification-system  │ functional  │ Draft complete    │
└───────┴──────────────────────┴─────────────┴───────────────────┘

Total WIP: 3 features
```

---

### Step 5 — Display Completed Features

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Completed Features
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┌───────┬──────────────────────┬──────────────┬────────┬───────────┐
│ #     │ Feature              │ Completed    │ Tasks  │ Duration  │
├───────┼──────────────────────┼──────────────┼────────┼───────────┤
│ 001   │ initial-setup        │ 2025-01-02   │ 5      │ 2 days    │
│ 002   │ api-versioning       │ 2025-01-05   │ 8      │ 3 days    │
└───────┴──────────────────────┴──────────────┴────────┴───────────┘

Total Completed: 2 features
Average Duration: 2.5 days
Average Tasks: 6.5 tasks/feature
```

---

### Step 6 — Project Statistics

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Project Statistics
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Total Features: 5 (3 in progress, 2 completed)

Velocity Trends:
• Average completion: 2.5 days
• Average tasks: 6.5/feature

Active Work:
• Features in functional phase: 1
• Features in technical phase:  1
• Features in implementation:   1
```

---

### Step 7 — Recommendations

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 Recommendations
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 Focus on: payment-integration (closest to completion)
   Next: /project.check payment-integration

⚠️  Action needed:
   • user-authentication stuck in technical phase for 3 days
     Consider: /project.spec technical
```

---

### Step 8 — Interactive Next Steps

Use AskUserQuestion:
- Question: "What would you like to do?"
- Header: "Next"
- Options:
  1. "/project.start" — Create a new feature
  2. "/project.check" — Check a specific feature (ask which one if multiple WIP)
  3. "/project.backlog" — View backlog items

---

## Output Modes

### Compact Mode (`--format compact`)

```
WIP (3):
• payment-integration (impl, 42%)
• user-authentication (technical)
• dark-mode (functional)

Completed (2):
• api-versioning (2025-01-05)
• initial-setup (2025-01-02)

Total: 5 features
```

### Table Mode (default)

Full tables with statistics as shown in Steps 4–6.

---

## Conflict Resolution: `--fix-conflicts`

**When it happens**: Two developers start features from the same branch → both get the same feature number → after merge, duplicates exist.

**Resolution logic (cascading renumbering)**:
1. Find all feature numbers that appear more than once
2. For each duplicate group, read `meta.md` → `created_at`
3. Oldest feature keeps its number
4. Newer features renumber sequentially, shifting subsequent features up if needed
5. Update `project/.feature-counter` to the new maximum

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔧 Fixing Feature Number Conflicts
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Duplicate found: 005
  • 005-user-auth (created: 2025-01-20) → keeps 005
  • 005-payment   (created: 2025-01-21) → renumbered to 006

Cascading:
  006-notifications → 007-notifications
  007-dark-mode     → 008-dark-mode

✅ Conflicts resolved. 3 features renumbered.
```

---

## Context Loading

Read from disk:
- All `meta.md` files in `project/wip/*/`
- All `meta.md` files in `project/features/*/`
- `project/.feature-counter`

---

## Related Commands

- `/project.check` — Detailed status of a specific feature
- `/project.start` — Start a new feature
- `/project.build` — Continue implementation
- `/project.backlog` — View and manage backlog

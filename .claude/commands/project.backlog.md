# Command: /project.backlog

**Description**: Manage technical backlog (TODOs, Technical Debt, Ideas)

**Usage**:
- `/project.backlog` → List all backlog items
- `/project.backlog add` → Add new item interactively
- `/project.backlog pick` → Select item and create feature
- `/project.backlog resolve <ID>` → Mark item as resolved

---

## Quick Help

> `/project.backlog help` → Shows this summary

**Syntax**: `/project.backlog [action] [options]`

| Flag | Description |
|------|-------------|
| (none) | List all backlog items |
| `add` | Add new item interactively |
| `pick` | Select item and create feature |
| `resolve <ID>` | Mark item as resolved |
| `--type <T>` | Filter by type (TODO/DEBT/IDEA) |
| `--priority <P>` | Filter by priority |

**Examples**:
```bash
/project.backlog               # List all items
/project.backlog add           # Add new item
/project.backlog pick TODO-003 # Create feature from item
```

---

## Purpose

Centralized system for capturing and managing:
1. **TODOs** — Pending technical tasks
2. **DEBT** — Consciously documented technical debt
3. **IDEAS** — Future improvements and suggestions

**Location**: `project/backlog.md` (centralized global file)

---

## `/project.backlog` - List Backlog

### Standard Mode

```
/project.backlog
```

Shows all items sorted by priority:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 Technical Backlog
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Summary: 5 items (2 TODO, 1 DEBT, 2 IDEA)

HIGH PRIORITY:
  TODO-001  [High]   Refactor payment validation        (M)

MEDIUM PRIORITY:
  TODO-002  [Medium] Add retry logic to API calls       (S)
  IDEA-001  [Medium] Cache search results               (M)

LOW PRIORITY:
  DEBT-001  [Low]    Migrate callbacks to async/await   (L)
  IDEA-002  [Low]    Metrics dashboard                  (M)

IN PROGRESS:
  TODO-003  [High]   Optimize DB queries                (M)
            └── Feature: project/wip/db-optimization/

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Use /project.backlog pick to create feature from item
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### If no backlog exists:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 Technical Backlog
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

No backlog items found.

Use /project.backlog add to create your first item.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## `/project.backlog add` - Add Item

Interactive flow to add a new item to the backlog:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
➕ Add Item to Backlog
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Type? [TODO / DEBT / IDEA]: TODO

Title: Add structured logging

Priority? [High / Medium / Low]: Medium

Context (why is this needed?):
> Current logging is plain text, hard to parse in log aggregators

Affected files (optional, comma-separated):
> src/utils/logger.ts, src/index.ts

Complexity? [S / M / L / XL]: M

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Added: TODO-003 - Add structured logging

Item saved to: project/backlog.md
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Fields by Type

**TODO**:
- Title, Priority, Context, Affected Files, Complexity

**DEBT**:
- Title, Priority, Context, Affected Files, Complexity
- Risk if Ignored (what happens if not resolved)

**IDEA**:
- Title, Priority, Context
- Potential Impact (Performance, UX, Maintainability, etc.)
- Notes (additional details)

---

## `/project.backlog pick` - Create Feature from Item

Interactive selection to create a feature from a backlog item:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 Pick Item to Create Feature
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Select item (enter number or ID):

  [1] TODO-001  Refactor payment validation  (High, M)
  [2] TODO-002  Add retry logic              (Medium, S)
  [3] DEBT-001  Migrate callbacks to async   (Low, L)
  [4] IDEA-001  Search cache                 (Medium, M)
  [5] IDEA-002  Metrics dashboard            (Low, M)

Choice: 1

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Creating feature from TODO-001...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Feature name suggestion: refactor-payment-validation
Accept? [Y/n/custom]: Y

✅ Feature created: project/wip/refactor-payment-validation/

Pre-populated context:
  • Problem Statement: from TODO-001 context
  • Affected Files: src/validators/payment.ts
  • Complexity: Medium

TODO-001 marked as: in-progress
  └── Linked to: project/wip/refactor-payment-validation/

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Run /project.spec to continue with specifications.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### What Gets Pre-populated

When creating a feature from backlog:

1. **meta.md** includes:
   ```yaml
   from_backlog: TODO-001
   ```

2. **Initial context** for `/project.spec`:
   - Problem Statement: from item's Context field
   - Suggested Files: from item's Affected Files field
   - Complexity: from item's Complexity field

---

## `/project.backlog resolve <ID>` - Resolve Item

```
/project.backlog resolve TODO-001
```

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Resolving TODO-001
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Item: Refactor payment validation
Status: in-progress
Linked Feature: project/wip/refactor-payment-validation/

Resolution type?
  [1] Completed - Implemented in a feature
  [2] Won't Do - No longer relevant
  [3] Duplicate - Merged with another item

Choice: 1

Resolved in feature (optional): refactor-payment-validation

✅ TODO-001 marked as RESOLVED
   Resolution: Completed
   Resolved in: refactor-payment-validation
   Date: 2025-12-10

Item moved to "Resolved Items" section in backlog.md
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Auto-capture During Build

During `/project.build` and `/project.fix`, the agent can detect potential improvements:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 Potential Improvement Detected
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

While implementing TASK-005, I noticed:
"The error handling here is minimal - should add proper retry logic"

Use AskUserQuestion:
- Question: "What would you like to do with this improvement?"
- Header: "Action"
- Options:
  - "Fix now" (description: "Address immediately in current task")
  - "Add as TODO" (description: "Track for later implementation")
  - "Add as DEBT" (description: "Document as technical debt")
  - "Add as IDEA" (description: "Log as future improvement suggestion")
  - "Skip" (description: "Not important, ignore")
```

### If "Fix now" is chosen:

```
User selected: Fix now

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔧 Fixing Now
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Implementing retry logic in src/services/api.ts...

[Agent implements the fix as part of current task]

✅ Fixed: Added retry logic with exponential backoff
   Files modified: src/services/api.ts

Continuing with TASK-005...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### If adding to backlog:

```
Choice: T

Title suggestion: Add retry logic to API calls
Accept? [Y/n/custom]: Y

✅ Added TODO-004 to backlog
   Origin: feature/user-auth (TASK-005)

Continuing with TASK-005...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Criteria for "Fix Now" vs "Add to Backlog"

| Criterion | Fix Now | Add to Backlog |
|----------|---------|----------------|
| Estimated time | < 15 min | > 15 min |
| Related to current task | Yes | Not directly |
| Risk if not done | High (bugs, security) | Low (improvement) |
| Complexity | Low | High |
| Scope creep | Does not expand scope | Would expand scope |

**Golden rule**: If the fix is small and directly related to what you're doing, offer "Fix Now" as the first option.

---

## Backlog File Format

**Location**: `project/backlog.md`

For the canonical format of each entry type (TODO, DEBT, IDEA, Resolved), see [`references/backlog-format.md`](../references/backlog-format.md).

---

## AI Agent Instructions

### Help Flag Detection

**WHEN** the user runs `/project.backlog help`:
1. Output ONLY the "Quick Help" section (not full documentation)
2. Do NOT execute backlog logic
3. Keep response concise (~15 lines)

### Key Rules

1. **Centralized file**: Always use `project/backlog.md`
2. **Unique IDs**: Format `{TYPE}-{NNN}` (TODO-001, DEBT-002, IDEA-003)
3. **Auto-increment**: Next ID = max(existing IDs for type) + 1
4. **Origin tracking**: Always record which feature/context the item came from
5. **Non-blocking**: Items are informational, never block `/project.finish`
6. **Create file if missing**: First time `/project.backlog` is used, create `project/backlog.md`

### Linking with Features

When creating a feature from an item:
1. Mark item as `in-progress` with link to feature
2. In feature's `meta.md` add: `from_backlog: TODO-001`
3. When feature completes (`/project.finish`), offer to resolve the item

### During Build

When the agent detects a potential improvement:
1. Pause and show options to user
2. If "Fix now": implement immediately, don't add to backlog
3. If backlog: add item with origin from current feature/task
4. Continue with original task

---

## Related Commands

- `/project.start` — Create feature (can use `--from-backlog ID`)
- `/project.check` — Shows backlog summary if exists
- `/project.finish` — Offers to resolve items related to feature
- `/project.build` — Can detect and capture items automatically

---

## Examples

### Example 1: Add TODO during development

```
User: /project.backlog add

AI: ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    ➕ Add Item to Backlog
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    Type? [TODO / DEBT / IDEA]:

User: TODO

AI: Title:

User: Implement API rate limiting

AI: Priority? [High / Medium / Low]:

User: High

AI: Context (why is this needed?):

User: Without rate limiting, API is vulnerable to abuse

AI: Affected files (optional):

User: src/middleware/rateLimit.ts

AI: Complexity? [S/M/L/XL]:

User: M

AI: ✅ Added: TODO-005 - Implement API rate limiting
```

### Example 2: Create feature from backlog

```
User: /project.backlog pick

AI: [Shows list of items]

User: 1

AI: Feature name suggestion: implement-rate-limiting
    Accept? [Y/n/custom]:

User: Y

AI: ✅ Feature created!
    Run /project.spec to continue.
```

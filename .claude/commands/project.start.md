# Command: /project.start

**Description**: Initialize new feature in the project SDD framework

**Usage**:
- `/project.start "feature-description"` → Standard mode (default)
- `/project.start "feature-description" --express` → Express mode (minimal interaction)
- `/project.start "feature-description" --expert` → Expert mode (full control)
- `/project.start "feature-description" --lite` → Lite template (~80 lines, combined spec)
- `/project.start --from-backlog <ID>` → Create from backlog item
- `/project.start --rename [new-name]` → Rename current feature

---

## Quick Help

> `/project.start help` → Shows this summary

**Syntax**: `/project.start [feature-description] [flags]`

| Argument | Description |
|----------|-------------|
| `feature-description` | Brief description of what you want to build (in natural language) |

| Flag | Description |
|------|-------------|
| (none) | Standard mode (confirmations at key points) |
| `--express` | Express mode (minimal interaction) |
| `--expert` | Expert mode (full granular control) |
| `--lite` | Lite template (~80 lines, combined spec) |
| `--from-backlog <ID>` | Create feature from backlog item |
| `--rename [new-name]` | Rename current feature (updates folder and meta.md) |

**Examples**:
```bash
# Describe what you want to build (RECOMMENDED)
/project.start "user authentication with OAuth"
/project.start "payment retry mechanism for failed transactions"
/project.start "inventory sync from external API"

# Or use a short feature name
/project.start "payment-gateway"
/project.start "user-auth" --express
/project.start "cache-layer" --lite

# Rename an existing feature
/project.start --rename "oauth-login"
```

**What happens**:
1. Agent infers a kebab-case feature name from your description
2. Reads project name from folder or asks
3. Creates `project/wip/[feature-name]/` directory structure
4. Initializes `meta.md` with feature metadata

---

## Modes

| Mode | Flag | Behavior |
|------|------|----------|
| **Express** | `--express` | Minimal interaction, auto-advances |
| **Standard** | (default) | Confirmations at key points |
| **Expert** | `--expert` | Full granular control |

## Templates

| Template | Flag | Lines | Use For |
|----------|------|-------|---------|
| **Full** | (default) | ~1,100 | Production features |
| **Lite** | `--lite` | ~80 | MVPs, prototypes, internal tools |

---

## Workflow (Steps in Order)

### Step 1: Validate Input (BLOCKING)

**Must pass before ANY file creation:**

1. **Detect input type**:
   - Valid name? (3-100 chars, kebab-case) → Continue
   - Looks like prompt? (>5 words, sentences) → Convert to name automatically, proceed
     - Show: "✓ Feature name inferred: `{suggested-name}` (from your description)"
     - Store original description for use as initial context in `/project.spec`
     - Do NOT ask for confirmation, continue to Step 2
   - Invalid format? → Reject, ask for correction

2. **Check uniqueness**: Feature must not exist in `project/wip/`

### Step 2: Prerequisites Validation

Check that git is configured:

```bash
# Verify git user is configured
git config user.name  || echo "⚠️ Git user.name not configured"
git config user.email || echo "⚠️ Git user.email not configured"
```

If not configured, warn but don't block.

### Step 3: Detect Project Name and Type

```bash
# Use folder name as project name
project_name=$(basename $(pwd))
```

Show detected name: `✓ Project: [project_name]`

If ambiguous, use AskUserQuestion: "Confirm project name: `[folder_name]`?"

**Ask project type** — always ask in standard/expert mode; auto-select in express:

**Standard/Expert mode**: Use AskUserQuestion:
- "What type of project is this?"
- Options:
  1. "Prototype — No tests, fast iteration"
  2. "MVP — Critical tests only, skip integration tests"
  3. "Production (default) — Full tests, 80% coverage required"

**Express mode** (or when no user is available): Default to `production` and show:
```
✓ Project type: production (default — use /project.start --expert to change)
```

> **Why this matters**: project_type controls whether `project.plan` generates tests and what coverage target `project.build` enforces. A wrong default means silently skipping tests or enforcing 80% coverage on a prototype. When in doubt, default to `production` (stricter is safer than permissive).

Store as `project_type.type` in meta.md.

### Step 4: Create Feature Branch

Skip this step if `--rename` was used (branch already exists).

```bash
git checkout -b "feature/[feature-name]"
```

If git repo does not exist, or if the branch already exists → skip branch creation and note it in output. Never force-push or overwrite an existing branch.

### Step 4.5: Initialize Project Directory (if needed)

Before reading the counter, ensure the base `project/` structure exists:

```bash
mkdir -p project/wip
mkdir -p project/features
mkdir -p project/specs

if [ ! -f "project/.feature-counter" ]; then
    echo "0" > project/.feature-counter
    echo "✓ Initialized project/ directory structure"
fi
```

This is a no-op if the directories already exist.

### Step 5: Read Next Feature Number

```bash
# Read or initialize counter
counter_file="project/.feature-counter"
if [ -f "$counter_file" ]; then
    last_num=$(cat "$counter_file")
else
    last_num=0
fi
next_num=$(printf "%03d" $((last_num + 1)))
```

### Step 6: Create Directory Structure

```bash
mkdir -p "project/wip/${next_num}-[feature-name]/1-functional"
mkdir -p "project/wip/${next_num}-[feature-name]/2-technical"
mkdir -p "project/wip/${next_num}-[feature-name]/3-tasks"
mkdir -p "project/wip/${next_num}-[feature-name]/progress"

# Update counter
echo "$((last_num + 1))" > project/.feature-counter
```

### Step 7: Initialize meta.md

Create `project/wip/[feature-name]/meta.md`:

```yaml
# Feature Metadata
feature: [feature-name]
feature_number: [NNN]
project: [project-name]
created_at: YYYY-MM-DD
execution_mode: standard  # standard | express | expert
template_mode: full       # full | lite
project_type:
  type: production        # prototype | mvp | production
vision_prompt_shown: false

Current Stage: functional

stages:
  functional:
    status: in-progress
    created_at: YYYY-MM-DD
  technical:
    status: pending
  tasks:
    status: pending
  implementation:
    status: pending
    completed_tasks: 0
    total_tasks: 0
```

If `--from-backlog <ID>` was used, also add:
```yaml
from_backlog: TODO-001
```

### Step 8: Create Spec Templates

#### Full Template

Create `project/wip/[feature-name]/1-functional/spec.md`.

**IMPORTANT**: If the user provided a description (not just a kebab-case name), seed the Problem Statement with it verbatim. This gives `/project.spec` an initial context to work from rather than starting from a blank slate.

```markdown
# Functional Specification: [Feature Name]

**Status**: Draft
**Created**: YYYY-MM-DD

## Problem Statement

> [If description was provided, paste it here verbatim as initial context for /project.spec]

## Objectives

- [ ] [Objective 1]

## Out of Scope

- [What this does NOT include]

## User Stories

### US-1: [Title]
**As a** [user type]
**I want to** [action]
**So that** [outcome]

#### Acceptance Criteria
- AC-1: [criterion]

## Business Rules

- BR-1: [rule]

## Edge Cases

- EC-1: [case]

## Success Metrics

- [How we measure success]

## Feature Dependencies

- [Other features or capabilities this depends on — omit section if none]
```

Create `project/wip/[feature-name]/2-technical/spec.md`:

~~~markdown
# Technical Specification: [Feature Name]

**Status**: Draft
**Created**: YYYY-MM-DD

## Architecture Overview

> [High-level approach]

## API Contract

### POST /[endpoint]

**Request**:
```json
{
  "field": "value"
}
```

**Response**:
```json
{
  "result": "value"
}
```

## Data Model & Storage

> [Key entities, their relationships, and storage strategy (tables, schemas)]

## External Integrations

> [External services and APIs]

## Error Handling

| Code | Error | Description |
|------|-------|-------------|
| 400 | INVALID_INPUT | [description] |
| 500 | INTERNAL_ERROR | [description] |

## Non-Functional Requirements

- Performance: [target]
- Security: [requirements]
~~~

#### Lite Template (--lite flag)

Creates a single combined `spec.md`:

```markdown
# Specification: [Feature Name]

**Status**: Draft | **Created**: YYYY-MM-DD

## What & Why

[Problem and solution in plain language]

## User Stories

### US-1: [Title]
- AC-1: [criterion]

## Technical Approach

[Brief technical description and API design]

## Out of Scope

- [exclusions]
```

### Step 9: Output

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Feature Initialized: [feature-name]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📁 Created: project/wip/[NNN-feature-name]/
   ├── meta.md
   ├── 1-functional/spec.md
   ├── 2-technical/spec.md
   └── 3-tasks/

🌿 Branch: feature/[feature-name]

Mode: standard | Template: full
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Then use AskUserQuestion: "Feature ready. Start specifications?"
- Options:
  1. "/project.spec (Recommended)" — Start writing specs
  2. "/project.check" — View feature structure
  3. "Later" — Exit for now

---

## `--rename` Flag

Updates folder name and meta.md:

```bash
# Rename: 003-old-name → 003-new-name
mv "project/wip/003-old-name" "project/wip/003-new-name"
# Update meta.md: feature: new-name
```

---

## `--from-backlog <ID>`

Pre-populates spec context from backlog item:

1. Read item from `project/backlog.md`
2. Use item's context as initial description for `/project.spec`
3. **Immediately** mark item as `in-progress` in `backlog.md` and add link to new feature folder — do this before creating any files, so the backlog always reflects current state
4. Add `from_backlog: TODO-001` to meta.md

> No separate `/project.backlog` call is needed. The status update happens atomically as part of `/project.start --from-backlog`.

---

## AI Agent Instructions

### Help Flag Detection

**WHEN** the user runs `/project.start help`:
1. Output ONLY the "Quick Help" section
2. Do NOT execute start logic
3. Keep response concise (~15 lines)

### Key Rules

1. **Infer name from description** — Auto-convert, don't ask for confirmation
2. **Never reuse feature numbers** — Always increment counter
3. **Create branch** — Only if inside a git repo
4. **Store original description** — For use as initial context in `/project.spec`
5. **Offer next steps** — Always use AskUserQuestion at the end

---

## Related Commands

- `/project.spec` — Write functional and technical specifications
- `/project.list` — View all features
- `/project.backlog` — Browse backlog items

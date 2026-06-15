# Command: /project.fix

**Purpose**: Fix errors by analyzing output and propagating changes across ALL artifacts (specs, tasks, code) to maintain consistency.

---

## Usage

```bash
/project.fix                           # Interactive: paste error output
/project.fix "error message or output" # Direct: pass error inline
/project.fix --file ./error.log        # From file: read error from file
```

---

## Quick Help

> `/project.fix help` → Shows this summary

**Syntax**: `/project.fix [input] [flags]`

| Flag | Description |
|------|-------------|
| (none) | Interactive: paste error output |
| `"error message"` | Direct: pass error inline |
| `--file <path>` | Read error from file |
| `--layer <N>` | Target specific layer only |
| `--auto` | Auto-apply recommended fixes |

**Examples**:
```bash
/project.fix                    # Interactive mode
/project.fix "NullPointer..."   # Direct error message
/project.fix --file error.log   # From file
```

---

## When to Use

`/project.fix` is for errors that reveal **gaps in your specs**, not for simple code typos.

| Situation | Use |
|-----------|-----|
| Suspected spec/code drift (no error output) | `/project.check --sync` |
| Test fail, crash, or wrong output | `/project.fix` |
| Simple typo, missing import, syntax error | Fix manually |
| Config/env/infra error | Fix directly — not a spec issue |
| NullPointerException | Fix manually if pure code bug; use `/project.fix` if it reveals a missing requirement |

---

## Core Principle: Horizontal Consistency

When you fix a bug, the fix must propagate through all affected layers — not just code. A code change that adds new behavior without updating the spec creates drift. A spec update without a corresponding task leaves orphaned work.

Two directions matter: **propagation** (Code → Tasks → Technical → Functional, when applying a fix) and **verification** (Specs → Code AND Code → Specs, when confirming the fix is complete).

Only layers that EXIST at the current phase can be updated. See Step 0 for the phase/layer table.

---

## Subagent Delegation

Fix obvious bugs directly (typo, missing import, clear logic error). For everything else:

- **Spec/code inconsistency** (code does X but spec says Y) → launch a dedicated Explore agent to read all layers and surface the drift before fixing.
- **Deep technical bug** (race condition, OOM, perf regression, intermittent failure) → launch a dedicated debugging agent for root cause analysis before touching code.
- **Everything else** → fix inline with `/project.fix`.

---

## Execution Flow

### Step 0: Detect Current Phase (MANDATORY)

> **CRITICAL**: Before analyzing any error, you MUST determine the current phase to know which layers EXIST.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 PHASE DETECTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Reading meta.md to determine current phase...

Current Phase: [functional / technical / tasks / implementation]
```

#### Layers Available by Phase

| Current Phase | Functional Spec | Technical Spec | Tasks | Code |
|---------------|-----------------|----------------|-------|------|
| **functional** | ✅ EXISTS | ❌ NOT YET | ❌ NOT YET | ❌ NOT YET |
| **technical** | ✅ EXISTS | ✅ EXISTS | ❌ NOT YET | ❌ NOT YET |
| **tasks** | ✅ EXISTS | ✅ EXISTS | ✅ EXISTS | ❌ NOT YET |
| **implementation** | ✅ EXISTS | ✅ EXISTS | ✅ EXISTS | ✅ EXISTS |

#### Phase-Aware Assessment Rules

**IF current phase = functional**: Only assess Functional Spec
**IF current phase = technical**: Only assess Functional + Technical Spec
**IF current phase = tasks**: Only assess Functional + Technical + Tasks
**IF current phase = implementation**: Assess ALL layers

> **WARNING**: Suggesting updates to layers that don't exist yet is incorrect and confusing.

---

### Step 1: Receive Error Input

```
AI: 🔧 Fix Mode
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Current Phase: [detected phase]
Available Layers: [list of layers that exist]

Paste the error output or describe the issue:

> [User pastes error]
```

---

### Step 1.5: Problem Classification (MANDATORY)

> **CRITICAL**: Before ANY analysis, classify the problem type. This determines which layers MUST be updated.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 PROBLEM CLASSIFICATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┌─────────────────────────────────────────────────────────────────┐
│                    CLASSIFICATION DECISION TREE                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Q1: Does the fix require NEW FUNCTIONALITY not in specs?       │
│      │                                                           │
│      ├── YES ──► FEATURE GAP                                     │
│      │           Must update: Functional + Technical + Tasks     │
│      │                                                           │
│      └── NO ──► Q2: Does the fix require changing HOW           │
│                     something works (API, data model)?           │
│                     │                                            │
│                     ├── YES ──► DESIGN FLAW                      │
│                     │           Must update: Technical + Tasks   │
│                     │                                            │
│                     └── NO ──► Q3: Does the fix add work        │
│                                    not captured in tasks?        │
│                                    │                             │
│                                    ├── YES ──► MISSING TASK      │
│                                    │           Must update: Tasks│
│                                    │                             │
│                                    └── NO ──► IMPLEMENTATION BUG │
│                                                Code only         │
└─────────────────────────────────────────────────────────────────┘

Classification Result: [FEATURE_GAP / DESIGN_FLAW / MISSING_TASK / IMPLEMENTATION_BUG]

Layers that MUST be updated (only layers that EXIST at current phase):
- [ ] Functional Spec: [Yes/No - with reason]
- [ ] Technical Spec: [Yes/No - with reason] ← Only if phase ≥ technical
- [ ] Tasks: [Yes/No - with reason]          ← Only if phase ≥ tasks
- [ ] Code: [Yes/No - with reason]           ← Only if phase = implementation
```

> **WARNING**: If you classify as IMPLEMENTATION_BUG but the fix adds new behavior, you have misclassified. Re-evaluate.

---

## Plan Mode for Complex Bugs

> **ENABLED BY DEFAULT**: For complex bugs (DESIGN_FLAW, FEATURE_GAP), Plan Mode helps
> plan investigation strategy before diving in.

### Platform Availability

| Platform | Plan Mode Available |
|----------|---------------------|
| Claude Code (CLI) | ✅ Yes (`EnterPlanMode`/`ExitPlanMode`) |
| Other editors | ❌ No (use fallback) |

### Trigger Conditions

Enter Plan Mode when **ANY** of these are true:
- Problem classified as `DESIGN_FLAW` or `FEATURE_GAP`
- Error spans multiple components (3+ files affected)
- Previous fix attempts failed (2+ attempts)
- Symptoms indicate systemic issues (performance, concurrency, race conditions)

### Plan Mode Flow

```
AFTER Step 1.5 (Classification), BEFORE Step 2 (Root Cause):

  IF complex_bug_detected:

    IF EnterPlanMode available (Claude Code):
      1. EnterPlanMode()
      2. EXPLORE: Map affected components
      3. DESIGN: Investigation strategy + hypothesis list
      4. Present plan to user
      5. ExitPlanMode() (user approves)

    ELSE (Fallback):
      1. EXPLORE: Same read-only exploration
      2. DESIGN: Same investigation planning
      3. Display plan inline in chat
      4. AskUserQuestion: "Approve this investigation approach?"
         Options: "Approve", "Modify", "Skip planning"

    6. Continue with Step 2 using approved strategy
```

### Post-Plan Mode Safeguards

After ExitPlanMode: plan output is read-only guidance. Apply the fix following the horizontal consistency rules. If the plan suggests a breaking change, get explicit user approval before proceeding.

### When to Skip Plan Mode

Skip Plan Mode for:
- `IMPLEMENTATION_BUG` (pure code bug, no spec impact)
- `MISSING_TASK` (clear scope, just add task)
- Simple typos, missing imports, obvious logic errors
- User explicitly requests `--auto` flag

#### Classification Examples

| Problem Description | Classification | Layers to Update |
|---------------------|----------------|------------------|
| "Reports not being generated" | **FEATURE_GAP** | Functional + Technical + Tasks + Code |
| "API returns 500 instead of 400 for validation" | **DESIGN_FLAW** | Technical + Tasks + Code |
| "Test coverage not reaching threshold" | **MISSING_TASK** | Tasks + Code |
| "NullPointerException in line 45" | **IMPLEMENTATION_BUG** | Code only |

> **WARNING**: If you classify as IMPLEMENTATION_BUG but the fix adds new behavior, you have misclassified. Re-evaluate.

---

### Step 2: Analyze Error & Root Cause

Identify what's broken and why. The root cause category maps directly to the classification from Step 1.5 — use it to confirm which layers need updating before proceeding to Step 3.

---

### Step 3: Assess Impact Across ALL Layers

For each layer that EXISTS at the current phase, declare **No Change** or **Update Required**:

- **Functional Spec**: Did the requirement miss this case? Does acceptance criteria need to change?
- **Technical Spec**: Does the API contract, data model, or architecture need updating?
- **Tasks**: Is there a missing task, or does an existing task need broader scope?
- **Code**: What files change and how?

Provide evidence for every "No Change" declaration (see Anti-Shortcut Protocol below).

---

### Step 3.5: Anti-Shortcut Protocol

Before declaring "No Change" for any layer, read the relevant section and quote the part that covers the fix. A declaration without a quote is not acceptable — it's how inconsistencies accumulate silently.

These always require a spec update (not "No Change"):

| Code change | Update |
|-------------|--------|
| New user-facing behavior or output | Functional Spec |
| New/changed API parameter or response | Technical Spec |
| New model or data structure | Technical Spec |
| New acceptance criteria | Tasks |

---

### Step 4: Propose Horizontal Fix

```markdown
## Proposed Fix (All Layers)

### Option A: [Fix Description] (Recommended)

**1. Functional Spec Changes** (`1-functional/spec.md`):
- [What to add/modify]

**2. Technical Spec Changes** (`2-technical/spec.md`):
- [API changes, data model updates]

**3. Task Changes** (`3-tasks/tasks.json`):
- [New or modified tasks]

**4. Code Changes**:
- [Files and description of changes]

**Confidence**: High/Medium/Low
**Risk**: Low/Medium/High

Apply this fix? (y/n)
```

---

### Step 5: Apply Fix Horizontally

Update all affected artifacts atomically. Report each layer updated: functional spec, technical spec, tasks.json, code files. Then re-run the test suite and confirm all tests pass.

---

### Step 6: Verify Fix

Re-run the original failing scenario to confirm the fix resolves it:
- Re-run the test or command that produced the original error
- Confirm output matches expected behavior
- If still failing: re-classify (the root cause may be deeper than assessed)

---

### Step 7: Bidirectional Consistency Check (MANDATORY)

> **CRITICAL**: After applying the fix, validate all layers remain consistent.

Run the sync validation:

```
/project.check --sync
```

This validates:
- **Functional ↔ Technical ↔ Tasks ↔ Code** consistency
- Detects any drift introduced by the fix
- Proposes additional fixes if gaps found

**Verdict Handling**:

| Verdict | Action |
|---------|--------|
| `APPROVED` | Fix complete, proceed |
| `CAN_PROCEED_WITH_WARNINGS` | Fix complete, note warnings in task |
| `CANNOT_PROCEED` | Apply suggested fixes before marking task complete |

**If sync finds issues**: Apply the suggested fixes, then re-run `/project.check --sync` until it passes.

---

## Flags and Options

| Flag | Description | Example |
|------|-------------|---------|
| `--file` | Read error from file | `/project.fix --file ./error.log` |
| `--dry-run` | Show fix plan without applying | `/project.fix --dry-run "error"` |
| `--code-only` | ⚠️ DANGEROUS: Fix code only | `/project.fix --code-only "error"` |
| `--layer` | ⚠️ DANGEROUS: Fix specific layer only | `/project.fix --layer technical "error"` |
| `--auto` | Skip confirmation prompts, apply recommended fix directly | `/project.fix --auto "error"` |

### `--auto` Flag Behavior

Skips the "Apply this fix? (y/n)" confirmation in Step 4 and applies the recommended fix directly. All other steps (classification, impact assessment, sync check) still run — `--auto` only removes the approval gate before applying.

**Safe to use when**: the fix is clearly an `IMPLEMENTATION_BUG` and you trust the classification.
**Avoid when**: the fix is `DESIGN_FLAW` or `FEATURE_GAP` — those changes deserve review before applying.

### ⚠️ Dangerous Flags Warning

**`--code-only` and `--layer` can cause spec drift:**

- The ONLY safe use case: pure implementation bug with no spec impact (e.g., fix a typo in variable name)
- If your fix changes behavior, specs MUST be updated.
- `/project.check --sync` will later detect inconsistencies if you skip spec updates.

---

## Output Format

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔧 FIX: [error-type]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📍 Root Cause: [explanation]

📊 Impact Assessment:
   📋 Functional: [No Change / Update]
   🔧 Technical:  [No Change / Update]
   📝 Tasks:      [No Change / Update]
   💻 Code:       [Update Required]

📝 Proposed Changes:
   [Summary of changes per layer]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## AI Agent Instructions

### Help Flag Detection

**WHEN** the user runs `/project.fix help`:
1. Output ONLY the "Quick Help" section (not full documentation)
2. Do NOT execute fix logic
3. Keep response concise (~15 lines)

### Key Rules

**0. Project directory guard** — Before anything else, verify `project/wip/` exists. If not, show SDD setup message (see `references/bash-patterns.md#project-directory-guard`)

**1. Classify before fixing** — the classification (Step 1.5) determines which layers need updating. Jumping to a code fix without classifying leads to spec drift every time.

```
✗  Read error → Fix code → Maybe check specs
✓  Read error → Classify → Determine layers → Update ALL required layers
```

**2. Only assess layers that exist** — if the feature is in `technical` phase, Tasks and Code don't exist yet. Never suggest updating them; it's confusing and wrong.

**3. Evidence-based "No Change"** — before declaring a layer unchanged, read the relevant section and quote it. Saying "already documented" without a quote is how inconsistencies accumulate.

```
✗  Functional Spec: No Change (already covered)
✓  Functional Spec: No Change
   Evidence: "System validates email format before submission" (spec line 45)
```

**4. Code changes trigger spec review** — if your fix adds any of the following, specs must be updated:

| Code Change | Spec Update Required |
|-------------|---------------------|
| New function/method with business logic | Technical Spec + Tasks |
| New API parameter or response field | Technical Spec + Tasks |
| New error type or validation | Technical Spec + Tasks |
| New user-visible output or behavior | Functional + Technical + Tasks |

**5. Post-fix verification is not optional** — fix isn't complete until `/project.check --sync` passes. Tests passing ≠ consistency maintained.

```
✗  ✅ Code fixed, tests pass — done!
✓  ✅ Code fixed  ✅ Tests pass  ✅ Sync check passes
```

---

## Related Commands

- `/project.check --sync` — Detect spec/code drift
- `/project.build` — Continue implementation
- `/project.cancel` — Cancel feature entirely

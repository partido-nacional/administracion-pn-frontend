# Command: /project.plan

**Description**: Generate, refine, and approve implementation tasks

**Usage**:
- `/project.plan` → Auto behavior based on mode
- `/project.plan --refine` → Refine existing tasks (expert mode)
- `/project.plan --approve` → Approve tasks and choose strategy (expert mode)
- `/project.plan --resume` → Resume interrupted planning session

---

## Quick Help

> `/project.plan help` → Shows this summary

**Syntax**: `/project.plan [flags]`

| Flag | Description |
|------|-------------|
| (none) | Auto behavior based on mode |
| `--refine` | Refine existing tasks |
| `--approve` | Approve tasks and choose strategy |
| `--resume` | Resume interrupted planning session |

**Examples**:
```bash
/project.plan              # Generate and review tasks
/project.plan --approve    # Approve tasks and select strategy
```

---

## Pre-Requisites (BLOCKING)

| Check | On Failure |
|-------|------------|
| Technical spec approved | Run `/project.spec technical --approve` first |
| Feature in `project/wip/` | Run `/project.start` first |

---

## Workflow (Steps in Order)

### Step 1: Phase Detection

Read `meta.md` and verify current stage is `technical` (approved) or later.

```bash
current_stage=$(grep "Current Stage:" project/wip/[feature]/meta.md | cut -d: -f2 | tr -d ' ')

if [ "$current_stage" != "tasks" ] && [ "$current_stage" != "implementation" ]; then
    # Check if technical spec is approved
    tech_status=$(grep -A2 "technical:" project/wip/[feature]/meta.md | grep "status:" | head -1 | cut -d: -f2 | tr -d ' ')
    if [ "$tech_status" != "approved" ]; then
        echo "❌ Technical spec not approved. Run /project.spec technical --approve first."
        exit 1
    fi
fi
```

### Step 2: Read Specifications

Read `template_mode` from `meta.md` first, then load accordingly:

- **`template_mode: full`** (default): Read both specs separately
  - `project/wip/[feature]/1-functional/spec.md`
  - `project/wip/[feature]/2-technical/spec.md`
- **`template_mode: lite`**: Read single combined spec
  - `project/wip/[feature]/spec.md`

### Step 3: Detect Technology Stack

Use the stack detection and build/test command patterns from [`references/bash-patterns.md`](../references/bash-patterns.md). Store the detected stack — it's used to generate appropriate gate commands in tasks.

### Step 4: Generate Tasks

Generate tasks following these rules:

**Task Types**:
- Implementation tasks (write code)
- Test tasks (unit + integration tests, based on project type)
- Quality tasks (code review, performance, security)

**Task Generation by Project Type** (read from `meta.md → project_type.type`):

| Type | Unit Tests | Integration Tests |
|------|------------|-------------------|
| **prototype** | Skip | Skip |
| **mvp** | Critical paths only | Skip |
| **production** | Full (80%+ coverage) | Yes |

**Task format**:
```json
{
  "id": "TASK-001",
  "title": "Short title",
  "description": "2-3 sentences max.",
  "status": "pending",
  "layer": 1,
  "depends_on": [],
  "files": ["path/to/file.go"],
  "acceptance_criteria": ["AC-1: ...", "GATE: build passes"],
  "references": ["US-1"]
}
```

### Step 5: Strategy Selection

**Auto-select based on feature size**:

| Change Size | Criteria | Strategy |
|-------------|----------|----------|
| Small | ≤5 tasks OR all Low complexity | Auto: Sequential |
| Medium/Large | >5 tasks with Medium/High | Ask user |

**Strategy Options**:

| Strategy | Best For |
|----------|----------|
| Sequential | Simple features, linear dependencies — one task at a time |
| Batched (Recommended) | Most projects — group tasks by domain, complete each group before the next |
| Parallel | Complex features with clearly independent tracks (e.g., API + DB + tests can be built separately) — agent still implements sequentially but plans the tracks as independent units |

> Note: "Parallel" doesn't mean simultaneous execution — it means structuring tasks so they can be built in independent tracks without blocking each other. Useful for larger features where different subsystems don't depend on each other.

### Step 6: Display Tasks for Approval

**BEFORE asking for approval, ALWAYS display full task list:**

```
## Tasks for Approval

| ID | Title | Layer | Complexity | Dependencies |
|----|-------|-------|------------|--------------|
| TASK-001 | Setup project structure | 1 | Low | - |
| TASK-002 | Create domain entities | 1 | Medium | TASK-001 |
| TASK-003 | Implement REST endpoints | 1 | Medium | TASK-002 |
| TASK-004 | Write unit tests | 1 | Medium | TASK-003 |
| TASK-005 | Code review | 2 | Low | TASK-004 |
| TASK-006 | Security review | 2 | Low | TASK-004 |

**Total: 6 tasks**

### Layer Summary
- Layer 1 (Implementation): 4 tasks
- Layer 2 (Quality): 2 tasks
```

**Before asking, validate the task list internally**:
- [ ] Each task references at least one User Story or technical spec item
- [ ] No orphan tasks (all have spec backing)
- [ ] No circular dependencies
- [ ] Layer 2 quality tasks have `depends_on` containing **all** Layer 1 task IDs (not empty, not partial)
- [ ] No Layer 2 task has `depends_on: []` — this is always a bug
- [ ] `project_type` taken into account (prototype skips test tasks)
- [ ] Every ID in `depends_on` arrays is the `id` of an actual task in the same array — no dangling references
- [ ] `execution_strategy` field is set at the root of tasks.json

> **Auto-fill Layer 2 dependencies**: When generating quality tasks (code review, performance, security), automatically populate their `depends_on` with the IDs of every Layer 1 task. Do not leave this to be filled manually — it must be complete at generation time.

Then use AskUserQuestion: "Approve these tasks?"
- Options: "Yes, approve" / "Adjust tasks" / "Cancel"

### Step 7: Write tasks.json

On approval, write `project/wip/[feature]/3-tasks/tasks.json` and update `meta.md`.

### Step 8: Post-Approval Context Check

If context is elevated (>50%), tell the user:
"Recommend running `/compact` before starting the build — it compresses the conversation history and prevents context issues mid-implementation. Then resume with `/project.build`."

### Step 9: Interactive Next Steps

Use AskUserQuestion: "Tasks ready. Start implementation?"
- Options:
  1. "/project.build (Recommended)" — Start implementing all tasks
  2. "/project.build --layer 1" — Build only implementation layer first
  3. "/project.check" — Review task structure

---

## `--refine` Flag

Invoked when tasks exist but the user wants to adjust them before approving.

**Flow**:
1. Read current `tasks.json` (or display generated tasks if not yet written)
2. Show full task table
3. Use AskUserQuestion: "What would you like to change?"
   - Options: "Add task", "Remove task", "Edit task description", "Change dependencies", "Change complexity", "Done — approve as-is"
4. Apply the requested change
5. Show updated table
6. Loop back to step 3 until user selects "Done"
7. On "Done": proceed to Step 7 (Write tasks.json) and Step 9 (Next steps)

**What can be refined**:
- Task titles and descriptions
- Acceptance criteria
- Complexity estimates
- Dependencies between tasks
- Adding or removing tasks
- Layer assignment

**What cannot be changed via --refine** (requires spec changes first):
- Scope that isn't in the specs
- Features not in functional spec

---

## Behavior by Mode

| Mode | Generate | Refine | Strategy | Approve |
|------|----------|--------|----------|---------|
| **Express** | Auto | Skip | Auto (Batched) | Auto |
| **Standard** | Auto | Ask user | Smart auto/Ask | Auto after choice |
| **Expert** | Manual | Explicit `--refine` | Explicit `--approve` | Explicit |

---

## tasks.json Structure

**Single source of truth** — Do NOT create `tasks.md`.

```json
{
  "feature": "feature-name",
  "local_config": {
    "database": "container|existing|null"
  },
  "stats": {
    "total": 6,
    "done": 0,
    "by_layer": { "1": 4, "2": 2 }
  },
  "execution_strategy": "batched",
  "tasks": [
    {
      "id": "TASK-001",
      "title": "Short title",
      "description": "2-3 sentences max.",
      "status": "pending",
      "layer": 1,
      "depends_on": [],
      "files": ["path/to/file.go"],
      "acceptance_criteria": ["AC-1: ...", "GATE: go build passes"],
      "references": ["US-1"]
    }
  ],
  "dependency_graph": {
    "by_layer": {
      "1": { "level_0": ["TASK-001"], "level_1": ["TASK-002"] }
    }
  }
}
```

---

## Task Layers

| Layer | Name | Purpose | GATEs |
|-------|------|---------|-------|
| **1** | Implementation | Write code and tests | `build`, `test`, `lint` |
| **2** | Quality | Review and validation | code review, security, performance |

**Layer 2 MUST contain these quality tasks**:
1. Code Review — catches design issues, dead code, and naming problems that are hard to see from inside the implementation
2. Performance Review — N+1 queries and missing indexes are easy to introduce without noticing; this catches them before they reach production
3. Security Review — OWASP issues (injection, missing auth, exposed secrets) are the highest-cost bugs to fix after deployment

These three are always Layer 2, always depend on all Layer 1 tasks, and always run after the code is complete — not during. Skipping any of them for `prototype` is acceptable (see project_type handling).

---

---

## AI Agent Instructions

### Help Flag Detection

**WHEN** the user runs `/project.plan help`:
1. Output ONLY the "Quick Help" section
2. Do NOT execute plan logic
3. Keep response concise (~15 lines)

### Key Rules

1. **Verify technical spec approved** — Check meta.md before generating tasks
2. **Read both specs** — Both functional and technical are needed
3. **Layer 2 always has 3 quality tasks** — Code review, performance, security; their `depends_on` lists ALL Layer 1 task IDs
4. **depends_on must be referentially valid** — Every ID in any `depends_on` array must match the `id` field of a real task in the same `tasks` array. Never invent placeholder IDs.
5. **Display before asking** — Show full task table before approval prompt
6. **Write tasks.json** — Not tasks.md, always JSON

---

## Related Commands

- `/project.spec` — Write or revise specifications
- `/project.build` — Start implementation after approval
- `/project.check` — Review feature status

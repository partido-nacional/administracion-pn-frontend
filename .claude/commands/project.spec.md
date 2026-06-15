# Command: /project.spec

**Description**: Create and manage functional and technical specifications

**Usage**:
- `/project.spec` → Auto-detects phase, behavior based on mode
- `/project.spec "description"` → Start with initial context (seeds interview)
- `/project.spec functional` → Functional spec only (expert mode)
- `/project.spec functional "description"` → Functional with initial context
- `/project.spec technical` → Technical spec only (expert mode)
- `/project.spec functional --include <context>` → Include external context
- `/project.spec functional --approve` → Approve functional (expert mode)
- `/project.spec technical --approve` → Approve technical (expert mode)
- `/project.spec --resume` → Resume interrupted spec session
- `/project.spec --iterate "change"` → Refine spec (shows preview, asks confirmation)
- `/project.spec --summary` → Quick overview without loading full spec

---

## Quick Help

> `/project.spec help` → Shows this summary

**Syntax**: `/project.spec [phase] [flags]`

| Flag | Description |
|------|-------------|
| (none) | Auto-detect phase, behavior based on mode |
| `"description"` | Initial context for the spec (seeds interview) |
| `functional` | Create functional spec only |
| `technical` | Create technical spec only |
| `--include <ctx>` | Include external context in spec |
| `--approve` | Approve current spec (expert mode) |
| `--resume` | Resume interrupted session |
| `--iterate "desc"` | Refine spec (shows preview, asks confirmation) |
| `--summary` | Quick spec overview |

**Examples**:
```bash
/project.spec                              # Auto-detect and continue
/project.spec "payment with refunds"       # Start with initial context
/project.spec functional                   # Start functional spec
/project.spec technical --approve          # Approve technical spec
/project.spec --summary                    # Quick spec overview
```

---

## Behavior by Mode

| Mode | Behavior |
|------|----------|
| **Express** | 3 questions only (problem, users, tech approach), auto-generates both specs, auto-approves without showing draft |
| **Standard** | Full interview, shows generated spec before approval, user confirms |
| **Expert** | Explicit phase control (`functional` / `technical` args), no auto-advancing |

### Express Mode (detail)

When invoked from `/project.go --express` or `/project.start --express`, `execution_mode` in meta.md is `express`. Use condensed interview:
- Q1: "What's the main feature and why does it matter?" (fills Problem Statement + Objectives)
- Q2: "Who uses it and what do they do?" (fills User Stories + AC)
- Q3: "Any technical constraints or external dependencies?" (fills Architecture + Integrations)

Auto-advance from functional → technical → tasks without confirmation.

---

## Workflow (Steps in Order)

### Step 1: Detect Phase

Read `meta.md` and determine current stage:

```bash
current_stage=$(grep "Current Stage:" project/wip/[feature]/meta.md | cut -d: -f2 | tr -d ' ')
template_mode=$(grep "template_mode:" project/wip/[feature]/meta.md | cut -d: -f2 | tr -d ' ')
```

**Phase mapping**:
- Stage `functional` → Start/continue functional spec
- Stage `technical` → Start/continue technical spec
- Stage `tasks` or `implementation` → Specs already approved, redirect to `/project.plan` or `/project.build`

**Template mode**:
- `template_mode: lite` → Single combined spec (~80 lines)
- `template_mode: full` → Separate specs (default)

### Step 1.5: Read Project Vision (if exists)

```bash
# Check if project/PROJECT.md has a vision section
vision=$(grep -A 50 "^## Vision" project/PROJECT.md 2>/dev/null | head -50)
```

**If vision is defined**: Use it to guide interview questions and spec content.

**If vision is NOT defined** AND `vision_prompt_shown: false` in meta.md:

Use AskUserQuestion:
- "PROJECT.md doesn't have a product vision. Vision helps align features with goals. Define it now?"
- Options:
  1. "Define now" — Quick 3-question wizard
  2. "Later" — Continue without, remind next time
  3. "Skip for this feature" — Never ask again for this feature

On "Later" or "Skip for this feature": set `vision_prompt_shown: true` in meta.md so this is never asked again for this feature.

**Inline Vision Wizard** (if user selects "Define now"):
1. "What does your project do in one sentence?"
2. "What problem does it solve and why should users care?"
3. "Any guiding principles? (optional)"
4. Write to `project/PROJECT.md`
5. Confirm to the user: `✅ Vision saved to project/PROJECT.md`

### Step 2: Functional Spec (WHAT to build)

> **Lite mode check**: If `template_mode == "lite"` → skip Steps 2-7 and jump to the **Lite Template Workflow** section below.

**Consolidated Interview (4-6 questions max)**:

| Question | Fills Sections | Condition |
|----------|----------------|-----------|
| Q1: Problem + expected outcome + business value | Problem Statement, Objectives, Success Metrics | Always |
| Q2: Explicit exclusions? | Scope (Out of Scope) | Skip if "nothing special" |
| Q3: Main user actions + outcomes | User Stories, Acceptance Criteria | Always |
| Q3b: Data input example? | Data Model, Business Rules, Validations | IF data processing detected |
| Q4: External integrations + edge cases | Edge Cases | Skip if purely internal |
| Q4b: Business rules example with numbers? | Business Rules, Acceptance Criteria | IF calculations detected |

**Gap-Driven Questions** (ask only when relevant):

| Feature Type Detected | Additional Questions |
|----------------------|---------------------|
| Async/Event processing | "What happens if the same event arrives twice?" + "Do you have a payload example?" |
| Data storage | "Is there pre-existing data to consider?" + "How long should data be stored?" |
| Calculations | "Can you give me an example with real numbers? If X=100, what result?" |
| External integration | "What do we do if the external API fails?" + "Should we retry?" |
| Concurrent access | "What happens if two users modify the same record at the same time?" |

**Anti-Redundancy**: NEVER ask the same thing twice. Derive from answers.

**Minimum bar**: Always ask at least one question from the table above before generating the spec. Even when the user provided extensive context upfront, asking one targeted question confirms alignment and surfaces gaps the user didn't know to mention. Silent spec generation without any dialogue is a red flag — it means you assumed rather than confirmed.

### Step 2.5: Completeness Check

> **AFTER answering all questions, BEFORE generating spec**

**Philosophy**:
- ✅ ASSUME what's safe (standard patterns, obvious defaults)
- ❌ NEVER leave uncertainty about **DATA ORIGINS**
- ❌ NEVER assume **BUSINESS LOGIC** without concrete examples

**Required to clarify — Data Sources**:

Data must be explicitly identified:
- User input (form, API request, upload)
- External service (which one? what API contract?)
- Database (but WHO populates it originally?)
- Message/event queue (from which producer?)
- Scheduled job (what triggers it?)

**Scan answers for gaps**:
- "stored in DB" but WHERE does it come from originally?
- "calls an API" but WHICH one? What's the contract?
- "from the system" → need specifics

**Enhanced Completeness Checklist**:

1. **Data Origin Clarity** (always required):
   - ✓ Source identified
   - ✓ Specific service/endpoint named

2. **Data Structure** (if data processing detected):
   - ✓ Example payload provided
   - ⚠️ No example → ask "Do you have an example of the input data?"

3. **Business Logic** (if calculations detected):
   - ✓ Concrete example with numbers provided
   - ⚠️ No example → ask "If input=X, what output do we expect?"

4. **Edge Cases** (if async/event processing detected):
   - ✓ Duplicate handling specified
   - ⚠️ Not specified → ask "What should happen if the same event arrives twice?"

5. **Error Handling** (if external integration detected):
   - ✓ Retry/fallback policy specified
   - ⚠️ Not specified → ask "What do we do if the external API fails?"

6. **Existing Data** (if storage detected):
   - ✓ Pre-existing data addressed
   - ⚠️ Not mentioned → ask "Is there pre-existing data we should consider?"

**IF gaps detected** — show summary and ask:
```
📋 I need a bit more detail to complete your spec.

What I understood:
• [summary of what's clear]

Need clarification on:
• [specific gap 1]
• [specific gap 2]
```

### Step 3: Generate Functional Spec

Write `project/wip/[feature]/1-functional/spec.md`. The file was created with a template by `/project.start` — fill in each section from the interview answers:

- **Problem Statement** — what problem this solves and why it matters
- **Objectives** — measurable goals (use checkboxes)
- **Out of Scope** — explicit exclusions
- **User Stories** — one per actor/action, with Acceptance Criteria (AC-N format)
- **Business Rules** — rules with concrete examples for any calculations
- **Edge Cases** — cases and expected behavior
- **Success Metrics** — how success is measured
- **Feature Dependencies** — other features or platform capabilities not yet available that this depends on (omit if none)

Every AC must be specific and testable: *"User sees error message X when Y"* not *"Errors are handled"*.

### Step 4: Review & Approve Functional Spec

Show spec to user and use AskUserQuestion:
- "Functional spec ready. Approve?"
- Options: "Approve" / "Revise section X" / "Add more context"

On approval:
1. Update `meta.md`:
   ```yaml
   stages:
     functional:
       status: approved        # MUST be exactly "approved" — not "complete", "done", or any other value
       approved_at: YYYY-MM-DD
   Current Stage: technical
   ```
   > **Critical**: `status: approved` is the exact string that `project.plan` checks before proceeding. Any other value (`complete`, `done`, `true`) will cause a hard block downstream.
2. Continue to technical spec (auto in express/standard, wait in expert)

### Step 5: Technical Spec (HOW to build)

**Consolidated Interview (3-5 questions)**:

| Question | Fills Sections | Condition |
|----------|----------------|-----------|
| T1: What's the main technical approach? | Architecture Overview | Always |
| T2: What data storage is needed? | Data Storage, Schema | Always |
| T3: What external services/APIs are needed? | External Integrations | If dependencies exist |
| T4: Any performance or security requirements? | NFRs | For production |
| T5: What's the API contract? | API Contract | If exposing endpoints |

**Technology Selection** — suggest based on context, no forbidden list:

| Need | Common Options |
|------|---------------|
| Relational DB | PostgreSQL, MySQL, SQLite |
| Document DB | MongoDB, Firestore |
| Key-value cache | Redis, Memcached |
| Message queue | RabbitMQ, Kafka, SQS, Redis Streams |
| File storage | S3, GCS, local filesystem |
| Search | Elasticsearch, Typesense |

Select based on what's already in the project if possible.

### Step 6: Generate Technical Spec

Write `project/wip/[feature]/2-technical/spec.md` with sections:

~~~markdown
# Technical Specification: [Feature Name]

**Version**: 1.0
**Status**: Draft
**Created**: YYYY-MM-DD

## Architecture Overview
[System design, component interaction, patterns used]

## API Contract

### POST /[endpoint]
**Description**: [what it does]
**Auth**: [required/not required]

**Request**:
```json
{
  "field": "type - description"
}
```

**Response (200)**:
```json
{
  "result": "type - description"
}
```

**Error Responses**:
| Code | Error | Description |
|------|-------|-------------|
| 400 | INVALID_INPUT | [description] |

## Data Model & Storage

> [Key entities and relationships]

### Table: [name]
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |

## External Integrations

### [Service Name]
- **Purpose**: [why we use it]
- **Auth**: [how we authenticate]
- **Failure handling**: [retry/fallback strategy]

## Non-Functional Requirements

- **Performance**: [response time targets]
- **Security**: [auth requirements, data sensitivity]
- **Scalability**: [expected load]

## Implementation Notes

[Key decisions, patterns to follow, gotchas]
~~~

### Step 7: Review & Approve Technical Spec

Show spec to user and use AskUserQuestion:
- "Technical spec ready. Approve?"
- Options: "Approve" / "Revise section X" / "Needs more detail"

On approval:
1. Update `meta.md`:
   ```yaml
   stages:
     technical:
       status: approved        # MUST be exactly "approved" — same constraint as functional
       approved_at: YYYY-MM-DD
   Current Stage: tasks
   ```
2. Offer next step: `/project.plan`

---

## `--iterate` Flag

Refine an approved spec:

1. Show diff preview of proposed change
2. Use AskUserQuestion: "Apply this change?" → Options: "Apply" / "Cancel"
3. If approved: update spec file
4. Evaluate if re-approval is required (see below)

**Re-approval required** (significant change) when the change affects any of:
- Acceptance criteria (added, removed, or changed)
- API contract (new endpoint, changed request/response schema)
- Data model (new table, changed fields)
- Out of scope definition

**Re-approval flow** (when required):
1. Show only the modified sections (not the full spec)
2. Use AskUserQuestion: "These changes affect [section]. Re-approve spec?"
   - Options: "Re-approve" / "Revert change" / "Edit further"
3. On re-approve: update `approved_at: YYYY-MM-DD` in `meta.md` (keep `status: approved`)
4. On revert: restore previous content, no meta.md change

**No re-approval needed** for: reformatting, clarifying wording, adding examples, fixing typos.

---

## `--include` Flag

Add external context to spec:

```bash
/project.spec functional --include "See API docs at ./docs/api.md"
```

The agent reads the referenced file and incorporates relevant information.

---

## `--summary` Flag

Show compact spec overview without full content:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 Spec Summary: user-auth
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Functional: ✅ Approved
  • 3 user stories, 8 acceptance criteria
  • Scope: Login, registration, password reset
  • Out of scope: OAuth (future)

Technical: 🔄 In progress
  • Approach: JWT + refresh tokens
  • Storage: PostgreSQL (users table)
  • API: 4 endpoints

Next: Complete technical spec → /project.spec technical
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Lite Template Workflow

When `template_mode: lite` (from `--lite` in `/project.start`), skip Steps 2-7 and follow this condensed workflow:

1. **Interview** (3 questions max): Problem, user actions, technical approach
2. **Generate** single `project/wip/[feature]/spec.md` with combined content (~80 lines max)
3. **Approve** once — covers both functional and technical
4. **Update meta.md**: set both `functional.status: approved` and `technical.status: approved`, `Current Stage: tasks`

**Combined file**: `project/wip/[feature]/spec.md` (NOT inside `1-functional/` or `2-technical/`)

When reading specs later (in plan/build/check), if `template_mode == "lite"`, read from `project/wip/[feature]/spec.md` instead of the two separate files.

---

## AI Agent Instructions

### Help Flag Detection

**WHEN** the user runs `/project.spec help`:
1. Output ONLY the "Quick Help" section
2. Do NOT execute spec logic
3. Keep response concise (~15 lines)

### Key Rules

1. **Detect phase first** — Always read meta.md before starting
2. **Gap-driven questions only** — Ask what's relevant to the feature type, not a generic questionnaire
3. **Never skip completeness check** — Always verify data origins before generating spec
4. **Show spec before approving** — Never auto-approve without user confirmation (except express mode)
5. **Update meta.md on approval** — Stage transitions must be recorded
6. **--iterate shows diff** — Always preview before applying changes

---

## Related Commands

- `/project.start` — Initialize feature before speccing
- `/project.plan` — Generate tasks after spec approval
- `/project.check --sync` — Validate spec-code consistency
- `/project.import` — Import external specs into a feature

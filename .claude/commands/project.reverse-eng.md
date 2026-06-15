# Command: /project.reverse-eng

**Description**: Reverse engineer an existing codebase to generate specs for spec-driven evolution.

**Usage**:
- `/project.reverse-eng` → Analyze current directory
- `/project.reverse-eng [path]` → Analyze specific path
- `/project.reverse-eng --focus api,database` → Focus on specific areas

---

## Quick Help

> `/project.reverse-eng help` → Shows this summary

**Syntax**: `/project.reverse-eng [path] [flags]`

| Flag | Description |
|------|-------------|
| (none) | Analyze current directory |
| `[path]` | Analyze specific path |
| `--focus <component>` | Deep-dive into specific component, enriching existing specs |

**Note on `--focus`**: This flag enriches existing specs with more detail about a specific component.
It does NOT create separate spec files — it updates `functional-spec.md` and `technical-spec.md` directly.

Use cases:
- General extraction first, then `--focus PaymentService` for more detail
- Re-extract specific component that was too shallow
- Add detail to existing brownfield specs

**Examples**:
```bash
/project.reverse-eng                         # Analyze current directory
/project.reverse-eng ./src                   # Analyze specific path
/project.reverse-eng --focus PaymentService  # Deep-dive into PaymentService
```

---

## First Step: Mode Selection (MANDATORY)

> **CRITICAL**: Before ANY extraction work, ALWAYS present mode selection to user.

```
┌─────────────────────────────────────────────────────────────────┐
│  /project.reverse-eng - Mode Selection                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Detected state:                                                 │
│  • project/extracted/ exists: [YES/NO]                           │
│  • project/specs/ exists: [YES/NO]                               │
│                                                                  │
│  Select mode:                                                    │
│  1. FULL EXTRACTION - Complete analysis from scratch             │
│  2. UPDATE MODE - Re-analyze and merge with existing specs       │
│  3. VIEW STATUS - Show current extraction summary                │
│                                                                  │
│  [If project/specs/ exists but project/extracted/ doesn't]:      │
│  4. ENHANCE SPECS - Add missing details to existing specs        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Use AskUserQuestion with these options ALWAYS at start.**

### Mode Behavior

| Mode | Condition | Behavior |
|------|-----------|----------|
| **FULL EXTRACTION** | Any state | Delete existing `project/extracted/`, create fresh, run all phases |
| **UPDATE MODE** | `project/extracted/` exists | Re-run extraction, compare diffs, update ALL files |
| **UPDATE MODE + --focus** | `project/extracted/` exists + `--focus` | Enrich existing specs with focused component detail |
| **VIEW STATUS** | `project/extracted/` exists | Show summary, no changes |
| **ENHANCE SPECS** | `project/specs/` exists, `project/extracted/` missing | Analyze code to add missing details |

### `--focus` Behavior (CRITICAL)

> **RULE**: `--focus` ALWAYS updates base spec files. It NEVER creates `-{component}.md` suffixed files.

| Scenario | Files Updated |
|----------|---------------|
| Fresh repo + `--focus ComponentA` | Creates `functional-spec.md`, `technical-spec.md` |
| Existing specs + `--focus ComponentB` | Updates existing `functional-spec.md`, `technical-spec.md` |
| Re-run with same `--focus` | Updates same files (UPDATE MODE) |
| Re-run with different `--focus` | Enriches same files with new component detail |

**What `--focus` does**:
1. Extracts deep detail about the specified component
2. **Merges** that detail into existing specs (or creates if none exist)
3. Marks sections as `[Focused: ComponentName]` for traceability

**What `--focus` does NOT do**:
- Create `functional-spec-{component}.md` files
- Create parallel spec versions
- Delete existing content from other components

### Anti-pattern: No `-UPDATED` Suffixes

```
❌ WRONG:
project/specs/
├── functional-spec.md           # Old version
├── functional-spec-UPDATED.md   # New version

✅ CORRECT:
project/specs/
├── functional-spec.md           # Replaced with new version
```

---

## Purpose

Performs comprehensive reverse engineering in **seven phases** (0-6):

| Phase | Name | Purpose |
|-------|------|---------|
| **0** | Repository State Detection | Identify existing specs/frameworks before extraction |
| **1** | Code Extraction | Extract data from codebase |
| **2** | Basic Cross-Validation | Compare sources, calculate coverage |
| **3** | Deep Cross-Validation | Field-by-field comparison, detect undocumented behavior |
| **4** | Synthesis | Generate specs with confidence indicators |
| **5** | Generate PATTERNS.md | Extract established patterns from codebase |
| **6** | Spec Promotion | Copy specs to `project/specs/` for brownfield mode |

**Use Cases**:
1. **Onboarding**: Document existing system for new contributors
2. **Evolution**: Prepare system for spec-driven feature development
3. **Migration**: Create specs before technology migration
4. **Compliance**: Generate architecture documentation

---

## Output Structure (CANONICAL)

> **CRITICAL**: This is the ONLY valid output structure.

```
project/
├── extracted/                        # WORKING directory
│   ├── raw/                          # Phase 0-1: Source data
│   │   ├── existing-specs/           # Created if any specs detected
│   │   │   └── DETECTION_REPORT.md
│   │   └── code-analysis/            # Always created
│   │       ├── architecture/
│   │       ├── api-specs/
│   │       ├── database/
│   │       └── deployment/
│   │
│   ├── DOCUMENTATION_GAPS.md         # Phase 2: Coverage report
│   ├── DISCREPANCIES_REPORT.md       # Phase 3: Field-level validation
│   ├── functional-spec.md            # Phase 4: Synthesized spec
│   ├── technical-spec.md             # Phase 4: Synthesized spec
│   ├── PATTERNS.md                   # Phase 5: Discovered patterns
│   └── README.md                     # Index and metadata
│
├── specs/                            # FINAL location (Phase 6)
│   ├── functional-spec.md            # ← PROMOTED from extracted/
│   └── technical-spec.md             # ← PROMOTED from extracted/
│
└── PATTERNS.md                       # ← PROMOTED from extracted/
```

**KEY POINTS**:
- `project/extracted/` = Working directory with all extraction artifacts
- `project/specs/` = Final location for global specs (created in Phase 6)
- Phase 6 **PROMOTES** specs from `extracted/` to `specs/`
- **NEVER write files to `project/` root except `PATTERNS.md`**

---

## Directory Creation (MANDATORY)

Before writing ANY file, ensure parent directories exist:

```bash
mkdir -p project/extracted/raw/existing-specs/
mkdir -p project/extracted/raw/code-analysis/architecture/
mkdir -p project/extracted/raw/code-analysis/api-specs/
mkdir -p project/extracted/raw/code-analysis/database/
mkdir -p project/extracted/raw/code-analysis/deployment/
mkdir -p project/specs/
mkdir -p project/wip/
```

---

## Output Discipline

Never create ad-hoc files outside the canonical structure. If unsure where something goes: use cases → `functional-spec.md`, technical analysis → `technical-spec.md`, patterns → `PATTERNS.md`, gaps → `DOCUMENTATION_GAPS.md`. The only file allowed at `project/` root is `PATTERNS.md`.

---

## Seven-Phase Workflow

### Phase 0 Pre-step: Ensure Standard Structure (MANDATORY)

```bash
if [ ! -d "project" ]; then
    mkdir -p project/specs
    mkdir -p project/extracted/raw/code-analysis
    mkdir -p project/wip
    echo "✅ Created project/ directory structure."
fi
```

---

### Phase 0: Repository State Detection

Identify if the repository already has specifications or follows an established spec framework.

**Detection Matrix**:

| Framework | Detection Patterns | Confidence |
|-----------|-------------------|------------|
| **Project SDD** | `project/specs/*.md`, `project/wip/*/spec.md` | 🟢 High |
| **OpenAPI/Swagger** | `openapi.yaml`, `swagger.json` | 🟢 High |
| **ADR/RFC** | `docs/adr/`, `docs/rfc/` | 🟡 Medium |
| **Claude Code** | `CLAUDE.md`, `.claude/settings.json` | 🟡 Medium |
| **Plain Docs** | `ARCHITECTURE.md`, `DESIGN.md`, `README.md` | 🟡 Medium |
| **Angular** | `angular.json`, `*.module.ts`, `*.routing.ts` | 🟢 High |
| **C#/.NET** | `*.csproj`, `*.sln`, `Program.cs`, `Startup.cs` | 🟢 High |
| **Other spec frameworks** | Custom detection based on file patterns | 🟡 Medium |

**Optimization Strategies**:

| Strategy | When to Use | Expected Speedup |
|----------|-------------|------------------|
| **INCREMENTAL** | SDD framework detected | 60-80% faster |
| **API_ANCHORED** | OpenAPI detected | 30-50% faster |
| **ASSISTED** | ADR, plain docs | 10-20% faster |
| **FULL** | No frameworks detected | Baseline |

**Output**: `DETECTION_REPORT.md`

```markdown
# Detection Report

**Generated**: [ISO-8601 timestamp]
**Repository**: [repo name]

## Extraction Scope

**Mode**: [FULL | UPDATE | ENHANCE]
**Focus Component**: [component name if --focus used, "Full Repository" otherwise]

## Detected Frameworks

| Framework | Confidence | Files Found |
|-----------|------------|-------------|
| [name] | 🟢 High / 🟡 Medium | [file list] |

## Selected Strategy

**Strategy**: [INCREMENTAL | API_ANCHORED | ASSISTED | FULL]
**Rationale**: [why this strategy was chosen]

## Extraction History

| Date | Mode | Focus | Summary |
|------|------|-------|---------|
| [ISO-8601] | [mode] | [component or "-"] | [brief description] |
```

---

### Phase 1: Code Extraction

Extract data from codebase. No interpretation, just facts.

**Step 1: Detect Stack**

Use the stack detection pattern from [`references/bash-patterns.md`](../references/bash-patterns.md#stack-detection).

**Step 2: Extract APIs**

| Language | Detection Pattern |
|----------|-------------------|
| Java | `@RestController`, `@GetMapping`, `@PostMapping`, etc. |
| Node.js | `router.get()`, `app.post()`, Express/Fastify routes |
| Go | `http.HandleFunc()`, Gin/Chi routes |
| Python | Flask/FastAPI routes, `@app.route()` |
| C#/.NET | `[ApiController]`, `[HttpGet]`, `[HttpPost]`, `[Route]`, `[HttpPut]`, `[HttpDelete]` |
| Angular | `HttpClient` calls in services, `Routes` array in routing modules, `@NgModule` imports |

**Step 3: Extract Data Models**

| Source | Pattern |
|--------|---------|
| Java | `@Entity`, `@Table`, class definitions |
| TypeScript | Interface/type definitions, DTO classes |
| Go | Struct definitions |
| Python | Dataclass, Pydantic models |
| C#/.NET | `[Table]`, `DbContext` entities, class definitions with `[Key]`/`[Column]`, EF Core migrations |
| Angular | `@Component`, `@Injectable` services, `interface`/`model` definitions, `*.model.ts` files |
| Database | Migration files, schema definitions |

**Step 4: Extract Actor Patterns**

| Actor Type | Detection Pattern |
|------------|-------------------|
| API Callers | Auth configurations, OpenAPI consumer tags |
| Message Consumers | Message broker subscribers |
| Scheduled Jobs | Cron configs, scheduled task annotations |
| External Integrations | HTTP client configs, external URLs |

**Step 5: Extract Architecture Patterns**

- Dependency injection wiring
- Middleware/interceptor chain
- Configuration files
- Deployment descriptors

**Delegate to Explore agent for large codebases** to preserve main context.

---

### Phase 2: Cross-Validation (Basic Coverage)

Compare **TWO sources** and generate initial coverage report.

```
┌─────────────────────────────────────────────────────────────────┐
│                    TWO-WAY CROSS-VALIDATION                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  existing-specs/ ───┐                                           │
│                     ├──► Compare EXISTENCE ──► Coverage %       │
│  code-analysis/ ────┘                                           │
│                                                                 │
│  Source Priority (for conflicts):                               │
│    1. CODE (source of truth)                                    │
│    2. existing-specs (pre-validated)                            │
└─────────────────────────────────────────────────────────────────┘
```

**Output**: `DOCUMENTATION_GAPS.md` with coverage percentages per category.

---

### Phase 3: Deep Cross-Validation (Field-by-Field)

**Validation Checks**:

| Check Type | What to Compare | Output |
|------------|-----------------|--------|
| **Entity Fields** | Existing spec schema vs code struct/class | Field diff table |
| **Endpoint Existence** | Spec routes vs code annotations | Missing routes list |
| **Enum Values** | Spec enum vs code enum/constants | Value diff |

**Output**: `DISCREPANCIES_REPORT.md` with prioritized action items.

---

### Phase 4: Synthesis with Confidence Indicators

Transform data into specs, marking the **origin** of each piece of information.

#### Confidence System

| Level | Icon | Meaning | Action |
|-------|------|---------|--------|
| **VERIFIED** | ✅✅ | Found in code + existing specs, fields MATCH | High confidence |
| **PARTIAL** | ✅⚠️ | Found in multiple sources, but fields DIFFER | Review diff first |
| **CODE_ONLY** | 🔸 | Found only in code (reliable, undocumented) | Consider documenting |
| **DOCS_ONLY** | ⚠️ | Found only in existing specs (NOT in code) | VERIFY before using |
| **UNKNOWN** | ❓ | Insufficient information | DO NOT USE without verification |

**Source Priority for Conflicts**:
1. **CODE** — Always the source of truth
2. **existing-specs** — Pre-validated, higher trust

> **CRITICAL**: When discrepancies are found between docs (README) and CODE, generated specs MUST reflect CODE reality.

**Generates**:
- `functional-spec.md` — From use cases, capabilities (with confidence)
- `technical-spec.md` — From architecture, APIs (with confidence)
- `DISCREPANCIES_REPORT.md` — Field-level validation results

#### Focused Extraction Merge Strategy

When `--focus <component>` is used with existing specs:

1. Load existing specs
2. Extract focused component detail
3. Merge strategy:

| Spec Section | Merge Behavior |
|--------------|----------------|
| **System Context** | Preserve existing, add focused component relationships |
| **Actors** | Preserve existing, add actors relevant to focused component |
| **Use Cases** | **ADD** detailed use cases for focused component with marker |
| **Data Models** | Preserve existing, expand models used by focused component |
| **API Endpoints** | Preserve existing, add detail for focused component endpoints |

4. Mark focused sections:
```markdown
### UC-005: Process Payment
<!-- Focused: PaymentService -->

[Detailed use case from focused extraction...]
```

---

### Phase 5: Generate PATTERNS.md

Extract established patterns from codebase for reuse across features.

**What qualifies as a pattern**: something that appears consistently in 2+ places in the codebase and represents a deliberate design decision — not accidental repetition.

**Pattern Categories**:
- Error handling patterns
- API response formats
- Authentication/authorization patterns
- Data validation approaches
- Testing patterns

**Entry format** (one section per pattern):

```markdown
## [Pattern Name]

**Category**: [Error handling / API / Auth / Validation / Testing]
**Found in**: [file1.ts, file2.ts, ...]

### Description
[What this pattern does and why it's used]

### Example
[Minimal code example extracted from codebase]

### When to use
[Condition or context where this pattern applies]
```

---

### Phase 6: Spec Promotion

Before promoting, check if `project/specs/` already has content:

```bash
specs_exist=false
if [ -f "project/specs/functional-spec.md" ] || [ -f "project/specs/technical-spec.md" ]; then
    specs_exist=true
fi
```

**If `specs_exist = true`** (UPDATE MODE or ENHANCE):

Show a warning and use AskUserQuestion before overwriting:

```
⚠️  Existing specs found in project/specs/:
   • functional-spec.md (last modified: [date])
   • technical-spec.md  (last modified: [date])

Overwriting will replace manual edits made outside of reverse-eng.
```

Options:
1. **"Overwrite"** — Replace with newly extracted specs (destructive)
2. **"Backup and overwrite"** — Copy existing to `project/specs/backup_YYYYMMDD/` first, then overwrite (recommended)
3. **"Skip"** — Keep existing specs, do not promote

**If `specs_exist = false`** (FULL EXTRACTION on clean project):

Promote directly with no confirmation needed:

```bash
# Promote specs to final location
cp project/extracted/functional-spec.md project/specs/functional-spec.md
cp project/extracted/technical-spec.md project/specs/technical-spec.md
cp project/extracted/PATTERNS.md project/PATTERNS.md
```

---

## Output Example

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 REVERSE ENGINEERING: payment-service
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Mode: FULL EXTRACTION
Strategy: FULL (no existing frameworks detected)

Phase 0: Detecting existing specs... ✅
Phase 1: Extracting from codebase...
  📂 Stack: Node.js (TypeScript)
  📡 APIs: 12 endpoints found
  🗄️ Models: 8 entities found
  🔗 External: 3 integrations found
  ✅ Extraction complete

Phase 2: Cross-validation...
  Coverage: 85% documented
  Gaps: 3 undocumented endpoints

Phase 3: Deep validation...
  Field mismatches: 2
  Phantom docs: 1

Phase 4: Synthesizing specs...
  ✅ functional-spec.md generated
  ✅ technical-spec.md generated

Phase 5: Generating PATTERNS.md...
  Found 4 patterns

Phase 6: Promoting specs...
  ✅ Specs promoted to project/specs/

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Reverse Engineering Complete
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📁 Output:
  project/specs/functional-spec.md
  project/specs/technical-spec.md
  project/PATTERNS.md
  project/extracted/ (full extraction data)

⚠️  Review recommended:
  • 3 DOCS_ONLY items (may be outdated)
  • 2 field mismatches need resolution
  • 3 undocumented endpoints flagged as CODE_ONLY

Next: /project.spec to review and refine extracted specs
      /project.start to begin feature development
```

---

## AI Agent Instructions

### Help Flag Detection

**WHEN** the user runs `/project.reverse-eng help`:
1. Output ONLY the "Quick Help" section (not full documentation)
2. Do NOT execute reverse-eng logic
3. Keep response concise (~15 lines)

### Key Rules

1. **ALWAYS ask mode first** — Present mode selection before any extraction
2. **Code is the source of truth** — Specs and docs are secondary
3. **No `-UPDATED` suffixes** — Replace files directly, never create side-by-side versions
4. **Delegate exploration for large codebases** — Use Explore agent to preserve context
5. **Mark confidence levels** — Every item in specs must have a confidence indicator
6. **Promote to specs/** — Phase 6 is mandatory, not optional
7. **Focus merges, not replaces** — `--focus` enriches existing specs

---

## Related Commands

- `/project.spec` — Review and refine extracted specs
- `/project.start` — Begin feature development using extracted specs
- `/project.import` — Import specific spec files into a feature

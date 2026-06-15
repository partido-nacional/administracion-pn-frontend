# Command: /project.import

**Description**: Import existing specifications (OpenAPI, architecture docs) into a new feature

**Usage**:
- `/project.import [path]` → Import specs from path
- `/project.import` → Interactive mode, prompts for path

---

## Quick Help

> `/project.import help` → Shows this summary

**Syntax**: `/project.import [path] [flags]`

| Flag | Description |
|------|-------------|
| (none) | Interactive mode, prompts for path |
| `[path]` | Import specs from specific path |
| `--from <url>` | Import from URL |
| `--type <T>` | Force type (openapi/markdown) |

**Supported**: OpenAPI 3.x, Markdown, JSON Schema

**Example**:
```bash
/project.import ./api-spec.yaml    # Import OpenAPI spec
```

---

## Purpose

Import existing specifications (OpenAPI specs, architecture documents, PRDs) into the project SDD framework, pre-populating feature structure.

**Greenfield** = starting a new feature from scratch (no prior specs).
**Brownfield** = working on an existing system that already has documentation, specs, or code — you import those artifacts to bootstrap the SDD structure rather than writing everything from scratch.

---

## Supported Formats

| Format | Extensions | Auto-Detection |
|--------|------------|----------------|
| OpenAPI 3.x | `.yaml`, `.yml`, `.json` | Yes (looks for `openapi:`) |
| Markdown | `.md` | Yes |
| JSON Schema | `.json` | Yes (looks for `$schema`) |
| Plain text | `.txt` | Manual classification |

---

## Workflow

### 1. Detect Import Source

Resolve the input:

- **File path** → read directly
- **Directory** → scan for supported files, show list, ask which to import
- **URL** (`--from <url>`) → download content to a temp file, then process as file

```bash
# URL import
if [[ "$INPUT" == http* ]]; then
    curl -fsSL "$INPUT" -o /tmp/project_import_$(date +%s)
    SOURCE="/tmp/project_import_..."
fi
```

### 2. Analyze and Classify Specs

Auto-detects:
- OpenAPI specs (looks for `openapi:` or `swagger:` key)
- Functional documentation (PRDs, requirements — markdown with user stories, acceptance criteria)
- Technical documentation (architecture, design docs)
- Configuration files (skipped)

### 3. Get Feature Information

Prompts for feature name (kebab-case).

### 4. Assign Feature Number

Read and increment `project/.feature-counter` exactly as `/project.start` does:

```bash
counter_file="project/.feature-counter"
last_num=$(cat "$counter_file" 2>/dev/null || echo "0")
next_num=$(printf "%03d" $((last_num + 1)))
echo "$((last_num + 1))" > "$counter_file"
```

### 5. Determine Mode

- If `project/specs/` exists → **Brownfield mode**: offer to also copy imported specs to `project/specs/` as system-level specs
- If not → **Greenfield mode**: create feature only

**Brownfield mode** — after creating the feature structure, use AskUserQuestion:
- "Also register imported specs as system-level specs in `project/specs/`?"
- Options: "Yes" / "No — feature only"
- If Yes: copy `functional-spec.md` and `technical-spec.md` to `project/specs/`

### 6. Import and Transform

- OpenAPI → Extracts endpoints and schemas into `2-technical/spec.md`
- PRD/Functional → Populates `1-functional/spec.md`
- Architecture → Merges into `2-technical/spec.md`

### 7. Create Feature Structure

Creates standard folder structure and **initializes `meta.md`**:

```bash
mkdir -p "project/wip/${next_num}-[feature-name]/1-functional"
mkdir -p "project/wip/${next_num}-[feature-name]/2-technical"
mkdir -p "project/wip/${next_num}-[feature-name]/3-tasks"
```

`meta.md` initialized with:
```yaml
feature: [feature-name]
feature_number: [NNN]
project: [project-name]
created_at: YYYY-MM-DD
execution_mode: standard
template_mode: full
project_type:
  type: production
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

import_source: [path or url]
```

> **Note**: Stage starts at `functional` regardless of what was imported — imported content pre-populates the spec templates, but the user must review and approve each spec via `/project.spec` before advancing.

---

## Output Example

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📥 Import External Specs
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Source: ./docs/

🔍 Scanning directory...

Found 4 files:
  1. [OpenAPI] api-spec.yaml (Orders API)
  2. [Technical] architecture.md
  3. [Functional] requirements.md
  4. [Config] database.yaml (skip)

[AskUserQuestion: "Import files 1-3?"] → User: Yes

Creating feature: orders-integration

✅ Import Complete!

📁 Feature created: project/wip/orders-integration/

Mode: greenfield

Imported:
  OpenAPI specs: 1
  Documentation: 2

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[AskUserQuestion: "Specs imported. Review and continue?"]
Options:
  ○ /project.spec (Recommended) - Review and complete specs
  ○ /project.check - View imported structure
  ○ Other...

On selection → Invoke corresponding command
```

---

## Examples

### Example 1: Import Single OpenAPI Spec

```
User: /project.import ./api/orders.yaml

AI: 📥 Importing specifications...

📄 Detected: OpenAPI 3.0.3 specification
   Title: Orders API
   Version: 2.1.0
   Endpoints: 12

Feature name: orders-api-integration

✅ Import complete!
```

### Example 2: Import Directory

```
User: /project.import ./docs/

AI: 🔍 Scanning directory...

Found 3 spec files.
Import all? [Y/n/select]
```

---

## AI Agent Instructions

### Help Flag Detection

**WHEN** the user runs `/project.import help`:
1. Output ONLY the "Quick Help" section (not full documentation)
2. Do NOT execute import logic
3. Keep response concise (~15 lines)

### Key Behaviors

1. **Auto-detect spec types** — Don't ask user what type each file is
2. **Preserve original content** — Don't modify imported content
3. **Add structure** — Wrap in proper project SDD structure
4. **Validate after import** — Check completeness
5. **Interactive next steps** — Always offer next action after import completes

### Interactive Next Steps (After Import Complete)

> **MANDATORY**: Always offer interactive selection after import completes.

**Use AskUserQuestion**:
- Question: "Specs imported. Review and continue?"
- Header: "Next"
- Options:
  1. "/project.spec (Recommended)" — Description: "Review and complete specs"
  2. "/project.check" — Description: "View imported structure"

**On user selection**:

| Selection | Action |
|-----------|--------|
| /project.spec (Recommended) | Execute `/project.spec` command |
| /project.check | Execute `/project.check` command |
| Other | User types custom input |

---

## Related Commands

- `/project.start` — Start new feature
- `/project.spec` — Continue after import
- `/project.reverse-eng` — Full codebase reverse engineering

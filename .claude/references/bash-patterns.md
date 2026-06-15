# Bash Patterns Reference

Shared bash patterns used across project commands. Import by reference — don't copy/paste.

---

## Feature Counter

**Always use this pattern when reading or writing `.feature-counter`.**

```bash
COUNTER_FILE="project/.feature-counter"

# Read current value (default 0 if missing)
last_num=$(cat "$COUNTER_FILE" 2>/dev/null || echo "0")
next_num=$(printf "%03d" $((last_num + 1)))

# Write back immediately after reading — keep the window between read and write as small as possible
echo "$((last_num + 1))" > "$COUNTER_FILE"
```

**Collision note**: This is not atomic. In single-user, single-agent sessions (the normal case) this is safe. In collaborative environments where two agents could run `/project.start` or `/project.import` simultaneously, duplicate numbers are possible. If `/project.list` detects duplicates, use `--fix-conflicts` to resolve them. Never decrement the counter — even cancelled or errored features keep their number.

---

## Project Directory Guard

**Run this first in any command that requires an existing SDD project.**
If `project/` doesn't exist, the command has no data to operate on.

```bash
if [ ! -d "project/wip" ]; then
    echo "❌ No SDD project found in this directory."
    echo "   To start using the SDD framework: /project.start \"your first feature\""
    echo "   To import existing work:           /project.import <path>"
    echo "   To reverse-engineer existing code: /project.reverse-eng"
    exit 1
fi
```

**Commands that MUST run this guard before any other logic**:
`project.list`, `project.check`, `project.build`, `project.fix`, `project.finish`,
`project.plan`, `project.spec`, `project.rollback`, `project.cancel`, `project.backlog`

**Commands exempt** (they create or populate the structure):
`project.start`, `project.import`, `project.reverse-eng`, `project.go`

---

## Phase Detection

Read the current stage from meta.md:

```bash
# Always run Project Directory Guard first (see above)
# Then resolve feature path (see Feature Folder Resolution below)

# Read current stage
current_stage=$(grep "Current Stage:" "$FEATURE_PATH/meta.md" | cut -d: -f2 | tr -d ' ')
# Values: functional | technical | tasks | implementation
```

**Stage → Phase mapping**:

| Stage | Phase | Meaning |
|-------|-------|---------|
| `functional` | 1 | Writing functional spec |
| `technical` | 2 | Writing technical spec |
| `tasks` | 3 | Task planning |
| `implementation` | 4 | Building code |

---

## Feature Folder Resolution

Use this before any operation that needs the feature path. Supports bare name, number, or full numbered name.

### When a feature argument is given

```bash
# Collect all matches
MATCHES=$(find project/wip -maxdepth 1 -type d -name "*[feature-name]*" 2>/dev/null)
MATCH_COUNT=$(echo "$MATCHES" | grep -c . 2>/dev/null || echo 0)

if [ "$MATCH_COUNT" -eq 0 ]; then
    echo "❌ Feature '[feature-name]' not found in project/wip/."
    echo "   Use /project.list to see active features."
    exit 1
elif [ "$MATCH_COUNT" -eq 1 ]; then
    FEATURE_PATH="$MATCHES"
else
    # Multiple matches — never pick silently, always ask
    echo "⚠️  Multiple features match '[feature-name]':"
    echo "$MATCHES" | nl -w2 -s'. '
    # Use AskUserQuestion to let user pick
    # Present numbered list, set FEATURE_PATH to chosen entry
fi

FOLDER_NAME=$(basename "$FEATURE_PATH")
echo "✓ Using: $FEATURE_PATH"
```

### When no argument is given (current feature)

Resolve in this strict order — never guess, never pick silently:

1. Only one folder in `project/wip/` → use it
2. Current git branch matches `feature/[name]` → use that feature
3. Multiple folders, no clear match → use AskUserQuestion with a numbered list of options

---

## Stack Detection

Detect the technology stack from project files:

```bash
if [ -f "pom.xml" ]; then
    stack="java-maven"
elif [ -f "build.gradle" ]; then
    stack="java-gradle"
elif [ -f "go.mod" ]; then
    stack="go"
elif find . -maxdepth 2 -name "*.csproj" 2>/dev/null | grep -q "."; then
    stack="dotnet"
elif find . -maxdepth 2 -name "*.sln" 2>/dev/null | grep -q "."; then
    stack="dotnet"
elif [ -f "angular.json" ]; then
    stack="angular"
elif [ -f "package.json" ]; then
    stack="node"
elif [ -f "requirements.txt" ] || [ -f "pyproject.toml" ]; then
    stack="python"
else
    stack="unknown"
fi
echo "✓ Stack detected: $stack"
```

---

## Build & Test Commands by Technology

Used in plan, build, check, and finish to run quality gates:

| Technology | Build | Test | Lint |
|------------|-------|------|------|
| Java/Maven | `mvn compile` | `mvn test` | `mvn checkstyle:check` |
| Java/Gradle | `./gradlew build` | `./gradlew test` | `./gradlew checkstyleMain` |
| Kotlin/Gradle | `./gradlew build` | `./gradlew test` | `./gradlew ktlintCheck` |
| Node.js | `npm run build` | `npm test` | `npm run lint` |
| Go | `go build ./...` | `go test ./...` | `golangci-lint run` |
| Python | N/A | `pytest` | `flake8` or `ruff` |
| Ruby | N/A | `bundle exec rspec` | `bundle exec rubocop` |
| Rust | `cargo build` | `cargo test` | `cargo clippy` |
| Angular | `ng build` | `ng test --watch=false` | `ng lint` |
| C#/.NET | `dotnet build` | `dotnet test` | `dotnet format --verify-no-changes` |

**Unknown stack fallback**: If the stack is not in this table, check `package.json` for a `test` script, or look for a `Makefile` with a `test` target. If neither exists, report: "Stack not recognized — run tests manually and confirm they pass before continuing."

**Validation flow**: Build → Test → Lint. Fail at any step = STOP and use `/project.fix`.

---

## Secrets Scan

Quick check for hardcoded credentials:

```bash
grep -rEn "(password|api_key|secret|token|credential)\s*[:=]\s*[\"'][^\"']+[\"']" \
  --include="*.java" --include="*.go" --include="*.ts" --include="*.js" \
  --include="*.py" --include="*.yml" --include="*.yaml" \
  --include="*.cs" --include="*.csproj" --include="*.json" \
  src/ && echo "❌ BLOCKER: Hardcoded secrets found!" || echo "✅ No secrets detected"
```

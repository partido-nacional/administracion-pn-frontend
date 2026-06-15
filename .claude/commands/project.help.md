# Command: /project.help

**Description**: Show all available commands with descriptions and quick reference

**Usage**: `/project.help`

---

## Quick Help

> `/project.help` → Shows this summary

**Syntax**: `/project.help [command]`

| Argument | Description |
|----------|-------------|
| (none) | List all commands with descriptions |
| `[command]` | Show quick help for a specific command |

**Examples**:
```bash
/project.help               # List all commands
/project.help build         # Quick help for /project.build
/project.help spec          # Quick help for /project.spec
```

---

## Purpose

Central reference for all available commands in the SDD framework.
Use `/project.help` when you don't know which command to use next,
or `/project.help [command]` as a shortcut instead of `/project.[command] help`.

---

## Output

### Default (no arguments)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📖 Project SDD — Command Reference
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

── Feature Lifecycle ──────────────────────

  /project.start      Initialize a new feature (scaffolding, branch, meta.md)
  /project.spec       Write functional and technical specifications
  /project.plan       Generate and approve task list from specs
  /project.build      Implement tasks with quality gates
  /project.finish     Validate, archive, and complete a feature

── Shortcuts ──────────────────────────────

  /project.go         Express mode: runs start → spec → plan → build → finish
                      in one command with minimal interaction (3–5 questions)

── Status & Diagnostics ───────────────────

  /project.list       List all features (WIP + completed) with stats
  /project.check      Feature status, consistency check (--sync), compliance (--compliance)

── Fixes & Recovery ───────────────────────

  /project.fix        Fix errors with horizontal propagation across all layers
  /project.cancel     Cancel a feature and archive it for potential future resumption

── Backlog ────────────────────────────────

  /project.backlog    Manage technical backlog (TODOs, Technical Debt, Ideas)

── Advanced ───────────────────────────────

  /project.import     Import an existing spec or codebase into a feature
  /project.reverse-eng  Reverse engineer an existing codebase to generate specs

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Tip: run /project.help [command] for details on any command
     e.g. /project.help build
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### With argument: `/project.help [command]`

Delegates to the target command's Quick Help section.
Equivalent to running `/project.[command] help`.

```
/project.help build
→ same output as /project.build help
```

---

## Typical Workflow

For new users, the standard feature development flow is:

```
1. /project.start "feature description"   ← Initialize
2. /project.spec                          ← Write specs
3. /project.plan                          ← Plan tasks
4. /project.build                         ← Implement
5. /project.finish                        ← Archive
```

Or in one command: `/project.go "feature description"`

---

## AI Agent Instructions

### Help Flag Detection

**WHEN** the user runs `/project.help help`:
1. Output ONLY the "Quick Help" section
2. Keep response concise (~10 lines)

### With argument

**WHEN** the user runs `/project.help [command]`:
1. Load the corresponding `commands/project.[command].md`
2. Output ONLY its "Quick Help" section
3. Do NOT execute any logic from that command

### Key Rules

1. **Read-only** — This command never modifies any file
2. **Delegate with argument** — `/project.help build` is identical to `/project.build help`
3. **Always show tip** — Remind the user they can drill into any command

---

## Related Commands

All commands in the SDD framework. Start with `/project.start` or `/project.go`.

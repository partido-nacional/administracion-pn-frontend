# Backlog File Format

Canonical format for `project/backlog.md`. Used by `/project.backlog` to read and write entries.

---

## File Header

```markdown
# Technical Backlog

> Items captured during development. Use `/project.backlog` to manage.

**Last Updated**: YYYY-MM-DD
**Total Items**: N (X TODO, Y DEBT, Z IDEA)
```

---

## TODO Entry

```markdown
## 📋 TODOs

### TODO-001: [Title]
- **Priority**: High | Medium | Low
- **Status**: pending | in-progress | resolved
- **Created**: YYYY-MM-DD
- **Origin**: feature/[feature-name] (during /project.build)
- **Context**: [Why this is needed]
- **Affected Files**: src/path/to/file.ts
- **Complexity**: S | M | L | XL
```

---

## DEBT Entry

```markdown
## 🔧 Technical Debt

### DEBT-001: [Title]
- **Priority**: High | Medium | Low
- **Status**: pending | in-progress | resolved
- **Created**: YYYY-MM-DD
- **Origin**: feature/[feature-name]
- **Context**: [What the debt is and why it was incurred]
- **Affected Files**: src/path/to/file.ts
- **Complexity**: S | M | L | XL
- **Risk if Ignored**: [What happens if this is never addressed]
```

---

## IDEA Entry

```markdown
## 💡 Ideas

### IDEA-001: [Title]
- **Priority**: High | Medium | Low
- **Status**: pending | in-progress | resolved
- **Created**: YYYY-MM-DD
- **Origin**: feature/[feature-name]
- **Context**: [What the idea is and why it might be valuable]
- **Potential Impact**: Performance | UX | Maintainability | Security | Other
- **Notes**: [Additional details, trade-offs, alternatives]
```

---

## Resolved Entry

```markdown
## ✅ Resolved Items

### TODO-002: [Title]
- **Priority**: Medium
- **Status**: resolved
- **Created**: YYYY-MM-DD
- **Resolved**: YYYY-MM-DD
- **Resolution**: Completed | Won't Do | Duplicate
- **Resolved In**: feature/[feature-name]
```

---

## ID Conventions

- Format: `{TYPE}-{NNN}` — e.g., `TODO-001`, `DEBT-002`, `IDEA-003`
- Auto-increment: next ID = max existing ID for that type + 1
- IDs are never reused, even after resolution

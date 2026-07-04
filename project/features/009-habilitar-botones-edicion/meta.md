# Feature Metadata
feature: habilitar-botones-edicion
feature_number: 009  # renumerado de 005 al mergear develop (colisión con 005-adhesion-baja-fecha-salida)
project: administracion-pn-frontend
created_at: 2026-07-04
execution_mode: standard  # standard | express | expert
template_mode: full       # full | lite
project_type:
  type: production        # prototype | mvp | production
vision_prompt_shown: false
cross_repo: administracion-pn-backend  # RESUELTO — endpoints POST/PUT implementados; ver docs/INTEGRACION-FRONTEND.md (§7.9, §7.10)

# Alcance (decidido 2026-07-04): 4 botones de edición colgados + botón de alta para esas mismas 4 entidades
# (Convencional nacional, Lista ODN/ODD, Organismo estatal/partidario, InfoOrganización). Solo alta+edición
# (sin baja). Reutilizar patrón visual de agrupaciones.component.ts. Referencia backend: docs/INTEGRACION-FRONTEND.md

Current Stage: done
completed_at: 2026-07-04
commit: 0409200

stages:
  functional:
    status: completed
    created_at: 2026-07-04
    completed_at: 2026-07-04
  technical:
    status: completed
    completed_at: 2026-07-04
  tasks:
    status: completed
    completed_at: 2026-07-04
    execution_strategy: batched
  implementation:
    status: completed
    completed_at: 2026-07-04
    completed_tasks: 10
    total_tasks: 10

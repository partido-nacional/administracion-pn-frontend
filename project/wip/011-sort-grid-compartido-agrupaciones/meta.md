# Feature Metadata
feature: sort-grid-compartido-agrupaciones
feature_number: 011
project: administracion-pn-frontend
created_at: 2026-07-04
execution_mode: standard  # standard | express | expert
template_mode: full       # full | lite
project_type:
  type: production        # prototype | mvp | production
vision_prompt_shown: false

# Origen: ítem 24 — "Lógica de sort/filtro repetida entre tres componentes" (agrupaciones).
# Se encontraron 4 componentes con el toggle de sort duplicado; se refactorizan los 4.

Current Stage: implementation

stages:
  functional:
    status: complete
    created_at: 2026-07-04
  technical:
    status: complete
  tasks:
    status: skipped   # implementación directa con specs; sin /project.plan
  implementation:
    status: complete
    completed_tasks: 1
    total_tasks: 1
    notes: |
      Nuevo helper shared/grid/grid-sort.ts (toggleSort + sortArrow) + spec.
      Refactorizados los 4 componentes de agrupaciones (onSort/indicador y
      sortBy/arrow) para usarlo, sin cambio de comportamiento ni de template.
      Verificado: ng build OK, ng test 109/109 (ChromeHeadless).

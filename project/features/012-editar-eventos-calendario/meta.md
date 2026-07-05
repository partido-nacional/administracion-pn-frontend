# Feature Metadata
feature: editar-eventos-calendario
feature_number: 012
project: administracion-pn-frontend
created_at: 2026-07-04
execution_mode: standard  # standard | express | expert
template_mode: full       # full | lite
project_type:
  type: production        # prototype | mvp | production
vision_prompt_shown: false

# Cross-repo: lado frontend del pedido "eventos de calendario editables + errores
# descriptivos". El lado backend (validación/errores) es la feature backend 002
# (validacion-eventos-calendario).
cross_repo:
  sibling_backend: 002-validacion-eventos-calendario

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
      Modal 'editar' + abrirEditar/guardarEdicion en dashboard, usando el PUT
      existente. Muestra err.error.message del backend. 4 tests nuevos.
      ng build OK, ng test 113/113.

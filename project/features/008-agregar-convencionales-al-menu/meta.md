# Feature Metadata
feature: agregar-convencionales-al-menu
feature_number: 008
project: administracion-pn-frontend
created_at: 2026-07-04
execution_mode: standard  # standard | express | expert
template_mode: full       # full | lite
project_type:
  type: prototype         # prototype | mvp | production
vision_prompt_shown: false

Current Stage: implementation

# Nota: feature trivial (insertar un nav-item a una ruta ya existente). Se
# implementó por vía corta saltando /project.spec, /project.plan y /project.build
# (aprobado por el usuario).

stages:
  functional:
    status: complete
    created_at: 2026-07-04
  technical:
    status: complete
  tasks:
    status: skipped
  implementation:
    status: complete
    completed_tasks: 1
    total_tasks: 1
    notes: |
      src/app/layout/shell.component.html — nuevo <a routerLink="/convencionales">
      insertado después de Organismos. Verificado con
      `npm run build -- --configuration production` (OK).

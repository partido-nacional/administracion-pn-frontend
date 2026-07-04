# Feature Metadata
feature: fix-campos-condicionales-perdida-datos
feature_number: 010   # renumerado de 009 → 010: el 009 lo tomó otra feature (habilitar-botones-edicion, #54) mergeada en paralelo
project: administracion-pn-frontend
created_at: 2026-07-04
execution_mode: standard  # standard | express | expert
template_mode: full       # full | lite
project_type:
  type: production        # prototype | mvp | production
vision_prompt_shown: false

# Origen: reporte del equipo de testing sobre la sección Adhesiones —
# "campos condicionales que pueden borrar datos cargados sin aviso".
# Enfoque elegido: A (ocultar sin borrar; sanear al guardar).

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
      applyX ya no borran; nueva sanitizarFichaParaGuardar aplicada en guardar()
      de nueva-ficha y fichas-contacto. Specs actualizados (constants + form).
      Verificado: ng build OK, ng test 66/66 (ChromeHeadless).

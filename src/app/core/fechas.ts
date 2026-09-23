/**
 * El backend serializa las fechas de referencias como `dd/MM/yyyy`, pero `<input type="date">`
 * sólo acepta `yyyy-MM-dd`. Sin esta conversión el campo aparece vacío al abrir el modal de
 * edición y guardar borraría la fecha en silencio.
 */
export function aIsoDate(fecha?: string | null): string | undefined {
  if (!fecha) return undefined;
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(fecha);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : fecha;
}

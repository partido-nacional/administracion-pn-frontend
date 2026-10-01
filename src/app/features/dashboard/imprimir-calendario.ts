/**
 * Impresión del calendario "estilo listado" (feature 030): eventos agrupados por día,
 * en una ventana nueva con window.print(). Mismo patrón que imprimir-agrupacion.ts;
 * el usuario puede elegir "Guardar como PDF" en el diálogo del navegador.
 *
 * Las fechas de los eventos se leen cortando el string ISO (como la grilla del calendario):
 * el backend guarda la hora de pared que tipeó el usuario marcada como UTC, así que
 * convertir con new Date() correría las horas según la zona del navegador.
 */

export interface EventoImprimible {
  titulo: string;
  fechaInicio: string;
  fechaFin?: string;
  descripcion?: string;
  tipo?: string;
  creadorNombre?: string;
  esPublico: boolean;
}

export interface DiaImpresion {
  iso: string;             // YYYY-MM-DD
  eventos: EventoImprimible[];
}

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto',
  'septiembre', 'octubre', 'noviembre', 'diciembre'];

function isoDe(d: Date): string {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

/** Date local a partir de 'YYYY-MM-DD' (sin pasar por UTC). */
function fechaDe(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Semana (lunes a domingo) que contiene `hoy` (BR-4). Devuelve las fechas ISO del lunes y del
 * lunes siguiente (exclusivo), que es lo que espera GET /calendario/eventos?desde&hasta.
 */
export function rangoSemana(hoy: Date): { desde: string; hasta: string } {
  const lunes = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - ((hoy.getDay() + 6) % 7));
  const lunesSig = new Date(lunes.getFullYear(), lunes.getMonth(), lunes.getDate() + 7);
  return { desde: isoDe(lunes), hasta: isoDe(lunesSig) };
}

/**
 * Agrupa por día de inicio (EC-2), en orden cronológico. Con `incluirVacios` (vista semanal)
 * devuelve todos los días del rango [desde, hasta); si no, solo los días con eventos.
 */
export function agruparPorDia(
  eventos: EventoImprimible[], desde: string, hasta: string, incluirVacios: boolean,
): DiaImpresion[] {
  const enRango = eventos
    .filter(e => { const d = e.fechaInicio.slice(0, 10); return d >= desde && d < hasta; })
    .sort((a, b) => a.fechaInicio.localeCompare(b.fechaInicio));
  const porDia = new Map<string, EventoImprimible[]>();
  for (const e of enRango) {
    const d = e.fechaInicio.slice(0, 10);
    porDia.set(d, [...(porDia.get(d) ?? []), e]);
  }
  if (!incluirVacios) return [...porDia].map(([iso, evs]) => ({ iso, eventos: evs }));

  const dias: DiaImpresion[] = [];
  for (let d = fechaDe(desde); isoDe(d) < hasta; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)) {
    const iso = isoDe(d);
    dias.push({ iso, eventos: porDia.get(iso) ?? [] });
  }
  return dias;
}

function esc(v: unknown): string {
  return String(v ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/** "Lunes 28/09/2026" */
export function tituloDia(iso: string): string {
  const d = fechaDe(iso);
  return `${DIAS[d.getDay()]} ${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;
}

/** Hora de fin: "HH:mm", "dd/MM HH:mm" si termina otro día (EC-2), "—" si no tiene. */
export function horaFin(e: EventoImprimible): string {
  if (!e.fechaFin) return '—';
  const hora = e.fechaFin.slice(11, 16);
  if (e.fechaFin.slice(0, 10) === e.fechaInicio.slice(0, 10)) return hora;
  return `${e.fechaFin.slice(8, 10)}/${e.fechaFin.slice(5, 7)} ${hora}`;
}

/** "Semana del 28 de septiembre al 4 de octubre de 2026" / "Octubre 2026" */
export function tituloPeriodo(modo: 'semana' | 'mes', desde: string, hasta: string): string {
  const ini = fechaDe(desde);
  if (modo === 'mes') return `${MESES[ini.getMonth()][0].toUpperCase()}${MESES[ini.getMonth()].slice(1)} ${ini.getFullYear()}`;
  const fin = fechaDe(hasta); fin.setDate(fin.getDate() - 1);
  return `Semana del ${ini.getDate()} de ${MESES[ini.getMonth()]} al ${fin.getDate()} de ${MESES[fin.getMonth()]} de ${fin.getFullYear()}`;
}

export function htmlCalendario(opts: {
  periodo: string; filtro: string; dias: DiaImpresion[]; generado?: Date;
}): string {
  const generado = (opts.generado ?? new Date()).toLocaleString('es-UY');
  const filas = (evs: EventoImprimible[]) => evs.map(e => `
        <tr>
          <td class="hora">${esc(e.fechaInicio.slice(11, 16))}</td>
          <td class="hora">${esc(horaFin(e))}</td>
          <td><strong>${esc(e.titulo)}</strong>${e.esPublico ? '' : ' 🔒'}</td>
          <td>${esc(e.tipo || '—')}</td>
          <td>${esc(e.creadorNombre || '—')}</td>
          <td class="desc">${esc(e.descripcion || '')}</td>
        </tr>`).join('');

  const cuerpo = opts.dias.length === 0
    ? '<p class="vacio">Sin eventos en el período.</p>'
    : opts.dias.map(d => `
    <section class="dia">
      <h2>${esc(tituloDia(d.iso))}</h2>
      ${d.eventos.length === 0 ? '<p class="sin">(sin eventos)</p>' : `
      <table>
        <thead><tr><th>Hora</th><th>Hasta</th><th>Título</th><th>Tipo</th><th>Creador</th><th>Descripción</th></tr></thead>
        <tbody>${filas(d.eventos)}</tbody>
      </table>`}
    </section>`).join('');

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Calendario — ${esc(opts.periodo)}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: -apple-system, 'Segoe UI', Roboto, Arial, sans-serif; color: #222; margin: 24px; font-size: 12px; }
    header { border-bottom: 2px solid #1a4f8a; padding-bottom: 8px; margin-bottom: 16px; }
    h1 { font-size: 18px; margin: 0 0 4px; color: #1a4f8a; }
    .sub { color: #555; font-size: 12px; }
    section.dia { margin-bottom: 14px; break-inside: avoid; }
    h2 { font-size: 13px; margin: 0 0 6px; padding: 4px 8px; background: #eef2f7; border-left: 3px solid #1a4f8a; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; font-size: 10px; text-transform: uppercase; color: #666; border-bottom: 1px solid #ccc; padding: 4px 6px; }
    td { padding: 5px 6px; border-bottom: 1px solid #eee; vertical-align: top; }
    td.hora { white-space: nowrap; width: 70px; font-variant-numeric: tabular-nums; }
    td.desc { color: #444; white-space: pre-wrap; }
    .sin, .vacio { color: #888; margin: 2px 8px; font-style: italic; }
    footer { margin-top: 24px; font-size: 10px; color: #888; text-align: right; }
    @media print {
      body { margin: 0; }
      section.dia, tr { break-inside: avoid; page-break-inside: avoid; }
      thead { display: table-header-group; }
    }
  </style>
</head>
<body>
  <header>
    <h1>Calendario — ${esc(opts.periodo)}</h1>
    <div class="sub">${esc(opts.filtro)}</div>
  </header>
  ${cuerpo}
  <footer>Impreso el ${esc(generado)}</footer>
</body>
</html>`;
}

/** Abre la ventana e imprime. Devuelve false si el navegador bloqueó la ventana (AC-8). */
export function imprimirCalendario(html: string): boolean {
  const w = window.open('', '_blank');
  if (!w) return false;
  w.document.open();
  w.document.write(html);
  w.document.close();
  w.onload = () => { w.focus(); w.print(); };
  return true;
}

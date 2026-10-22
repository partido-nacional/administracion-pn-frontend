/**
 * Helper para imprimir agrupaciones-periodo o agrupaciones pendientes en una
 * ventana nueva. El usuario puede elegir "Guardar como PDF" en el dialogo de
 * impresion del navegador.
 *
 * La ficha entra en UNA hoja A4 con las firmas, como la del sistema anterior: el layout es
 * compacto y, si igual no entra (muchos integrantes o textos largos), se achica entera
 * (escalaParaUnaHoja) en lugar de pasar a una segunda hoja.
 */

export interface PrintAgrupacionData {
  // identificacion
  agrupacionId: number;
  periodoId: number;
  periodo: string;
  pendiente?: boolean;

  // datos
  nombre: string;
  codAgrup?: string;
  codDepto?: string;
  tipo?: string;
  depto?: string;
  solic?: number;
  clasificacion?: string;
  solicita?: string;
  sector?: string;
  fechaSolicitud?: string;
  codAnt?: string;
  nombreAnt?: string;

  // contacto
  domicilioLegal?: string;
  ciudad?: string;
  tel1?: string; tel2?: string; fax?: string; email?: string;

  // C.E.
  formaRepresentacion?: string;
  representante?: string;
  delegadoCE?: string;
  formaActuacion?: string;
  fechaIngComis?: string;
  fechaRecAgrup?: string;
  fechaEntrCE?: string;
  fechaCircCE?: string;
  nroTramite?: string;

  // observaciones
  observaciones?: string;
  obsCE?: string;
  nota?: string;
  antecedentes?: string;
  resolucionComision?: string;

  // sublemas (del periodo)
  sublema1?: string; sublema2?: string; sublema3?: string;
  sublema4?: string; sublema5?: string;
  sublemaRenunciado?: string;

  // integrantes (opcional)
  integrantes?: Array<{
    nombre: string; apellido: string;
    cedula?: string; credencial?: string;
    cargo?: string; fechaIngreso?: string;
    /** Adhesión local con aporte confirmado: requisito para abrir una agrupación. */
    adherente?: boolean;
  }>;
}

const FIRMAS = [
  'Gloria Rodríguez',
  'Javier García',
  'Armando Castaingdebat',
  'Luis A. Heber',
  'Enrique Antía',
  'Juventud',
  'Juventud'
];

/** Área útil de una hoja A4 con los márgenes de @page (10mm × 12mm). */
const HOJA_ANCHO_MM = 186;
const HOJA_ALTO_MM = 277;
const PX_POR_MM = 96 / 25.4;
/** Margen de seguridad: al imprimir, Chrome pagina el contenido algo más alto que lo medido en pantalla (~7%). */
const MARGEN_SEGURIDAD = 0.9;

/**
 * Factor para que el contenido entre en una hoja: 1 si ya entra; si no, la proporción que
 * hace falta achicarlo. Se aplica como zoom al body antes de imprimir.
 */
export function escalaParaUnaHoja(alturaContenidoPx: number): number {
  const disponible = HOJA_ALTO_MM * PX_POR_MM * MARGEN_SEGURIDAD;
  return alturaContenidoPx > disponible ? disponible / alturaContenidoPx : 1;
}

/** Escapa HTML para evitar inyección (XSS) al interpolar datos en el string del documento. */
const esc = (v: any) =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const fmt = (v: any) => (v == null || v === '') ? '' : esc(v);

function tipoLabel(t?: string): string {
  if (t === 'D') return 'DEPARTAMENTAL';
  if (t === 'N') return 'NACIONAL';
  return t || '';
}

/** Par etiqueta / valor en la grilla de 6 columnas; `ancho` = columnas que ocupa. */
function campo(label: string, value: any, ancho = 2): string {
  const l = label ? `<span class="l">${label}</span>` : '';
  return `<div class="f s${ancho}">${l}<span class="v">${fmt(value)}</span></div>`;
}

/**
 * Jerarquía de cargos en la ficha impresa (como la del sistema anterior). No es el orden del
 * desplegable: ahí Vocal va antes que Secretario.
 */
const JERARQUIA_CARGOS = [
  'Presidente', 'Vicepresidente', 'Sec. General', 'Secretario General', 'Secretario',
  'Prosecretario', 'Tesorero', 'Protesorero', 'Vocal',
];

/** Orden de la ficha: por jerarquía de cargo (los demás al final) y después por apellido. */
function ordenarIntegrantes(integrantes: NonNullable<PrintAgrupacionData['integrantes']>) {
  const rango = (c?: string) => {
    const i = JERARQUIA_CARGOS.indexOf(c ?? '');
    return i < 0 ? JERARQUIA_CARGOS.length : i;
  };
  return [...integrantes].sort((a, b) =>
    rango(a.cargo) - rango(b.cargo) || (a.apellido ?? '').localeCompare(b.apellido ?? '', 'es'));
}

function buildIntegrantes(integrantes: PrintAgrupacionData['integrantes']): string {
  if (!integrantes || integrantes.length === 0) {
    return `<p class="muted">Sin integrantes registrados.</p>`;
  }
  return `
    <table class="ints">
      <thead>
        <tr><th>Cargo</th><th>Nombres</th><th>Apellidos</th><th>Cédula</th><th>C.C.</th><th class="c">Adh.</th><th>F. Ingreso</th></tr>
      </thead>
      <tbody>
        ${ordenarIntegrantes(integrantes).map(i => `
          <tr>
            <td>${fmt(i.cargo)}</td>
            <td>${fmt(i.nombre)}</td>
            <td>${fmt(i.apellido)}</td>
            <td>${fmt(i.cedula)}</td>
            <td>${fmt(i.credencial)}</td>
            <td class="c"><span class="chk${i.adherente ? ' on' : ''}">${i.adherente ? '✓' : ''}</span></td>
            <td>${fmt(i.fechaIngreso)}</td>
          </tr>`).join('')}
      </tbody>
    </table>`;
}

function buildFirmas(): string {
  return `
    <div class="firmas">
      ${FIRMAS.map(n => `<div class="firma"><span class="firma-linea"></span><span class="firma-nombre">${esc(n)}</span></div>`).join('')}
    </div>`;
}

function buildHtml(d: PrintAgrupacionData, opts: { firmas: boolean; titulo: string }): string {
  const estado = d.pendiente !== undefined
    ? (d.pendiente ? '<span class="badge pend">PENDIENTE</span>' : '<span class="badge ok">APROBADA</span>')
    : '';
  const sublemas = [d.sublema1, d.sublema2, d.sublema3, d.sublema4, d.sublema5].filter(Boolean);
  const codigo = d.codAgrup ? ` (${esc(d.codAgrup)})` : '';

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>${esc(opts.titulo)} — ${esc(d.nombre)} (${esc(d.periodo)})</title>
  <style>
    @page { size: A4; margin: 10mm 12mm; }
    * { box-sizing: border-box; }
    html, body { margin: 0; }
    body {
      width: ${HOJA_ANCHO_MM}mm;
      font-family: Arial, 'Helvetica Neue', sans-serif; color: #111;
      font-size: 10px; line-height: 1.25;
    }
    header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 1.5px solid #1e3a8a; padding-bottom: 4px; }
    .org { font-size: 9px; color: #555; text-transform: uppercase; letter-spacing: .4px; }
    h1 { font-size: 14px; margin: 1px 0 0; color: #1e3a8a; }
    .per { font-size: 10px; color: #333; text-align: right; }
    .badge { display: inline-block; margin-top: 2px; padding: 1px 7px; border-radius: 8px; font-size: 9px; font-weight: 700; }
    .badge.pend { background: #fff3cd; color: #856404; }
    .badge.ok { background: #e6f4ea; color: #1f6f3b; }
    h2 { font-size: 10px; margin: 7px 0 3px; color: #1e3a8a; text-transform: uppercase; letter-spacing: .4px; border-bottom: 1px solid #cfd6e0; padding-bottom: 1px; }
    .grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 2px 10px; }
    .f { display: flex; gap: 4px; min-width: 0; border-bottom: 1px dotted #c8ced8; padding: 1px 0; }
    .s1 { grid-column: span 1; } .s2 { grid-column: span 2; } .s3 { grid-column: span 3; }
    .s4 { grid-column: span 4; } .s6 { grid-column: span 6; }
    .l { color: #555; white-space: nowrap; }
    .l::after { content: ':'; }
    .v { font-weight: 600; overflow-wrap: anywhere; }
    .resol { border: 1px solid #444; min-height: 12mm; padding: 2px 4px; margin-top: 4px; }
    .resol .l { display: block; font-size: 9px; }
    .ints { width: 100%; border-collapse: collapse; margin-top: 2px; }
    .ints th, .ints td { border: 1px solid #9aa4b2; padding: 1.5px 4px; text-align: left; }
    .ints th { background: #eef2f8; font-weight: 600; font-size: 9px; }
    .ints .c { text-align: center; width: 9mm; }
    .chk { display: inline-block; width: 10px; height: 10px; border: 1px solid #333; line-height: 9px; font-size: 9px; font-weight: 700; }
    .muted { color: #777; margin: 2px 0; }
    .firmas { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0 8mm; margin-top: 3mm; break-inside: avoid; }
    .firma { display: flex; flex-direction: column; align-items: center; padding-top: 16mm; }
    .firma-linea { width: 100%; border-bottom: 1px solid #222; }
    .firma-nombre { margin-top: 1px; font-weight: 700; font-size: 10px; }
    .generado { font-size: 8px; color: #888; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style>
</head>
<body>
  <header>
    <div>
      <div class="org">Partido Nacional · Comisión de Asuntos Políticos</div>
      <h1>${esc(opts.titulo)} — ${esc(d.nombre)}${codigo}</h1>
    </div>
    <div class="per">Período <strong>${esc(d.periodo)}</strong> ${estado}<br><span class="generado">Generado el ${new Date().toLocaleString('es-UY')}</span></div>
  </header>

  <h2>Informe de la Comisión de Asuntos Políticos</h2>
  <div class="grid">
    ${campo('Cod. Agrupación', d.codAgrup, 1)}
    ${campo('Cod. Depto.', d.codDepto, 1)}
    ${campo('Clasificación', d.clasificacion, 2)}
    ${campo('Solicita', d.solicita, 2)}
    ${campo('Tipo', tipoLabel(d.tipo), 2)}
    ${campo('Departamento', d.depto, 2)}
    ${campo('Sector', d.sector, 1)}
    ${campo('Solic.', d.solic, 1)}
    ${campo('Fecha Solicitud', d.fechaSolicitud, 2)}
    ${campo('Fecha Ingr. Comisión', d.fechaIngComis, 2)}
    ${campo('N° Trámite', d.nroTramite, 2)}
    ${campo('Fecha Rec. Agrup.', d.fechaRecAgrup, 2)}
    ${campo('Fecha Entr. C.E.', d.fechaEntrCE, 2)}
    ${d.fechaCircCE ? campo('Fecha Circ. C.E.', d.fechaCircCE, 2) : ''}
    ${d.codAnt || d.nombreAnt ? campo('Cód. Ant.', d.codAnt, 2) + campo('Nombre Ant.', d.nombreAnt, 4) : ''}
  </div>

  <h2>Domicilio y contacto</h2>
  <div class="grid">
    ${campo('Domic. Legal', d.domicilioLegal, 4)}
    ${campo('Ciudad', d.ciudad, 2)}
    ${campo('Tel 1', d.tel1, 1)}
    ${campo('Tel 2', d.tel2, 1)}
    ${campo('Fax', d.fax, 1)}
    ${campo('Email', d.email, 3)}
  </div>

  <h2>Representación</h2>
  <div class="grid">
    ${campo('Forma Representación', d.formaRepresentacion, 2)}
    ${campo('Representación', d.representante, 4)}
    ${campo('Forma de Actuación', d.formaActuacion, 2)}
    ${campo('Delegados', d.delegadoCE, 4)}
  </div>

  <h2>Sublemas</h2>
  <div class="grid">
    ${sublemas.length ? sublemas.map(x => campo('', x, 3)).join('') : campo('', '', 6)}
    ${d.sublemaRenunciado ? campo('Sublema renunciado', d.sublemaRenunciado, 6) : ''}
  </div>

  <h2>Antecedentes y resolución</h2>
  <div class="grid">
    ${campo('Antecedentes', d.antecedentes, 6)}
    ${campo('Observaciones', d.observaciones, 6)}
    ${d.obsCE ? campo('Obs. C.E.', d.obsCE, 6) : ''}
    ${campo('Notas', d.nota, 6)}
  </div>
  <div class="resol"><span class="l">Resolución de la Comisión</span>${fmt(d.resolucionComision)}</div>

  <h2>Integrantes de la Agrupación</h2>
  ${buildIntegrantes(d.integrantes)}

  ${opts.firmas ? buildFirmas() : ''}
</body>
</html>`;
}

export function imprimirAgrupacion(
  d: PrintAgrupacionData,
  opts: { firmas: boolean; titulo: string }
): void {
  const html = buildHtml(d, opts);
  const w = window.open('', '_blank');
  if (!w) {
    alert('El navegador bloqueó la ventana de impresión. Permitilas para este sitio y volvé a intentar.');
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
  // Esperar a que rendere, achicar si no entra en una hoja, e imprimir
  w.onload = () => {
    const body = w.document.body;
    const escala = escalaParaUnaHoja(body.scrollHeight);
    if (escala < 1) body.style.setProperty('zoom', String(escala));
    w.focus();
    w.print();
  };
}

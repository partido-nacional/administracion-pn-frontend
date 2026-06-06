/**
 * Helper para imprimir agrupaciones-periodo o agrupaciones pendientes en una
 * ventana nueva. El usuario puede elegir "Guardar como PDF" en el dialogo de
 * impresion del navegador.
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
  }>;
}

// '' = celda vacia para mantener alineacion 2-cols y que las dos Juventud
// queden lado a lado en la ultima fila.
const FIRMAS_PENDIENTE = [
  'Gloria Rodriguez',
  'Luis Alberto Heber',
  'Javier Garcia',
  'Enrique Antia',
  'Armando Castaingdo',
  '',
  'Juventud',
  'Juventud (2)'
];

const fmt = (v: any) => (v == null || v === '') ? '—' : String(v);

function tipoLabel(t?: string): string {
  if (t === 'D') return 'DEPARTAMENTAL';
  if (t === 'N') return 'NACIONAL';
  return t || '—';
}

function row(label: string, value: any): string {
  return `<tr><th>${label}</th><td>${fmt(value)}</td></tr>`;
}

function buildIntegrantes(integrantes: PrintAgrupacionData['integrantes']): string {
  if (!integrantes || integrantes.length === 0) {
    return `<p class="muted">Sin integrantes registrados.</p>`;
  }
  return `
    <table class="data-table">
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Cédula</th>
          <th>Credencial</th>
          <th>Cargo</th>
          <th>Fecha Ingreso</th>
        </tr>
      </thead>
      <tbody>
        ${integrantes.map(i => `
          <tr>
            <td>${fmt(i.apellido)}, ${fmt(i.nombre)}</td>
            <td>${fmt(i.cedula)}</td>
            <td>${fmt(i.credencial)}</td>
            <td>${fmt(i.cargo)}</td>
            <td>${fmt(i.fechaIngreso)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function buildFirmas(): string {
  return `
    <h2 class="sec">Firmas</h2>
    <div class="firmas">
      ${FIRMAS_PENDIENTE.map(n => n
        ? `<div class="firma">
             <div class="firma-linea"></div>
             <div class="firma-nombre">${n}</div>
           </div>`
        : `<div class="firma firma-empty"></div>`
      ).join('')}
    </div>
  `;
}

function buildHtml(d: PrintAgrupacionData, opts: { firmas: boolean; titulo: string }): string {
  const tituloEstado = d.pendiente !== undefined
    ? (d.pendiente ? '<span class="badge-pend">PENDIENTE</span>' : '<span class="badge-ok">APROBADA</span>')
    : '';

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>${opts.titulo} — ${d.nombre} (${d.periodo})</title>
  <style>
    @page { size: A4; margin: 18mm 16mm; }
    * { box-sizing: border-box; }
    body {
      font-family: 'Helvetica Neue', Arial, sans-serif; color: #222;
      font-size: 12px; line-height: 1.4; margin: 0;
    }
    header { border-bottom: 2px solid #1e3a8a; padding-bottom: 10px; margin-bottom: 18px; }
    h1 { font-size: 18px; margin: 0 0 4px 0; color: #1e3a8a; }
    .sub {
      font-size: 13px; color: #444; margin-top: 4px;
      display: flex; gap: 14px; flex-wrap: wrap; align-items: center;
    }
    .sub strong { color: #1e3a8a; }
    .badge-pend { background:#fff3cd; color:#856404; padding:3px 9px; border-radius:10px; font-size:11px; font-weight:700; }
    .badge-ok   { background:#e6f4ea; color:#1f6f3b; padding:3px 9px; border-radius:10px; font-size:11px; font-weight:700; }
    h2.sec {
      font-size: 13px; margin: 16px 0 6px 0; color: #1e3a8a;
      text-transform: uppercase; letter-spacing: .5px;
      border-bottom: 1px solid #cfd6e0; padding-bottom: 4px;
    }
    table.kv { width: 100%; border-collapse: collapse; }
    table.kv th, table.kv td { padding: 4px 6px; font-size: 12px; vertical-align: top; }
    table.kv th {
      width: 30%; text-align: left; color: #666; font-weight: 600;
      font-size: 11px; text-transform: uppercase; letter-spacing: .3px;
    }
    table.kv tr { border-bottom: 1px solid #f0f3f7; }
    .col-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0 24px; }
    .data-table { width: 100%; border-collapse: collapse; margin-top: 4px; }
    .data-table th, .data-table td { border: 1px solid #d6dde6; padding: 4px 6px; font-size: 11px; text-align: left; }
    .data-table th { background: #f3f6fb; font-weight: 600; }
    .muted { color: #888; font-size: 11px; }
    .firmas {
      display: grid; grid-template-columns: 1fr 1fr; gap: 30px 60px;
      margin-top: 24px;
    }
    .firma { display: flex; flex-direction: column; align-items: center; }
    .firma-linea {
      width: 100%; border-top: 1px solid #222; height: 0; margin-top: 35px;
    }
    .firma-nombre { font-size: 12px; margin-top: 4px; color: #333; font-weight: 600; text-align: center; }
    .firma-empty { visibility: hidden; }
    footer { margin-top: 24px; font-size: 10px; color: #888; text-align: right; }
    @media print {
      header { break-inside: avoid; }
      .firmas { break-inside: avoid; page-break-inside: avoid; }
      h2.sec, table.kv, .data-table { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <header>
    <h1>${opts.titulo}</h1>
    <div class="sub">
      <span><strong>Agrupación:</strong> ${d.nombre}</span>
      <span><strong>Período:</strong> ${d.periodo}</span>
      ${tituloEstado}
    </div>
  </header>

  <h2 class="sec">Datos de la Agrupación</h2>
  <div class="col-2">
    <table class="kv">
      ${row('ID Agrupación', d.agrupacionId)}
      ${row('Cod. Agrupación', d.codAgrup)}
      ${row('Cod. Depto.', d.codDepto)}
      ${row('Tipo', tipoLabel(d.tipo))}
      ${row('Departamento', d.depto)}
      ${row('Sector', d.sector)}
      ${row('Solic.', d.solic)}
    </table>
    <table class="kv">
      ${row('Clasificación', d.clasificacion)}
      ${row('Solicita', d.solicita)}
      ${row('Fecha Solicitud', d.fechaSolicitud)}
      ${row('Cod. Ant.', d.codAnt)}
      ${row('Nombre Ant.', d.nombreAnt)}
    </table>
  </div>

  <h2 class="sec">Domicilio y Contacto</h2>
  <table class="kv">
    ${row('Domicilio Legal', d.domicilioLegal)}
    ${row('Ciudad', d.ciudad)}
    ${row('Teléfono 1', d.tel1)}
    ${row('Teléfono 2', d.tel2)}
    ${row('Fax', d.fax)}
    ${row('Email', d.email)}
  </table>

  <h2 class="sec">Comisión Electoral</h2>
  <div class="col-2">
    <table class="kv">
      ${row('Forma Representación', d.formaRepresentacion)}
      ${row('Representante', d.representante)}
      ${row('Delegado C.E.', d.delegadoCE)}
      ${row('Forma de Actuación', d.formaActuacion)}
    </table>
    <table class="kv">
      ${row('Fecha Ing. Comis.', d.fechaIngComis)}
      ${row('Fecha Rec. Agrup.', d.fechaRecAgrup)}
      ${row('Fecha Entr. C.E.', d.fechaEntrCE)}
      ${row('Fecha Circ. C.E.', d.fechaCircCE)}
    </table>
  </div>

  <h2 class="sec">Sublemas (período ${d.periodo})</h2>
  <table class="kv">
    ${row('Sublema 1', d.sublema1)}
    ${row('Sublema 2', d.sublema2)}
    ${row('Sublema 3', d.sublema3)}
    ${row('Sublema 4', d.sublema4)}
    ${row('Sublema 5', d.sublema5)}
    ${row('Sublema Renunciado', d.sublemaRenunciado)}
  </table>

  <h2 class="sec">Antecedentes y Resolución</h2>
  <table class="kv">
    ${row('Antecedentes', d.antecedentes)}
    ${row('Resolución de la Comisión', d.resolucionComision)}
    ${row('Observaciones', d.observaciones)}
    ${row('Obs. C.E.', d.obsCE)}
    ${row('Nota', d.nota)}
  </table>

  <h2 class="sec">Integrantes</h2>
  ${buildIntegrantes(d.integrantes)}

  ${opts.firmas ? buildFirmas() : ''}

  <footer>Generado el ${new Date().toLocaleString('es-UY')}</footer>
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
  // Esperar a que rendere para imprimir
  w.onload = () => { w.focus(); w.print(); };
}

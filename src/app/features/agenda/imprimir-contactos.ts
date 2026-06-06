/**
 * Helper para imprimir la lista de contactos filtrada y ordenada.
 * Abre una ventana nueva con HTML A4 y dispara window.print() para
 * que el usuario pueda elegir 'Guardar como PDF' desde el dialogo.
 */

export interface ContactoPrintRow {
  id: number;
  nombre: string;
  apellido: string;
  cedula?: string;
  credencial?: string;
  departamento?: string;
  celular?: string;
  email?: string;
  adhesion?: string;
}

export interface ContactoPrintOpts {
  filtros?: Array<{ campo: string; valor: string }>;
  orden?: Array<{ campo: string; dir: 'asc' | 'desc' }>;
}

const fmt = (v: any) => (v == null || v === '') ? '—' : String(v);

function buildFiltros(filtros?: ContactoPrintOpts['filtros']): string {
  const activos = (filtros || []).filter(f => f.valor && f.valor.trim() !== '');
  if (activos.length === 0) return '';
  return `
    <div class="meta">
      <strong>Filtros:</strong>
      ${activos.map(f => `<span class="chip">${f.campo}: ${f.valor}</span>`).join('')}
    </div>
  `;
}

function buildOrden(orden?: ContactoPrintOpts['orden']): string {
  if (!orden || orden.length === 0) return '';
  return `
    <div class="meta">
      <strong>Orden:</strong>
      ${orden.map((o, i) => `<span class="chip">${i + 1}. ${o.campo} ${o.dir === 'asc' ? '▲' : '▼'}</span>`).join('')}
    </div>
  `;
}

function buildHtml(rows: ContactoPrintRow[], opts: ContactoPrintOpts): string {
  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Contactos (${rows.length})</title>
  <style>
    @page { size: A4 landscape; margin: 14mm; }
    * { box-sizing: border-box; }
    body {
      font-family: 'Helvetica Neue', Arial, sans-serif; color: #222;
      font-size: 11px; line-height: 1.35; margin: 0;
    }
    header { border-bottom: 2px solid #1e3a8a; padding-bottom: 8px; margin-bottom: 12px; }
    h1 { font-size: 16px; margin: 0; color: #1e3a8a; }
    .total { font-size: 12px; color: #444; margin-top: 4px; }
    .meta {
      font-size: 11px; color: #444; margin-top: 6px;
      display: flex; gap: 6px; flex-wrap: wrap; align-items: center;
    }
    .chip {
      background: #f0f4fa; border: 1px solid #d6dde6; color: #333;
      padding: 1px 8px; border-radius: 10px; font-size: 10px;
    }
    table {
      width: 100%; border-collapse: collapse; font-size: 11px;
      margin-top: 4px;
    }
    th, td {
      border: 1px solid #cfd6e0; padding: 4px 6px;
      text-align: left; vertical-align: top;
    }
    th {
      background: #f3f6fb; font-weight: 600; font-size: 10px;
      text-transform: uppercase; letter-spacing: .3px; color: #444;
    }
    tr:nth-child(even) td { background: #fafbfd; }
    .badge {
      display: inline-block; padding: 1px 6px; border-radius: 8px;
      font-size: 10px; font-weight: 600;
    }
    .b-activa { background:#e6f4ea; color:#1f6f3b; }
    .b-pend { background:#fff3cd; color:#856404; }
    .b-baja { background:#fdecea; color:#a8261b; }
    footer { margin-top: 16px; font-size: 10px; color: #888; text-align: right; }
    @media print { thead { display: table-header-group; } }
  </style>
</head>
<body>
  <header>
    <h1>Lista de Contactos</h1>
    <div class="total">Total: <strong>${rows.length}</strong> contactos</div>
    ${buildFiltros(opts.filtros)}
    ${buildOrden(opts.orden)}
  </header>

  <table>
    <thead>
      <tr>
        <th style="width:42px">ID</th>
        <th>Nombre</th>
        <th>Cédula</th>
        <th>Credencial</th>
        <th>Departamento</th>
        <th>Celular</th>
        <th>Email</th>
        <th>Adhesión</th>
      </tr>
    </thead>
    <tbody>
      ${rows.map(c => `
        <tr>
          <td>${c.id}</td>
          <td><strong>${fmt(c.apellido)}, ${fmt(c.nombre)}</strong></td>
          <td>${fmt(c.cedula)}</td>
          <td>${fmt(c.credencial)}</td>
          <td>${fmt(c.departamento)}</td>
          <td>${fmt(c.celular)}</td>
          <td>${fmt(c.email)}</td>
          <td>${badgeAdhesion(c.adhesion)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <footer>Generado el ${new Date().toLocaleString('es-UY')}</footer>
</body>
</html>`;
}

function badgeAdhesion(estado?: string): string {
  if (!estado) return '—';
  const cls = estado === 'Activa' ? 'b-activa' : estado === 'Pendiente' ? 'b-pend' : 'b-baja';
  return `<span class="badge ${cls}">${estado}</span>`;
}

export function imprimirContactos(rows: ContactoPrintRow[], opts: ContactoPrintOpts = {}): void {
  const html = buildHtml(rows, opts);
  const w = window.open('', '_blank');
  if (!w) {
    alert('El navegador bloqueó la ventana de impresión. Permitilas para este sitio y volvé a intentar.');
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
  w.onload = () => { w.focus(); w.print(); };
}

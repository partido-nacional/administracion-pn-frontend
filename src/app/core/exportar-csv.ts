/**
 * Genera un CSV (RFC 4180) a partir de un array de objetos y lanza la descarga
 * en el navegador. Soporta valores con comas, comillas y saltos de linea.
 */

export interface CsvColumn<T> {
  /** clave del objeto o funcion para extraer el valor */
  get: keyof T | ((row: T) => any);
  label: string;
}

function escape(v: any): string {
  if (v == null) return '';
  let s: string;
  if (typeof v === 'boolean') s = v ? 'Sí' : 'No';
  else if (v instanceof Date) s = v.toISOString().slice(0, 10);
  else s = String(v);
  // RFC 4180: si contiene coma, comilla o salto de linea, encerrar en
  // comillas y duplicar las comillas internas.
  if (/[",\n\r]/.test(s)) {
    s = '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

export function exportarCSV<T>(rows: T[], columnas: CsvColumn<T>[], filename: string): void {
  const header = columnas.map(c => escape(c.label)).join(',');
  const lines = rows.map(r =>
    columnas.map(c => {
      const v = typeof c.get === 'function' ? (c.get as any)(r) : (r as any)[c.get];
      return escape(v);
    }).join(',')
  );
  const csv = [header, ...lines].join('\r\n');
  // BOM para que Excel detecte UTF-8 correctamente
  const blob = new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

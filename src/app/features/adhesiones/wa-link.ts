/**
 * Normaliza un celular uruguayo a formato internacional (598, sin el 0 inicial) y arma
 * el deep link de WhatsApp con el mensaje pre-cargado. Devuelve null si no hay un número
 * válido (feature 024).
 */
export function waLink(celular: string | null | undefined, mensaje: string): string | null {
  let n = (celular ?? '').replace(/\D/g, '').replace(/^0+/, '');
  if (!n) return null;
  if (!n.startsWith('598')) n = '598' + n;
  if (n.length < 11) return null;   // 598 + al menos 8 dígitos
  return `https://wa.me/${n}?text=${encodeURIComponent(mensaje)}`;
}

/** Mensaje de recordatorio de vencimiento de la adhesión anual. */
export function mensajeVencimiento(nombre: string, vencimiento: string): string {
  return `Hola ${nombre}, te recordamos desde el Partido Nacional que tu adhesión anual vence el ${vencimiento}. ¡Gracias por tu apoyo!`;
}

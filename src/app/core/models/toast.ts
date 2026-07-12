export type ToastTipo = 'error' | 'success' | 'info';

export interface Toast {
  id: number;
  tipo: ToastTipo;
  mensaje: string;
}

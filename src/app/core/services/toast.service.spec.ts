import { fakeAsync, tick } from '@angular/core/testing';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let svc: ToastService;
  beforeEach(() => { svc = new ToastService(); });

  it('agrega un toast de error con tipo y mensaje', () => {
    svc.error('Falló algo');
    expect(svc.toasts().length).toBe(1);
    expect(svc.toasts()[0].tipo).toBe('error');
    expect(svc.toasts()[0].mensaje).toBe('Falló algo');
  });

  it('ignora mensajes vacíos', () => {
    svc.success('   ');
    svc.error('');
    expect(svc.toasts().length).toBe(0);
  });

  it('descarta por id', () => {
    svc.info('a'); svc.info('b');
    const id = svc.toasts()[0].id;
    svc.dismiss(id);
    expect(svc.toasts().length).toBe(1);
    expect(svc.toasts()[0].mensaje).toBe('b');
  });

  it('auto-descarta a los 5s', fakeAsync(() => {
    svc.error('temporal');
    expect(svc.toasts().length).toBe(1);
    tick(5000);
    expect(svc.toasts().length).toBe(0);
  }));

  it('topea la cantidad de visibles en 4', () => {
    for (let i = 0; i < 6; i++) svc.info(`t${i}`);
    expect(svc.toasts().length).toBe(4);
    // conserva los últimos
    expect(svc.toasts()[0].mensaje).toBe('t2');
    expect(svc.toasts()[3].mensaje).toBe('t5');
  });
});

import { TestBed } from '@angular/core/testing';
import { ConfirmDialogComponent } from './confirm-dialog.component';

describe('ConfirmDialogComponent', () => {
  function montar() {
    const f = TestBed.createComponent(ConfirmDialogComponent);
    f.componentInstance.title = 'Eliminar';
    f.componentInstance.message = '¿Seguro?';
    f.componentInstance.confirmLabel = 'Sí, eliminar';
    f.detectChanges();
    return f;
  }

  const botones = (el: HTMLElement) => Array.from(el.querySelectorAll('.nv-footer button')) as HTMLButtonElement[];

  it('muestra título, mensaje y emite confirm / cancel', () => {
    const f = montar();
    const el = f.nativeElement as HTMLElement;
    const confirm = spyOn(f.componentInstance.confirm, 'emit');
    const cancel = spyOn(f.componentInstance.cancel, 'emit');

    expect(el.querySelector('.nv-title')?.textContent).toContain('Eliminar');
    expect(el.textContent).toContain('¿Seguro?');
    const [cancelar, confirmar] = botones(el);
    expect(confirmar.classList).toContain('btn-danger');
    confirmar.click();
    cancelar.click();
    expect(confirm).toHaveBeenCalledTimes(1);
    expect(cancel).toHaveBeenCalledTimes(1);
  });

  it('con busy deshabilita los botones y el click afuera no cierra', () => {
    const f = montar();
    f.componentRef.setInput('busy', true);
    f.detectChanges();
    const el = f.nativeElement as HTMLElement;
    const cancel = spyOn(f.componentInstance.cancel, 'emit');

    expect(botones(el).every(b => b.disabled)).toBeTrue();
    expect(botones(el)[1].textContent).toContain('Procesando…');
    (el.querySelector('.modal-backdrop') as HTMLElement).click();
    expect(cancel).not.toHaveBeenCalled();
  });
});

import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ToastsComponent } from './toasts.component';
import { ToastService } from '../../../core/services/toast.service';

describe('ToastsComponent', () => {
  let fixture: ComponentFixture<ToastsComponent>;
  let toast: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [ToastsComponent] });
    fixture = TestBed.createComponent(ToastsComponent);
    toast = TestBed.inject(ToastService);
    fixture.detectChanges();
  });

  const html = () => fixture.nativeElement.innerHTML as string;

  it('renderiza los toasts del servicio con su clase por tipo', () => {
    toast.error('Falló'); toast.success('Guardado');
    fixture.detectChanges();
    expect(html()).toContain('Falló');
    expect(html()).toContain('Guardado');
    expect(fixture.nativeElement.querySelector('.toast.error')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.toast.success')).toBeTruthy();
  });

  it('el botón cerrar descarta el toast', () => {
    toast.info('temporal');
    fixture.detectChanges();
    fixture.nativeElement.querySelector('.toast-x').click();
    fixture.detectChanges();
    expect(toast.toasts().length).toBe(0);
    expect(html()).not.toContain('temporal');
  });
});

import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FichaAdhesionFormComponent } from './ficha-adhesion-form.component';
import { FichaAdhesionDetalle } from '../../features/agenda/contactos.service';

function ficha(over: Partial<FichaAdhesionDetalle> = {}): FichaAdhesionDetalle {
  return {
    id: 7, contactoId: 1,
    aporteConfirmado: null, art46: false, departamental: false,
    aporteTodoAlPartido: true,
    ...over,
  };
}

function labels(fixture: ComponentFixture<FichaAdhesionFormComponent>): string[] {
  return Array.from(fixture.nativeElement.querySelectorAll('.form-label'))
    .map((el: any) => el.textContent.trim());
}

describe('FichaAdhesionFormComponent', () => {
  let fixture: ComponentFixture<FichaAdhesionFormComponent>;
  let component: FichaAdhesionFormComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FichaAdhesionFormComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(FichaAdhesionFormComponent);
    component = fixture.componentInstance;
  });

  function setFicha(f: FichaAdhesionDetalle) {
    fixture.componentRef.setInput('ficha', f);
    fixture.detectChanges();
  }

  it('renderiza Cédula responsable para OCA y no Teléfono Antel', () => {
    setFicha(ficha({ sistContrib: 'OCA' }));
    expect(labels(fixture)).toContain('Cédula responsable');
    expect(labels(fixture)).not.toContain('Teléfono Antel');
  });

  it('renderiza Teléfono Antel para Antel', () => {
    setFicha(ficha({ sistContrib: 'Antel' }));
    expect(labels(fixture)).toContain('Teléfono Antel');
  });

  it('renderiza Fecha Vencimiento/Ult. Pago para ANUAL', () => {
    setFicha(ficha({ sistContrib: 'ANUAL' }));
    const ls = labels(fixture);
    expect(ls).toContain('Fecha Vencimiento');
    expect(ls).toContain('Fecha Ult. Pago');
  });

  it('muestra campos de sector cuando aporteTodoAlPartido = false', () => {
    setFicha(ficha({ aporteTodoAlPartido: false }));
    expect(labels(fixture)).toContain('Aporte a un Sector');
  });

  it('oculta el Id salvo showId = true', () => {
    setFicha(ficha());
    expect(labels(fixture)).not.toContain('Id Adhesión');
    fixture.componentRef.setInput('showId', true);
    fixture.detectChanges();
    expect(labels(fixture)).toContain('Id Adhesión');
  });

  it('disabled deshabilita los inputs', fakeAsync(() => {
    setFicha(ficha({ sistContrib: 'Antel' }));
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
    const inputs = fixture.nativeElement.querySelectorAll('input.form-input, select.form-select');
    expect(inputs.length).toBeGreaterThan(0);
    inputs.forEach((el: any) => expect(el.disabled).toBeTrue());
  }));

  it('onSistContribChange aplica la regla y actualiza el model (two-way)', () => {
    setFicha(ficha({ sistContrib: 'Antel', telefonoAntel: '099' }));
    component.onSistContribChange('OCA');
    expect(component.ficha().sistContrib).toBe('OCA');
    expect(component.ficha().telefonoAntel).toBeUndefined();
  });

  it('onAporteTodoChange(true) limpia los campos de sector', () => {
    setFicha(ficha({ aporteTodoAlPartido: false, sector: 'X' }));
    component.onAporteTodoChange(true);
    expect(component.ficha().aporteTodoAlPartido).toBeTrue();
    expect(component.ficha().sector).toBeUndefined();
  });

  describe('onConfirmadoChange (BR-3 / TODO-012, sin window.prompt)', () => {
    it('baja (false) setea aporteConfirmado=false y prellena fechaSalida', () => {
      setFicha(ficha({ aporteConfirmado: true, fechaSalida: undefined }));
      component.onConfirmadoChange(false);
      expect(component.ficha().aporteConfirmado).toBeFalse();
      expect(component.ficha().fechaSalida).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('baja (false) conserva la fecha de salida existente', () => {
      setFicha(ficha({ aporteConfirmado: true, fechaSalida: '2020-05-05' }));
      component.onConfirmadoChange(false);
      expect(component.ficha().fechaSalida).toBe('2020-05-05');
    });

    it('activa (true) limpia fechaSalida', () => {
      setFicha(ficha({ aporteConfirmado: false, fechaSalida: '2020-01-01' }));
      component.onConfirmadoChange(true);
      expect(component.ficha().aporteConfirmado).toBeTrue();
      expect(component.ficha().fechaSalida).toBeUndefined();
    });

    it('pendiente (null) limpia fechaSalida', () => {
      setFicha(ficha({ aporteConfirmado: false, fechaSalida: '2020-01-01' }));
      component.onConfirmadoChange(null);
      expect(component.ficha().aporteConfirmado).toBeNull();
      expect(component.ficha().fechaSalida).toBeUndefined();
    });

    it('re-emite el model con nueva referencia en cada cambio', () => {
      const first = ficha({ aporteConfirmado: true });
      setFicha(first);
      component.onConfirmadoChange(false);
      expect(component.ficha()).not.toBe(first);
    });
  });
});

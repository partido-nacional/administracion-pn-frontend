import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { DEPARTAMENTOS, DEPARTAMENTOS_CON_NACIONAL, canonDepto, opcionesDepto } from '../core/departamentos';
import { DEPARTAMENTOS as DEPTOS_FICHA } from '../shared/adhesiones/ficha-adhesion.constants';
import { ContactosService, Contacto } from './agenda/contactos.service';
import { AdhesionesService } from './adhesiones/adhesiones.service';
import { AgendaNuevoComponent } from './agenda/agenda-nuevo.component';
import { NuevaFichaComponent } from './adhesiones/nueva-ficha.component';
import { AgrupacionesPendientesComponent } from './agrupaciones/agrupaciones-pendientes.component';

/** Feature 031 — DEBT-015 (formularios con lista canónica) y DEBT-016 (nueva-ficha). */
describe('Normalizar departamentos (feature 031)', () => {
  describe('helpers', () => {
    it('canonDepto: MAYÚSCULAS / sin tilde / espacios / Nacional → canónico; resto → vacío', () => {
      expect(canonDepto('PAYSANDÚ')).toBe('Paysandú');
      expect(canonDepto('Rio Negro')).toBe('Río Negro');
      expect(canonDepto('  san jose ')).toBe('San José');
      expect(canonDepto('NACIONAL')).toBe('Nacional');
      expect(canonDepto('C')).toBe('');
      expect(canonDepto('ARGENTINA')).toBe('');
      expect(canonDepto(null)).toBe('');
    });

    it('opcionesDepto agrega el valor guardado si no está en la lista', () => {
      expect(opcionesDepto(DEPARTAMENTOS, 'Salto')).toBe(DEPARTAMENTOS);
      expect(opcionesDepto(DEPARTAMENTOS, '')).toBe(DEPARTAMENTOS);
      expect(opcionesDepto(DEPARTAMENTOS, 'C')).toEqual([...DEPARTAMENTOS, 'C']);
    });

    it('la ficha de adhesión usa la lista canónica + Nacional (sin copia propia)', () => {
      expect(DEPTOS_FICHA).toBe(DEPARTAMENTOS_CON_NACIONAL);
    });
  });

  describe('agenda-nuevo (AC-6, AC-7)', () => {
    let svc: jasmine.SpyObj<ContactosService>;
    let paramId: string | null;

    beforeEach(() => {
      paramId = null;
      svc = jasmine.createSpyObj('ContactosService', ['get', 'create', 'update']);
      TestBed.configureTestingModule({
        imports: [AgendaNuevoComponent],
        providers: [
          { provide: ContactosService, useValue: svc },
          { provide: Router, useValue: jasmine.createSpyObj('Router', ['navigate']) },
          { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => paramId } } } },
        ],
      });
    });

    it('ofrece la lista canónica', () => {
      const c = TestBed.createComponent(AgendaNuevoComponent).componentInstance;
      expect(c.departamentos).toBe(DEPARTAMENTOS);
    });

    it('la credencial deriva el departamento con tilde ("K…" → "Paysandú")', () => {
      const f = TestBed.createComponent(AgendaNuevoComponent);
      f.componentInstance.onCredencialInput({ target: { value: 'KAB123' } } as any);
      expect(f.componentInstance.c.departamentoCredencial).toBe('Paysandú');
    });

    it('al editar, un valor histórico se muestra canónico y uno no reconocido se conserva', () => {
      paramId = '7';
      svc.get.and.returnValue(of({ id: 7, nombre: 'N', apellido: 'A', activo: true,
        departamento: 'PAYSANDÚ', departamentoCredencial: 'Tacuarembo', departamentoLaboral: 'ARGENTINA' } as Contacto));
      const f = TestBed.createComponent(AgendaNuevoComponent);
      f.detectChanges();
      const c = f.componentInstance.c;
      expect(c.departamento).toBe('Paysandú');
      expect(c.departamentoCredencial).toBe('Tacuarembó');
      expect(c.departamentoLaboral).toBe('ARGENTINA');
      const opciones = Array.from((f.nativeElement as HTMLElement).querySelectorAll('select[name="depLab"] option'))
        .map(o => o.textContent?.trim());
      expect(opciones).toContain('ARGENTINA');
    });
  });

  describe('nueva-ficha (DEBT-016, AC-8/AC-9)', () => {
    function montar(departamento: string | undefined) {
      const contactos = jasmine.createSpyObj('ContactosService', ['get']);
      contactos.get.and.returnValue(of({ id: 3, nombre: 'N', apellido: 'A', departamento } as Contacto));
      TestBed.configureTestingModule({
        imports: [NuevaFichaComponent],
        providers: [
          provideHttpClient(), provideHttpClientTesting(),
          { provide: ContactosService, useValue: contactos },
          { provide: AdhesionesService, useValue: jasmine.createSpyObj('AdhesionesService', ['createLocal']) },
          provideRouter([]), // el template usa routerLink: necesita un Router real
          { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '3' } } } },
        ],
      });
      return TestBed.createComponent(NuevaFichaComponent).componentInstance;
    }

    it('contacto con "PAYSANDÚ" precarga "Paysandú"', () => {
      expect(montar('PAYSANDÚ').ficha()?.departamentoAgrupacion).toBe('Paysandú');
    });

    it('contacto sin departamento reconocible deja el campo vacío', () => {
      expect(montar('ARGENTINA').ficha()?.departamentoAgrupacion).toBeUndefined();
      TestBed.resetTestingModule();
      expect(montar(undefined).ficha()?.departamentoAgrupacion).toBeUndefined();
    });
  });

  it('agrupaciones pendientes: el formulario usa la lista canónica + Nacional', () => {
    TestBed.configureTestingModule({
      imports: [AgrupacionesPendientesComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const c = TestBed.createComponent(AgrupacionesPendientesComponent).componentInstance as any;
    expect(c.deptos).toBe(DEPARTAMENTOS_CON_NACIONAL);
    expect(c.opcionesDepto(c.deptos, 'C')).toContain('C'); // letra de serie guardada se conserva
  });
});

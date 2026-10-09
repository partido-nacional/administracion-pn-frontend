import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AgendaListadoComponent, esMoroso, AVISO_MOROSIDAD } from './agenda-listado.component';
import { ContactosService, Contacto, ContactoListado } from './contactos.service';
import { PagedResult } from '../../core/models/paged';

describe('AgendaListadoComponent', () => {
  let svcSpy: jasmine.SpyObj<ContactosService>;

  const fila = (id: number, situacion?: string): ContactoListado =>
    ({ id, nombre: `N${id}`, apellido: `A${id}`, situacion });

  const paged = (items: ContactoListado[]): PagedResult<ContactoListado> =>
    ({ items, total: items.length, page: 1, pageSize: 20 });

  beforeEach(() => {
    svcSpy = jasmine.createSpyObj('ContactosService', ['listado', 'get', 'duplicados']);
    svcSpy.listado.and.returnValue(of(paged([])));
    svcSpy.get.and.returnValue(of({ id: 1 } as Contacto));

    TestBed.configureTestingModule({
      imports: [AgendaListadoComponent],
      providers: [
        { provide: ContactosService, useValue: svcSpy },
        provideRouter([]),
      ],
    });
  });

  function montar(filas: ContactoListado[]): ComponentFixture<AgendaListadoComponent> {
    svcSpy.listado.and.returnValue(of(paged(filas)));
    const f = TestBed.createComponent(AgendaListadoComponent);
    f.detectChanges();
    return f;
  }

  /** Despliega la fila del contacto y resuelve el detalle con la situación indicada. */
  function desplegar(f: ComponentFixture<AgendaListadoComponent>, id: number, situacion?: string) {
    svcSpy.get.and.returnValue(of({ id, nombre: 'N', apellido: 'A', situacion } as Contacto));
    f.componentInstance.toggle(id);
    f.detectChanges();
  }

  function filaDe(f: ComponentFixture<AgendaListadoComponent>, indice: number): HTMLTableRowElement {
    return f.nativeElement.querySelectorAll('tbody tr.clickable')[indice];
  }

  // ── Criterio de morosidad (BR-1) ───────────────────────────
  it('esMoroso reconoce la M sin importar mayúsculas ni espacios', () => {
    expect(esMoroso('M')).toBeTrue();
    expect(esMoroso('m')).toBeTrue();
    expect(esMoroso(' M ')).toBeTrue();
    expect(esMoroso('m ')).toBeTrue();
  });

  it('esMoroso descarta vacíos y otras situaciones del catálogo', () => {
    expect(esMoroso(undefined)).toBeFalse();
    expect(esMoroso(null)).toBeFalse();
    expect(esMoroso('')).toBeFalse();
    expect(esMoroso('   ')).toBeFalse();
    // 'SM' contiene una M pero no es morosidad: la comparación es por igualdad, no substring.
    expect(esMoroso('SM')).toBeFalse();
    expect(esMoroso('PC')).toBeFalse();
    expect(esMoroso('MA')).toBeFalse();
  });

  // ── US-1: resaltado de la fila ─────────────────────────────
  it('AC-1: la fila de un contacto moroso recibe la clase moroso', () => {
    const f = montar([fila(1, 'M')]);
    expect(filaDe(f, 0).classList).toContain('moroso');
  });

  it('feature 037: la fila morosa se pinta de rojo #e85d5d; la común no', () => {
    const f = montar([fila(1, 'M'), fila(2)]);
    document.body.appendChild(f.nativeElement);   // getComputedStyle necesita el elemento en el DOM
    expect(getComputedStyle(filaDe(f, 0)).backgroundColor).toBe('rgb(232, 93, 93)');
    expect(getComputedStyle(filaDe(f, 1)).backgroundColor).not.toBe('rgb(232, 93, 93)');
    f.nativeElement.remove();
  });

  it('AC-2: la fila de un contacto con otra situación no la recibe', () => {
    const f = montar([fila(1, 'PC'), fila(2)]);
    expect(filaDe(f, 0).classList).not.toContain('moroso');
    expect(filaDe(f, 1).classList).not.toContain('moroso');
  });

  it('AC-4: la fila morosa desplegada conserva "moroso" junto a "selected"', () => {
    const f = montar([fila(1, 'M')]);
    desplegar(f, 1, 'M');

    const tr = filaDe(f, 0);
    expect(tr.classList).toContain('selected');
    expect(tr.classList).toContain('moroso');
  });

  it('AC-5: la fila no morosa desplegada recibe "selected" sin "moroso"', () => {
    const f = montar([fila(1, 'PC')]);
    desplegar(f, 1, 'PC');

    const tr = filaDe(f, 0);
    expect(tr.classList).toContain('selected');
    expect(tr.classList).not.toContain('moroso');
  });

  it('EC-5: sin situacion en el listado (backend sin el campo) ninguna fila se resalta', () => {
    const f = montar([fila(1), fila(2), fila(3)]);
    const filas = f.nativeElement.querySelectorAll('tbody tr.clickable');
    expect(filas.length).toBe(3);
    filas.forEach((tr: HTMLTableRowElement) => expect(tr.classList).not.toContain('moroso'));
  });

  // ── US-2: cartel al desplegar ──────────────────────────────
  it('AC-7: al desplegar un moroso aparece el texto exacto de la advertencia', () => {
    const f = montar([fila(1, 'M')]);
    desplegar(f, 1, 'M');

    const aviso = f.nativeElement.querySelector('.aviso-morosidad');
    expect(aviso).toBeTruthy();
    expect(aviso.textContent.trim()).toBe(AVISO_MOROSIDAD);
    expect(AVISO_MOROSIDAD).toContain('CONSULTAR CON CCH');
  });

  it('AC-9: al desplegar un no moroso el cartel no está en el DOM', () => {
    const f = montar([fila(1, 'PC')]);
    desplegar(f, 1, 'PC');

    expect(f.nativeElement.querySelector('.aviso-morosidad')).toBeNull();
  });

  it('AC-8: el cartel es el primer elemento del área desplegada', () => {
    const f = montar([fila(1, 'M')]);
    desplegar(f, 1, 'M');

    // Si termina debajo de las secciones de datos hay que scrollear para verlo,
    // y el aviso pierde el sentido. Se verifica por posición, no sólo por presencia.
    const wrap = f.nativeElement.querySelector('.detalle-wrap');
    expect(wrap.firstElementChild.classList).toContain('aviso-morosidad');
  });

  it('AC-10: el área desplegada de un moroso se tiñe en sus dos capas', () => {
    const f = montar([fila(1, 'M')]);
    desplegar(f, 1, 'M');

    expect(f.nativeElement.querySelector('tr.detalle-row').classList).toContain('moroso');
    expect(f.nativeElement.querySelector('.detalle-wrap').classList).toContain('moroso');
  });

  it('la situación del cartel sale del detalle, no de la fila del listado', () => {
    // El listado puede no traer situacion (backend viejo) y el detalle sí: el cartel
    // debe aparecer igual, porque GET /contactos/{id} ya devolvía el campo.
    const f = montar([fila(1)]);
    desplegar(f, 1, 'M');

    expect(f.nativeElement.querySelector('.aviso-morosidad')).toBeTruthy();
    expect(filaDe(f, 0).classList).not.toContain('moroso');
  });

  it('si falla la carga muestra el error con Reintentar, no "Sin contactos"', () => {
    svcSpy.listado.and.returnValue(throwError(() => new Error('500')));
    const f = TestBed.createComponent(AgendaListadoComponent);
    f.detectChanges();
    const txt = (f.nativeElement as HTMLElement).querySelector('tbody')!.textContent!;
    expect(txt).toContain('No se pudo cargar la agenda');
    expect(txt).not.toContain('Sin contactos');

    svcSpy.listado.and.returnValue(of(paged([fila(1)])));
    f.componentInstance.reintentar();
    f.detectChanges();
    expect(f.componentInstance.errorCarga()).toBeFalse();
    expect(f.componentInstance.items().length).toBe(1);
  });
});

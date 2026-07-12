import { Component } from '@angular/core';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ListStateComponent } from './list-state.component';

@Component({
  standalone: true,
  imports: [ListStateComponent],
  template: `
    <app-list-state [state]="state" [emptyText]="'Nada por aquí'" (retry)="reintentos = reintentos + 1">
      <div class="contenido">TABLA</div>
    </app-list-state>
  `,
})
class HostComponent {
  state: 'loading' | 'error' | 'empty' | 'ready' = 'ready';
  reintentos = 0;
}

describe('ListStateComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HostComponent] });
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
  });

  const html = () => fixture.nativeElement.innerHTML as string;

  it('ready → proyecta el contenido', () => {
    host.state = 'ready'; fixture.detectChanges();
    expect(html()).toContain('TABLA');
  });

  it('loading → muestra cargando y oculta el contenido', () => {
    host.state = 'loading'; fixture.detectChanges();
    expect(html()).toContain('Cargando');
    expect(html()).not.toContain('TABLA');
  });

  it('empty → muestra el emptyText', () => {
    host.state = 'empty'; fixture.detectChanges();
    expect(html()).toContain('Nada por aquí');
    expect(html()).not.toContain('TABLA');
  });

  it('error → botón Reintentar emite retry', () => {
    host.state = 'error'; fixture.detectChanges();
    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('.ls-retry');
    expect(btn).toBeTruthy();
    btn.click();
    expect(host.reintentos).toBe(1);
  });
});

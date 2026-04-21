import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent) },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell.component').then(m => m.ShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'inicio' },
      { path: 'inicio', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'agenda', loadComponent: () => import('./features/agenda/agenda-listado.component').then(m => m.AgendaListadoComponent) },
      { path: 'agenda/nuevo', loadComponent: () => import('./features/agenda/agenda-nuevo.component').then(m => m.AgendaNuevoComponent) },
      { path: 'agenda/:id', loadComponent: () => import('./features/agenda/agenda-nuevo.component').then(m => m.AgendaNuevoComponent) },
      { path: 'adhesiones', loadComponent: () => import('./features/adhesiones/adhesiones-listado.component').then(m => m.AdhesionesListadoComponent) },
      { path: 'productos', loadComponent: () => import('./features/productos/productos.component').then(m => m.ProductosComponent) },
      { path: 'listados', loadComponent: () => import('./features/listados/listados.component').then(m => m.ListadosComponent) },
      { path: 'debitos', loadComponent: () => import('./features/debitos/debitos.component').then(m => m.DebitosComponent) },
      { path: 'organismos', loadComponent: () => import('./features/organismos/organismos.component').then(m => m.OrganismosComponent) },
      { path: 'agrupaciones', loadComponent: () => import('./features/agrupaciones/agrupaciones.component').then(m => m.AgrupacionesComponent) },
      { path: 'convencionales', loadComponent: () => import('./features/convencionales/convencionales.component').then(m => m.ConvencionalesComponent) }
    ]
  },
  { path: '**', redirectTo: '' }
];

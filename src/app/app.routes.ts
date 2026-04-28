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
      { path: 'agenda/:contactoId/fichas/nueva', loadComponent: () => import('./features/adhesiones/nueva-ficha.component').then(m => m.NuevaFichaComponent) },
      { path: 'agenda/:contactoId/fichas', loadComponent: () => import('./features/adhesiones/fichas-contacto.component').then(m => m.FichasContactoComponent) },
      { path: 'agenda/:contactoId/organismos', loadComponent: () => import('./features/organismos/integrantes-contacto.component').then(m => m.IntegrantesContactoComponent) },
      { path: 'agenda/:id', loadComponent: () => import('./features/agenda/agenda-nuevo.component').then(m => m.AgendaNuevoComponent) },
      { path: 'adhesiones', loadComponent: () => import('./features/adhesiones/adhesiones-listado.component').then(m => m.AdhesionesListadoComponent) },
      { path: 'productos', loadComponent: () => import('./features/productos/productos.component').then(m => m.ProductosComponent) },
      { path: 'listados', pathMatch: 'full', redirectTo: 'listados/movimientos' },
      { path: 'listados/movimientos', loadComponent: () => import('./features/listados/movimientos.component').then(m => m.MovimientosComponent) },
      { path: 'listados/parlamentarias', loadComponent: () => import('./features/listados/parlamentarias.component').then(m => m.ParlamentariasComponent) },
      { path: 'listados/gobierno', loadComponent: () => import('./features/listados/gobierno.component').then(m => m.GobiernoComponent) },
      { path: 'listados/departamentales', loadComponent: () => import('./features/listados/departamentales.component').then(m => m.DepartamentalesComponent) },
      { path: 'listados/intendencias-nacionalistas', loadComponent: () => import('./features/listados/intendencias-nac.component').then(m => m.IntendenciasNacComponent) },
      { path: 'listados/intendencias-pn', loadComponent: () => import('./features/listados/intendencias-pn.component').then(m => m.IntendenciasPnComponent) },
      { path: 'listados/alcaldes', loadComponent: () => import('./features/listados/alcaldes.component').then(m => m.AlcaldesComponent) },
      { path: 'listados/jovenes', loadComponent: () => import('./features/listados/jovenes.component').then(m => m.JovenesComponent) },
      { path: 'listados/convencionales', loadComponent: () => import('./features/listados/convencionales-listado.component').then(m => m.ConvencionalesListadoComponent) },
      { path: 'listados/directorio', loadComponent: () => import('./features/listados/directorio.component').then(m => m.DirectorioComponent) },
      { path: 'debitos', loadComponent: () => import('./features/debitos/debitos.component').then(m => m.DebitosComponent) },
      { path: 'organismos', loadComponent: () => import('./features/organismos/organismos.component').then(m => m.OrganismosComponent) },
      { path: 'agrupaciones', loadComponent: () => import('./features/agrupaciones/agrupaciones.component').then(m => m.AgrupacionesComponent) },
      { path: 'convencionales', loadComponent: () => import('./features/convencionales/convencionales.component').then(m => m.ConvencionalesComponent) }
    ]
  },
  { path: '**', redirectTo: '' }
];

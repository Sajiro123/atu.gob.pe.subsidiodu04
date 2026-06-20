import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'carga',
        pathMatch: 'full'
      },
      {
        path: 'carga',
        loadComponent: () =>
          import('./pages/dashboard/pages/carga/carga.component').then(m => m.CargaComponent)
      },
      {
        path: 'registros',
        loadComponent: () =>
          import('./pages/dashboard/pages/registros/registros.component').then(m => m.RegistrosComponent)
      },
      {
        path: 'historial',
        loadComponent: () =>
          import('./pages/dashboard/pages/historial/historial.component').then(m => m.HistorialComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];

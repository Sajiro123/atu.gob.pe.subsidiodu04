import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    loadComponent: () =>
      import('./components/shell/shell.component').then(
        (m) => m.ShellComponent,
      ),
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent,
          ),
      },

      {
        path: 'vehiculo-empresa',
        loadComponent: () =>
          import('./pages/funcionario/vehiculo-empresa/vehiculo-empresa.component').then(
            (m) => m.VehiculoEmpresaComponent,
          ),
      },
      {
        path: 'perfil',
        loadComponent: () =>
          import('./pages/perfil/perfil-info.component').then(
            (m) => m.PerfilInfoComponent,
          ),
      },
      {
        path: 'empresas',
        loadComponent: () =>
          import('./pages/funcionario/empresas/empresas.component').then(
            (m) => m.EmpresasComponent,
          ),
      },
      {
        path: 'registros',
        loadComponent: () =>
          import('./pages/pages/registros/registros.component').then(
            (m) => m.RegistrosComponent,
          ),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];

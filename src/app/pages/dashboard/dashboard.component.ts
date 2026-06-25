import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ApiAuthService } from '../../core/services/api-auth.service';
import { CargaService } from '../../core/services/carga.service';
import { Usuario } from '../../core/models/models';

interface KpiCard {
  label: string;
  icon: string;
  value: number | string;
  sub: string;
  accent: string;
  subColor: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  usuario: Usuario | null = null;

  private readonly authService = inject(AuthService);
  private readonly apiAuthService = inject(ApiAuthService);
  private readonly cargaService = inject(CargaService);
  private readonly router = inject(Router);

  // ── KPI: Empresas por tipo de servicio ─────────────────
  kpisEmp: KpiCard[] = [
    {
      label: 'Transporte Nacional Regular',
      icon: '🚌',
      value: 24,
      sub: '+2 este mes',
      accent: '#0E5A8A',
      subColor: '#15803D',
    },
    {
      label: 'Transporte de Mercancías',
      icon: '🚛',
      value: 11,
      sub: 'Sin cambios',
      accent: '#E0A042',
      subColor: '#6E8090',
    },
    {
      label: 'Transporte Escolar',
      icon: '🏫',
      value: 6,
      sub: '+1 nuevo',
      accent: '#15803D',
      subColor: '#15803D',
    },
    {
      label: 'Turismo',
      icon: '✈️',
      value: 3,
      sub: 'Sin cambios',
      accent: '#C0392B',
      subColor: '#6E8090',
    },
  ];

  // ── KPI: Vehículos cargados ─────────────────────────────
  kpisVeh: KpiCard[] = [
    {
      label: 'Total cargados',
      icon: '🚗',
      value: 0,
      sub: 'Padrón actual',
      accent: '#0E5A8A',
      subColor: '#46586A',
    },
    {
      label: 'TUC Vigente',
      icon: '✅',
      value: 9,
      sub: 'Habilitados',
      accent: '#15803D',
      subColor: '#15803D',
    },
    {
      label: 'Por vencer (<30 días)',
      icon: '⚠️',
      value: 2,
      sub: 'Requieren atención',
      accent: '#E0A042',
      subColor: '#B45309',
    },
    {
      label: 'TUC Vencido',
      icon: '❌',
      value: 1,
      sub: 'Retirar o actualizar',
      accent: '#C0392B',
      subColor: '#C0392B',
    },
  ];

  get primerNombre(): string {
    return this.usuario?.nombre?.split(' ')[0] ?? 'Funcionario';
  }

  get avatarLetter(): string {
    return this.usuario?.nombre?.charAt(0).toUpperCase() ?? 'U';
  }

  get totalCargados(): number {
    return this.cargaService.getResumen().total;
  }

  ngOnInit(): void {
    this.usuario = this.resolveSession();
    // Update vehicles KPI with real data from service
    this.kpisVeh[0].value = this.totalCargados;
  }

  private resolveSession(): Usuario | null {
    const local = this.authService.getSession();
    if (local) return local;

    const api = this.apiAuthService.getSession();
    if (api) {
      return {
        email: '',
        password: '',
        nombre: api.user.nombrePersona,
        primerApellido: api.user.apellidoPaterno,
        segundoApellido: api.user.apellidoMaterno,
        entidad: api.user.nombreEntidad,
        tipoEntidad: 'regional',
      } as Usuario;
    }
    return null;
  }

  goEmpresas(): void {
    this.router.navigate(['/empresas']);
  }

  goVehiculos(): void {
    this.router.navigate(['/vehiculo-empresa']);
  }
}

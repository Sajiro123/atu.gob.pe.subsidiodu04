import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { CargaService } from '../../core/services/carga.service';
import { Usuario } from '../../core/models/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {

  usuario: Usuario | null = null;
  sidebarOpen = false;
  currentYear = new Date().getFullYear();

  // ── Profile / Change Password State ──────────────────────
  modalPerfilOpen = false;
  passActual = '';
  passNueva = '';
  passConfirmar = '';
  perfilAlert: { message: string; type: 'error' | 'success' } | null = null;

  private readonly authService = inject(AuthService);
  private readonly cargaService = inject(CargaService);
  private readonly router      = inject(Router);


  ngOnInit(): void {
    this.usuario = this.authService.getSession();
    if (!this.usuario) {
      this.router.navigate(['/login']);
    }
  }

  get totalCargados(): number {
    return this.cargaService.getResumen().total;
  }

  get avatarLetter(): string {
    return this.usuario?.nombre?.charAt(0).toUpperCase() ?? 'U';
  }

  get tipoLabel(): string {
    return this.usuario?.tipoEntidad === 'regional' ? 'GR' : 'MP';
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebar(): void {
    this.sidebarOpen = false;
  }

  onLogout(): void {
    if (confirm('¿Cerrar sesión?')) {
      this.authService.logout();
      this.router.navigate(['/login']);
    }
  }

  // ── Change Password Modal Actions ──────────────────────
  abrirPerfil(): void {
    this.modalPerfilOpen = true;
    this.passActual = '';
    this.passNueva = '';
    this.passConfirmar = '';
    this.perfilAlert = null;
  }

  cerrarPerfil(): void {
    this.modalPerfilOpen = false;
  }

  onSavePassword(): void {
    this.perfilAlert = null;
    if (!this.usuario) return;

    if (!this.passActual || !this.passNueva || !this.passConfirmar) {
      this.perfilAlert = { message: 'Todos los campos son obligatorios.', type: 'error' };
      return;
    }
    if (this.passNueva !== this.passConfirmar) {
      this.perfilAlert = { message: 'Las nuevas contraseñas no coinciden.', type: 'error' };
      return;
    }

    const res = this.authService.changePassword(this.usuario.email, this.passActual, this.passNueva);
    if (res.success) {
      this.perfilAlert = { message: 'Contraseña actualizada con éxito.', type: 'success' };
      this.usuario = this.authService.getSession();
      setTimeout(() => this.cerrarPerfil(), 1500);
    } else {
      this.perfilAlert = { message: res.error || 'Error al cambiar la contraseña.', type: 'error' };
    }
  }
}

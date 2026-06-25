import { Component, OnInit, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ApiAuthService } from '../../core/services/api-auth.service';
import { SessionService } from '../../core/services/session.service';
import { CargaService } from '../../core/services/carga.service';
import { ThemeService } from '../../core/services/theme.service';
import { Usuario } from '../../core/models/models';

import { SidebarFooterComponent } from '../sidebar-footer/sidebar-footer.component';
import { SidebarNavComponent } from '../sidebar-nav/sidebar-nav.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    FormsModule,
    SidebarNavComponent,
    SidebarFooterComponent,
  ],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class ShellComponent implements OnInit {
  usuario: Usuario | null = null;
  sidebarOpen = true;
  currentYear = new Date().getFullYear();

  // ── User Dropdown State ─────────────────────────────────
  showUserMenu = false;

  readonly themeService = inject(ThemeService);
  private readonly authService    = inject(AuthService);
  private readonly apiAuthService = inject(ApiAuthService);
  private readonly sessionService = inject(SessionService);
  private readonly cargaService   = inject(CargaService);
  private readonly router         = inject(Router);

  get isDark(): boolean {
    return this.themeService.isDark();
  }
  toggleTheme(): void {
    this.themeService.toggle();
  }

  ngOnInit(): void {
    this.usuario = this.resolveSession();
    if (!this.usuario) {
      this.router.navigate(['/login']);
      return;
    }
    // Si hay una sesión JWT activa y el timer no está corriendo (ej: refresh de página),
    // iniciamos el contador de expiración.
    if (this.apiAuthService.isLoggedIn() && this.sessionService.remainingSeconds$.value < 0) {
      this.sessionService.startSession();
    }
  }

  /**
   * Resuelve la sesión activa:
   * 1. Busca en localStorage (sesión local / registro previo)
   * 2. Si no existe, construye un Usuario compatible desde la sesión JWT (API)
   */
  private resolveSession(): Usuario | null {
    // 1. Sesión local (localStorage — sistema anterior)
    const local = this.authService.getSession();
    if (local) return local;

    // 2. Sesión API (JWT en sessionStorage)
    const api = this.apiAuthService.getSession();
    if (api) {
      return {
        email: '',
        password: '',
        nombre: api.user.nombrePersona,
        primerApellido: api.user.apellidoPaterno,
        segundoApellido: api.user.apellidoMaterno,
        entidad: api.user.nombreEntidad,
        tipoEntidad: 'regional', // default; el API no devuelve este campo aún
      } as Usuario;
    }

    return null;
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

  // ── Dropdown ────────────────────────────────────────────
  toggleUserMenu(event: Event): void {
    event.stopPropagation();
    this.showUserMenu = !this.showUserMenu;
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.showUserMenu = false;
  }

  onLogout(): void {
    if (confirm('¿Cerrar sesión?')) {
      this.sessionService.stopSession();
      this.authService.logout();
      this.apiAuthService.clearSession();
      this.router.navigate(['/login']);
    }
  }

  // ── Profile Navigation ──────────────────────────────────
  abrirPerfil(): void {
    this.router.navigate(['/perfil']);
  }
}

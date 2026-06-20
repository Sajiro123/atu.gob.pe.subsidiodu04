import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, REGIONALES, MUNICIPALES } from '../../core/services/auth.service';

type FormView = 'login' | 'registro' | 'recuperacion';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {

  // ── View state ────────────────────────────────────────
  activeForm: FormView = 'login';
  showPassword   = false;
  showPassword2  = false;
  isLoading      = false;

  // ── Alert ─────────────────────────────────────────────
  alert: { message: string; type: 'error' | 'success' | 'info' } | null = null;

  // ── Login form ────────────────────────────────────────
  loginEmail    = '';
  loginPassword = '';

  // ── Register form ─────────────────────────────────────
  regEmail      = '';
  regPassword   = '';
  regPassword2  = '';
  regNombre     = '';
  regTipoEntidad: 'regional' | 'municipal' = 'regional';
  regEntidad    = '';
  regDocumentoCargo = '';

  // ── Recovery form ─────────────────────────────────────
  recEmail = '';

  // ── Entity lists ──────────────────────────────────────
  entidadesFiltradas: string[] = [];

  private readonly authService = inject(AuthService);
  private readonly router      = inject(Router);


  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/dashboard']);
      return;
    }
    this.actualizarEntidades();
  }

  // ── Helpers ───────────────────────────────────────────
  showForm(form: FormView): void {
    this.activeForm = form;
    this.alert = null;
    if (form === 'registro') this.actualizarEntidades();
  }

  actualizarEntidades(): void {
    this.entidadesFiltradas = this.regTipoEntidad === 'regional' ? REGIONALES : MUNICIPALES;
    this.regEntidad = this.entidadesFiltradas[0] ?? '';
  }

  onFileCargoChange(event: any): void {
    const file = event.target?.files?.[0];
    if (file) {
      this.regDocumentoCargo = file.name;
    }
  }

  showAlert(message: string, type: 'error' | 'success' | 'info'): void {
    this.alert = { message, type };
  }

  clearAlert(): void { this.alert = null; }

  // ── Login ─────────────────────────────────────────────
  onLogin(): void {
    this.clearAlert();
    this.isLoading = true;
    setTimeout(() => {  // simulated async
      const res = this.authService.login(this.loginEmail.trim(), this.loginPassword);
      this.isLoading = false;
      if (res.success) {
        this.router.navigate(['/dashboard']);
      } else {
        this.showAlert(res.error!, 'error');
      }
    }, 400);
  }

  onLoginKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter') this.onLogin();
  }

  // ── Register ──────────────────────────────────────────
  onRegister(): void {
    this.clearAlert();
    const res = this.authService.register({
      email:          this.regEmail.trim(),
      password:       this.regPassword,
      password2:      this.regPassword2,
      nombre:         this.regNombre.trim(),
      tipoEntidad:    this.regTipoEntidad,
      entidad:        this.regEntidad,
      documentoCargo: this.regDocumentoCargo.trim()
    });
    if (res.success) {
      this.showAlert('Registro exitoso. Ahora puedes iniciar sesión.', 'success');
      setTimeout(() => this.showForm('login'), 1600);
    } else {
      this.showAlert(res.error!, 'error');
    }
  }

  // ── Recovery ──────────────────────────────────────────
  onRecovery(): void {
    this.clearAlert();
    const res = this.authService.solicitarRecuperacion(this.recEmail.trim());
    if (res.success) {
      this.showAlert(res.message!, 'success');
    } else {
      this.showAlert(res.error!, 'error');
    }
  }

  // ── Alert icon ────────────────────────────────────────
  get alertIcon(): string {
    if (!this.alert) return '';
    return this.alert.type === 'error'   ? 'error'
         : this.alert.type === 'success' ? 'check_circle'
         : 'info';
  }
}

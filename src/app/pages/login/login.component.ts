import { Component, OnInit, OnDestroy, inject, NgZone, AfterViewInit } from '@angular/core';
import { environment } from '../../../environments/environment';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  AuthService,
  REGIONALES,
  MUNICIPALES,
} from '../../core/services/auth.service';
import { ApiAuthService } from '../../core/services/api-auth.service';
import { SessionService } from '../../core/services/session.service';
import { ApiErrorResponse } from '../../core/models/api.models';
import { ThemeService } from '../../core/services/theme.service';
import Swal from 'sweetalert2';

// Declarar el objeto grecaptcha global (inyectado por el script de Google)
declare const grecaptcha: any;

type FormView = 'login' | 'registro' | 'recuperacion';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit, AfterViewInit, OnDestroy {
  // ── Theme State ───────────────────────────────────────
  readonly themeService = inject(ThemeService);
  get isDark(): boolean {
    return this.themeService.isDark();
  }
  toggleTheme(): void {
    this.themeService.toggle();
  }
  get themeLabel(): string {
    return this.themeService.isDark() ? 'Modo claro' : 'Modo oscuro';
  }
  get themeIcon(): string {
    return this.themeService.isDark() ? '☀️' : '🌙';
  }

  // ── View state ────────────────────────────────────────
  activeForm: FormView = 'login';
  showPassword = false;
  showPassword2 = false;
  isLoading = false;

  // ── reCAPTCHA ─────────────────────────────────────────
  /** ID del widget reCAPTCHA renderizado en la vista actual */
  recaptchaWidgetId: number | null = null;

  /** Token devuelto por reCAPTCHA v2 al resolver el desafío */
  recaptchaToken: string | null = null;
  /** Indica si el reCAPTCHA ya fue resuelto */
  get captchaResolved(): boolean {
    return !!this.recaptchaToken;
  }

  // ── Slider state ──────────────────────────────────────
  sliderImages = [
    'images/AV1I2768.jpg',
    'images/AV1I2651.jpg',
    'images/AV1I2703.jpg',
  ];
  currentSlide = 0;
  private sliderInterval: any;

  // ── Alert ─────────────────────────────────────────────
  alert: { message: string; type: 'error' | 'success' | 'info' } | null = null;

  // ── Login form ────────────────────────────────────────
  loginEmail = '';
  loginPassword = '';

  // ── Register form ─────────────────────────────────────
  regEmail = '';
  regPassword = '';
  regPassword2 = '';
  regNombre = '';
  regTipoEntidad: 'regional' | 'municipal' = 'regional';
  regEntidad = '';
  regDocumentoCargo = '';
  regTipoUsuario: 'empresa' | 'municipalidad' = 'municipalidad';
  regEmpresaNombre = '';

  // ── Transportista Form Fields ─────────────────────────
  tpTipoPersona: 'Natural' | 'Jurídica' | '' = '';
  tpTipoDocumento: 'DNI' | 'RUC' | 'Pasaporte' | 'Carnet de Extranjería' | '' =
    '';
  tpNumDocumento = '';
  tpNombres = '';
  tpPrimerApellido = '';
  tpSegundoApellido = '';
  tpEmail = '';
  tpEmailVerificado = false;

  tpDepartamento = '';
  tpProvincia = '';
  tpDistrito = '';
  tpVia = '';
  tpDireccion = '';
  tpNumeroMzLt = '';
  tpReferencia = '';

  // ── Ubigeo Data ───────────────────────────────────────
  departamentosList = ['Lima', 'Arequipa', 'La Libertad'];

  provinciasMap: Record<string, string[]> = {
    Lima: ['Lima', 'Barranca', 'Cañete'],
    Arequipa: ['Arequipa', 'Camaná', 'Caylloma'],
    'La Libertad': ['Trujillo', 'Ascope', 'Pacasmayo'],
  };

  distritosMap: Record<string, string[]> = {
    Lima: ['Miraflores', 'San Isidro', 'Santiago de Surco', 'Lima Centro'],
    Barranca: ['Barranca', 'Supe', 'Pativilca'],
    Cañete: ['San Vicente de Cañete', 'Imperial', 'Mala'],
    Arequipa: ['Arequipa', 'Cayma', 'Yanahuara', 'Bustamante y Rivero'],
    Camaná: ['Camaná', 'José María Quimper', 'Mariscal Cáceres'],
    Caylloma: ['Chivay', 'Majes', 'Yanque'],
    Trujillo: ['Trujillo', 'Víctor Larco Herrera', 'Huanchaco', 'La Esperanza'],
    Ascope: ['Ascope', 'Chicama', 'Casa Grande'],
    Pacasmayo: ['San Pedro de Lloc', 'Pacasmayo', 'Guadalupe'],
  };

  get provinciasList(): string[] {
    return this.tpDepartamento
      ? (this.provinciasMap[this.tpDepartamento] ?? [])
      : [];
  }

  get distritosList(): string[] {
    return this.tpProvincia ? (this.distritosMap[this.tpProvincia] ?? []) : [];
  }

  onDepartamentoChange(): void {
    this.tpProvincia = '';
    this.tpDistrito = '';
  }

  onProvinciaChange(): void {
    this.tpDistrito = '';
  }

  validarEmail(): void {
    if (!this.tpEmail || this.errEmail) {
      Swal.fire({
        title: 'Formato Inválido',
        text: 'Por favor, ingrese un formato de correo electrónico válido.',
        icon: 'warning',
        confirmButtonColor: '#0059bb',
      });
      return;
    }
    this.tpEmailVerificado = true;
    Swal.fire({
      title: '¡Email Validado!',
      text: 'El correo electrónico ha sido verificado con éxito.',
      icon: 'success',
      timer: 1600,
      showConfirmButton: false,
    });
  }

  onEmailChange(): void {
    this.tpEmailVerificado = false;
  }

  // ── Validation Errors Getters ─────────────────────────
  get errTipoPersona(): string {
    if (this.regTipoUsuario !== 'empresa') return '';
    return !this.tpTipoPersona ? 'El tipo de persona es requerido.' : '';
  }

  get errTipoDocumento(): string {
    if (this.regTipoUsuario !== 'empresa') return '';
    return !this.tpTipoDocumento ? 'El tipo de documento es requerido.' : '';
  }

  get errNumDocumento(): string {
    if (this.regTipoUsuario !== 'empresa') return '';
    if (!this.tpNumDocumento) return 'El número de documento es requerido.';
    if (this.tpTipoDocumento === 'DNI') {
      return !/^\d{8}$/.test(this.tpNumDocumento)
        ? 'DNI inválido (debe tener 8 dígitos)'
        : '';
    }
    if (this.tpTipoDocumento === 'RUC') {
      return !/^(10|20)\d{9}$/.test(this.tpNumDocumento)
        ? 'RUC inválido (11 dígitos, debe iniciar con 10 o 20)'
        : '';
    }
    return '';
  }

  get errNombres(): string {
    if (this.regTipoUsuario !== 'empresa') return '';
    if (!this.tpNombres) return 'Nombres es requerido.';
    return !/^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+$/.test(this.tpNombres)
      ? 'Solo debe aceptar letras y espacios.'
      : '';
  }

  get errPrimerApellido(): string {
    if (this.regTipoUsuario !== 'empresa') return '';
    if (!this.tpPrimerApellido) return 'El primer apellido es requerido.';
    return !/^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+$/.test(this.tpPrimerApellido)
      ? 'Solo debe aceptar letras y espacios.'
      : '';
  }

  get errSegundoApellido(): string {
    if (this.regTipoUsuario !== 'empresa') return '';
    if (
      this.tpSegundoApellido &&
      !/^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+$/.test(this.tpSegundoApellido)
    ) {
      return 'Solo debe aceptar letras y espacios.';
    }
    return '';
  }

  get errEmail(): string {
    if (this.regTipoUsuario !== 'empresa') return '';
    if (!this.tpEmail) return 'El email es requerido.';
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return !emailRegex.test(this.tpEmail) ? 'Formato de email inválido.' : '';
  }

  get errDepartamento(): string {
    if (this.regTipoUsuario !== 'empresa') return '';
    return !this.tpDepartamento ? 'El departamento es requerido.' : '';
  }

  get errProvincia(): string {
    if (this.regTipoUsuario !== 'empresa') return '';
    return !this.tpProvincia ? 'La provincia es requerida.' : '';
  }

  get errDistrito(): string {
    if (this.regTipoUsuario !== 'empresa') return '';
    return !this.tpDistrito ? 'El distrito es requerido.' : '';
  }

  get errVia(): string {
    if (this.regTipoUsuario !== 'empresa') return '';
    return !this.tpVia ? 'La vía es requerida.' : '';
  }

  get errDireccion(): string {
    if (this.regTipoUsuario !== 'empresa') return '';
    return !this.tpDireccion ? 'La dirección es requerida.' : '';
  }

  get errNumeroMzLt(): string {
    if (this.regTipoUsuario !== 'empresa') return '';
    if (!this.tpNumeroMzLt) return 'El número/manzana/lote es requerido.';
    return !/^[a-zA-Z0-9\s.,-]+$/.test(this.tpNumeroMzLt)
      ? 'Debe ser alfanumérico.'
      : '';
  }

  get errReferencia(): string {
    if (this.regTipoUsuario !== 'empresa') return '';
    return !this.tpReferencia ? 'La referencia es requerida.' : '';
  }

  get isFormTransportistaValido(): boolean {
    return (
      !this.errTipoPersona &&
      !this.errTipoDocumento &&
      !this.errNumDocumento &&
      !this.errNombres &&
      !this.errPrimerApellido &&
      !this.errSegundoApellido &&
      !this.errEmail &&
      !this.errDepartamento &&
      !this.errProvincia &&
      !this.errDistrito &&
      !this.errVia &&
      !this.errDireccion &&
      !this.errNumeroMzLt &&
      !this.errReferencia &&
      this.tpEmailVerificado &&
      !!this.regPassword &&
      this.regPassword === this.regPassword2
    );
  }

  // ── Recovery form ─────────────────────────────────────
  recEmail = '';

  // ── Entity lists ──────────────────────────────────────
  entidadesFiltradas: string[] = [];

  private readonly authService    = inject(AuthService);
  private readonly apiAuthService = inject(ApiAuthService);
  private readonly sessionService = inject(SessionService);
  private readonly router         = inject(Router);
  private readonly ngZone         = inject(NgZone);

  ngOnInit(): void {
    this.iniciarSlider();
    if (this.apiAuthService.isLoggedIn() || this.authService.isLoggedIn()) {
      this.router.navigate(['/dashboard']);
      return;
    }
    this.actualizarEntidades();
    this._loadRecaptchaScript();
  }

  ngAfterViewInit(): void {
    // Intentar renderizar el captcha después de que la vista esté lista.
    // Se reintenta hasta que el script de Google cargue.
    this._tryRenderRecaptcha();
  }

  ngOnDestroy(): void {
    if (this.sliderInterval) {
      clearInterval(this.sliderInterval);
    }
  }

  iniciarSlider(): void {
    this.sliderInterval = setInterval(() => {
      this.currentSlide = (this.currentSlide + 1) % this.sliderImages.length;
    }, 5000);
  }

  setSlide(index: number): void {
    this.currentSlide = index;
    clearInterval(this.sliderInterval);
    this.iniciarSlider();
  }

  // ── reCAPTCHA v2 ──────────────────────────────────────

  /**
   * Inyecta el script de Google reCAPTCHA en el <head> si aún no existe.
   * Usa onload callback para saber cuándo está disponible grecaptcha.
   */
  private _loadRecaptchaScript(): void {
    if (document.getElementById('recaptcha-script')) return;

    // Callback global que Angular puede disparar desde la zona correcta
    (window as any)['onRecaptchaLoad'] = () => {
      this.ngZone.run(() => this._tryRenderRecaptcha());
    };

    const script = document.createElement('script');
    script.id = 'recaptcha-script';
    script.src = 'https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoad&render=explicit';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }

  /** Renderiza el widget de reCAPTCHA en el contenedor #recaptcha-container */
  private _tryRenderRecaptcha(retries = 10): void {
    const container = document.getElementById('recaptcha-container');
    if (!container) {
      if (retries > 0) setTimeout(() => this._tryRenderRecaptcha(retries - 1), 400);
      return;
    }

    if (typeof grecaptcha !== 'undefined' && grecaptcha.render) {
      // Evitar doble renderizado si ya está instanciado en esta vista
      if (this.recaptchaWidgetId !== null) return;
      
      try {
        container.innerHTML = '';
        this.recaptchaWidgetId = grecaptcha.render('recaptcha-container', {
        sitekey: '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI', // Sitekey de prueba de Google
        callback: (token: string) => {
          this.ngZone.run(() => {
            this.recaptchaToken = token;
          });
        },
        'expired-callback': () => {
          this.ngZone.run(() => {
            this.recaptchaToken = null;
          });
        },
        'error-callback': () => {
          this.ngZone.run(() => {
            this.recaptchaToken = null;
          });
        },
        theme: this.isDark ? 'dark' : 'light',
      });
      } catch (e) {
        // En caso de que grecaptcha lance error al re-renderizar
        console.error('Error al renderizar reCAPTCHA:', e);
      }
    } else if (retries > 0) {
      // Script aún no cargó → reintentar en 400ms
      setTimeout(() => this._tryRenderRecaptcha(retries - 1), 400);
    }
  }

  /** Resetea el widget reCAPTCHA (útil tras un error de login) */
  private _resetRecaptcha(): void {
    if (this.recaptchaWidgetId !== null && typeof grecaptcha !== 'undefined') {
      grecaptcha.reset(this.recaptchaWidgetId);
    }
    this.recaptchaToken = null;
  }

  // ── Helpers ───────────────────────────────────────────
  showForm(form: FormView): void {
    this.activeForm = form;
    this.alert = null;
    if (form === 'registro') {
      this.actualizarEntidades();
    }
    if (form === 'login') {
      this.recaptchaWidgetId = null;
      this.recaptchaToken = null;
      // Esperamos al siguiente ciclo para que el DOM cree #recaptcha-container
      setTimeout(() => this._tryRenderRecaptcha(), 0);
    }
  }

  actualizarEntidades(): void {
    this.entidadesFiltradas =
      this.regTipoEntidad === 'regional' ? REGIONALES : MUNICIPALES;
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

  clearAlert(): void {
    this.alert = null;
  }

  // ── Login ─────────────────────────────────────────────
  onLogin(): void {
    this.clearAlert();

    // Sanitizar inputs
    const usuario  = this.loginEmail.trim();
    const password = this.loginPassword;

    if (!usuario || !password) {
      this.showAlert('Ingrese usuario y contraseña.', 'error');
      return;
    }

    // Validar que el reCAPTCHA fue resuelto (omitir en modo mock para agilizar desarrollo)
    if (!environment.USE_MOCK_API && !this.recaptchaToken) {
      this.showAlert('Por favor, complete el captcha de verificación.', 'error');
      return;
    }

    this.isLoading = true;

    this.apiAuthService
      .login(usuario, password, this.recaptchaToken ?? undefined)
      .subscribe({
        next: (res) => {
          this.isLoading = false;
          this.apiAuthService.saveSession(res);
          // Iniciar el timer de sesión de 15 minutos
          this.sessionService.startSession();
          this.router.navigate(['/dashboard']);
        },
        error: (err: ApiErrorResponse) => {
          this.isLoading = false;
          this._resetRecaptcha();
          // Usa el campo 'descripcion' del API si está disponible
          const msg =
            err?.descripcion || err?.message || 'Error al iniciar sesión.';
          this.showAlert(msg, 'error');
        },
      });
  }

  onLoginKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter') this.onLogin();
  }

  // ── Register ──────────────────────────────────────────
  onRegister(): void {
    const isEmpresa = this.regTipoUsuario === 'empresa';

    if (isEmpresa) {
      if (!this.isFormTransportistaValido) {
        this.showAlert(
          'Por favor, complete todos los campos obligatorios del transportista correctamente y verifique el email.',
          'error',
        );
        return;
      }
    }

    const emailVal = isEmpresa ? this.tpEmail.trim() : this.regEmail.trim();
    const nombreVal = isEmpresa
      ? `${this.tpNombres.trim()} ${this.tpPrimerApellido.trim()} ${this.tpSegundoApellido.trim()}`.trim()
      : this.regNombre.trim();
    const tipo = isEmpresa ? 'empresa' : this.regTipoEntidad;
    const entidadVal = isEmpresa
      ? `${this.tpNumDocumento.trim()} - ${this.tpNombres.trim()} ${this.tpPrimerApellido.trim()}`
      : this.regEntidad;
    const docVal = isEmpresa ? '' : this.regDocumentoCargo.trim();

    const res = this.authService.register({
      email: emailVal,
      password: this.regPassword,
      password2: this.regPassword2,
      nombre: nombreVal,
      tipoEntidad: tipo as any,
      entidad: entidadVal,
      documentoCargo: docVal,
      // Extended profile fields
      primerApellido: this.tpPrimerApellido.trim() || undefined,
      segundoApellido: this.tpSegundoApellido.trim() || undefined,
      tipoDocumento: this.tpTipoDocumento || undefined,
      numDocumento: this.tpNumDocumento.trim() || undefined,
      departamento: this.tpDepartamento || undefined,
      provincia: this.tpProvincia || undefined,
      distrito: this.tpDistrito || undefined,
      cargo: this.regDocumentoCargo.trim() || undefined,
    });
    if (res.success) {
      this.showAlert(
        'Registro exitoso. Ahora puedes iniciar sesión.',
        'success',
      );
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
    return this.alert.type === 'error'
      ? 'error'
      : this.alert.type === 'success'
        ? 'check_circle'
        : 'info';
  }
}



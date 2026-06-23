import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, REGIONALES, MUNICIPALES } from '../../core/services/auth.service';
import Swal from 'sweetalert2';

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
  showPassword = false;
  showPassword2 = false;
  isLoading = false;

  // ── Alert ─────────────────────────────────────────────
  alert: { message: string; type: 'error' | 'success' | 'info' } | null = null;

  // ── Login form ────────────────────────────────────────
  loginEmail = 'demo@region.gob.pe';
  loginPassword = 'demo123';

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
  tpTipoDocumento: 'DNI' | 'RUC' | 'Pasaporte' | 'Carnet de Extranjería' | '' = '';
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
    'Lima': ['Lima', 'Barranca', 'Cañete'],
    'Arequipa': ['Arequipa', 'Camaná', 'Caylloma'],
    'La Libertad': ['Trujillo', 'Ascope', 'Pacasmayo']
  };

  distritosMap: Record<string, string[]> = {
    'Lima': ['Miraflores', 'San Isidro', 'Santiago de Surco', 'Lima Centro'],
    'Barranca': ['Barranca', 'Supe', 'Pativilca'],
    'Cañete': ['San Vicente de Cañete', 'Imperial', 'Mala'],
    'Arequipa': ['Arequipa', 'Cayma', 'Yanahuara', 'Bustamante y Rivero'],
    'Camaná': ['Camaná', 'José María Quimper', 'Mariscal Cáceres'],
    'Caylloma': ['Chivay', 'Majes', 'Yanque'],
    'Trujillo': ['Trujillo', 'Víctor Larco Herrera', 'Huanchaco', 'La Esperanza'],
    'Ascope': ['Ascope', 'Chicama', 'Casa Grande'],
    'Pacasmayo': ['San Pedro de Lloc', 'Pacasmayo', 'Guadalupe']
  };

  get provinciasList(): string[] {
    return this.tpDepartamento ? (this.provinciasMap[this.tpDepartamento] ?? []) : [];
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
        confirmButtonColor: '#0059bb'
      });
      return;
    }
    this.tpEmailVerificado = true;
    Swal.fire({
      title: '¡Email Validado!',
      text: 'El correo electrónico ha sido verificado con éxito.',
      icon: 'success',
      timer: 1600,
      showConfirmButton: false
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
      return !/^\d{8}$/.test(this.tpNumDocumento) ? 'DNI inválido (debe tener 8 dígitos)' : '';
    }
    if (this.tpTipoDocumento === 'RUC') {
      return !/^(10|20)\d{9}$/.test(this.tpNumDocumento) ? 'RUC inválido (11 dígitos, debe iniciar con 10 o 20)' : '';
    }
    return '';
  }

  get errNombres(): string {
    if (this.regTipoUsuario !== 'empresa') return '';
    if (!this.tpNombres) return 'Nombres es requerido.';
    return !/^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+$/.test(this.tpNombres) ? 'Solo debe aceptar letras y espacios.' : '';
  }

  get errPrimerApellido(): string {
    if (this.regTipoUsuario !== 'empresa') return '';
    if (!this.tpPrimerApellido) return 'El primer apellido es requerido.';
    return !/^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+$/.test(this.tpPrimerApellido) ? 'Solo debe aceptar letras y espacios.' : '';
  }

  get errSegundoApellido(): string {
    if (this.regTipoUsuario !== 'empresa') return '';
    if (this.tpSegundoApellido && !/^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+$/.test(this.tpSegundoApellido)) {
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
    return !/^[a-zA-Z0-9\s.,-]+$/.test(this.tpNumeroMzLt) ? 'Debe ser alfanumérico.' : '';
  }

  get errReferencia(): string {
    if (this.regTipoUsuario !== 'empresa') return '';
    return !this.tpReferencia ? 'La referencia es requerida.' : '';
  }

  get isFormTransportistaValido(): boolean {
    return !this.errTipoPersona &&
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
      this.regPassword === this.regPassword2;
  }

  // ── Recovery form ─────────────────────────────────────
  recEmail = '';

  // ── Entity lists ──────────────────────────────────────
  entidadesFiltradas: string[] = [];

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);


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
    const isEmpresa = this.regTipoUsuario === 'empresa';

    if (isEmpresa) {
      if (!this.isFormTransportistaValido) {
        this.showAlert('Por favor, complete todos los campos obligatorios del transportista correctamente y verifique el email.', 'error');
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
      documentoCargo: docVal
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
    return this.alert.type === 'error' ? 'error'
      : this.alert.type === 'success' ? 'check_circle'
        : 'info';
  }
}

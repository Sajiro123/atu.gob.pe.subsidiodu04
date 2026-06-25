import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ApiAuthService } from '../../core/services/api-auth.service';
import { ApiUsuarioService } from '../../core/services/api-usuario.service';
import { CargaService } from '../../core/services/carga.service';
import { Usuario } from '../../core/models/models';

@Component({
  selector: 'app-perfil-info',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Header Section -->
      <div
        class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-atu-border dark:border-[#30363D] pb-4"
      >
        <div>
          <h1
            class="text-xl sm:text-2xl font-extrabold text-atu-text dark:text-[#E6EDF3] tracking-tight"
          >
            Mi Perfil
          </h1>
          <p class="text-sm text-atu-text-3 dark:text-[#6E7681] mt-1">
            Administre su información institucional y credenciales de acceso.
          </p>
        </div>
      </div>

      <!-- Main Grid -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- ── User Info Card (2/3) ── -->
        <div
          class="md:col-span-2 bg-white dark:bg-[#161B22] border border-atu-border dark:border-[#30363D] rounded-2xl shadow-sm dark:shadow-[0_1px_4px_rgba(0,0,0,0.3)] p-4 sm:p-6 space-y-6"
        >
          <!-- Avatar Row -->
          <div class="flex items-center gap-4 justify-between">
            <div class="flex items-center gap-4 min-w-0">
              <div
                class="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-atu-primary-soft dark:bg-[rgba(0,163,224,0.12)] text-atu-primary dark:text-[#00A3E0] border border-atu-border dark:border-[#30363D] flex items-center justify-center text-xl sm:text-2xl shrink-0"
              >
                <i class="fa-solid fa-user"></i>
              </div>
              <div class="min-w-0">
                <h2 class="text-base sm:text-lg font-bold text-atu-text dark:text-[#E6EDF3] truncate">
                  {{ usuario?.nombre }}
                </h2>
                <p class="text-xs text-atu-primary dark:text-[#00A3E0] font-semibold uppercase tracking-wider">
                  {{ tipoLabel }}
                </p>
              </div>
            </div>
            <!-- Botones Editar / Guardar / Cancelar -->
            <div class="flex items-center gap-2 shrink-0">
              @if (!editMode) {
                <button (click)="iniciarEdicion()"
                  class="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-bold bg-atu-primary text-white hover:bg-atu-primary-strong active:scale-[0.97] transition-all shadow-sm">
                  <i class="fa-solid fa-pen-to-square text-xs"></i>
                  <span class="hidden sm:inline">Editar perfil</span>
                </button>
              } @else {
                <button (click)="guardarEdicion()" [disabled]="isSaving"
                  class="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-bold bg-atu-primary text-white hover:bg-atu-primary-strong active:scale-[0.97] transition-all shadow-sm">
                  @if (isSaving) {
                    <i class="fa-solid fa-spinner fa-spin text-xs"></i>
                    <span class="hidden sm:inline">Guardando...</span>
                  } @else {
                    <i class="fa-solid fa-floppy-disk text-xs"></i>
                    <span class="hidden sm:inline">Guardar</span>
                  }
                </button>
                <button (click)="cancelarEdicion()" [disabled]="isSaving"
                  class="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-bold bg-atu-surface-2 dark:bg-[#21262D] text-atu-text-2 dark:text-[#8B949E] border border-atu-border dark:border-[#30363D] hover:border-atu-text-3 dark:hover:border-[#8B949E] active:scale-[0.97] transition-all">
                  <i class="fa-solid fa-xmark text-xs"></i>
                  <span class="hidden sm:inline">Cancelar</span>
                </button>
              }
            </div>
          </div>

          <!-- Info Grid -->
          <div
            class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs leading-normal pt-4 border-t border-atu-border dark:border-[#30363D]"
          >
            <!-- Nombre Completo (solo lectura) -->
            <div class="space-y-1">
              <span
                class="text-atu-text-3 dark:text-[#6E7681] font-semibold uppercase tracking-wider block text-[10px]"
                >Nombre Completo</span
              >
              <strong
                class="text-sm text-atu-text dark:text-[#E6EDF3] font-semibold block"
              >
                {{ usuario?.nombre }} {{ usuario?.primerApellido }}
                {{ usuario?.segundoApellido }}
              </strong>
            </div>

            <!-- DNI (solo lectura) -->
            <div class="space-y-1">
              <span
                class="text-atu-text-3 dark:text-[#6E7681] font-semibold uppercase tracking-wider block text-[10px]"
              >
                {{ usuario?.tipoDocumento || 'DNI' }}
              </span>
              <div class="flex items-center gap-2 flex-wrap">
                <strong
                  class="text-sm text-atu-text dark:text-[#E6EDF3] font-semibold"
                >
                  {{ usuario?.numDocumento || '—' }}
                </strong>
                <span
                  class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-atu-surface-2 dark:bg-[#21262D] text-atu-text-3 dark:text-[#6E7681] border border-atu-border dark:border-[#30363D]"
                >
                  <i class="fa-solid fa-lock text-[9px]"></i> No editable
                </span>
              </div>
            </div>

            <!-- Correo (editable en modo edición) -->
            <div class="space-y-1.5">
              <span
                class="text-atu-text-3 dark:text-[#6E7681] font-semibold uppercase tracking-wider block text-[10px]"
                >Correo Institucional</span
              >
              @if (editMode) {
                <input
                  type="email"
                  [(ngModel)]="editEmail"
                  placeholder="correo&#64;entidad.gob.pe"
                  class="w-full border border-atu-primary dark:border-[#00A3E0] rounded-lg bg-white dark:bg-[#0D1117] px-3 py-2 text-sm text-atu-text dark:text-[#E6EDF3] focus:outline-none focus:ring-2 focus:ring-atu-primary/30 dark:focus:ring-[#00A3E0]/30 transition-all"
                />
              } @else {
                <strong
                  class="text-sm text-atu-text dark:text-[#E6EDF3] font-semibold block break-all"
                  >{{ usuario?.email }}</strong
                >
              }
            </div>

            <!-- Teléfono (editable en modo edición) -->
            <div class="space-y-1.5">
              <span
                class="text-atu-text-3 dark:text-[#6E7681] font-semibold uppercase tracking-wider block text-[10px]"
                >Teléfono</span
              >
              @if (editMode) {
                <input
                  type="tel"
                  [(ngModel)]="editTelefono"
                  placeholder="9XX XXX XXX"
                  class="w-full border border-atu-primary dark:border-[#00A3E0] rounded-lg bg-white dark:bg-[#0D1117] px-3 py-2 text-sm text-atu-text dark:text-[#E6EDF3] focus:outline-none focus:ring-2 focus:ring-atu-primary/30 dark:focus:ring-[#00A3E0]/30 transition-all"
                />
              } @else {
                <strong
                  class="text-sm text-atu-text dark:text-[#E6EDF3] font-semibold block"
                >
                  {{ usuario?.telefono || '—' }}
                </strong>
              }
            </div>

            <!-- Entidad Gubernamental (solo lectura) -->
            <div class="space-y-1">
              <span
                class="text-atu-text-3 dark:text-[#6E7681] font-semibold uppercase tracking-wider block text-[10px]"
                >Entidad Gubernamental</span
              >
              <strong
                class="text-sm text-atu-text dark:text-[#E6EDF3] font-semibold block"
                >{{ usuario?.entidad }}</strong
              >
            </div>

            <!-- Tipo de Entidad (solo lectura) -->
            <div class="space-y-1">
              <span
                class="text-atu-text-3 dark:text-[#6E7681] font-semibold uppercase tracking-wider block text-[10px]"
                >Tipo de Entidad</span
              >
              <strong
                class="text-sm text-atu-text dark:text-[#E6EDF3] font-semibold block"
              >
                {{
                  usuario?.tipoEntidad === 'regional'
                    ? 'Gobierno Regional'
                    : 'Municipalidad Provincial'
                }}
              </strong>
            </div>

            @if (usuario?.documentoCargo) {
              <div class="space-y-1 sm:col-span-2">
                <span
                  class="text-atu-text-3 dark:text-[#6E7681] font-semibold uppercase tracking-wider block text-[10px]"
                  >Documento de Sustentación de Cargo</span
                >
                <span
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-atu-surface-2 dark:bg-[#21262D] border border-atu-border dark:border-[#30363D] rounded-lg text-sm font-semibold text-atu-text-2 dark:text-[#8B949E]"
                >
                  <i
                    class="fa-solid fa-paperclip text-atu-text-3 dark:text-[#6E7681]"
                  ></i>
                  {{ usuario?.documentoCargo }}
                </span>
              </div>
            }
          </div>

          <!-- Edit Alert -->
          @if (editAlert) {
            <div
              class="flex items-center gap-2.5 p-3 rounded-[10px] text-[13px] font-[600]"
              [ngClass]="
                editAlert.type === 'error'
                  ? 'bg-red-50 text-red-600 dark:bg-[rgba(239,68,68,0.1)] dark:text-red-400 border border-red-100 dark:border-red-900/50'
                  : 'bg-green-50 text-green-600 dark:bg-[rgba(34,197,94,0.1)] dark:text-green-400 border border-green-100 dark:border-green-900/50'
              "
            >
              <i
                class="fa-solid"
                [ngClass]="
                  editAlert.type === 'error'
                    ? 'fa-circle-exclamation'
                    : 'fa-circle-check'
                "
              ></i>
              {{ editAlert.message }}
            </div>
          }


        </div>

        <!-- ── Right Column (1/3) ── -->
        <div class="space-y-6">
          <!-- Change Password Card -->
          <div
            class="bg-white dark:bg-[#161B22] border border-atu-border dark:border-[#30363D] rounded-2xl shadow-sm dark:shadow-[0_1px_4px_rgba(0,0,0,0.3)] p-4 sm:p-5 space-y-4"
          >
            <h3
              class="font-bold text-base text-atu-primary dark:text-[#00A3E0] flex items-center gap-2"
            >
              <i class="fa-solid fa-lock-open text-lg"></i>
              Cambiar Contraseña
            </h3>
            <p class="text-xs text-atu-text-3 dark:text-[#6E7681]">
              Actualice sus credenciales regularmente para mantener segura su
              cuenta.
            </p>

            @if (perfilAlert) {
              <div
                class="p-3 rounded-[10px] text-[13px] font-[600] flex items-center gap-2"
                [ngClass]="
                  perfilAlert.type === 'error'
                    ? 'bg-red-50 text-red-600 dark:bg-[rgba(239,68,68,0.1)] dark:text-red-400 border border-red-100 dark:border-red-900/50'
                    : 'bg-green-50 text-green-600 dark:bg-[rgba(34,197,94,0.1)] dark:text-green-400 border border-green-100 dark:border-green-900/50'
                "
              >
                <i
                  class="fa-solid"
                  [ngClass]="
                    perfilAlert.type === 'error'
                      ? 'fa-circle-exclamation'
                      : 'fa-circle-check'
                  "
                ></i>
                {{ perfilAlert.message }}
              </div>
            }

            <div class="space-y-3">
              <div class="flex flex-col gap-1">
                <label
                  class="text-xs font-semibold text-atu-text-2 dark:text-[#8B949E]"
                  >Contraseña actual *</label
                >
                <input
                  type="password"
                  [(ngModel)]="passActual"
                  placeholder="••••••••"
                  class="w-full border border-atu-border dark:border-[#30363D] rounded-lg bg-white dark:bg-[#0D1117] px-3 py-2.5 text-sm text-atu-text dark:text-[#E6EDF3] focus:border-atu-primary dark:focus:border-atu-primary-mid focus:ring-1 focus:ring-atu-primary dark:focus:ring-atu-primary-mid outline-none transition-colors"
                />
              </div>
              <div class="flex flex-col gap-1">
                <label
                  class="text-xs font-semibold text-atu-text-2 dark:text-[#8B949E]"
                  >Nueva contraseña *</label
                >
                <input
                  type="password"
                  [(ngModel)]="passNueva"
                  placeholder="Mínimo 6 caracteres"
                  class="w-full border border-atu-border dark:border-[#30363D] rounded-lg bg-white dark:bg-[#0D1117] px-3 py-2.5 text-sm text-atu-text dark:text-[#E6EDF3] focus:border-atu-primary dark:focus:border-atu-primary-mid focus:ring-1 focus:ring-atu-primary dark:focus:ring-atu-primary-mid outline-none transition-colors"
                />
              </div>
              <div class="flex flex-col gap-1">
                <label
                  class="text-xs font-semibold text-atu-text-2 dark:text-[#8B949E]"
                  >Confirmar nueva contraseña *</label
                >
                <input
                  type="password"
                  [(ngModel)]="passConfirmar"
                  placeholder="Mínimo 6 caracteres"
                  class="w-full border border-atu-border dark:border-[#30363D] rounded-lg bg-white dark:bg-[#0D1117] px-3 py-2.5 text-sm text-atu-text dark:text-[#E6EDF3] focus:border-atu-primary dark:focus:border-atu-primary-mid focus:ring-1 focus:ring-atu-primary dark:focus:ring-atu-primary-mid outline-none transition-colors"
                />
              </div>
              <button
                (click)="onSavePassword()"
                class="atu-btn-primary w-full justify-center mt-2"
              >
                <i class="fa-solid fa-floppy-disk text-sm"></i>
                <span>Guardar cambios</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [],
})
export class PerfilInfoComponent implements OnInit {
  usuario: Usuario | null = null;

  // Password change
  passActual = '';
  passNueva = '';
  passConfirmar = '';
  perfilAlert: { message: string; type: 'error' | 'success' } | null = null;

  // Edit profile
  editMode = false;
  isSaving = false;
  editEmail = '';
  editTelefono = '';
  editAlert: { message: string; type: 'error' | 'success' } | null = null;

  private readonly authService = inject(AuthService);
  private readonly apiAuthService = inject(ApiAuthService);
  private readonly apiUsuarioService = inject(ApiUsuarioService);
  private readonly cargaService = inject(CargaService);

  ngOnInit(): void {
    this.usuario = this.resolveSession();
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

  get totalCargados(): number {
    return this.cargaService.getResumen().total;
  }

  get avatarLetter(): string {
    return this.usuario?.nombre?.charAt(0).toUpperCase() ?? 'U';
  }

  get tipoLabel(): string {
    return this.usuario?.tipoEntidad === 'regional' ? 'GR' : 'MP';
  }

  iniciarEdicion(): void {
    this.editEmail = this.usuario?.email ?? '';
    this.editTelefono = this.usuario?.telefono ?? '';
    this.editAlert = null;
    this.editMode = true;
  }

  cancelarEdicion(): void {
    this.editMode = false;
    this.editAlert = null;
  }

  guardarEdicion(): void {
    this.editAlert = null;
    if (!this.usuario) return;

    // Verificar si estamos usando la sesión por API (JWT)
    const apiSession = this.apiAuthService.getSession();

    if (apiSession) {
      this.isSaving = true;
      
      const usuarioId = apiSession.user.usuarioId ?? 1; // ID que viene del login API
      
      this.apiUsuarioService.actualizarCorreoTelefono({
        usuarioId: usuarioId,
        correo: this.editEmail,
        telefono: this.editTelefono
      }).subscribe({
        next: (res) => {
          this.isSaving = false;
          // Actualizamos visualmente el usuario ya que el API devuelve solo un string de confirmación
          if (this.usuario) {
            this.usuario.email = this.editEmail;
            this.usuario.telefono = this.editTelefono;
          }
          this.editMode = false;
          this.editAlert = { message: res.data.mensaje, type: 'success' };
          setTimeout(() => (this.editAlert = null), 4000);
        },
        error: (err) => {
          this.isSaving = false;
          this.editAlert = { message: err?.message || 'Error al guardar en el API.', type: 'error' };
        }
      });
    } else {
      // Fallback para usuarios del modo Mock / LocalStorage antiguo
      const res = this.authService.updateProfile(this.usuario.email, {
        email: this.editEmail,
        telefono: this.editTelefono,
      });

      if (res.success) {
        this.usuario = this.resolveSession();
        this.editMode = false;
        this.editAlert = {
          message: 'Perfil actualizado correctamente.',
          type: 'success',
        };
        setTimeout(() => (this.editAlert = null), 4000);
      } else {
        this.editAlert = {
          message: res.error ?? 'Error al guardar.',
          type: 'error',
        };
      }
    }
  }

  onSavePassword(): void {
    this.perfilAlert = null;
    if (!this.usuario) return;

    if (!this.passActual || !this.passNueva || !this.passConfirmar) {
      this.perfilAlert = {
        message: 'Todos los campos son obligatorios.',
        type: 'error',
      };
      return;
    }
    if (this.passNueva !== this.passConfirmar) {
      this.perfilAlert = {
        message: 'Las nuevas contraseñas no coinciden.',
        type: 'error',
      };
      return;
    }

    const res = this.authService.changePassword(
      this.usuario.email,
      this.passActual,
      this.passNueva,
    );
    if (res.success) {
      this.perfilAlert = {
        message: 'Contraseña actualizada con éxito.',
        type: 'success',
      };
      this.usuario = this.resolveSession();
      this.passActual = '';
      this.passNueva = '';
      this.passConfirmar = '';
    } else {
      this.perfilAlert = {
        message: res.error || 'Error al cambiar la contraseña.',
        type: 'error',
      };
    }
  }
}

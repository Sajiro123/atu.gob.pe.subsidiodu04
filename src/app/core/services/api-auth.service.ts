import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map, delay, tap } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import {
  LoginRequest,
  LoginResponse,
  ApiErrorResponse,
  ApiSession,
} from '../models/api.models';

// ── Storage keys ──────────────────────────────────────────
const KEY_API_SESSION = 'sigt_api_session_DU004';

// ── Mock data (usado cuando USE_MOCK_API = true) ──────────
const MOCK_USERS: Record<string, LoginResponse> = {
  admin: {
    data: {
      nombrePersona: 'Administrador',
      apellidoPaterno: 'SYS_ATU',
      apellidoMaterno: 'ATU_SYS',
      razonSocial: 'ATU',
      nombreEntidad: 'ATU',
    },
    accessToken:
      'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiIxIiwiaWF0IjoxNzgyMjk2NDk1LCJleHAiOjE3ODIyOTczOTV9.MOCK_ACCESS',
    refreshToken:
      'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiIxIiwiaWF0IjoxNzgyMjk2NDk1LCJleHAiOjE3ODIzODI4OTV9.MOCK_REFRESH',
    expiresIn: 900000,
    tokenType: 'Bearer',
  },
  'demo@region.gob.pe': {
    data: {
      nombrePersona: 'Carlos',
      apellidoPaterno: 'Mendoza',
      apellidoMaterno: 'Ríos',
      razonSocial: 'Gobierno Regional de Lima',
      nombreEntidad: 'Gobierno Regional de Lima',
    },
    accessToken: 'MOCK_TOKEN_DEMO_REGIONAL',
    refreshToken: 'MOCK_REFRESH_DEMO_REGIONAL',
    expiresIn: 900000,
    tokenType: 'Bearer',
  },
};

const MOCK_PASSWORDS: Record<string, string> = {
  admin: '123456',
  'demo@region.gob.pe': 'demo123',
};

// ─────────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class ApiAuthService {
  private readonly http    = inject(HttpClient);
  private readonly baseUrl = environment.API_BASE_URL;

  // ── Login ───────────────────────────────────────────────
  /**
   * Llama a POST /api/auth/login.
   * Si USE_MOCK_API = true, simula la respuesta sin hacer HTTP.
   * @param usuario  Usuario o email ingresado por el usuario
   * @param password Contraseña
   * @param recaptchaToken Token de Google reCAPTCHA v2 (requerido en producción)
   */
  login(usuario: string, password: string, recaptchaToken?: string): Observable<LoginResponse> {
    if (environment.USE_MOCK_API) {
      return this.mockLogin(usuario, password);
    }
    return this.realLogin(usuario, password, recaptchaToken);
  }

  private realLogin(usuario: string, password: string, recaptchaToken?: string): Observable<LoginResponse> {
    const body: LoginRequest = { usuario, password, recaptchaToken };
    return this.http
      .post<LoginResponse>(`${this.baseUrl}/auth/login`, body)
      .pipe(catchError((err: HttpErrorResponse) => this.handleError(err)));
  }

  private mockLogin(usuario: string, password: string): Observable<LoginResponse> {
    const mockResponse = MOCK_USERS[usuario];
    const expectedPass = MOCK_PASSWORDS[usuario];

    if (mockResponse && expectedPass === password) {
      // Simula latencia de red (400ms)
      return of(mockResponse).pipe(delay(400));
    }

    // Simula error 401
    const err: ApiErrorResponse = {
      code: 'AUTH_001',
      message: 'Error en login',
      descripcion: 'Usuario o contraseña inválidos',
    };
    return throwError(() => err);
  }

  // ── Sesión ──────────────────────────────────────────────
  saveSession(response: LoginResponse): void {
    const session: ApiSession = {
      accessToken:  response.accessToken,
      refreshToken: response.refreshToken,
      tokenType:    response.tokenType,
      expiresAt:    Date.now() + response.expiresIn,
      user:         response.data,
    };
    sessionStorage.setItem(KEY_API_SESSION, JSON.stringify(session));
  }

  getSession(): ApiSession | null {
    try {
      const raw = sessionStorage.getItem(KEY_API_SESSION);
      return raw ? (JSON.parse(raw) as ApiSession) : null;
    } catch {
      return null;
    }
  }

  getAccessToken(): string | null {
    return this.getSession()?.accessToken ?? null;
  }

  isLoggedIn(): boolean {
    const session = this.getSession();
    if (!session) return false;
    // Verifica que el token no haya expirado
    return Date.now() < session.expiresAt;
  }

  clearSession(): void {
    sessionStorage.removeItem(KEY_API_SESSION);
  }

  // ── Manejo de errores HTTP ───────────────────────────────
  private handleError(err: HttpErrorResponse): Observable<never> {
    let apiError: ApiErrorResponse;

    if (err.error && err.error.code) {
      // El backend devolvió un objeto de error estructurado
      apiError = err.error as ApiErrorResponse;
    } else if (err.status === 401) {
      apiError = {
        code: 'AUTH_001',
        message: 'No autorizado',
        descripcion: 'Usuario o contraseña incorrectos.',
      };
    } else if (err.status === 403) {
      apiError = {
        code: 'AUTH_403',
        message: 'Acceso denegado',
        descripcion: 'No tiene permisos para acceder a este recurso.',
      };
    } else if (err.status === 0) {
      apiError = {
        code: 'NETWORK_ERROR',
        message: 'Error de conexión',
        descripcion: 'No se pudo conectar al servidor. Verifique su conexión a internet.',
      };
    } else {
      apiError = {
        code: `HTTP_${err.status}`,
        message: 'Error del servidor',
        descripcion: err.message ?? 'Ocurrió un error inesperado.',
      };
    }

    return throwError(() => apiError);
  }
}

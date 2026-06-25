// =========================================================
// SIGT – ATU | API Models
// Mapeo exacto de la estructura del API REST
// =========================================================

// ── Request ───────────────────────────────────────────────
export interface LoginRequest {
  /** Usuario / email para autenticación */
  usuario: string;
  password: string;
  /** Token generado por Google reCAPTCHA v2 (opcional si el backend lo valida) */
  recaptchaToken?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

// ── Response 200 ──────────────────────────────────────────
export interface LoginData {
  usuarioId?: number;
  nombrePersona: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  razonSocial: string;
  nombreEntidad: string;
}

export interface LoginResponse {
  data: LoginData;
  accessToken: string;
  refreshToken: string;
  /** Tiempo de expiración en milisegundos */
  expiresIn: number;
  tokenType: string;
}

// ── Response 401 / Error ──────────────────────────────────
export interface ApiErrorResponse {
  code: string;
  message: string;
  descripcion: string;
}

// ── Sesión local (guardada en sessionStorage) ─────────────
export interface ApiSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // timestamp epoch ms
  tokenType: string;
  user: LoginData;
}

// ── Update Profile ─────────────────────────────────────────
export interface UpdateEmailPhoneRequest {
  usuarioId: number;
  correo: string;
  telefono: string;
}

export interface UpdateEmailPhoneResponse {
  data: {
    respuesta: string;
    mensaje: string;
  };
}

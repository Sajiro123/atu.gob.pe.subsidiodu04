// =========================================================
// Environment – DESARROLLO
// Para cambiar al API real:
//   1. Cambia USE_MOCK_API a false
//   2. Actualiza API_BASE_URL con la URL real del backend
// =========================================================
export const environment = {
  production: false,

  /** URL base del API REST. Cambia según el entorno. */
  API_BASE_URL: 'http://localhost:8080/api_iam',

  /**
   * true  → usa datos ficticios en localStorage (sin conexión al API)
   * false → hace llamadas HTTP reales al API
   */
  USE_MOCK_API: false,
};

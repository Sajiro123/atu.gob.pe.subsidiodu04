import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  UpdateEmailPhoneRequest,
  UpdateEmailPhoneResponse,
} from '../models/api.models';

@Injectable({
  providedIn: 'root',
})
export class ApiUsuarioService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = environment.API_BASE_URL;

  /**
   * Actualiza el correo y el teléfono del usuario.
   * El Token es inyectado automáticamente por el AuthInterceptor en las cabeceras.
   */
  actualizarCorreoTelefono(payload: UpdateEmailPhoneRequest): Observable<UpdateEmailPhoneResponse> {
    if (environment.USE_MOCK_API) {
      // Mock Response
      return of({
        data: {
          respuesta: 'OK',
          mensaje: 'Datos actualizados correctamente',
        },
      }).pipe(delay(600)); // Simulate network delay
    }

    // Real API Call
    return this.http.post<UpdateEmailPhoneResponse>(
      `${this.API_URL}/usuarios/updateEmailPhone`,
      payload
    );
  }
}

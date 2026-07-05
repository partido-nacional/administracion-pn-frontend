import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ResetearClaveResponse, UsuarioDto, UsuarioInput } from '../models/usuarios';

/**
 * Service por dominio para Usuarios. Encapsula las llamadas HTTP tipadas; no transforma
 * errores (los propaga para que el componente/interceptor los maneje).
 */
@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/usuarios`;

  getUsuarios(): Observable<UsuarioDto[]> {
    return this.http.get<UsuarioDto[]>(this.base);
  }

  crear(input: UsuarioInput): Observable<UsuarioDto> {
    return this.http.post<UsuarioDto>(this.base, input);
  }

  actualizar(id: number, input: UsuarioInput): Observable<UsuarioDto> {
    return this.http.put<UsuarioDto>(`${this.base}/${id}`, input);
  }

  cambiarEstado(id: number, activo: boolean): Observable<UsuarioDto> {
    return this.http.put<UsuarioDto>(`${this.base}/${id}/estado`, { activo });
  }

  resetearClave(id: number): Observable<ResetearClaveResponse> {
    return this.http.post<ResetearClaveResponse>(`${this.base}/${id}/resetear-clave`, {});
  }
}

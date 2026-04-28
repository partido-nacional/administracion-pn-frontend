import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { FichaAdhesionDetalle } from '../agenda/contactos.service';

@Injectable({ providedIn: 'root' })
export class AdhesionesService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/adhesiones`;

  getLocal(id: number) { return this.http.get<FichaAdhesionDetalle>(`${this.base}/locales/${id}`); }
  updateLocal(f: FichaAdhesionDetalle) { return this.http.put<void>(`${this.base}/locales/${f.id}`, f); }
}

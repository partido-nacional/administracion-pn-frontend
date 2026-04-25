import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

export interface Contacto {
  id: number;
  cortesia?: string;
  nombre: string;
  apellido: string;
  documento?: string;
  credencialCivica?: string;
  fechaNacimiento?: string;
  sexo?: string;
  estadoCivil?: string;
  telefono?: string;
  celular?: string;
  email?: string;
  departamento?: string;
  departamentoCredencial?: string;
  localidad?: string;
  direccion?: string;
  situacion?: string;
  ocupacion?: string;
  empresa?: string;
  cargoLaboral?: string;
  activo: boolean;
}

@Injectable({ providedIn: 'root' })
export class ContactosService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/contactos`;
  list(q?: string): Observable<Contacto[]> { return this.http.get<Contacto[]>(this.base, { params: q ? { q } : {} }); }
  get(id: number) { return this.http.get<Contacto>(`${this.base}/${id}`); }
  create(c: Partial<Contacto>) { return this.http.post<Contacto>(this.base, c); }
  update(c: Contacto) { return this.http.put<void>(`${this.base}/${c.id}`, c); }
  delete(id: number) { return this.http.delete<void>(`${this.base}/${id}`); }
}

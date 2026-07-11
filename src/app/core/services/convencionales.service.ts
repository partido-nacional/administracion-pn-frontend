import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ConvencionalDto, ConvencionalStats,
  ListaDto, ListaInput, ListaTipo,
} from '../models/convencionales';

/**
 * Service por dominio para Convencionales (feature `habilitar-botones-edicion`).
 * Encapsula las llamadas HTTP tipadas; no transforma errores (los propaga para
 * que el componente/interceptor los maneje). Ver docs/INTEGRACION-FRONTEND.md §7.9.
 */
@Injectable({ providedIn: 'root' })
export class ConvencionalesService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/convencionales`;

  // ── Lecturas ──────────────────────────────────────────────
  getStats(): Observable<ConvencionalStats> {
    return this.http.get<ConvencionalStats>(`${this.base}/stats`);
  }

  getNacionales(): Observable<ConvencionalDto[]> {
    return this.http.get<ConvencionalDto[]>(`${this.base}/nacionales`);
  }

  getListas(tipo: ListaTipo): Observable<ListaDto[]> {
    return this.http.get<ListaDto[]>(`${this.base}/listas/${tipo.toLowerCase()}`);
  }

  // Convencionales es solo lectura (feature 019): es un join sobre MiembrosOrganismo, ya no
  // una tabla editable. El alta/edición de convencionales se retiró.

  // ── Lista: alta / edición ─────────────────────────────────
  createLista(input: ListaInput): Observable<ListaDto> {
    return this.http.post<ListaDto>(`${this.base}/listas`, input);
  }

  updateLista(id: number, input: ListaInput): Observable<ListaDto> {
    return this.http.put<ListaDto>(`${this.base}/listas/${id}`, input);
  }
}

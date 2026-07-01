import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface SectorDto {
  id: number;
  codigo: string;
  descripcion: string;
  referente?: string;
  activo: boolean;
  orden: number;
}

export interface PartidoSectorDto {
  id: number;
  codigo: string;
  descripcion?: string;
  activo: boolean;
}

@Injectable({ providedIn: 'root' })
export class CatalogosService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/catalogos`;

  /** cache simple en memoria, persistente durante la sesion */
  private _sectores = signal<SectorDto[] | null>(null);
  private _partidoSectores = signal<PartidoSectorDto[] | null>(null);

  sectores(): Observable<SectorDto[]> {
    const cached = this._sectores();
    if (cached) return of(cached);
    return this.http.get<SectorDto[]>(`${this.base}/sectores`)
      .pipe(tap(v => this._sectores.set(v)));
  }

  partidoSectores(): Observable<PartidoSectorDto[]> {
    const cached = this._partidoSectores();
    if (cached) return of(cached);
    return this.http.get<PartidoSectorDto[]>(`${this.base}/partido-sectores`)
      .pipe(tap(v => this._partidoSectores.set(v)));
  }
}

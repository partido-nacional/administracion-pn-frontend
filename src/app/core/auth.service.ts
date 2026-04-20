import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface LoginResponse {
  token: string;
  usuario: string;
  rol: string;
}

const STORAGE_KEY = 'admpn_auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _session = signal<LoginResponse | null>(this.loadSession());
  readonly session = this._session.asReadonly();
  readonly isLogged = computed(() => this._session() !== null);

  constructor(private http: HttpClient) {}

  login(usuario: string, clave: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, { usuario, clave })
      .pipe(tap(r => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(r));
        this._session.set(r);
      }));
  }

  logout(): void {
    localStorage.removeItem(STORAGE_KEY);
    this._session.set(null);
  }

  get token(): string | null { return this._session()?.token ?? null; }

  private loadSession(): LoginResponse | null {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  }
}

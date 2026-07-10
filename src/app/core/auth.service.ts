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

  // ── Autoservicio de cuentas (feature 020, sin tocar la sesión) ──
  private base = `${environment.apiUrl}/auth`;

  register(usuario: string, clave: string, email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/register`, { usuario, clave, email });
  }

  verificarEmail(usuario: string, codigo: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/verificar-email`, { usuario, codigo });
  }

  reenviarCodigo(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/reenviar-codigo`, { email });
  }

  recuperar(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/recuperar`, { email });
  }

  resetear(token: string, nuevaClave: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/resetear`, { token, nuevaClave });
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

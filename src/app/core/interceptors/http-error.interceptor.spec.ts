import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { httpErrorInterceptor } from './http-error.interceptor';
import { ToastService } from '../services/toast.service';
import { skipErrorToast } from '../http/skip-error-toast';

describe('httpErrorInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let toast: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([httpErrorInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    toast = TestBed.inject(ToastService);
  });

  afterEach(() => httpMock.verify());

  it('dispara un toast de error y re-emite el error', () => {
    let recibido = false;
    http.get('/x').subscribe({ error: () => (recibido = true) });
    httpMock.expectOne('/x').flush({ message: 'Boom' }, { status: 500, statusText: 'err' });
    expect(toast.toasts().length).toBe(1);
    expect(toast.toasts()[0].mensaje).toBe('Boom');
    expect(recibido).toBeTrue();
  });

  it('NO dispara toast en 401', () => {
    http.get('/x').subscribe({ error: () => {} });
    httpMock.expectOne('/x').flush(null, { status: 401, statusText: 'unauth' });
    expect(toast.toasts().length).toBe(0);
  });

  it('respeta el opt-out (skipErrorToast) pero igual re-emite', () => {
    let recibido = false;
    http.get('/x', { context: skipErrorToast() }).subscribe({ error: () => (recibido = true) });
    httpMock.expectOne('/x').flush({ message: 'inline' }, { status: 409, statusText: 'conflict' });
    expect(toast.toasts().length).toBe(0);
    expect(recibido).toBeTrue();
  });
});

import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PageTitleService {
  readonly title = signal<string>('');
  set(t: string) { this.title.set(t); }
}

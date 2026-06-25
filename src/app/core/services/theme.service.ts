import { Injectable, signal, computed, effect } from '@angular/core';

const STORAGE_KEY = 'atu-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {

  /** true = modo oscuro activo */
  readonly isDark = signal<boolean>(this._loadPreference());

  /** Clase CSS aplicada al <html> */
  readonly themeClass = computed(() => this.isDark() ? 'dark' : 'light');

  constructor() {
    // Aplica el tema inmediatamente al arrancar
    this._applyTheme(this.isDark());

    // Sincroniza cada vez que cambia la señal
    effect(() => {
      this._applyTheme(this.isDark());
      this._savePreference(this.isDark());
    });
  }

  /** Alterna entre claro y oscuro */
  toggle(): void {
    this.isDark.update(v => !v);
  }

  /** Fuerza un tema concreto */
  setDark(dark: boolean): void {
    this.isDark.set(dark);
  }

  // ── Privados ──────────────────────────────────────────────────

  private _applyTheme(dark: boolean): void {
    const html = document.documentElement;
    if (dark) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  }

  private _loadPreference(): boolean {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) return stored === 'dark';
    // Respeta preferencia del sistema si no hay configuración guardada
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  private _savePreference(dark: boolean): void {
    localStorage.setItem(STORAGE_KEY, dark ? 'dark' : 'light');
  }
}

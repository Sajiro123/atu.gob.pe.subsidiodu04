import { Injectable } from '@angular/core';
import { Usuario } from '../models/models';

// ── Demo users pre-loaded ─────────────────────────────────
const DEMO_USERS: Usuario[] = [
  {
    email: 'demo@region.gob.pe',
    password: 'demo123',
    nombre: 'Carlos',
    primerApellido: 'Mendoza',
    segundoApellido: 'Ríos',
    tipoEntidad: 'regional',
    entidad: 'Gobierno Regional de Lima',
    tipoDocumento: 'DNI',
    numDocumento: '42381956',
    departamento: 'Lima',
    provincia: 'Lima',
    distrito: 'San Isidro',
    telefono: '987 654 321',
    cargo: 'Director de Transporte Regional',
    documentoCargo: 'Resolución Directoral N° 124-2025',
    registradoEn: new Date().toISOString()
  },
  {
    email: 'maria.quispe@munihuancayo.gob.pe',
    password: 'Maria2026!',
    nombre: 'María Elena',
    primerApellido: 'Quispe',
    segundoApellido: 'Huamán',
    tipoEntidad: 'municipal',
    entidad: 'Municipalidad Provincial de Huancayo',
    tipoDocumento: 'DNI',
    numDocumento: '46729301',
    departamento: 'Junín',
    provincia: 'Huancayo',
    distrito: 'Huancayo',
    telefono: '964 123 789',
    cargo: 'Jefa de División de Tránsito',
    documentoCargo: 'Resolución Gerencial N° 089-2026',
    registradoEn: new Date().toISOString()
  },
  {
    email: 'jorge.valdivia@regionarequipa.gob.pe',
    password: 'Arequipa2026',
    nombre: 'Jorge Luis',
    primerApellido: 'Valdivia',
    segundoApellido: 'Paredes',
    tipoEntidad: 'regional',
    entidad: 'Gobierno Regional de Arequipa',
    tipoDocumento: 'DNI',
    numDocumento: '29403817',
    departamento: 'Arequipa',
    provincia: 'Arequipa',
    distrito: 'Cayma',
    telefono: '958 200 411',
    cargo: 'Subgerente de Transportes',
    documentoCargo: 'Memorándum N° 301-2026-GRA',
    registradoEn: new Date().toISOString()
  }
];

// ── Entity lists ──────────────────────────────────────────
export const REGIONALES: string[] = [
  'Gobierno Regional de Amazonas','Gobierno Regional de Áncash',
  'Gobierno Regional de Apurímac','Gobierno Regional de Arequipa',
  'Gobierno Regional de Ayacucho','Gobierno Regional de Cajamarca',
  'Gobierno Regional de Callao','Gobierno Regional de Cusco',
  'Gobierno Regional de Huancavelica','Gobierno Regional de Huánuco',
  'Gobierno Regional de Ica','Gobierno Regional de Junín',
  'Gobierno Regional de La Libertad','Gobierno Regional de Lambayeque',
  'Gobierno Regional de Lima','Gobierno Regional de Loreto',
  'Gobierno Regional de Madre de Dios','Gobierno Regional de Moquegua',
  'Gobierno Regional de Pasco','Gobierno Regional de Piura',
  'Gobierno Regional de Puno','Gobierno Regional de San Martín',
  'Gobierno Regional de Tacna','Gobierno Regional de Tumbes',
  'Gobierno Regional de Ucayali'
];

export const MUNICIPALES: string[] = [
  'Municipalidad Provincial de Abancay','Municipalidad Provincial de Arequipa',
  'Municipalidad Provincial de Ayacucho','Municipalidad Provincial de Cajamarca',
  'Municipalidad Provincial de Callao','Municipalidad Provincial de Cusco',
  'Municipalidad Provincial de Huancayo','Municipalidad Provincial de Ica',
  'Municipalidad Provincial de Lima','Municipalidad Provincial de Loreto',
  'Municipalidad Provincial de Piura','Municipalidad Provincial de Puno',
  'Municipalidad Provincial de Tacna','Municipalidad Provincial de Trujillo',
  'Municipalidad Provincial de Tumbes','Municipalidad Provincial de Huaraz',
  'Municipalidad Provincial de Maynas','Municipalidad Provincial de San Román',
  'Municipalidad Provincial de Chiclayo','Municipalidad Provincial de Sullana'
];

// ── Storage keys ──────────────────────────────────────────
const KEY_USERS   = 'sigt_usuarios_DU004';
const KEY_SESSION = 'sigt_sesion_DU004';

@Injectable({ providedIn: 'root' })
export class AuthService {

  // ── Helpers ───────────────────────────────────────────
  private getUsuarios(): Usuario[] {
    try {
      const raw = localStorage.getItem(KEY_USERS);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }

  private saveUsuarios(users: Usuario[]): void {
    localStorage.setItem(KEY_USERS, JSON.stringify(users));
  }

  // ── Init: ensure demo users exist ─────────────────────
  constructor() {
    this.inicializarUsuarios();
  }

  private inicializarUsuarios(): void {
    const usuarios = this.getUsuarios();
    let changed = false;
    DEMO_USERS.forEach(demo => {
      const idx = usuarios.findIndex(u => u.email.toLowerCase() === demo.email.toLowerCase());
      if (idx === -1) {
        // New demo user → add it
        usuarios.push(demo);
        changed = true;
      } else {
        // Existing demo user → merge extended fields so new fields are always up to date
        const merged = { ...usuarios[idx], ...demo };
        if (JSON.stringify(usuarios[idx]) !== JSON.stringify(merged)) {
          usuarios[idx] = merged;
          changed = true;
        }
      }
    });
    if (changed) this.saveUsuarios(usuarios);
  }

  // ── Session ───────────────────────────────────────────
  getSession(): Usuario | null {
    try {
      const raw = localStorage.getItem(KEY_SESSION);
      if (!raw) return null;
      const sesion: Usuario = JSON.parse(raw);
      const usuarios = this.getUsuarios();
      return usuarios.find(
        u => u.email.toLowerCase() === sesion.email.toLowerCase() &&
             u.password === sesion.password
      ) ?? null;
    } catch { return null; }
  }

  isLoggedIn(): boolean {
    return this.getSession() !== null;
  }

  // ── Login ─────────────────────────────────────────────
  login(email: string, password: string): { success: boolean; user?: Usuario; error?: string } {
    if (!email || !password) {
      return { success: false, error: 'Ingresa correo y contraseña.' };
    }
    const usuarios = this.getUsuarios();
    const user = usuarios.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    if (!user) {
      return { success: false, error: 'Correo o contraseña incorrectos.' };
    }
    localStorage.setItem(KEY_SESSION, JSON.stringify(user));
    return { success: true, user };
  }

  // ── Register ──────────────────────────────────────────
  register(data: {
    email: string; password: string; password2: string;
    nombre: string; tipoEntidad: 'regional' | 'municipal' | 'empresa'; entidad: string;
    documentoCargo?: string;
    // Extended profile fields
    primerApellido?: string;
    segundoApellido?: string;
    tipoDocumento?: string;
    numDocumento?: string;
    departamento?: string;
    provincia?: string;
    distrito?: string;
    telefono?: string;
    cargo?: string;
  }): { success: boolean; error?: string } {
    const {
      email, password, password2, nombre, tipoEntidad, entidad, documentoCargo,
      primerApellido, segundoApellido, tipoDocumento, numDocumento,
      departamento, provincia, distrito, telefono, cargo
    } = data;

    if (!email || !password || !nombre || !entidad || (tipoEntidad !== 'empresa' && !documentoCargo)) {
      return { success: false, error: 'Todos los campos son obligatorios.' };
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { success: false, error: 'Formato de correo inválido.' };
    }
    if (password.length < 6) {
      return { success: false, error: 'La contraseña debe tener al menos 6 caracteres.' };
    }
    if (password !== password2) {
      return { success: false, error: 'Las contraseñas no coinciden.' };
    }

    const usuarios = this.getUsuarios();
    if (usuarios.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      return { success: false, error: 'Este correo ya está registrado.' };
    }

    const newUser: Usuario = {
      email, password, nombre, tipoEntidad, entidad, documentoCargo,
      primerApellido, segundoApellido, tipoDocumento, numDocumento,
      departamento, provincia, distrito, telefono, cargo,
      registradoEn: new Date().toISOString()
    };
    usuarios.push(newUser);
    this.saveUsuarios(usuarios);
    return { success: true };
  }

  // ── Password recovery (simulated) ─────────────────────
  solicitarRecuperacion(email: string): { success: boolean; error?: string; message?: string } {
    if (!email) return { success: false, error: 'Ingresa tu correo electrónico.' };
    const usuarios = this.getUsuarios();
    const user = usuarios.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return { success: false, error: 'No existe una cuenta con ese correo.' };
    return {
      success: true,
      message: `Se ha enviado un enlace de recuperación a ${email} (simulado). Revisa tu bandeja.`
    };
  }

  // ── Logout ────────────────────────────────────────────
  logout(): void {
    localStorage.removeItem(KEY_SESSION);
  }

  // ── Update Profile ────────────────────────────────────
  updateProfile(currentEmail: string, changes: { email?: string; telefono?: string }): { success: boolean; error?: string } {
    const usuarios = this.getUsuarios();
    const idx = usuarios.findIndex(u => u.email.toLowerCase() === currentEmail.toLowerCase());
    if (idx === -1) return { success: false, error: 'Usuario no encontrado.' };

    const newEmail = changes.email?.trim() ?? '';
    if (newEmail && newEmail !== currentEmail) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
        return { success: false, error: 'Formato de correo inválido.' };
      }
      const existe = usuarios.find(u => u.email.toLowerCase() === newEmail.toLowerCase());
      if (existe) return { success: false, error: 'Ese correo ya está registrado por otro usuario.' };
      usuarios[idx].email = newEmail;
    }
    if (changes.telefono !== undefined) {
      usuarios[idx].telefono = changes.telefono.trim();
    }
    this.saveUsuarios(usuarios);

    // Refresh active session
    const session = this.getSession();
    if (session && session.email.toLowerCase() === currentEmail.toLowerCase()) {
      const updated = { ...session, ...usuarios[idx] };
      localStorage.setItem(KEY_SESSION, JSON.stringify(updated));
    }
    return { success: true };
  }

  // ── Change Password ────────────────────────────────────
  changePassword(email: string, oldPass: string, newPass: string): { success: boolean; error?: string } {
    const usuarios = this.getUsuarios();
    const idx = usuarios.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
    if (idx === -1) {
      return { success: false, error: 'Usuario no encontrado.' };
    }
    if (usuarios[idx].password !== oldPass) {
      return { success: false, error: 'La contraseña actual es incorrecta.' };
    }
    if (newPass.length < 6) {
      return { success: false, error: 'La nueva contraseña debe tener al menos 6 caracteres.' };
    }

    usuarios[idx].password = newPass;
    this.saveUsuarios(usuarios);

    // Refresh active session
    const active = this.getSession();
    if (active && active.email.toLowerCase() === email.toLowerCase()) {
      active.password = newPass;
      localStorage.setItem(KEY_SESSION, JSON.stringify(active));
    }
    return { success: true };
  }

  // ── Entities ──────────────────────────────────────────
  getEntidades(tipo: 'regional' | 'municipal'): string[] {
    return tipo === 'regional' ? REGIONALES : MUNICIPALES;
  }
}

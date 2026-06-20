import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { CargaService } from '../../../../core/services/carga.service';
import { RegistroVehicular } from '../../../../core/models/models';

@Component({
  selector: 'app-registros',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './registros.component.html',
  styleUrl: './registros.component.scss'
})
export class RegistrosComponent implements OnInit {

  searchTerm = '';
  registros: RegistroVehicular[] = [];
  entidad = '';

  // ── Modal state ───────────────────────────────────────
  modalDetalleOpen = false;
  modalConfirmOpen = false;
  registroDetalle: RegistroVehicular | null = null;

  private readonly authService = inject(AuthService);
  private readonly cargaService = inject(CargaService);
  private readonly router      = inject(Router);


  ngOnInit(): void {
    const user = this.authService.getSession();
    if (user) {
      this.entidad = user.entidad;
    }
    this.registros = this.cargaService.getRegistros();
  }

  // ── Reactive Filtering ────────────────────────────────
  get registrosFiltrados(): RegistroVehicular[] {
    if (!this.searchTerm.trim()) {
      return this.registros;
    }
    const term = this.searchTerm.toLowerCase().trim();
    return this.registros.filter(r =>
      r.placa.toLowerCase().includes(term) ||
      r.transportista.toLowerCase().includes(term) ||
      r.ruc.includes(term)
    );
  }

  // ── Delete record ─────────────────────────────────────
  eliminarRegistro(id: number): void {
    if (!confirm('¿Eliminar este registro de la lista?')) return;
    this.cargaService.eliminarRegistro(id);
    this.registros = this.cargaService.getRegistros();
  }

  // ── Detail modal ──────────────────────────────────────
  verDetalle(id: number): void {
    this.registroDetalle = this.registros.find(r => r.id === id) ?? null;
    this.modalDetalleOpen = true;
  }

  cerrarDetalle(): void {
    this.modalDetalleOpen = false;
    this.registroDetalle = null;
  }

  // ── Confirm send modal ────────────────────────────────
  prepararEnvio(): void {
    if (!this.registros.length) return;
    this.modalConfirmOpen = true;
  }

  cerrarConfirm(): void {
    this.modalConfirmOpen = false;
  }

  confirmarEnvio(): void {
    const sessionDoc = localStorage.getItem('sigt_doc_oficio') ?? 'Sin adjunto';
    const nOficio = localStorage.getItem('sigt_num_oficio') ?? '—';
    const envio = this.cargaService.confirmarEnvio(this.entidad, nOficio, sessionDoc);
    
    this.modalConfirmOpen = false;
    alert(
      `✅ Información enviada exitosamente a la ATU.\n` +
      `N° de envío: ENV-DU004-${String(envio.id).padStart(4,'0')}\n` +
      `Registros elegibles: ${envio.elegibles}\n` +
      `Documento: ${sessionDoc}`
    );
    this.registros = [];
    this.router.navigate(['/dashboard/historial']);
  }

  // ── Download ──────────────────────────────────────────
  descargarErrores(): void {
    this.cargaService.descargarErroresCSV();
  }

  // ── Helpers & Getters ─────────────────────────────────
  get resumen() {
    return this.cargaService.getResumen();
  }

  get puedeEnviar(): boolean {
    return this.registros.some(r => r.elegible);
  }

  badgeEstado(e: string): { label: string; css: string } {
    if (!e) return { label: '—', css: 'badge-gray' };
    const u = e.toUpperCase();
    if (u === 'VIGENTE' || u === 'HABILITADO') return { label: e, css: 'badge-green' };
    if (u === 'SUSPENDIDO') return { label: e, css: 'badge-yellow' };
    if (u.includes('CANCELADO') || u.includes('INHABILITADO')) return { label: e, css: 'badge-red' };
    return { label: e, css: 'badge-gray' };
  }

  getTipoServicioCorto(tipo: string): string {
    if (tipo.includes('NACIONAL REGULAR')) return 'Nacional Regular';
    if (tipo.includes('MERCANCÍAS')) return 'Mercancías';
    return tipo;
  }

  getSubsidioMax(cat: string): string {
    return this.cargaService.getMaxSubsidio(cat);
  }
}

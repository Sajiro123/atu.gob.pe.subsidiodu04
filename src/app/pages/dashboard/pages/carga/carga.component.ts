import { Component, OnInit, ElementRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { CargaService } from '../../../../core/services/carga.service';
import { RegistroVehicular } from '../../../../core/models/models';

declare const XLSX: any;  // loaded via CDN in index.html

@Component({
  selector: 'app-carga',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './carga.component.html',
  styleUrl: './carga.component.scss'
})
export class CargaComponent implements OnInit {

  @ViewChild('dropArea') dropAreaRef!: ElementRef<HTMLDivElement>;

  // ── Entity selector ───────────────────────────────────
  tipoEntidad: 'regional' | 'municipal' = 'regional';
  entidad = '';
  entidades: string[] = [];
  responsable = '';
  cargo = '';
  fechaRemision = new Date().toISOString().split('T')[0];
  nOficio = '';
  docNombre = 'Ningún archivo seleccionado';
  documentoAdjunto: File | null = null;

  // ── Upload state ──────────────────────────────────────
  archivoSeleccionado: File | null = null;
  fileNombre = '';
  statusCarga = '';
  isDragover = false;
  procesando = false;

  // ── Records ───────────────────────────────────────────
  registros: RegistroVehicular[] = [];

  // ── Modal state ───────────────────────────────────────
  modalDetalleOpen = false;
  modalConfirmOpen = false;
  registroDetalle: RegistroVehicular | null = null;

  private readonly authService = inject(AuthService);
  private readonly cargaService = inject(CargaService);
  private readonly router      = inject(Router);


  ngOnInit(): void {
    this.actualizarEntidades();
    const user = this.authService.getSession();
    if (user) {
      this.tipoEntidad = user.tipoEntidad;
      this.actualizarEntidades();
      this.entidad = user.entidad;
    }
    this.registros = this.cargaService.getRegistros();
  }

  // ── Entity ────────────────────────────────────────────
  actualizarEntidades(): void {
    this.entidades = this.authService.getEntidades(this.tipoEntidad);
    if (!this.entidades.includes(this.entidad)) {
      this.entidad = this.entidades[0] ?? '';
    }
  }

  get chipLabel(): string {
    const tipo = this.tipoEntidad === 'regional' ? 'GR' : 'MP';
    const parts = this.entidad.split(' ');
    return `${tipo} · ${parts.slice(-2).join(' ')}`;
  }

  // ── File selection ────────────────────────────────────
  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.setArchivo(input.files[0]);
    }
  }

  onDocOficioChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      const f = input.files[0];
      this.documentoAdjunto = f;
      this.docNombre = `${f.name} (${(f.size / 1024).toFixed(1)} KB)`;
      localStorage.setItem('sigt_doc_oficio', this.docNombre);
    } else {
      this.documentoAdjunto = null;
      this.docNombre = 'Ningún archivo seleccionado';
      localStorage.removeItem('sigt_doc_oficio');
    }
  }

  setArchivo(file: File): void {
    this.archivoSeleccionado = file;
    this.fileNombre = `${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
    this.statusCarga = 'Archivo listo para procesar.';
  }

  // ── Drag & drop ───────────────────────────────────────
  onDragover(e: DragEvent): void { e.preventDefault(); this.isDragover = true; }
  onDragleave(): void            { this.isDragover = false; }
  onDrop(e: DragEvent): void {
    e.preventDefault();
    this.isDragover = false;
    const files = e.dataTransfer?.files;
    if (files?.length) this.setArchivo(files[0]);
  }

  // ── Process Excel ─────────────────────────────────────
  procesarArchivo(): void {
    if (!this.archivoSeleccionado) return;
    this.procesando = true;
    this.statusCarga = 'Leyendo archivo...';

    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      try {
        const data     = new Uint8Array(e.target!.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet    = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: '' }) as Record<string,unknown>[];

        if (!jsonData.length) {
          this.statusCarga = 'Error: archivo vacío.';
          this.procesando = false;
          return;
        }

        const parsedData = jsonData
          .map(row => this.cargaService.mapearFila(row))
          .filter(row => row.placa && row.ruc);

        if (!parsedData.length) {
          this.statusCarga = 'Error: columnas no coinciden con la plantilla.';
          this.procesando = false;
          return;
        }

        const res = this.cargaService.procesarDatos(parsedData);
        this.registros = this.cargaService.getRegistros();
        this.statusCarga = `✓ ${res.total} procesados · ${res.validos} válidos · ${res.invalidos} errores. Redirigiendo...`;

        // Save metadata
        localStorage.setItem('sigt_num_oficio', this.nOficio);
        localStorage.setItem('sigt_doc_oficio', this.docNombre);

        setTimeout(() => {
          this.router.navigate(['/dashboard/registros']);
        }, 1200);
      } catch (err: any) {
        this.statusCarga = 'Error al leer el archivo: ' + err.message;
        console.error(err);
      } finally {
        this.procesando = false;
      }
    };
    reader.readAsArrayBuffer(this.archivoSeleccionado);
  }

  // ── Clean ─────────────────────────────────────────────
  limpiarCarga(): void {
    if (!this.registros.length) return;
    if (!confirm('¿Eliminar todos los registros?')) return;
    this.cargaService.limpiar();
    this.registros = [];
    this.archivoSeleccionado = null;
    this.fileNombre = '';
    this.statusCarga = 'Datos limpiados.';
  }

  // ── Delete record ─────────────────────────────────────
  eliminarRegistro(id: number): void {
    if (!confirm('¿Eliminar este registro?')) return;
    this.cargaService.eliminarRegistro(id);
    this.registros = this.cargaService.getRegistros();
  }

  // ── Detail modal ──────────────────────────────────────
  verDetalle(id: number): void {
    this.registroDetalle = this.registros.find(r => r.id === id) ?? null;
    this.modalDetalleOpen = true;
  }

  cerrarDetalle(): void { this.modalDetalleOpen = false; }

  // ── Confirm send modal ────────────────────────────────
  prepararEnvio(): void {
    if (!this.registros.length) return;
    this.modalConfirmOpen = true;
  }

  cerrarConfirm(): void { this.modalConfirmOpen = false; }

  confirmarEnvio(): void {
    const docNom = this.documentoAdjunto?.name ?? 'Sin adjunto';
    const envio  = this.cargaService.confirmarEnvio(this.entidad, this.nOficio, docNom);
    this.modalConfirmOpen = false;
    alert(
      `✅ Información enviada exitosamente a la ATU.\n` +
      `N° de envío: ENV-DU004-${String(envio.id).padStart(4,'0')}\n` +
      `Registros elegibles: ${envio.elegibles}\n` +
      `Documento: ${docNom}`
    );
  }

  // ── Download ──────────────────────────────────────────
  descargarErrores(): void  { this.cargaService.descargarErroresCSV(); }

  descargarPlantilla(): void {
    const headers = [
      'PLACA DE VEHÍCULO','CATEGORÍA VEHICULAR','TARJETA ÚNICA DE CIRCULACIÓN',
      'FECHA DE INICIO DE VIGENCIA (TUC)','FECHA FIN DE VIGENCIA (TUC)','ESTADO DE TUC',
      'NOMBRE O RAZÓN SOCIAL DEL TRANSPORTISTA','RUC DEL TRANSPORTISTA',
      'PARTIDA REGISTRAL O CÓDIGO DE INSCRIPCIÓN','TIPO DE SERVICIO AUTORIZADO',
      'ACTO ADMINISTRATIVO DE AUTORIZACIÓN','FECHA DE INICIO DE VIGENCIA (AUTORIZACIÓN)',
      'FECHA FIN DE VIGENCIA (AUTORIZACIÓN)','ESTADO (AUTORIZACIÓN)'
    ];
    const sample = [
      'ABC123','M2','TUC-100001','2026-05-15','2027-12-31','VIGENTE',
      'Transportes Andes SAC','20123456789','PR-20001',
      'SERVICIO DE TRANSPORTE NACIONAL REGULAR','RES-3001',
      '2026-05-20','2027-06-30','HABILITADO'
    ];
    const ws = XLSX.utils.aoa_to_sheet([headers, sample]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Plantilla');
    XLSX.writeFile(wb, `plantilla_DU004-2026_${this.entidad.replace(/\s/g,'_')}.xlsx`);
  }

  // ── Helpers ───────────────────────────────────────────
  get resumen() { return this.cargaService.getResumen(); }

  get puedeEnviar(): boolean { return this.registros.some(r => r.elegible); }

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

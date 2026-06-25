import {
  Component,
  OnInit,
  inject,
  LOCALE_ID,
  HostListener,
} from '@angular/core';
import { CommonModule, DatePipe, registerLocaleData } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ApiAuthService } from '../../../core/services/api-auth.service';
import { Usuario } from '../../../core/models/models';
import localeEs from '@angular/common/locales/es';
import Swal from 'sweetalert2';

// PrimeNG Imports
import { TableModule } from 'primeng/table';
import { SkeletonModule } from 'primeng/skeleton';
import { InputTextModule } from 'primeng/inputtext';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { DatePickerModule } from 'primeng/datepicker';

registerLocaleData(localeEs, 'es-PE');

interface EmpresaData {
  placa: string;
  categoria: string;
  tuc: string;
  fechaInicioTuc: string;
  fechaFinTuc: string;
  estadoTuc: string;
  razonSocial: string;
  ruc: string;
  partidaRegistral: string;
  tipoServicio: string;
  actoAdministrativo: string;
  fechaInicioAut: string;
  fechaFinAut: string;
  estadoAut: string;
}

@Component({
  selector: 'app-empresas',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    FormsModule,
    TableModule,
    SkeletonModule,
    InputTextModule,
    OverlayPanelModule,
    DatePickerModule,
    RouterModule,
  ],
  providers: [{ provide: LOCALE_ID, useValue: 'es-PE' }],
  templateUrl: './empresas.component.html',
  styleUrl: './empresas.component.scss',
})
export class EmpresasComponent implements OnInit {
  usuario: Usuario | null = null;
  loading = false;
  filtroGlobal = '';

  // Grid/List of Empresas
  empresas: EmpresaData[] = [
    {
      placa: 'A1B-234',
      categoria: 'M3',
      tuc: 'TUC-20261189',
      fechaInicioTuc: '2026-01-10',
      fechaFinTuc: '2027-01-10',
      estadoTuc: 'VIGENTE',
      razonSocial: 'EMPRESA DE TRANSPORTE URBANUS S.A.C.',
      ruc: '20556677881',
      partidaRegistral: 'PART-99881',
      tipoServicio: 'SERVICIO DE TRANSPORTE NACIONAL REGULAR',
      actoAdministrativo: 'RES-0012-2026-ATU',
      fechaInicioAut: '2026-02-15',
      fechaFinAut: '2030-02-15',
      estadoAut: 'HABILITADO',
    },
    {
      placa: 'X9Z-887',
      categoria: 'M2',
      tuc: 'TUC-20265541',
      fechaInicioTuc: '2026-03-05',
      fechaFinTuc: '2026-05-29',
      estadoTuc: 'VIGENTE',
      razonSocial: 'TRANSPORTES RAPIDO LIMA S.A.',
      ruc: '20112233445',
      partidaRegistral: 'PART-55443',
      tipoServicio: 'SERVICIO DE TRANSPORTE NACIONAL REGULAR',
      actoAdministrativo: 'RES-0542-2026-ATU',
      fechaInicioAut: '2026-03-10',
      fechaFinAut: '2028-03-10',
      estadoAut: 'HABILITADO',
    },
  ];

  // Modal States
  nuevaEmpresa: EmpresaData = this.getEmptyEmpresa();

  private readonly authService = inject(AuthService);
  private readonly apiAuthService = inject(ApiAuthService);
  private readonly router = inject(Router);
  modalAgregarOpen = false;
  modoEdicion = false;
  empresaEditIndex = -1;
  activeMenuRuc: string | null = null;

  // Bulk Upload variables
  bulkOpen = false;
  bulkStep: 'drop' | 'grid' = 'drop';
  bulkFile = '';
  bulkFilter: 'all' | 'new' | 'upd' | 'err' = 'all';
  expandedRowIndex: number | null = null;
  bulkData: any[] = [];
  bulkCols = [
    { key: 'ruc', label: 'RUC', w: '120px', mono: true },
    { key: 'razon', label: 'Razón Social', w: '260px' },
    { key: 'rep', label: 'Representante', w: '180px' },
    { key: 'tipo', label: 'Tipo', w: '110px' },
    { key: 'tel', label: 'Teléfono', w: '110px', mono: true },
    { key: 'correo', label: 'Correo', w: '160px' },
    { key: 'ini', label: 'Inicio vig.', w: '110px', mono: true },
    { key: 'fin', label: 'Fin vig.', w: '110px', mono: true }
  ];

  sampleBulk = [
    { ruc: '20512300011', razon: 'Transportes Costa Verde S.A.C.', rep: 'Diego Salas Rivera', tipo: 'Pasajeros', tel: '987100200', correo: 'contacto@costaverde.pe', ini: '01/02/2026', fin: '31/01/2031', err: {} },
    { ruc: '20498110022', razon: 'Líneas del Altiplano E.I.R.L.', rep: 'Carmen Ríos Pacheco', tipo: 'Carga/Comercio', tel: '956220033', correo: 'info@altiplano.pe', ini: '15/03/2026', fin: '14/03/2031', err: {} },
    { ruc: '2051234', razon: 'Turismo El Sol S.A.C.', rep: 'Pablo Núñez Gala', tipo: 'Turístico', tel: '945330044', correo: 'ventas@elsol.pe', ini: '10/01/2026', fin: '09/01/2031', err: { ruc: 'RUC inválido: debe tener 11 dígitos' } },
    { ruc: '20611990055', razon: 'Movilidad Praderas S.A.C.', rep: 'Lucía Vega Mora', tipo: 'Pasajeros', tel: '933440055', correo: 'praderas@mov.pe', ini: '05/04/2026', fin: '04/04/2031', err: {} },
    { ruc: '20512345678', razon: 'Transportes Lima Sur S.A.C.', rep: 'Juan Pérez Díaz', tipo: 'Pasajeros', tel: '987100200', correo: 'contacto@limasur.pe', ini: '12/02/2026', fin: '11/02/2031', err: {} },
    { ruc: '20603880077', razon: 'Rutas Integradas del Sur S.A.C.', rep: 'Elena Cárdenas Ruiz', tipo: 'Carga/Comercio', tel: '988660077', correo: 'rutas@integradas.pe', ini: '20/05/2026', fin: '19/05/2031', err: {} }
  ];

  @HostListener('document:click')
  clickOutside(): void {
    this.activeMenuRuc = null;
  }
  toggleRowMenu(ruc: string, event: Event): void {
    event.stopPropagation();
    this.activeMenuRuc = this.activeMenuRuc === ruc ? null : ruc;
  }
  editAction(emp: EmpresaData): void {
    this.activeMenuRuc = null;
    this.abrirModal(emp);
  }
  autosAction(emp: EmpresaData): void {
    this.activeMenuRuc = null;
    this.irVehiculos(emp);
  }
  deleteAction(emp: EmpresaData): void {
    this.activeMenuRuc = null;
    Swal.fire({
      title: '¿Eliminar registro?',
      text: `Está a punto de eliminar la empresa con RUC ${emp.ruc}. Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#737780',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.empresas = this.empresas.filter((e) => e.ruc !== emp.ruc);
        Swal.fire('Eliminado', 'El registro ha sido eliminado.', 'success');
      }
    });
  }

  constructor() {}

  ngOnInit(): void {
    this.usuario = this.resolveSession();
  }

  private resolveSession(): Usuario | null {
    const local = this.authService.getSession();
    if (local) return local;

    const api = this.apiAuthService.getSession();
    if (api) {
      return {
        email: '',
        password: '',
        nombre: api.user.nombrePersona,
        primerApellido: api.user.apellidoPaterno,
        segundoApellido: api.user.apellidoMaterno,
        entidad: api.user.nombreEntidad,
        tipoEntidad: 'regional',
      } as Usuario;
    }
    return null;
  }

  getEmptyEmpresa(): EmpresaData {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const formattedToday = `${yyyy}-${mm}-${dd}`;

    return {
      placa: '',
      categoria: 'M2',
      tuc: '',
      fechaInicioTuc: formattedToday,
      fechaFinTuc: formattedToday,
      estadoTuc: 'VIGENTE',
      razonSocial: '',
      ruc: '',
      partidaRegistral: '',
      tipoServicio: 'SERVICIO DE TRANSPORTE NACIONAL REGULAR',
      actoAdministrativo: '',
      fechaInicioAut: formattedToday,
      fechaFinAut: formattedToday,
      estadoAut: 'HABILITADO',
    };
  }

  abrirModal(emp?: EmpresaData): void {
    if (emp) {
      this.modoEdicion = true;
      this.nuevaEmpresa = { ...emp };
      this.empresaEditIndex = this.empresas.indexOf(emp);
    } else {
      this.modoEdicion = false;
      this.nuevaEmpresa = this.getEmptyEmpresa();
      this.empresaEditIndex = -1;
    }
    this.modalAgregarOpen = true;
  }

  cerrarModal(): void {
    this.modalAgregarOpen = false;
  }

  guardarEmpresa(): void {
    // Basic validation
    if (
      !this.nuevaEmpresa.placa ||
      !this.nuevaEmpresa.ruc ||
      !this.nuevaEmpresa.razonSocial ||
      !this.nuevaEmpresa.tuc
    ) {
      Swal.fire(
        'Campos obligatorios',
        'Por favor complete la Placa, RUC, Razón Social y TUC.',
        'warning',
      );
      return;
    }

    if (this.modoEdicion && this.empresaEditIndex > -1) {
      this.empresas[this.empresaEditIndex] = { ...this.nuevaEmpresa };
      this.cerrarModal();
      Swal.fire({
        title: '¡Edición Exitosa!',
        text: 'Los datos han sido actualizados correctamente.',
        icon: 'success',
        confirmButtonColor: '#0059bb',
      });
    } else {
      this.empresas.unshift({ ...this.nuevaEmpresa });
      this.cerrarModal();
      Swal.fire({
        title: '¡Registro Exitoso!',
        text: 'La empresa/vehículo ha sido agregada correctamente a la grilla.',
        icon: 'success',
        confirmButtonColor: '#0059bb',
      });
    }
  }

  // Bulk upload actions
  openBulk(): void {
    this.bulkOpen = true;
    this.bulkStep = 'drop';
    this.bulkFile = '';
    this.bulkFilter = 'all';
    this.bulkData = [];
    this.expandedRowIndex = null;
  }

  closeBulk(): void {
    this.bulkOpen = false;
  }

  resetBulk(): void {
    this.bulkStep = 'drop';
    this.bulkFile = '';
    this.bulkData = [];
    this.expandedRowIndex = null;
  }

  simulateBulk(): void {
    this.bulkFile = 'padron_empresas_valido.xlsx';
    this.bulkStep = 'grid';
    // Deep clone sampleBulk so edits don't mutate original
    this.bulkData = this.sampleBulk.map(row => ({
      ...row,
      err: { ...row.err }
    }));
  }

  downloadTemplate(): void {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'info',
      title: 'Descargando plantilla oficial (.xlsx)…',
      showConfirmButton: false,
      timer: 2000
    });
  }

  deleteBulkRow(idx: number): void {
    this.bulkData = this.bulkData.filter((_, i) => i !== idx);
    if (this.expandedRowIndex === idx) {
      this.expandedRowIndex = null;
    }
  }

  toggleBulkExpand(idx: number): void {
    this.expandedRowIndex = this.expandedRowIndex === idx ? null : idx;
  }

  confirmBulk(): void {
    const validRows = this.bulkData.filter(r => Object.keys(r.err).length === 0);
    if (validRows.length === 0) {
      Swal.fire('Atención', 'No hay registros válidos para cargar', 'warning');
      return;
    }

    // Map bulk rows to EmpresaData structure
    const newEmpresas: EmpresaData[] = validRows.map(r => ({
      placa: 'ABC-' + Math.floor(100 + Math.random() * 900), // Mock placa
      categoria: 'M3',
      tuc: 'TUC-2026' + Math.floor(1000 + Math.random() * 9000), // Mock TUC
      fechaInicioTuc: r.ini ? r.ini.split('/').reverse().join('-') : '2026-06-01',
      fechaFinTuc: r.fin ? r.fin.split('/').reverse().join('-') : '2031-06-01',
      estadoTuc: 'VIGENTE',
      razonSocial: r.razon,
      ruc: r.ruc,
      partidaRegistral: 'PART-' + Math.floor(10000 + Math.random() * 90000),
      tipoServicio: r.tipo === 'Pasajeros' ? 'SERVICIO DE TRANSPORTE NACIONAL REGULAR' : 'SERVICIO DE TRANSPORTE DE MERCANCÍAS',
      actoAdministrativo: 'RES-' + Math.floor(100 + Math.random() * 900) + '-2026-ATU',
      fechaInicioAut: r.ini ? r.ini.split('/').reverse().join('-') : '2026-06-01',
      fechaFinAut: r.fin ? r.fin.split('/').reverse().join('-') : '2031-06-01',
      estadoAut: 'HABILITADO'
    }));

    // Add new ones, or overwrite existing ones by RUC
    newEmpresas.forEach(newItem => {
      const existingIdx = this.empresas.findIndex(e => e.ruc === newItem.ruc);
      if (existingIdx > -1) {
        this.empresas[existingIdx] = newItem;
      } else {
        this.empresas.unshift(newItem);
      }
    });

    this.bulkOpen = false;
    Swal.fire('Éxito', `${validRows.length} registros cargados correctamente a la base de datos (grilla).`, 'success');
  }

  get okCount(): number {
    return this.bulkData.filter(r => Object.keys(r.err).length === 0).length;
  }

  get errCount(): number {
    return this.bulkData.filter(r => Object.keys(r.err).length > 0).length;
  }

  get updCount(): number {
    return this.bulkData.filter(r => Object.keys(r.err).length === 0 && this.empresas.some(e => e.ruc === r.ruc)).length;
  }

  get newCount(): number {
    return this.bulkData.filter(r => Object.keys(r.err).length === 0 && !this.empresas.some(e => e.ruc === r.ruc)).length;
  }

  get hasUpdates(): boolean {
    return this.updCount > 0;
  }

  get hasErrors(): boolean {
    return this.errCount > 0;
  }

  get filteredBulkData(): any[] {
    if (this.bulkFilter === 'new') {
      return this.bulkData.filter(r => Object.keys(r.err).length === 0 && !this.empresas.some(e => e.ruc === r.ruc));
    }
    if (this.bulkFilter === 'upd') {
      return this.bulkData.filter(r => Object.keys(r.err).length === 0 && this.empresas.some(e => e.ruc === r.ruc));
    }
    if (this.bulkFilter === 'err') {
      return this.bulkData.filter(r => Object.keys(r.err).length > 0);
    }
    return this.bulkData;
  }

  getBulkRowDetail(r: any): any[] {
    const list: any[] = [];
    if (Object.keys(r.err).length > 0) {
      Object.keys(r.err).forEach(k => {
        list.push({
          label: k.toUpperCase() + ' (Error)',
          labelColor: 'var(--bad)',
          color: 'var(--bad)',
          text: r.err[k]
        });
      });
    } else {
      const exists = this.empresas.some(e => e.ruc === r.ruc);
      if (exists) {
        list.push({
          label: 'Acción',
          labelColor: 'var(--warn)',
          color: 'var(--warn)',
          text: 'Sobrescribirá la empresa con el mismo RUC.'
        });
      } else {
        list.push({
          label: 'Acción',
          labelColor: 'var(--ok)',
          color: 'var(--ok)',
          text: 'Creará un nuevo registro en la grilla.'
        });
      }
    }
    list.push({ label: 'Representante', labelColor: 'var(--text-3)', color: 'var(--text-2)', text: r.rep });
    list.push({ label: 'Correo', labelColor: 'var(--text-3)', color: 'var(--text-2)', text: r.correo });
    list.push({ label: 'Teléfono', labelColor: 'var(--text-3)', color: 'var(--text-2)', text: r.tel });
    return list;
  }

  onBulkCellInput(r: any, field: string): void {
    if (field === 'ruc') {
      if (/^\d{11}$/.test(r.ruc)) {
        delete r.err.ruc;
      } else {
        r.err.ruc = 'El RUC debe tener 11 dígitos';
      }
    }
    // Clean empty error object if resolved
    if (Object.keys(r.err).length === 0) {
      r.err = {};
    }
  }

  /** Nombre completo: Nombre + Apellidos */
  get nombreCompleto(): string {
    if (!this.usuario) return '—';
    const partes = [
      this.usuario.nombre,
      this.usuario.primerApellido,
      this.usuario.segundoApellido,
    ].filter(Boolean);
    return partes.join(' ') || '—';
  }

  /** Dirección completa: Vía + Dist + Prov + Dep */
  get direccionCompleta(): string {
    if (!this.usuario) return '—';
    const partes = [
      this.usuario.distrito,
      this.usuario.provincia,
      this.usuario.departamento,
    ].filter(Boolean);
    return partes.join(', ') || '—';
  }

  /** Etiqueta legible del tipo de entidad */
  get tipoEntidadLabel(): string {
    const mapa: Record<string, string> = {
      regional: 'Gobierno Regional',
      municipal: 'Municipalidad Provincial',
      empresa: 'Empresa de Transporte',
    };
    return this.usuario ? (mapa[this.usuario.tipoEntidad] ?? '—') : '—';
  }

  checkRucExists(ruc: string): boolean {
    return this.empresas.some(e => e.ruc === ruc);
  }

  irVehiculos(emp: EmpresaData) {
    this.router.navigate(['/vehiculo-empresa']);
  }
}

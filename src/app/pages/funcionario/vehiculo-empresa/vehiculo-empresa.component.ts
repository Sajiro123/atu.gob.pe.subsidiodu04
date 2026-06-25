import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TableModule } from 'primeng/table';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { AutoCompleteModule } from 'primeng/autocomplete';
import Swal from 'sweetalert2';

const CAT_LABELS: Record<string, string> = {
  M2: 'Microbús',
  M3: 'Ómnibus',
  N1: 'Carga',
};

const ESTADO_BADGE: Record<string, { bg: string; fg: string }> = {
  VIGENTE:    { bg: '#E4F4EA', fg: '#15803D' },
  SUSPENDIDO: { bg: '#FBEFDD', fg: '#B45309' },
  VENCIDO:    { bg: '#FEE2E2', fg: '#DC2626' },
};

interface AddForm {
  placa: string;
  cat: string;
  tuc: string;
  iniF: string;
  finF: string;
  estado: string;
}

@Component({
  selector: 'app-vehiculo-empresa',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TableModule, OverlayPanelModule, AutoCompleteModule],
  templateUrl: './vehiculo-empresa.component.html',
  styleUrl: './vehiculo-empresa.component.scss'
})
export class VehiculoEmpresaComponent implements OnInit {

  // List of mock companies to search from
  empresasLista = [
    { label: 'EMPRESA DE TRANSPORTE URBANUS S.A.C.', ruc: '20556677881', tipoLabel: 'SERVICIO DE TRANSPORTE NACIONAL REGULAR', acto: 'RES-0012-2026-ATU', estadoText: 'HABILITADO', badgeBg: '#E4F4EA', badgeFg: '#15803D' },
    { label: 'TRANSPORTES RAPIDO LIMA S.A.', ruc: '20112233445', tipoLabel: 'SERVICIO DE TRANSPORTE NACIONAL REGULAR', acto: 'RES-0542-2026-ATU', estadoText: 'HABILITADO', badgeBg: '#E4F4EA', badgeFg: '#15803D' },
    { label: 'TRANSPORTES COSTA VERDE S.A.C.', ruc: '20512300011', tipoLabel: 'SERVICIO DE TRANSPORTE DE MERCANCÍAS', acto: 'RES-0899-2026-ATU', estadoText: 'HABILITADO', badgeBg: '#E4F4EA', badgeFg: '#15803D' },
  ];

  selectedItem: any = this.empresasLista[0];
  filteredItems: any[] = [];

  filterItems(event: any) {
    const query = event.query.toLowerCase();
    this.filteredItems = this.empresasLista.filter(emp => 
      emp.label.toLowerCase().includes(query) || emp.ruc.includes(query)
    );
  }

  onEmpresaSelect(event: any) {
    const value = event.value || event;
    if (value) {
      this.selEmp = {
        ...value,
        razon: value.label,
        vTotal: Math.floor(6 + Math.random() * 10),
        vVig: 0,
        vVenc: 0
      };
      this.generarVehiculosMock();
    }
  }

  // Mock data representing the selected company
  selEmp: any = {
    razon: 'EMPRESA DE TRANSPORTE URBANUS S.A.C.',
    estadoText: 'HABILITADO',
    badgeBg: '#E4F4EA',
    badgeFg: '#15803D',
    ruc: '20556677881',
    tipoLabel: 'SERVICIO DE TRANSPORTE NACIONAL REGULAR',
    acto: 'RES-0012-2026-ATU',
    vTotal: 12,
    vVig: 9,
    vVenc: 3
  };

  vehiculos: any[] = [];
  vehShowTable = true;

  vehFilters = { q: '', cat: '', estado: '' };
  catOpts = [
    {value:'', label:'Todas'},
    {value:'M2', label:'M2 - Microbús'},
    {value:'M3', label:'M3 - Ómnibus'},
    {value:'N1', label:'N1 - Carga'}
  ];
  estadoVehOpts = [
    {value:'', label:'Todos'},
    {value:'VIGENTE', label:'Vigentes'},
    {value:'VENCIDO', label:'Vencidas'}
  ];

  // ─── Modal ────────────────────────────────────────────────
  showAddModal = false;

  addForm: AddForm = this.emptyForm();
  addErrors: Partial<Record<keyof AddForm, string>> = {};

  // ─── Dropdown options per row ──────────────────────────────
  activeMenuPlaca: string | null = null;

  // ─── Modal de Edición ─────────────────────────────────────
  showEditModal = false;
  editForm: AddForm = this.emptyForm();
  editErrors: Partial<Record<keyof AddForm, string>> = {};
  editingVehiculoPlaca: string | null = null;

  // ─────────────────────────────────────────────────────────

  ngOnInit() {
    this.generarVehiculosMock();
  }

  generarVehiculosMock() {
    this.vehiculos = Array.from({length: this.selEmp.vTotal}).map((_, i) => ({
       placa: `F${i % 9}B-${Math.floor(100 + Math.random() * 899)}`,
       cat: i % 2 === 0 ? 'M2' : 'M3',
       catLabel: i % 2 === 0 ? 'Microbús' : 'Ómnibus',
       tuc: `TUC-2026${Math.floor(1000 + Math.random() * 8999)}`,
       iniF: '10/01/2026',
       finF: i % 3 === 0 ? '15/07/2026' : '10/01/2027',
       estadoText: i % 4 === 0 ? 'SUSPENDIDO' : 'VIGENTE',
       badgeBg: i % 4 === 0 ? '#FBEFDD' : '#E4F4EA',
       badgeFg: i % 4 === 0 ? '#B45309' : '#15803D',
       porVencer: i % 3 === 0,
       venceTxt: 'Vence pronto'
    }));
    this.recalculateFlotaStats();
  }

  recalculateFlotaStats() {
    const total = this.vehiculos.length;
    const vig = this.vehiculos.filter(v => v.estadoText === 'VIGENTE').length;
    const venc = this.vehiculos.filter(v => v.estadoText === 'VENCIDO').length;
    this.selEmp = {
      ...this.selEmp,
      vTotal: total,
      vVig: vig,
      vVenc: venc
    };
  }

  openUploadVeh() { Swal.fire('Carga Masiva', 'Modal para carga de vehículos...', 'info'); }
  exportAction()  { Swal.fire('Exportar', 'Exportando...', 'success'); }

  /** Abre el modal de agregar vehículo */
  addAction() {
    this.addForm   = this.emptyForm();
    this.addErrors = {};
    this.showAddModal = true;
  }

  /** Cierra el modal sin guardar */
  closeAddModal() {
    this.showAddModal = false;
  }

  /** Actualiza catLabel cuando cambia la categoría */
  onCatChange() { /* se calcula en saveVehiculo */ }

  /** Valida y guarda el nuevo vehículo en la lista */
  saveVehiculo() {
    this.addErrors = {};
    const f = this.addForm;

    if (!f.placa.trim())  this.addErrors['placa']  = 'La placa es obligatoria.';
    if (!f.cat)           this.addErrors['cat']    = 'Seleccione una categoría.';
    if (!f.tuc.trim())    this.addErrors['tuc']    = 'El N° TUC es obligatorio.';
    if (!f.iniF)          this.addErrors['iniF']   = 'Indique la fecha de inicio.';
    if (!f.finF)          this.addErrors['finF']   = 'Indique la fecha de fin.';
    if (f.iniF && f.finF && f.finF < f.iniF)
                          this.addErrors['finF']   = 'La fecha de fin debe ser posterior al inicio.';
    if (!f.estado)        this.addErrors['estado'] = 'Seleccione un estado.';

    if (Object.keys(this.addErrors).length > 0) return;

    const badge = ESTADO_BADGE[f.estado] ?? { bg: '#E4F4EA', fg: '#15803D' };
    const fmt   = (d: string) => d ? d.split('-').reverse().join('/') : '';

    const nuevo: any = {
      placa:      f.placa.toUpperCase(),
      cat:        f.cat,
      catLabel:   CAT_LABELS[f.cat] ?? f.cat,
      tuc:        f.tuc.toUpperCase(),
      iniF:       fmt(f.iniF),
      finF:       fmt(f.finF),
      estadoText: f.estado,
      badgeBg:    badge.bg,
      badgeFg:    badge.fg,
      porVencer:  false,
      venceTxt:   ''
    };

    this.vehiculos = [nuevo, ...this.vehiculos];
    this.recalculateFlotaStats();
    this.showAddModal = false;

    Swal.fire({
      icon: 'success',
      title: 'Vehículo registrado',
      text: `La placa ${nuevo.placa} fue agregada correctamente.`,
      timer: 2200,
      showConfirmButton: false
    });
  }

  // ─── Menús de Acciones y Edición ──────────────────────────

  toggleRowMenu(placa: string, event: Event) {
    event.stopPropagation();
    this.activeMenuPlaca = this.activeMenuPlaca === placa ? null : placa;
  }

  @HostListener('document:click')
  onDocumentClick() {
    this.activeMenuPlaca = null;
  }

  editAction(veh: any) {
    this.activeMenuPlaca = null;
    this.editingVehiculoPlaca = veh.placa;
    
    // Rellenar formulario con datos parsed a formato de input (date)
    this.editForm = {
      placa: veh.placa,
      cat: veh.cat,
      tuc: veh.tuc,
      iniF: this.parseDateToInput(veh.iniF),
      finF: this.parseDateToInput(veh.finF),
      estado: veh.estadoText
    };
    this.editErrors = {};
    this.showEditModal = true;
  }

  closeEditModal() {
    this.showEditModal = false;
    this.editingVehiculoPlaca = null;
  }

  updateVehiculo() {
    this.editErrors = {};
    const f = this.editForm;

    if (!f.placa.trim())  this.editErrors['placa']  = 'La placa es obligatoria.';
    if (!f.cat)           this.editErrors['cat']    = 'Seleccione una categoría.';
    if (!f.tuc.trim())    this.editErrors['tuc']    = 'El N° TUC es obligatorio.';
    if (!f.iniF)          this.editErrors['iniF']   = 'Indique la fecha de inicio.';
    if (!f.finF)          this.editErrors['finF']   = 'Indique la fecha de fin.';
    if (f.iniF && f.finF && f.finF < f.iniF)
                          this.editErrors['finF']   = 'La fecha de fin debe ser posterior al inicio.';
    if (!f.estado)        this.editErrors['estado'] = 'Seleccione un estado.';

    if (Object.keys(this.editErrors).length > 0) return;

    const idx = this.vehiculos.findIndex(v => v.placa === this.editingVehiculoPlaca);
    if (idx !== -1) {
      const badge = ESTADO_BADGE[f.estado] ?? { bg: '#E4F4EA', fg: '#15803D' };
      const fmt   = (d: string) => d ? d.split('-').reverse().join('/') : '';

      // Mantener propiedades calculadas como porVencer si fuesen necesarias
      const dateParts = f.finF ? f.finF.split('-') : [];
      const isSoon = dateParts.length === 3 && new Date(f.finF) < new Date(new Date().setDate(new Date().getDate() + 30));

      this.vehiculos[idx] = {
        ...this.vehiculos[idx],
        placa:      f.placa.toUpperCase(),
        cat:        f.cat,
        catLabel:   CAT_LABELS[f.cat] ?? f.cat,
        tuc:        f.tuc.toUpperCase(),
        iniF:       fmt(f.iniF),
        finF:       fmt(f.finF),
        estadoText: f.estado,
        badgeBg:    badge.bg,
        badgeFg:    badge.fg,
        porVencer:  isSoon,
        venceTxt:   isSoon ? 'Vence pronto' : ''
      };

      this.recalculateFlotaStats();
    }

    this.showEditModal = false;
    this.editingVehiculoPlaca = null;

    Swal.fire({
      icon: 'success',
      title: 'Cambios guardados',
      text: 'El vehículo fue actualizado correctamente.',
      timer: 2200,
      showConfirmButton: false
    });
  }

  deleteAction(veh: any) {
    this.activeMenuPlaca = null;
    Swal.fire({
      title: '¿Confirmar eliminación?',
      text: `Se eliminará el vehículo con placa ${veh.placa} de la flota.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.vehiculos = this.vehiculos.filter(v => v.placa !== veh.placa);
        this.recalculateFlotaStats();
        Swal.fire(
          'Eliminado',
          'El vehículo ha sido retirado de la lista.',
          'success'
        );
      }
    });
  }

  private parseDateToInput(d: string): string {
    if (!d) return '';
    const parts = d.split('/');
    if (parts.length === 3) {
      // DD/MM/YYYY -> YYYY-MM-DD
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return d;
  }

  setVehGrid() { this.vehShowTable = true; }
  setVehList()  { this.vehShowTable = false; }

  private emptyForm(): AddForm {
    return { placa: '', cat: '', tuc: '', iniF: '', finF: '', estado: '' };
  }
}


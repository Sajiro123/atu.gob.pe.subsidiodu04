import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CargaService } from '../../../../core/services/carga.service';
import { EnvioATU } from '../../../../core/models/models';

@Component({
  selector: 'app-historial',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './historial.component.html',
  styleUrl: './historial.component.scss'
})
export class HistorialComponent implements OnInit {
  historial: EnvioATU[] = [];

  private readonly cargaService = inject(CargaService);


  ngOnInit(): void {
    this.historial = this.cargaService.getHistorial();
  }

  get totalElegibles(): number {
    return this.historial.reduce((acc, h) => acc + h.elegibles, 0);
  }

  get totalRegistros(): number {
    return this.historial.reduce((acc, h) => acc + h.total, 0);
  }

  getEnvioId(id: number): string {
    return `ENV-DU004-${String(id).padStart(4,'0')}`;
  }
}

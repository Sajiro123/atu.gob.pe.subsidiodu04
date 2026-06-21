import { Injectable } from '@angular/core';
import { RegistroVehicular, EnvioATU, RegistroRaw } from '../models/models';

// ── Subsidy max gallons per category ──────────────────────
export const MAX_GALONES: Record<string, number> = {
  M2: 674.65, M3: 1915.41,
  N1: 552.52, N2: 888.45, N3: 1412.54
};

// ── Excel column mapping ──────────────────────────────────
const COLUMN_MAP: Record<string, keyof RegistroRaw> = {
  'PLACA DE VEHÍCULO':                        'placa',
  'CATEGORÍA VEHICULAR':                      'categoria',
  'TARJETA ÚNICA DE CIRCULACIÓN':             'tuc',
  'FECHA DE INICIO DE VIGENCIA (TUC)':        'fecha_inicio_tuc',
  'FECHA FIN DE VIGENCIA (TUC)':              'fecha_fin_tuc',
  'ESTADO DE TUC':                            'estado_tuc',
  'NOMBRE O RAZÓN SOCIAL DEL TRANSPORTISTA':  'transportista',
  'RUC DEL TRANSPORTISTA':                    'ruc',
  'PARTIDA REGISTRAL O CÓDIGO DE INSCRIPCIÓN':'partida_registral',
  'TIPO DE SERVICIO AUTORIZADO':              'tipo_servicio',
  'ACTO ADMINISTRATIVO DE AUTORIZACIÓN':      'acto_administrativo',
  'FECHA DE INICIO DE VIGENCIA (AUTORIZACIÓN)':'fecha_inicio_aut',
  'FECHA FIN DE VIGENCIA (AUTORIZACIÓN)':     'fecha_fin_aut',
  'ESTADO (AUTORIZACIÓN)':                    'estado_aut'
};

const FECHA_LIMITE = new Date('2026-05-29');

const CATEGORIAS_VALIDAS = ['M2','M3','N1','N2','N3'];
const ESTADOS_TUC_VALIDOS = ['VIGENTE','SUSPENDIDO','CANCELADO Y/O INHABILITADO'];
const ESTADOS_AUT_VALIDOS = ['HABILITADO','SUSPENDIDO','CANCELADO Y/O INHABILITADO'];
const TIPOS_SERVICIO_VALIDOS = [
  'SERVICIO DE TRANSPORTE NACIONAL REGULAR',
  'SERVICIO DE TRANSPORTE DE MERCANCÍAS'
];

@Injectable({ providedIn: 'root' })
export class CargaService {

  private registros: RegistroVehicular[] = [];
  private erroresGlobales: { fila: number; msg: string }[] = [];
  private historial: EnvioATU[] = [];
  private idCounter = 0;
  private envioCounter = 0;

  // ── Map raw Excel row → RegistroRaw ──────────────────
  mapearFila(row: Record<string, unknown>): RegistroRaw {
    const obj = {} as RegistroRaw;
    for (const [excelCol, campo] of Object.entries(COLUMN_MAP)) {
      const key = Object.keys(row).find(
        k => k.trim().toUpperCase() === excelCol.trim().toUpperCase()
      );
      (obj as unknown as Record<string, string>)[campo] = key
        ? String(row[key]).trim()
        : '';
    }
    return obj;
  }

  // ── Validate a single record ──────────────────────────
  validarRegistro(row: RegistroRaw, fila: number, seenPlates?: Set<string>): RegistroVehicular {
    const errores: string[] = [];

    const campos: (keyof RegistroRaw)[] = [
      'placa','categoria','tuc','fecha_inicio_tuc','estado_tuc',
      'transportista','ruc','tipo_servicio','acto_administrativo',
      'fecha_inicio_aut','estado_aut'
    ];
    campos.forEach(c => {
      if (!row[c]?.toString().trim()) errores.push(`Falta "${c}"`);
    });

    if (row.placa) {
      const placaClean = row.placa.toString().trim().toUpperCase();
      if (!/^[A-Z0-9]{6}$/.test(placaClean)) {
        errores.push('Placa debe tener 6 caracteres alfanuméricos sin espacios ni guiones');
      }
      if (seenPlates) {
        if (seenPlates.has(placaClean)) {
          errores.push('Placa duplicada');
        } else {
          seenPlates.add(placaClean);
        }
      }
    }
    if (row.categoria && !CATEGORIAS_VALIDAS.includes(row.categoria.toUpperCase())) {
      errores.push('Categoría debe ser M2, M3, N1, N2 o N3');
    }
    if (row.ruc && !/^\d{11}$/.test(row.ruc.trim())) {
      errores.push('RUC debe tener 11 dígitos');
    }

    const validarFecha = (f: string, campo: string): void => {
      if (!f) return;
      const d = new Date(f);
      if (isNaN(d.getTime())) { errores.push(`Fecha ${campo} inválida`); return; }
      if (d > FECHA_LIMITE) errores.push(`${campo} debe ser ≤ 29/05/2026`);
    };
    validarFecha(row.fecha_inicio_tuc, 'fecha_inicio_tuc');
    validarFecha(row.fecha_inicio_aut, 'fecha_inicio_aut');

    if (row.estado_tuc && !ESTADOS_TUC_VALIDOS.includes(row.estado_tuc.toUpperCase())) {
      errores.push('Estado TUC inválido');
    }
    if (row.estado_aut && !ESTADOS_AUT_VALIDOS.includes(row.estado_aut.toUpperCase())) {
      errores.push('Estado autorización inválido');
    }
    if (row.tipo_servicio && !TIPOS_SERVICIO_VALIDOS.includes(row.tipo_servicio.toUpperCase())) {
      errores.push('Tipo servicio no permitido');
    }

    const valido   = errores.length === 0;
    const elegible = valido
      && row.estado_tuc?.toUpperCase() === 'VIGENTE'
      && row.estado_aut?.toUpperCase() === 'HABILITADO';

    return {
      ...row,
      id: 0, fila,
      categoria:  row.categoria?.toUpperCase()  || '',
      estado_tuc: row.estado_tuc?.toUpperCase() || '',
      estado_aut: row.estado_aut?.toUpperCase() || '',
      valido, elegible, errores
    };
  }

  // ── Process parsed data ───────────────────────────────
  procesarDatos(datos: RegistroRaw[]): {
    total: number; validos: number; invalidos: number;
  } {
    const seenPlates = new Set<string>(
      this.registros.map(r => r.placa.trim().toUpperCase())
    );
    const resultados = datos.map((r, i) => this.validarRegistro(r, i + 1, seenPlates));
    const validos   = resultados.filter(r => r.valido);
    const invalidos = resultados.filter(r => !r.valido);

    validos.forEach(r => { r.id = ++this.idCounter; });
    this.registros      = [...this.registros, ...validos];
    this.erroresGlobales = invalidos.map(r => ({
      fila: r.fila, msg: r.errores.join('; ')
    }));

    return { total: resultados.length, validos: validos.length, invalidos: invalidos.length };
  }

  // ── CRUD helpers ──────────────────────────────────────
  getRegistros(): RegistroVehicular[]  { return this.registros; }
  getErrores():   typeof this.erroresGlobales { return this.erroresGlobales; }
  getHistorial(): EnvioATU[]           { return this.historial; }

  getResumen() {
    const total   = this.registros.length;
    const validos = this.registros.filter(r => r.valido).length;
    const elegibles = this.registros.filter(r => r.elegible).length;
    return { total, validos, elegibles, errores: total - validos, noElegibles: validos - elegibles };
  }

  eliminarRegistro(id: number): void {
    this.registros = this.registros.filter(r => r.id !== id);
  }

  limpiar(): void {
    this.registros = [];
    this.erroresGlobales = [];
    this.idCounter = 0;
  }

  // ── Submit to ATU ─────────────────────────────────────
  confirmarEnvio(entidad: string, oficio: string, documento: string): EnvioATU {
    const elegibles = this.registros.filter(r => r.elegible).length;
    const envio: EnvioATU = {
      id:         ++this.envioCounter,
      entidad, oficio, documento,
      fecha:      new Date().toLocaleString('es-PE'),
      total:      this.registros.length,
      elegibles,
      estado:     'RECIBIDO POR ATU'
    };
    this.historial.unshift(envio);
    return envio;
  }

  // ── Download helpers ──────────────────────────────────
  descargarErroresCSV(): void {
    if (!this.erroresGlobales.length) return;
    let csv = 'Fila,Mensaje\n';
    this.erroresGlobales.forEach(e => { csv += `${e.fila},"${e.msg}"\n`; });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'errores_validacion_DU004.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  getMaxSubsidio(categoria: string): string {
    const g = MAX_GALONES[categoria.toUpperCase()];
    return g ? `S/ ${(g * 4).toFixed(2)}` : '—';
  }
}

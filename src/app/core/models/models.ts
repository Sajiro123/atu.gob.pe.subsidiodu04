// =========================================================
// SIGT – ATU | Models
// =========================================================

export interface Usuario {
  email: string;
  password: string;
  nombre: string;
  tipoEntidad: 'regional' | 'municipal';
  entidad: string;
  documentoCargo?: string;
  registradoEn?: string;
}

export interface RegistroVehicular {
  id: number;
  fila: number;
  placa: string;
  categoria: 'M2' | 'M3' | 'N1' | 'N2' | 'N3' | string;
  tuc: string;
  fecha_inicio_tuc: string;
  fecha_fin_tuc: string;
  estado_tuc: string;
  transportista: string;
  ruc: string;
  partida_registral: string;
  tipo_servicio: string;
  acto_administrativo: string;
  fecha_inicio_aut: string;
  fecha_fin_aut: string;
  estado_aut: string;
  valido: boolean;
  elegible: boolean;
  errores: string[];
}

export interface EnvioATU {
  id: number;
  entidad: string;
  oficio: string;
  documento: string;
  fecha: string;
  total: number;
  elegibles: number;
  estado: string;
}

export interface RegistroRaw {
  placa: string;
  categoria: string;
  tuc: string;
  fecha_inicio_tuc: string;
  fecha_fin_tuc: string;
  estado_tuc: string;
  transportista: string;
  ruc: string;
  partida_registral: string;
  tipo_servicio: string;
  acto_administrativo: string;
  fecha_inicio_aut: string;
  fecha_fin_aut: string;
  estado_aut: string;
}

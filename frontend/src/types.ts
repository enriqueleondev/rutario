// Modelo de dominio compartido con el backend (Spring Boot). Mantener sincronizado con los DTOs.

export type Rol = 'ROOT' | 'DIRECTIVO' | 'VINCULADOR' | 'ORIENTADOR' | 'DOCENTE' | 'ALUMNO' | 'EMPLEADOR'

export type TipoPractica = 'SERVICIO_SOCIAL' | 'ESTADIAS' | 'EJECUCION'

export type DiaSemana = 'LUNES' | 'MARTES' | 'MIERCOLES' | 'JUEVES' | 'VIERNES'

export interface GrupoRef {
  carreraId: number
  grado: number
  grupo: number
}

export interface Usuario {
  id: number
  nombre: string
  apellidoPaterno: string
  apellidoMaterno?: string
  /** Login de personal. Alumnos lo tendrán en el futuro. */
  email?: string
  /** Login de alumnos: 8 dígitos */
  matricula?: string
  rol: Rol
  carreraId?: number
  /** Solo empleadores: empresa a la que pertenecen */
  empresaId?: number
  grado?: number
  grupo?: number
  /** Solo orientadores: grupos que puede consultar */
  gruposAsignados?: GrupoRef[]
  telefono?: string
  activo: boolean
  registradoPor?: number
  createdAt: string
  /** true si aún no acepta la versión vigente del aviso de privacidad */
  avisoPendiente?: boolean
  /** true si su contraseña la asignó otra persona y debe cambiarla al entrar */
  debeCambiarPassword?: boolean
}

export interface Carrera {
  id: number
  nombre: string
  clave: string
  descripcion?: string
  /** número de grupos por grado (índice 0 = 1er grado) */
  gruposPorGrado: number[]
  icono: 'car' | 'laptop' | 'flask' | 'book'
  activa: boolean
}

export interface Empresa {
  id: number
  nombre: string
  giro?: string
  direccion: string
  latitud: number
  longitud: number
  contactoNombre?: string
  contactoTelefono?: string
  contactoEmail?: string
  activa: boolean
  creadaPor?: number
}

export interface HorarioDia {
  dia: DiaSemana
  inicio: string // HH:mm
  fin: string
}

export interface Vinculacion {
  id: number
  usuarioId: number
  empresaId: number
  tipoPractica: TipoPractica
  actividades: string
  fechaInicio?: string
  fechaFin?: string
  horario: HorarioDia[]
  vinculadorId: number
  /** Persona de la empresa (rol EMPLEADOR) que valida la asistencia del alumno */
  empleadorId?: number
}

/** Alumno asignado a un empleador, tal como lo ve él: sin foto ni ubicación */
export interface Asignado {
  usuarioId: number
  nombre: string
  carrera?: string
  grado?: number
  grupo?: number
  tipoPractica: TipoPractica
  actividades: string
  horarioInicio?: string
  horarioFin?: string
  /** Registro de entrada de hoy (null si aún no llega) */
  registroId?: number
  entrada?: string
  salida?: string
  estado: 'SIN_ENTRADA' | 'PENDIENTE' | 'PRESENTE' | 'AUSENTE'
  comentario?: string
  validadoEn?: string
}

/** Confirmación de la empresa sobre la entrada de un alumno */
export interface Validacion {
  id: number
  registroId: number
  usuarioId: number
  fecha: string
  presente: boolean
  comentario?: string
  empleadorId?: number
  empleadorNombre?: string
  validadoEn: string
}

export interface Registro {
  id: number
  usuarioId: number
  tipo: 'ENTRADA' | 'SALIDA'
  timestamp: string // ISO
  /** Foto y GPS se eliminan al cumplir el plazo de conservación (1 año); entonces llegan vacíos. */
  latitud?: number
  longitud?: number
  fotoUrl?: string
  origen: 'APP' | 'WEB'
  /** true si se capturó sin conexión y se subió después */
  offline: boolean
  eliminado: boolean
}

export interface DiaNoLaborable {
  id: number
  fecha: string // YYYY-MM-DD
  descripcion: string
  tipo: 'FERIADO' | 'SUSPENSION' | 'CTE' | 'VACACIONES'
}

/** Jornada = par entrada/salida de un día (derivado de registros) */
export interface Jornada {
  fecha: string
  entrada?: Registro
  salida?: Registro
  horas: number
  completa: boolean
}

export interface ResumenHoras {
  usuario: Usuario
  vinculacion?: Vinculacion
  empresa?: Empresa
  diasAsistidos: number
  diasIncompletos: number
  horasTotales: number
  ultimoRegistro?: Registro
}

export const ROL_LABEL: Record<Rol, string> = {
  ROOT: 'Root',
  DIRECTIVO: 'Directivo',
  VINCULADOR: 'Vinculador',
  ORIENTADOR: 'Orientador',
  DOCENTE: 'Docente',
  ALUMNO: 'Alumno',
  EMPLEADOR: 'Empleador',
}

export const TIPO_LABEL: Record<TipoPractica, string> = {
  SERVICIO_SOCIAL: 'Servicio Social',
  ESTADIAS: 'Estadías',
  EJECUCION: 'Prácticas de Ejecución',
}

export const DIAS: { key: DiaSemana; corto: string }[] = [
  { key: 'LUNES', corto: 'Lun' },
  { key: 'MARTES', corto: 'Mar' },
  { key: 'MIERCOLES', corto: 'Mié' },
  { key: 'JUEVES', corto: 'Jue' },
  { key: 'VIERNES', corto: 'Vie' },
]

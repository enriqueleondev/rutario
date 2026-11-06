import type {
  Asignado, Carrera, DiaNoLaborable, Empresa, Jornada, Registro, ResumenHoras, Rol, TipoPractica, Usuario, Validacion, Vinculacion,
} from '../types'

export interface Sesion {
  token: string
  usuario: Usuario
}

export interface FiltroUsuarios {
  rol?: Rol | ''
  carreraId?: number | ''
  grado?: number | ''
  grupo?: number | ''
  q?: string
}

export interface FiltroRegistros {
  desde?: string // YYYY-MM-DD
  hasta?: string
  usuarioId?: number
  tipo?: 'ENTRADA' | 'SALIDA' | ''
  q?: string
}

export interface FiltroReporte {
  desde?: string
  hasta?: string
  rol?: 'ALUMNO' | 'DOCENTE' | ''
  carreraId?: number | ''
  grado?: number | ''
  grupo?: number | ''
  tipoPractica?: TipoPractica | ''
  empresaId?: number | ''
  estatus?: 'ACTIVO' | 'FINALIZADO' | ''
  q?: string
}

export interface NuevoRegistro {
  tipo: 'ENTRADA' | 'SALIDA'
  foto: Blob
  latitud: number
  longitud: number
  timestamp: string
}

export interface RegistroDetalle extends Registro {
  usuario: Usuario
  empresa?: Empresa
}

/**
 * Contrato del frontend con la API REST.
 * La implementación mock vive en mock.ts y la real (Spring Boot) en http.ts.
 * El backend aplica el alcance por rol: cada usuario solo recibe lo que su rol puede ver.
 */
export interface Api {
  login(identificador: string, password: string): Promise<Sesion>
  /** Cierra la sesión en todos los dispositivos (invalida los tokens emitidos) */
  logout(): Promise<void>
  /** Acepta la versión vigente del aviso de privacidad */
  aceptarAviso(): Promise<Usuario>
  /** Cambia la contraseña propia (pide la actual) */
  cambiarPassword(actual: string, nueva: string): Promise<Usuario>

  carreras(): Promise<Carrera[]>
  guardarCarrera(c: Partial<Carrera>): Promise<Carrera>

  usuarios(f?: FiltroUsuarios): Promise<Usuario[]>
  usuario(id: number): Promise<Usuario>
  guardarUsuario(u: Partial<Usuario>, password?: string): Promise<Usuario>
  setActivo(id: number, activo: boolean): Promise<void>

  /** Eliminación definitiva (solo Root y Directivo) */
  eliminarUsuario(id: number): Promise<void>
  /** Genera una contraseña temporal (Root, Directivo, Vinculador) */
  restablecerPassword(id: number): Promise<{ temporal: string; usuario: string }>
  eliminarEmpresa(id: number): Promise<void>
  eliminarVinculacion(usuarioId: number): Promise<void>
  eliminarRegistro(id: number): Promise<void>

  empresas(): Promise<Empresa[]>
  guardarEmpresa(e: Partial<Empresa>): Promise<Empresa>

  vinculaciones(): Promise<Vinculacion[]>
  guardarVinculacion(v: Partial<Vinculacion>): Promise<Vinculacion>

  registros(f?: FiltroRegistros): Promise<RegistroDetalle[]>
  crearRegistro(r: NuevoRegistro): Promise<Registro>
  deshacerRegistro(id: number): Promise<void>
  jornadas(usuarioId: number, desde?: string, hasta?: string): Promise<Jornada[]>

  /** Solo Empleador: sus alumnos asignados con el estado de la validación de hoy */
  empleadorHoy(): Promise<Asignado[]>
  /** Solo Empleador: «se presentó» (true) o «no se presentó» (false) sobre la entrada de hoy */
  validarAsistencia(registroId: number, presente: boolean, comentario?: string): Promise<Validacion>
  /** Root, Directivo, Vinculador y Orientador: validaciones de las empresas */
  validaciones(desde?: string, hasta?: string): Promise<Validacion[]>

  diasNoLaborables(): Promise<DiaNoLaborable[]>
  guardarDia(d: Partial<DiaNoLaborable>): Promise<DiaNoLaborable>
  eliminarDia(id: number): Promise<void>

  reporte(f: FiltroReporte): Promise<ResumenHoras[]>
  exportarReporte(f: FiltroReporte, formato: 'xlsx' | 'docx'): Promise<Blob>
  exportarIndividual(usuarioId: number, formato: 'xlsx' | 'docx', desde?: string, hasta?: string): Promise<Blob>
}

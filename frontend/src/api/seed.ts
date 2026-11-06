// Datos de prueba (solo modo mock). Generados de forma determinista para que el demo sea estable.
import type {
  Carrera, DiaNoLaborable, Empresa, Registro, Usuario, Validacion, Vinculacion, TipoPractica, HorarioDia, DiaSemana,
} from '../types'

export interface MockDb {
  usuarios: Usuario[]
  passwords: Record<number, string>
  carreras: Carrera[]
  empresas: Empresa[]
  vinculaciones: Vinculacion[]
  registros: Registro[]
  dias: DiaNoLaborable[]
  /** Validaciones de las empresas (se crea al validar) */
  validaciones?: Validacion[]
  seq: number
}

function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

const NOMBRES = ['Ana Sofía', 'Carlos', 'Valeria', 'Jorge Luis', 'Mateo', 'Andrea', 'Diego', 'Jimena', 'Santiago', 'Emiliano', 'Sofía', 'Daniel', 'Fernanda', 'Luis Ángel', 'Camila', 'Ximena', 'Brandon', 'Itzel', 'Kevin', 'Mariana', 'Ángel', 'Dulce María', 'Óscar', 'Paola', 'Ricardo', 'Renata', 'Alexis', 'Guadalupe', 'Uriel', 'Nayeli', 'Axel', 'Montserrat', 'Iván', 'Karla', 'Erick', 'Lizbeth', 'Josué', 'Abigail', 'Alan', 'Yaretzi']
const APELLIDOS = ['Hernández', 'García', 'Martínez', 'López', 'González', 'Pérez', 'Rodríguez', 'Sánchez', 'Ramírez', 'Cruz', 'Flores', 'Gómez', 'Morales', 'Vázquez', 'Reyes', 'Jiménez', 'Torres', 'Díaz', 'Mendoza', 'Ruiz', 'Castro', 'Ortiz', 'Navarrete', 'Vargas', 'Peña', 'Salazar', 'Rojas', 'Mejía']

export const EMPRESAS_SEED: Omit<Empresa, 'id'>[] = [
  { nombre: 'Taller Automotriz Hernández', giro: 'Mecánica automotriz', direccion: 'Av. Benito Juárez 210, Chapultepec, Edo. Méx.', latitud: 19.2021, longitud: -99.5602, contactoNombre: 'Ing. Raúl Hernández', contactoTelefono: '722 154 8890', activa: true },
  { nombre: 'Servicio Automotriz del Valle', giro: 'Diagnóstico electrónico', direccion: 'Carr. Toluca–Tenango km 12, Mexicaltzingo', latitud: 19.2089, longitud: -99.5841, contactoNombre: 'Lic. Patricia Mejía', contactoTelefono: '722 310 2241', activa: true },
  { nombre: 'Agencia Automotriz Metepec', giro: 'Concesionario y taller', direccion: 'Av. Tecnológico 1500, Metepec', latitud: 19.2559, longitud: -99.5980, contactoNombre: 'Ing. Héctor Salazar', contactoTelefono: '722 271 4400', activa: true },
  { nombre: 'Soporte TIC Municipal Chapultepec', giro: 'Gobierno municipal', direccion: 'Plaza Hidalgo s/n, Centro, Chapultepec', latitud: 19.2006, longitud: -99.5617, contactoNombre: 'Mtra. Laura Castro', contactoTelefono: '722 409 1100', activa: true },
  { nombre: 'CiberRed Soluciones Informáticas', giro: 'Redes y soporte técnico', direccion: 'Calle Morelos 45, San Mateo Atenco', latitud: 19.2671, longitud: -99.5339, contactoNombre: 'Ing. Omar Rojas', contactoTelefono: '722 655 0912', activa: true },
  { nombre: 'Desarrollo Web Toluca', giro: 'Software', direccion: 'Paseo Tollocan 820, Toluca', latitud: 19.2858, longitud: -99.6362, contactoNombre: 'Lic. Andrea Vázquez', contactoTelefono: '722 980 3321', activa: true },
  { nombre: 'Laboratorio Clínico del Valle', giro: 'Análisis clínicos', direccion: 'Av. Las Torres 300, Metepec', latitud: 19.2588, longitud: -99.6106, contactoNombre: 'Q.F.B. Mónica Peña', contactoTelefono: '722 212 6677', activa: true },
  { nombre: 'Planta Purificadora Calimaya', giro: 'Control de calidad de agua', direccion: 'Camino a Calimaya 18, Calimaya', latitud: 19.1739, longitud: -99.6171, contactoNombre: 'Ing. Felipe Ortiz', contactoTelefono: '722 118 4545', activa: true },
  { nombre: 'Laboratorio de Alimentos Lerma', giro: 'Análisis de alimentos', direccion: 'Parque Industrial Lerma, Nave 7', latitud: 19.2849, longitud: -99.5115, contactoNombre: 'Q. Rosa Navarrete', contactoTelefono: '728 284 9010', activa: true },
  { nombre: 'Biblioteca Pública Municipal', giro: 'Servicio comunitario', direccion: 'Calle 5 de Mayo 12, Chapultepec', latitud: 19.1998, longitud: -99.5631, contactoNombre: 'Prof. Martín Díaz', contactoTelefono: '722 409 1120', activa: true },
]

/** Fecha local YYYY-MM-DD */
export function ymd(d: Date) {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

const DIA_IDX: Record<number, DiaSemana | undefined> = { 1: 'LUNES', 2: 'MARTES', 3: 'MIERCOLES', 4: 'JUEVES', 5: 'VIERNES' }

export function buildSeed(): MockDb {
  const r = rng(2026)
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length)]
  const now = new Date()
  const iso = (d: Date) => d.toISOString()
  let id = 1
  const usuarios: Usuario[] = []
  const passwords: Record<number, string> = {}
  const created = iso(new Date(now.getTime() - 60 * 86400000))

  const add = (u: Omit<Usuario, 'id' | 'activo' | 'createdAt'>, pass = 'rutario') => {
    const user: Usuario = { ...u, id: id++, activo: true, createdAt: created }
    usuarios.push(user)
    passwords[user.id] = pass
    return user
  }

  const carreras: Carrera[] = [
    { id: 1, nombre: 'Técnico en Autotrónica', clave: 'AUT', icono: 'car', gruposPorGrado: [4, 4, 4], activa: true, descripcion: 'Diagnóstico y mantenimiento de sistemas electrónicos automotrices.' },
    { id: 2, nombre: 'Técnico en Informática', clave: 'INF', icono: 'laptop', gruposPorGrado: [4, 4, 4], activa: true, descripcion: 'Soporte, redes y desarrollo de software.' },
    { id: 3, nombre: 'Técnico como Laboratorista Químico', clave: 'LAB', icono: 'flask', gruposPorGrado: [4, 4, 3], activa: true, descripcion: 'Análisis químicos, control de calidad y laboratorio.' },
  ]

  const root = add({ nombre: 'Enrique', apellidoPaterno: 'Rentería', apellidoMaterno: 'León', email: 'root@example.org', rol: 'ROOT' })
  const dir = add({ nombre: 'Marcos', apellidoPaterno: 'Vega', apellidoMaterno: 'Duarte', email: 'directivo@example.org', rol: 'DIRECTIVO', registradoPor: root.id })
  const vin1 = add({ nombre: 'Roberto', apellidoPaterno: 'Jiménez', apellidoMaterno: 'Salas', email: 'vinculador@example.org', rol: 'VINCULADOR', registradoPor: dir.id, telefono: '722 100 2030' })
  const vin2 = add({ nombre: 'Elena', apellidoPaterno: 'Valdés', apellidoMaterno: 'Mora', email: 'elena.valdes@example.org', rol: 'VINCULADOR', registradoPor: dir.id })
  add({ nombre: 'Claudia', apellidoPaterno: 'Ríos', apellidoMaterno: 'Aguilar', email: 'orientador@example.org', rol: 'ORIENTADOR', registradoPor: dir.id,
    gruposAsignados: [{ carreraId: 2, grado: 3, grupo: 1 }, { carreraId: 2, grado: 3, grupo: 2 }, { carreraId: 1, grado: 3, grupo: 1 }] })
  add({ nombre: 'Miguel', apellidoPaterno: 'Sandoval', apellidoMaterno: 'Paz', email: 'miguel.sandoval@example.org', rol: 'ORIENTADOR', registradoPor: dir.id,
    gruposAsignados: [{ carreraId: 3, grado: 3, grupo: 1 }, { carreraId: 3, grado: 3, grupo: 2 }] })

  const empresas: Empresa[] = EMPRESAS_SEED.map((e, i) => ({ ...e, id: i + 1, creadaPor: i % 3 === 2 ? vin2.id : vin1.id }))
  const empresasPorCarrera: Record<number, number[]> = { 1: [1, 2, 3], 2: [4, 5, 6, 10], 3: [7, 8, 9] }

  // Docentes (uno por empresa principal)
  const docentes: Usuario[] = []
  const docenteNombres = [['Carlos', 'Ruiz', 'Sánchez'], ['Laura', 'Gutiérrez', 'Mena'], ['Fernando', 'Ávila', 'Cortés'], ['Patricia', 'Lara', 'Ibarra'], ['Jesús', 'Medina', 'Solís'], ['Gabriela', 'Fuentes', 'Rangel'], ['Raúl', 'Estrada', 'Nava'], ['Adriana', 'Campos', 'Rivas']]
  const docenteEmpresa = [1, 3, 4, 5, 6, 7, 8, 9]
  docenteNombres.forEach(([n, ap, am], i) => {
    const emp = empresas[docenteEmpresa[i] - 1]
    const carreraId = Object.entries(empresasPorCarrera).find(([, ids]) => ids.includes(emp.id))![0]
    const email = i === 0 ? 'docente@example.org' : `${n.toLowerCase()}.${ap.toLowerCase()}@example.org`.normalize('NFD').replace(/[̀-ͯ]/g, '')
    docentes.push(add({ nombre: n, apellidoPaterno: ap, apellidoMaterno: am, email, rol: 'DOCENTE', carreraId: Number(carreraId), registradoPor: i % 2 ? vin2.id : vin1.id }))
  })

  // Alumnos: 3er grado (en prácticas) + algunos de 2º
  const alumnos: Usuario[] = []
  let mat = 21104600
  for (let i = 0; i < 42; i++) {
    const carreraId = (i % 3) + 1
    const grado = i < 34 ? 3 : 2
    const grupo = (Math.floor(i / 3) % 2) + 1
    const nombre = NOMBRES[i % NOMBRES.length]
    const ap = pick(APELLIDOS)
    let am = pick(APELLIDOS)
    if (am === ap) am = 'Reyes'
    mat += Math.floor(r() * 40) + 7
    const vinculador = i % 3 === 2 ? vin2 : vin1
    alumnos.push(add({ nombre, apellidoPaterno: ap, apellidoMaterno: am, matricula: i === 0 ? '20000001' : String(mat), rol: 'ALUMNO', carreraId, grado, grupo, registradoPor: vinculador.id }))
  }
  usuarios.find((u) => u.matricula === '20000001')!.nombre = 'Mateo'

  // Vinculaciones
  const vinculaciones: Vinculacion[] = []
  let vid = 1
  const horarioLV = (inicio: string, fin: string, dias: DiaSemana[] = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES']): HorarioDia[] =>
    dias.map((dia) => ({ dia, inicio, fin }))
  const tipos: TipoPractica[] = ['SERVICIO_SOCIAL', 'ESTADIAS', 'EJECUCION']
  const actividadesPorCarrera: Record<number, string[]> = {
    1: ['Diagnóstico con escáner OBD-II y mantenimiento preventivo de sistemas eléctricos.', 'Apoyo en afinaciones, revisión de sensores y registro de órdenes de servicio.'],
    2: ['Soporte técnico a equipos de cómputo, mantenimiento de red e inventario.', 'Desarrollo de páginas web y captura de información en sistemas internos.'],
    3: ['Preparación de reactivos, toma de muestras y registro en bitácora de laboratorio.', 'Análisis fisicoquímicos de agua y control de calidad de lotes.'],
  }
  const inicioPeriodo = new Date(now.getTime() - 45 * 86400000)
  const finPeriodo = new Date(now.getTime() + 75 * 86400000)
  alumnos.forEach((a, i) => {
    if (i % 9 === 7) return // algunos alumnos sin vincular todavía
    const lista = empresasPorCarrera[a.carreraId!]
    const empId = lista[Math.floor(i / 3) % lista.length]
    const turnoTarde = i % 5 === 4
    vinculaciones.push({
      id: vid++, usuarioId: a.id, empresaId: empId, tipoPractica: a.grado === 2 ? 'EJECUCION' : tipos[i % 2],
      actividades: actividadesPorCarrera[a.carreraId!][i % 2],
      fechaInicio: ymd(inicioPeriodo), fechaFin: ymd(finPeriodo),
      horario: turnoTarde ? horarioLV('14:00', '18:00', ['LUNES', 'MIERCOLES', 'VIERNES']) : horarioLV('08:00', '13:00'),
      vinculadorId: a.registradoPor!,
    })
  })
  docentes.forEach((d, i) => {
    vinculaciones.push({
      id: vid++, usuarioId: d.id, empresaId: docenteEmpresa[i], tipoPractica: 'ESTADIAS',
      actividades: 'Supervisión y visita de seguimiento a alumnos en la empresa.',
      fechaInicio: ymd(inicioPeriodo), fechaFin: ymd(finPeriodo),
      horario: horarioLV('09:00', '11:00', ['MARTES', 'JUEVES']), vinculadorId: d.registradoPor!,
    })
  })

  // Días no laborables
  const y = now.getFullYear()
  const dias: DiaNoLaborable[] = [
    { id: 1, fecha: `${y}-09-16`, descripcion: 'Día de la Independencia de México', tipo: 'FERIADO' },
    { id: 2, fecha: `${y}-09-26`, descripcion: 'Consejo Técnico Escolar', tipo: 'CTE' },
    { id: 3, fecha: `${y}-10-31`, descripcion: 'Consejo Técnico Escolar', tipo: 'CTE' },
    { id: 4, fecha: `${y}-11-02`, descripcion: 'Día de Muertos', tipo: 'SUSPENSION' },
    { id: 5, fecha: `${y}-11-16`, descripcion: 'Aniversario de la Revolución (traslado)', tipo: 'FERIADO' },
    { id: 6, fecha: `${y}-12-21`, descripcion: 'Inicio de vacaciones de invierno', tipo: 'VACACIONES' },
  ]
  const noLab = new Set(dias.map((d) => d.fecha))

  // Registros de los últimos 30 días según horario
  // Empleador demo: persona de la empresa 1 que confirma la asistencia de sus alumnos
  const empleador = add({ nombre: 'Raúl', apellidoPaterno: 'Hernández', apellidoMaterno: 'Mena', email: 'empleador@example.org', rol: 'EMPLEADOR', empresaId: 1, registradoPor: vin1.id })
  vinculaciones.forEach((v) => { if (v.empresaId === 1 && usuarios.find((u) => u.id === v.usuarioId)?.rol === 'ALUMNO') v.empleadorId = empleador.id })

  const registros: Registro[] = []
  let rid = 1
  const emp = (eid: number) => empresas[eid - 1]
  for (let back = 30; back >= 0; back--) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - back)
    const dia = DIA_IDX[day.getDay()]
    if (!dia || noLab.has(ymd(day))) continue
    for (const v of vinculaciones) {
      const h = v.horario.find((x) => x.dia === dia)
      if (!h) continue
      if (r() < 0.1) continue // falta
      const e = emp(v.empresaId)
      const [hi, mi] = h.inicio.split(':').map(Number)
      const [hf, mf] = h.fin.split(':').map(Number)
      const ent = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hi, mi - 10 + Math.floor(r() * 25), Math.floor(r() * 60))
      const sal = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hf, mf - 5 + Math.floor(r() * 30), Math.floor(r() * 60))
      const jitter = () => (r() - 0.5) * 0.0008
      const off = r() < 0.18
      if (ent > now) continue
      registros.push({ id: rid++, usuarioId: v.usuarioId, tipo: 'ENTRADA', timestamp: iso(ent), latitud: +(e.latitud + jitter()).toFixed(6), longitud: +(e.longitud + jitter()).toFixed(6), fotoUrl: `mock:${rid}`, origen: r() < 0.85 ? 'APP' : 'WEB', offline: off, eliminado: false })
      if (sal > now) continue
      if (back > 0 && r() < 0.05) continue // olvidó registrar salida → día incompleto
      registros.push({ id: rid++, usuarioId: v.usuarioId, tipo: 'SALIDA', timestamp: iso(sal), latitud: +(e.latitud + jitter()).toFixed(6), longitud: +(e.longitud + jitter()).toFixed(6), fotoUrl: `mock:${rid}`, origen: r() < 0.85 ? 'APP' : 'WEB', offline: off, eliminado: false })
    }
  }

  return { usuarios, passwords, carreras, empresas, vinculaciones, registros, dias, seq: Math.max(id, rid, vid) + 100 }
}

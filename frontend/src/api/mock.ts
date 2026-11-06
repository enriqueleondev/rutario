// Implementación en memoria (persistida en localStorage) que imita las reglas del backend.
import type { Api, FiltroReporte, RegistroDetalle } from './types'
import type { Asignado, Registro, ResumenHoras, Usuario, Vinculacion } from '../types'
import { ROL_LABEL, TIPO_LABEL } from '../types'
import { buildSeed, type MockDb } from './seed'
import { blobToDataUrl, calcularJornadas, hoy, nombreCompleto, safeStorage, ymd } from '../utils'

const KEY = 'saferutes-mock-v1'
let db: MockDb = load()

// Los datos de prueba se regeneran cada día para que el demo siempre tenga registros de "hoy"
function load(): MockDb {
  const raw = safeStorage.get(KEY)
  if (raw) {
    try {
      const d = JSON.parse(raw) as MockDb & { dia?: string }
      if (d.dia === hoy()) return d
    } catch { /* reinicia */ }
  }
  return { ...buildSeed(), dia: hoy() } as MockDb
}
function save() { safeStorage.set(KEY, JSON.stringify(db)) }
export function resetMock() { db = { ...buildSeed(), dia: hoy() } as MockDb; save() }

let token: string | null = null
export function setMockToken(t: string | null) { token = t }

const delay = <T,>(v: T, ms = 120) => new Promise<T>((res) => setTimeout(() => res(structuredClone(v)), ms))
const fail = (msg: string) => new Promise<never>((_, rej) => setTimeout(() => rej(new Error(msg)), 150))
const nextId = () => ++db.seq

function yo(): Usuario {
  const id = Number(token?.replace('mock-', ''))
  const u = db.usuarios.find((x) => x.id === id)
  if (!u) throw new Error('Sesión expirada')
  return u
}

// Demo: el aviso se acepta una vez por usuario; las contraseñas demo no obligan a cambiarse
const avisos = () => ((db as MockDb & { avisos?: Record<number, boolean> }).avisos ??= {})
const conCuenta = (u: Usuario): Usuario => ({ ...u, avisoPendiente: !avisos()[u.id], debeCambiarPassword: false })

const vincDe = (uid: number) => db.vinculaciones.find((v) => v.usuarioId === uid)

/** Alcance por rol: ids de usuarios (alumnos/docentes) que el usuario actual puede ver */
function visibles(u: Usuario): Set<number> {
  const all = db.usuarios
  switch (u.rol) {
    case 'ROOT':
    case 'DIRECTIVO':
      return new Set(all.map((x) => x.id))
    case 'VINCULADOR': // los que registró o vinculó, más los que aún no tienen vinculación
      return new Set(all.filter((x) => x.rol === 'EMPLEADOR' || ((x.rol === 'ALUMNO' || x.rol === 'DOCENTE') && (x.registradoPor === u.id || (vincDe(x.id)?.vinculadorId ?? u.id) === u.id))).map((x) => x.id))
    case 'ORIENTADOR': {
      const g = u.gruposAsignados ?? []
      const alumnos = all.filter((x) => x.rol === 'ALUMNO' && g.some((k) => k.carreraId === x.carreraId && k.grado === x.grado && k.grupo === x.grupo))
      const emp = new Set(alumnos.map((a) => vincDe(a.id)?.empresaId).filter(Boolean))
      const docentes = all.filter((x) => x.rol === 'DOCENTE' && emp.has(vincDe(x.id)?.empresaId))
      return new Set([...alumnos, ...docentes].map((x) => x.id))
    }
    case 'DOCENTE': {
      const emp = vincDe(u.id)?.empresaId
      return new Set([u.id, ...all.filter((x) => x.rol === 'ALUMNO' && emp && vincDe(x.id)?.empresaId === emp).map((x) => x.id)])
    }
    default:
      return new Set([u.id])
  }
}

const puedeCrear: Record<string, string[]> = {
  ROOT: ['ROOT', 'DIRECTIVO', 'VINCULADOR', 'ORIENTADOR', 'DOCENTE', 'ALUMNO', 'EMPLEADOR'],
  DIRECTIVO: ['VINCULADOR', 'ORIENTADOR', 'DOCENTE', 'ALUMNO', 'EMPLEADOR'],
  VINCULADOR: ['DOCENTE', 'ALUMNO', 'EMPLEADOR'],
}

function resumen(u: Usuario, desde?: string, hasta?: string): ResumenHoras {
  const regs = db.registros.filter((r) => r.usuarioId === u.id && !r.eliminado && enRango(r, desde, hasta))
  const js = calcularJornadas(regs)
  const v = vincDe(u.id)
  return {
    usuario: u,
    vinculacion: v,
    empresa: v ? db.empresas.find((e) => e.id === v.empresaId) : undefined,
    diasAsistidos: js.filter((j) => j.completa).length,
    diasIncompletos: js.filter((j) => !j.completa && j.fecha !== hoy()).length,
    horasTotales: js.reduce((s, j) => s + j.horas, 0),
    ultimoRegistro: regs.sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0],
  }
}

function enRango(r: Registro, desde?: string, hasta?: string) {
  const f = ymd(new Date(r.timestamp))
  return (!desde || f >= desde) && (!hasta || f <= hasta)
}

function filtrarReporte(f: FiltroReporte): ResumenHoras[] {
  const me = yo()
  const vis = visibles(me)
  const q = f.q?.toLowerCase().trim()
  return db.usuarios
    .filter((u) => vis.has(u.id) && (u.rol === 'ALUMNO' || u.rol === 'DOCENTE'))
    .filter((u) => !f.rol || u.rol === f.rol)
    .filter((u) => !f.carreraId || u.carreraId === Number(f.carreraId))
    .filter((u) => !f.grado || u.grado === Number(f.grado))
    .filter((u) => !f.grupo || u.grupo === Number(f.grupo))
    .filter((u) => !q || nombreCompleto(u).toLowerCase().includes(q) || u.matricula?.includes(q) || u.email?.includes(q))
    .map((u) => resumen(u, f.desde, f.hasta))
    .filter((r) => !f.tipoPractica || r.vinculacion?.tipoPractica === f.tipoPractica)
    .filter((r) => !f.empresaId || r.empresa?.id === Number(f.empresaId))
    .filter((r) => {
      if (!f.estatus) return true
      const fin = r.vinculacion?.fechaFin
      const finalizado = !!fin && fin < hoy()
      return f.estatus === 'FINALIZADO' ? finalizado : !finalizado && !!r.vinculacion
    })
    .sort((a, b) => nombreCompleto(a.usuario).localeCompare(nombreCompleto(b.usuario)))
}

function tablaReporte(rows: ResumenHoras[]) {
  const carrera = (id?: number) => db.carreras.find((c) => c.id === id)?.nombre ?? ''
  return rows.map((r) => [
    r.usuario.matricula ?? r.usuario.email ?? '', nombreCompleto(r.usuario), ROL_LABEL[r.usuario.rol], carrera(r.usuario.carreraId),
    r.usuario.grado ? `${r.usuario.grado}° ${r.usuario.grupo}` : '', r.vinculacion ? TIPO_LABEL[r.vinculacion.tipoPractica] : '',
    r.empresa?.nombre ?? 'Sin asignar', r.empresa?.direccion ?? '', String(r.diasAsistidos), String(r.diasIncompletos), r.horasTotales.toFixed(2),
  ])
}
const ENCABEZADOS = ['Matrícula / Correo', 'Nombre', 'Rol', 'Carrera', 'Grado y grupo', 'Tipo de práctica', 'Lugar (empresa)', 'Dirección', 'Días asistidos', 'Días incompletos', 'Horas totales']

function exportar(titulo: string, header: string[], rows: string[][], formato: 'xlsx' | 'docx'): Blob {
  if (formato === 'xlsx') {
    const esc = (s: string) => `"${s.replace(/"/g, '""')}"`
    return new Blob(['﻿' + [header, ...rows].map((r) => r.map(esc).join(',')).join('\r\n')], { type: 'text/csv' })
  }
  const td = (s: string, th = false) => `<${th ? 'th' : 'td'} style="border:1px solid #999;padding:4px 6px;font-size:10pt">${s}</${th ? 'th' : 'td'}>`
  const html = `<html><head><meta charset="utf-8"></head><body style="font-family:Arial">
<h2 style="color:#166534">Rutario — ${titulo}</h2><p>CBT Lic. Julián Díaz Arias · Generado ${new Date().toLocaleString('es-MX')}</p>
<table style="border-collapse:collapse"><tr>${header.map((h) => td(h, true)).join('')}</tr>${rows.map((r) => `<tr>${r.map((c) => td(c)).join('')}</tr>`).join('')}</table></body></html>`
  return new Blob([html], { type: 'application/msword' })
}

export const mockApi: Api = {
  async login(identificador, password) {
    const id = identificador.trim().toLowerCase()
    const u = db.usuarios.find((x) => (/^\d{8}$/.test(id) ? x.matricula === id : x.email?.toLowerCase() === id))
    if (!u || db.passwords[u.id] !== password) return fail('Matrícula/correo o contraseña incorrectos')
    if (!u.activo) return fail('Tu cuenta está desactivada. Acude con tu vinculador.')
    return delay({ token: `mock-${u.id}`, usuario: conCuenta(u) }, 350)
  },
  async logout() {
    return delay(undefined)
  },
  async aceptarAviso() {
    const u = yo()
    avisos()[u.id] = true; save()
    return delay(conCuenta(u))
  },
  async cambiarPassword(actual, nueva) {
    const u = yo()
    if (db.passwords[u.id] !== actual) return fail('La contraseña actual no es correcta')
    if (nueva.length < 8 || !/[A-Za-zÁÉÍÓÚÑáéíóúñ]/.test(nueva) || !/\d/.test(nueva)) return fail('La nueva contraseña debe tener al menos 8 caracteres, con letras y números')
    if (nueva === actual) return fail('La nueva contraseña debe ser distinta a la actual')
    db.passwords[u.id] = nueva; save()
    return delay(conCuenta(u))
  },

  async carreras() { return delay(db.carreras) },
  async guardarCarrera(c) {
    if (c.id) {
      const i = db.carreras.findIndex((x) => x.id === c.id)
      db.carreras[i] = { ...db.carreras[i], ...c }
      save(); return delay(db.carreras[i])
    }
    const nueva = { id: nextId(), nombre: '', clave: '', gruposPorGrado: [4, 4, 4], icono: 'book', activa: true, ...c } as typeof db.carreras[0]
    db.carreras.push(nueva); save(); return delay(nueva)
  },

  async usuarios(f = {}) {
    const me = yo()
    const vis = visibles(me)
    const q = f.q?.toLowerCase().trim()
    const esAdmin = me.rol === 'ROOT' || me.rol === 'DIRECTIVO'
    return delay(db.usuarios
      .filter((u) => vis.has(u.id) && (esAdmin || u.rol === 'ALUMNO' || u.rol === 'DOCENTE' || u.rol === 'EMPLEADOR'))
      .filter((u) => me.rol === 'ROOT' || u.rol !== 'ROOT')
      .filter((u) => !f.rol || u.rol === f.rol)
      .filter((u) => !f.carreraId || u.carreraId === Number(f.carreraId))
      .filter((u) => !f.grado || u.grado === Number(f.grado))
      .filter((u) => !f.grupo || u.grupo === Number(f.grupo))
      .filter((u) => !q || nombreCompleto(u).toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.matricula?.includes(q))
      .sort((a, b) => a.apellidoPaterno.localeCompare(b.apellidoPaterno)))
  },
  async usuario(id) {
    const me = yo()
    const u = db.usuarios.find((x) => x.id === id)
    if (!u || !(visibles(me).has(id) || me.id === id)) return fail('No tienes acceso a este usuario')
    return delay(u)
  },
  async guardarUsuario(u, password) {
    const me = yo()
    if (u.rol && !puedeCrear[me.rol]?.includes(u.rol)) return fail('Tu rol no puede gestionar este tipo de usuario')
    if (u.matricula && !/^\d{8}$/.test(u.matricula)) return fail('La matrícula debe tener exactamente 8 dígitos')
    const dup = db.usuarios.find((x) => x.id !== u.id && ((u.matricula && x.matricula === u.matricula) || (u.email && x.email?.toLowerCase() === u.email.toLowerCase())))
    if (dup) return fail(u.matricula && dup.matricula === u.matricula ? 'Esa matrícula ya está registrada' : 'Ese correo ya está registrado')
    if (u.id) {
      const i = db.usuarios.findIndex((x) => x.id === u.id)
      db.usuarios[i] = { ...db.usuarios[i], ...u }
      if (password) db.passwords[u.id] = password
      save(); return delay(db.usuarios[i])
    }
    const nuevo = { registradoPor: me.id, ...u, activo: u.activo ?? true, createdAt: new Date().toISOString(), id: nextId() } as Usuario
    db.usuarios.push(nuevo)
    db.passwords[nuevo.id] = password || 'rutario'
    save(); return delay(nuevo)
  },
  async setActivo(id, activo) {
    const u = db.usuarios.find((x) => x.id === id)
    if (u) { u.activo = activo; save() }
    return delay(undefined)
  },
  async restablecerPassword(id) {
    const u = db.usuarios.find((x) => x.id === id)
    if (!u) return fail('Usuario no encontrado')
    if (u.id === yo().id) return fail('Para tu propia cuenta usa «Cambiar contraseña»')
    const L = 'abcdefghjkmnpqrstuvwxyz', D = '23456789', r = (s: string) => s[Math.floor(Math.random() * s.length)]
    const temporal = `${r(L)}${r(D)}${r(D)}${r(L)}-${r(L)}${r(D)}${r(D)}${r(L)}`
    db.passwords[id] = temporal; save()
    return delay({ temporal, usuario: u.matricula ?? u.email ?? '' })
  },
  async eliminarUsuario(id) {
    const me = yo(), u = db.usuarios.find((x) => x.id === id)
    if (!u) return fail('Usuario no encontrado')
    if (u.id === me.id) return fail('No puedes eliminar tu propia cuenta')
    if (u.rol === 'ROOT') return fail('La cuenta Root no se puede eliminar')
    if (u.rol === 'DIRECTIVO' && me.rol !== 'ROOT') return fail('Solo Root puede eliminar directivos')
    db.usuarios = db.usuarios.filter((x) => x.id !== id)
    db.registros = db.registros.filter((r) => r.usuarioId !== id)
    db.vinculaciones = db.vinculaciones.filter((v) => v.usuarioId !== id)
    delete db.passwords[id]; save()
    return delay(undefined)
  },
  async eliminarEmpresa(id) {
    db.empresas = db.empresas.filter((e) => e.id !== id)
    db.vinculaciones = db.vinculaciones.filter((v) => v.empresaId !== id); save()
    return delay(undefined)
  },
  async eliminarVinculacion(usuarioId) {
    db.vinculaciones = db.vinculaciones.filter((v) => v.usuarioId !== usuarioId); save()
    return delay(undefined)
  },
  async eliminarRegistro(id) {
    db.registros = db.registros.filter((r) => r.id !== id); save()
    return delay(undefined)
  },

  async empresas() { return delay(db.empresas) },
  async guardarEmpresa(e) {
    if (e.id) {
      const i = db.empresas.findIndex((x) => x.id === e.id)
      db.empresas[i] = { ...db.empresas[i], ...e }
      save(); return delay(db.empresas[i])
    }
    const nueva = { activa: true, ...e, id: nextId(), creadaPor: yo().id } as typeof db.empresas[0]
    db.empresas.push(nueva); save(); return delay(nueva)
  },

  async vinculaciones() {
    const vis = visibles(yo())
    return delay(db.vinculaciones.filter((v) => vis.has(v.usuarioId)))
  },
  async guardarVinculacion(v) {
    const me = yo()
    if (v.empleadorId) {
      const e = db.usuarios.find((x) => x.id === v.empleadorId && x.rol === 'EMPLEADOR')
      if (!e) return fail('Selecciona un empleador válido')
      if (e.empresaId !== v.empresaId) return fail('El empleador seleccionado no pertenece a esa empresa')
    }
    const i = db.vinculaciones.findIndex((x) => x.usuarioId === v.usuarioId)
    const merged = { ...(i >= 0 ? db.vinculaciones[i] : { id: nextId(), vinculadorId: me.id, horario: [] }), ...v } as Vinculacion
    if (i >= 0) db.vinculaciones[i] = merged
    else db.vinculaciones.push(merged)
    save(); return delay(merged)
  },

  async registros(f = {}) {
    const vis = visibles(yo())
    const q = f.q?.toLowerCase().trim()
    const out: RegistroDetalle[] = []
    for (const r of db.registros) {
      if (r.eliminado || !vis.has(r.usuarioId)) continue
      if (f.usuarioId && r.usuarioId !== f.usuarioId) continue
      if (f.tipo && r.tipo !== f.tipo) continue
      if (!enRango(r, f.desde, f.hasta)) continue
      const usuario = db.usuarios.find((u) => u.id === r.usuarioId)!
      if (q && !(nombreCompleto(usuario).toLowerCase().includes(q) || usuario.matricula?.includes(q))) continue
      const v = vincDe(r.usuarioId)
      out.push({ ...r, usuario, empresa: v ? db.empresas.find((e) => e.id === v.empresaId) : undefined })
    }
    return delay(out.sort((a, b) => b.timestamp.localeCompare(a.timestamp)))
  },
  async crearRegistro(n) {
    const me = yo()
    if (me.rol !== 'ALUMNO' && me.rol !== 'DOCENTE') return fail('Solo alumnos y docentes registran asistencia')
    const reg: Registro = {
      id: nextId(), usuarioId: me.id, tipo: n.tipo, timestamp: n.timestamp, latitud: n.latitud, longitud: n.longitud,
      fotoUrl: await blobToDataUrl(n.foto), origen: 'WEB', offline: false, eliminado: false,
    }
    db.registros.push(reg); save()
    return delay(reg, 500)
  },
  async deshacerRegistro(id) {
    const me = yo()
    const r = db.registros.find((x) => x.id === id && x.usuarioId === me.id)
    if (!r) return fail('Registro no encontrado')
    if (Date.now() - new Date(r.timestamp).getTime() > 5 * 60000) return fail('Ya pasaron más de 5 minutos; no se puede deshacer')
    r.eliminado = true; save()
    return delay(undefined)
  },
  async jornadas(usuarioId, desde, hasta) {
    const me = yo()
    if (!visibles(me).has(usuarioId)) return fail('Sin acceso')
    return delay(calcularJornadas(db.registros.filter((r) => r.usuarioId === usuarioId && enRango(r, desde, hasta))))
  },

  async empleadorHoy() {
    const me = yo()
    const dia = hoy()
    const out: Asignado[] = []
    for (const v of db.vinculaciones.filter((x) => x.empleadorId === me.id)) {
      if ((v.fechaInicio && dia < v.fechaInicio) || (v.fechaFin && dia > v.fechaFin)) continue
      const a = db.usuarios.find((u) => u.id === v.usuarioId)
      if (!a || a.rol !== 'ALUMNO' || !a.activo) continue
      const regs = db.registros.filter((r) => r.usuarioId === a.id && !r.eliminado && ymd(new Date(r.timestamp)) === dia)
      const ent = regs.filter((r) => r.tipo === 'ENTRADA').sort((x, y) => x.timestamp.localeCompare(y.timestamp))[0]
      const sal = regs.filter((r) => r.tipo === 'SALIDA').sort((x, y) => y.timestamp.localeCompare(x.timestamp))[0]
      const val = ent ? (db.validaciones ?? []).find((x) => x.registroId === ent.id) : undefined
      const nombreDia = ['DOMINGO', 'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'][new Date().getDay()]
      const h = v.horario.find((x) => x.dia === nombreDia)
      out.push({
        usuarioId: a.id, nombre: nombreCompleto(a), carrera: db.carreras.find((c) => c.id === a.carreraId)?.clave, grado: a.grado, grupo: a.grupo,
        tipoPractica: v.tipoPractica, actividades: v.actividades, horarioInicio: h?.inicio, horarioFin: h?.fin,
        registroId: ent?.id, entrada: ent?.timestamp, salida: sal?.timestamp,
        estado: !ent ? 'SIN_ENTRADA' : !val ? 'PENDIENTE' : val.presente ? 'PRESENTE' : 'AUSENTE',
        comentario: val?.comentario, validadoEn: val?.validadoEn,
      })
    }
    const orden = { PENDIENTE: 0, SIN_ENTRADA: 1, PRESENTE: 2, AUSENTE: 2 }
    return delay(out.sort((a, b) => orden[a.estado] - orden[b.estado] || a.nombre.localeCompare(b.nombre)))
  },
  async validarAsistencia(registroId, presente, comentario) {
    const me = yo()
    const reg = db.registros.find((r) => r.id === registroId && !r.eliminado && r.tipo === 'ENTRADA')
    if (!reg) return fail('El alumno aún no registra su entrada')
    if (vincDe(reg.usuarioId)?.empleadorId !== me.id) return fail('Este alumno no está asignado a ti')
    if (ymd(new Date(reg.timestamp)) !== hoy()) return fail('Solo puedes validar la asistencia de hoy')
    if ((comentario ?? '').length > 500) return fail('El comentario no puede pasar de 500 caracteres')
    const lista = (db.validaciones ??= [])
    let val = lista.find((x) => x.registroId === registroId)
    if (!val) { val = { id: nextId(), registroId, usuarioId: reg.usuarioId, fecha: hoy(), presente, validadoEn: '', empleadorId: me.id }; lista.push(val) }
    Object.assign(val, { presente, comentario: comentario?.trim() || undefined, empleadorId: me.id, empleadorNombre: nombreCompleto(me), validadoEn: new Date().toISOString() })
    save(); return delay(val)
  },
  async validaciones(desde, hasta) {
    const vis = visibles(yo())
    return delay((db.validaciones ?? []).filter((x) => vis.has(x.usuarioId) && (!desde || x.fecha >= desde) && (!hasta || x.fecha <= hasta)))
  },

  async diasNoLaborables() { return delay([...db.dias].sort((a, b) => a.fecha.localeCompare(b.fecha))) },
  async guardarDia(d) {
    if (db.dias.some((x) => x.fecha === d.fecha && x.id !== d.id)) return fail('Esa fecha ya está registrada')
    if (d.id) {
      const i = db.dias.findIndex((x) => x.id === d.id)
      db.dias[i] = { ...db.dias[i], ...d }
      save(); return delay(db.dias[i])
    }
    const nuevo = { ...d, id: nextId() } as typeof db.dias[0]
    db.dias.push(nuevo); save(); return delay(nuevo)
  },
  async eliminarDia(id) { db.dias = db.dias.filter((d) => d.id !== id); save(); return delay(undefined) },

  async reporte(f) { return delay(filtrarReporte(f), 200) },
  async exportarReporte(f, formato) {
    return delay(exportar('Reporte general de horas', ENCABEZADOS, tablaReporte(filtrarReporte(f)), formato))
  },
  async exportarIndividual(usuarioId, formato, desde, hasta) {
    const u = db.usuarios.find((x) => x.id === usuarioId)!
    const js = calcularJornadas(db.registros.filter((r) => r.usuarioId === usuarioId && enRango(r, desde, hasta)))
    const res = resumen(u, desde, hasta)
    const rows = js.map((j) => [j.fecha, j.entrada ? new Date(j.entrada.timestamp).toLocaleTimeString('es-MX') : '', j.salida ? new Date(j.salida.timestamp).toLocaleTimeString('es-MX') : '',
      j.horas.toFixed(2), j.entrada ? `${j.entrada.latitud}, ${j.entrada.longitud}` : '', j.completa ? 'Completa' : 'Incompleta (falta)'])
    rows.push(['TOTAL', '', '', res.horasTotales.toFixed(2), res.empresa?.nombre ?? '', `${res.diasAsistidos} días`])
    return delay(exportar(`Reporte individual — ${nombreCompleto(u)}`, ['Fecha', 'Entrada', 'Salida', 'Horas', 'Ubicación (entrada)', 'Estatus'], rows, formato))
  },
}

/** Usuarios demo para el login rápido (solo modo mock) */
export const DEMO = [
  { rol: 'ROOT', id: 'root@example.org' },
  { rol: 'DIRECTIVO', id: 'directivo@example.org' },
  { rol: 'VINCULADOR', id: 'vinculador@example.org' },
  { rol: 'ORIENTADOR', id: 'orientador@example.org' },
  { rol: 'DOCENTE', id: 'docente@example.org' },
  { rol: 'ALUMNO', id: '20000001' },
  { rol: 'EMPLEADOR', id: 'empleador@example.org' },
] as const

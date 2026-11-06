// Cliente real contra la API de Spring Boot. Mismos endpoints que el documento de requerimientos (§6.3).
import type { Api, FiltroReporte } from './types'

const BASE = import.meta.env.VITE_API_URL ?? '/api'
let token: string | null = null
let onUnauthorized: () => void = () => {}
let onTokenRefresh: (t: string) => void = () => {}

export function setHttpToken(t: string | null) { token = t }
export function setOnUnauthorized(fn: () => void) { onUnauthorized = fn }
export function setOnTokenRefresh(fn: (t: string) => void) { onTokenRefresh = fn }

function qs(o: object = {}) {
  const p = new URLSearchParams()
  Object.entries(o).forEach(([k, v]) => { if (v !== undefined && v !== '' && v !== null) p.set(k, String(v)) })
  const s = p.toString()
  return s ? `?${s}` : ''
}

async function req<T>(path: string, init: RequestInit = {}, raw = false): Promise<T> {
  const headers = new Headers(init.headers)
  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (init.body && !(init.body instanceof FormData)) headers.set('Content-Type', 'application/json')
  const res = await fetch(BASE + path, { ...init, headers })
  // 401 con sesión activa = token vencido; sin sesión (login) se muestra el mensaje del servidor
  if (res.status === 401 && token) { onUnauthorized(); throw new Error('Tu sesión expiró. Inicia sesión de nuevo.') }
  if (!res.ok) {
    let msg = `Error ${res.status}`
    try { msg = (await res.json()).mensaje ?? msg } catch { /* sin cuerpo */ }
    throw new Error(msg)
  }
  // El backend renueva el token en cada petición (RF-02)
  const nuevo = res.headers.get('X-Refresh-Token')
  if (nuevo && nuevo !== token) { token = nuevo; onTokenRefresh(nuevo) }
  if (raw) return (await res.blob()) as T
  return res.status === 204 ? (undefined as T) : res.json()
}

// Los campos vacíos ('') se mandan como ausentes para que el backend los guarde como null
const json = (body: unknown, method = 'POST'): RequestInit => ({ method, body: JSON.stringify(body, (_k, v) => (v === '' ? undefined : v)) })
const reportQs = (f: FiltroReporte) => qs(f)

export const httpApi: Api = {
  login: (identificador, password) => req('/auth/login', json({ identificador, password })),
  logout: () => req('/auth/logout', { method: 'POST' }),
  aceptarAviso: () => req('/cuenta/aviso', { method: 'POST' }),
  cambiarPassword: (actual, nueva) => req('/cuenta/password', { method: 'PUT', body: JSON.stringify({ actual, nueva }) }),

  carreras: () => req('/carreras'),
  guardarCarrera: (c) => req(c.id ? `/carreras/${c.id}` : '/carreras', json(c, c.id ? 'PUT' : 'POST')),

  usuarios: (f) => req(`/usuarios${qs(f)}`),
  usuario: (id) => req(`/usuarios/${id}`),
  guardarUsuario: (u, password) => req(u.id ? `/usuarios/${u.id}` : '/usuarios', json({ ...u, password }, u.id ? 'PUT' : 'POST')),
  setActivo: (id, activo) => req(`/usuarios/${id}/activo`, json({ activo }, 'PATCH')),
  restablecerPassword: (id) => req(`/usuarios/${id}/restablecer-password`, { method: 'POST' }),
  eliminarUsuario: (id) => req(`/admin/usuarios/${id}`, { method: 'DELETE' }),
  eliminarEmpresa: (id) => req(`/admin/empresas/${id}`, { method: 'DELETE' }),
  eliminarVinculacion: (usuarioId) => req(`/admin/vinculaciones/${usuarioId}`, { method: 'DELETE' }),
  eliminarRegistro: (id) => req(`/admin/registros/${id}`, { method: 'DELETE' }),

  empresas: () => req('/empresas'),
  guardarEmpresa: (e) => req(e.id ? `/empresas/${e.id}` : '/empresas', json(e, e.id ? 'PUT' : 'POST')),

  vinculaciones: () => req('/vinculaciones'),
  guardarVinculacion: (v) => req('/vinculaciones', json(v, 'PUT')),

  registros: (f) => req(`/registros${qs(f)}`),
  crearRegistro: (r) => {
    const fd = new FormData()
    fd.append('foto', r.foto, 'foto.jpg')
    fd.append('datos', new Blob([JSON.stringify({ tipo: r.tipo, latitud: r.latitud, longitud: r.longitud, timestamp: r.timestamp, origen: 'WEB' })], { type: 'application/json' }))
    return req('/registros', { method: 'POST', body: fd })
  },
  deshacerRegistro: (id) => req(`/registros/${id}`, { method: 'DELETE' }),
  jornadas: (usuarioId, desde, hasta) => req(`/registros/jornadas/${usuarioId}${qs({ desde, hasta })}`),

  empleadorHoy: () => req('/empleador/hoy'),
  validarAsistencia: (registroId, presente, comentario) => req('/empleador/validaciones', json({ registroId, presente, comentario }, 'PUT')),
  validaciones: (desde, hasta) => req(`/validaciones${qs({ desde, hasta })}`),

  diasNoLaborables: () => req('/dias-no-laborables'),
  guardarDia: (d) => req(d.id ? `/dias-no-laborables/${d.id}` : '/dias-no-laborables', json(d, d.id ? 'PUT' : 'POST')),
  eliminarDia: (id) => req(`/dias-no-laborables/${id}`, { method: 'DELETE' }),

  reporte: (f) => req(`/reportes/general${reportQs(f)}`),
  exportarReporte: (f, formato) => req(`/reportes/general/${formato}${reportQs(f)}`, {}, true),
  exportarIndividual: (id, formato, desde, hasta) => req(`/reportes/individual/${id}/${formato}${qs({ desde, hasta })}`, {}, true),
}

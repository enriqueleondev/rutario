import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { api, setToken } from '../api'
import { setOnTokenRefresh, setOnUnauthorized } from '../api/http'
import type { Usuario } from '../types'
import { safeStorage } from '../utils'

const KEY = 'saferutes-sesion'
const INACTIVIDAD_MS = 20 * 60 * 1000 // RF-02: 20 min sin actividad

interface AuthState {
  usuario: Usuario | null
  login: (id: string, pass: string) => Promise<Usuario>
  /** Cierre explícito: avisa al servidor para invalidar la sesión en todos los dispositivos */
  logout: () => void
  /** Reemplaza los datos del usuario en sesión (tras aceptar el aviso o cambiar la contraseña) */
  actualizarUsuario: (u: Usuario) => void
}

const Ctx = createContext<AuthState>(null!)

function restore(): { token: string; usuario: Usuario } | null {
  const raw = safeStorage.get(KEY)
  if (!raw) return null
  try {
    const s = JSON.parse(raw)
    if (Date.now() - (s.ultimaActividad ?? 0) > INACTIVIDAD_MS) return null
    setToken(s.token)
    return s
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sesion, setSesion] = useState(restore)
  const timer = useRef<number | undefined>(undefined)

  // Solo local: por inactividad o token vencido no se revocan las sesiones de otros dispositivos (app Android)
  const cerrarLocal = useCallback(() => {
    safeStorage.del(KEY)
    setToken(null)
    setSesion(null)
  }, [])

  const logout = useCallback(() => {
    api.logout().catch(() => { /* sin conexión: el token vence solo en 20 min */ }).finally(cerrarLocal)
  }, [cerrarLocal])

  const login = useCallback(async (id: string, pass: string) => {
    const s = await api.login(id, pass)
    setToken(s.token)
    safeStorage.set(KEY, JSON.stringify({ ...s, ultimaActividad: Date.now() }))
    setSesion(s)
    return s.usuario
  }, [])

  const actualizarUsuario = useCallback((u: Usuario) => {
    setSesion((s) => {
      if (!s) return s
      const nueva = { ...s, usuario: u }
      safeStorage.set(KEY, JSON.stringify({ ...nueva, ultimaActividad: Date.now() }))
      return nueva
    })
  }, [])

  useEffect(() => setOnUnauthorized(cerrarLocal), [cerrarLocal])

  // El backend renueva el token en cada petición; se guarda para que recargar la página no cierre la sesión
  useEffect(() => {
    setOnTokenRefresh((token) => {
      setSesion((s) => {
        if (!s) return s
        const nueva = { ...s, token }
        safeStorage.set(KEY, JSON.stringify({ ...nueva, ultimaActividad: Date.now() }))
        return nueva
      })
    })
  }, [])

  // Cierre por inactividad
  useEffect(() => {
    if (!sesion) return
    const tocar = () => {
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(cerrarLocal, INACTIVIDAD_MS)
      safeStorage.set(KEY, JSON.stringify({ ...sesion, ultimaActividad: Date.now() }))
    }
    tocar()
    const evs = ['click', 'keydown', 'touchstart'] as const
    evs.forEach((e) => window.addEventListener(e, tocar, { passive: true }))
    return () => {
      window.clearTimeout(timer.current)
      evs.forEach((e) => window.removeEventListener(e, tocar))
    }
  }, [sesion, cerrarLocal])

  return <Ctx.Provider value={{ usuario: sesion?.usuario ?? null, login, logout, actualizarUsuario }}>{children}</Ctx.Provider>
}

export const useAuth = () => useContext(Ctx)

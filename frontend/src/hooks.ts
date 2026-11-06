import { useCallback, useEffect, useState } from 'react'
import { api } from './api'
import type { Carrera, Empresa } from './types'

export function useAsync<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T>()
  const [error, setError] = useState<string>()
  const [loading, setLoading] = useState(true)
  const [tick, setTick] = useState(0)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(fn, deps)
  useEffect(() => {
    let vivo = true
    setLoading(true)
    run()
      .then((d) => { if (vivo) { setData(d); setError(undefined) } })
      .catch((e) => vivo && setError(e.message))
      .finally(() => vivo && setLoading(false))
    return () => { vivo = false }
  }, [run, tick])
  return { data, error, loading, reload: () => setTick((t) => t + 1), setData }
}

/** Catálogos usados en casi todas las vistas */
export function useCatalogos() {
  const { data } = useAsync(() => Promise.all([api.carreras(), api.empresas()]), [])
  const carreras: Carrera[] = data?.[0] ?? []
  const empresas: Empresa[] = data?.[1] ?? []
  return {
    carreras,
    empresas,
    carrera: (id?: number) => carreras.find((c) => c.id === id),
    empresa: (id?: number) => empresas.find((e) => e.id === id),
  }
}

export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), intervalMs)
    return () => clearInterval(t)
  }, [intervalMs])
  return now
}

export function useOnline() {
  const [online, setOnline] = useState(navigator.onLine)
  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])
  return online
}

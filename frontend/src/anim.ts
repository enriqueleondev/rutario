import { useEffect, useRef, useState } from 'react'

export const reducirMovimiento = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/** Número que «cuenta» desde 0 (o desde el valor anterior) hasta `meta`. Sin animación si el usuario pidió reducir movimiento. */
export function useCountUp(meta: number, ms = 1200) {
  const [v, setV] = useState(() => (reducirMovimiento() ? meta : 0))
  const desde = useRef(v)
  useEffect(() => {
    if (reducirMovimiento()) { setV(meta); return }
    const t0 = performance.now()
    const ini = desde.current
    let raf = 0
    const paso = (now: number) => {
      const t = Math.min(1, (now - t0) / ms)
      const e = 1 - Math.pow(1 - t, 3)
      const val = ini + (meta - ini) * e
      desde.current = val
      setV(val)
      if (t < 1) raf = requestAnimationFrame(paso)
    }
    raf = requestAnimationFrame(paso)
    return () => cancelAnimationFrame(raf)
  }, [meta, ms])
  return Math.round(v)
}

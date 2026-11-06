import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { Check, Link2 } from 'lucide-react'
import { api } from '../api'
import { Drawer, ErrorBox, useToast } from './ui'
import type { Usuario, Vinculacion } from '../types'
import { cls, nombreCompleto } from '../utils'

interface Props {
  empleador: Usuario | null
  empresaNombre?: string
  alumnos: Usuario[]
  vinculaciones: Vinculacion[]
  empleadores: Usuario[]
  onClose: () => void
  onSaved: () => void
}

/** Paso a paso: Empresa → Empleador → Alumnos. Aquí se eligen los alumnos que validará esta persona. */
export default function AsignarAlumnosDrawer({ empleador, empresaNombre, alumnos, vinculaciones, empleadores, onClose, onSaved }: Props) {
  const toast = useToast()
  const [sel, setSel] = useState<Set<number>>(new Set())
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string>()
  const [listo, setListo] = useState<{ agregados: number; quitados: number } | null>(null)

  // Alumnos vinculados a la empresa de este empleador (solo ellos pueden asignarse)
  const filas = useMemo(() => {
    if (!empleador) return []
    return vinculaciones
      .filter((v) => v.empresaId === empleador.empresaId)
      .map((v) => ({ v, a: alumnos.find((x) => x.id === v.usuarioId) }))
      .filter((f): f is { v: Vinculacion; a: Usuario } => !!f.a && f.a.activo)
      .sort((x, y) => Number(!!x.v.empleadorId) - Number(!!y.v.empleadorId) || nombreCompleto(x.a).localeCompare(nombreCompleto(y.a)))
  }, [empleador, vinculaciones, alumnos])

  const yaAsignados = useMemo(() => new Set(filas.filter((f) => f.v.empleadorId === empleador?.id).map((f) => f.a.id)), [filas, empleador])

  useEffect(() => {
    setSel(new Set(yaAsignados))
    setError(undefined)
    setListo(null)
  }, [empleador?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const agregar = filas.filter((f) => sel.has(f.a.id) && !yaAsignados.has(f.a.id))
  const quitar = filas.filter((f) => !sel.has(f.a.id) && yaAsignados.has(f.a.id))
  const hayCambios = agregar.length + quitar.length > 0
  const alternar = (id: number) => setSel((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n })

  const guardar = async () => {
    if (!empleador) return
    setError(undefined)
    setGuardando(true)
    const cambios = [
      ...agregar.map((f) => api.guardarVinculacion({ ...f.v, empleadorId: empleador.id })),
      ...quitar.map((f) => api.guardarVinculacion({ ...f.v, empleadorId: undefined })),
    ]
    const res = await Promise.allSettled(cambios)
    setGuardando(false)
    const fallos = res.filter((r): r is PromiseRejectedResult => r.status === 'rejected')
    onSaved()
    if (fallos.length) {
      setError(`${fallos.length} de ${res.length} cambios no se pudieron guardar: ${(fallos[0].reason as Error).message}`)
      return
    }
    setListo({ agregados: agregar.length, quitados: quitar.length })
    toast('Asignación guardada')
  }

  const pasos = [
    { n: 1, titulo: 'Empresa', detalle: empresaNombre ?? '—', hecho: true },
    { n: 2, titulo: 'Empleador', detalle: empleador ? nombreCompleto(empleador) : '—', hecho: true },
    { n: 3, titulo: 'Alumnos', detalle: hayCambios ? 'Cambios sin guardar' : 'Elige quién', hecho: !!listo },
  ]

  const boton = quitar.length === 0
    ? `Asignar ${agregar.length || ''} ${agregar.length === 1 ? 'alumno' : 'alumnos'}`.replace('  ', ' ')
    : 'Guardar cambios'

  return (
    <Drawer open={!!empleador} onClose={onClose} title="Asignar alumnos" subtitle={empleador ? `a ${nombreCompleto(empleador)} · ${empresaNombre ?? ''}` : undefined}
      icon={<Link2 className="w-5 h-5" />}
      footer={listo ? undefined : <>
        <span className="mr-auto text-sm font-medium text-neutral" aria-live="polite">{sel.size === 0 ? 'Marca a quién quieres asignar' : `${sel.size} ${sel.size === 1 ? 'alumno seleccionado' : 'alumnos seleccionados'}`}</span>
        <button className="btn-ghost" onClick={onClose}>Cancelar</button>
        <button className="btn-primary" disabled={!hayCambios || guardando} onClick={guardar}>{guardando ? 'Guardando…' : boton}</button>
      </>}>
      {listo ? (
        <div className="flex flex-col items-center text-center gap-4 py-12">
          <div className="w-24 h-24 rounded-full bg-primary-container flex items-center justify-center anim-pop">
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#0B7468" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" className="anim-check" /></svg>
          </div>
          <h3 className="text-xl font-extrabold">
            {listo.agregados > 0 && `${listo.agregados} ${listo.agregados === 1 ? 'alumno asignado' : 'alumnos asignados'}`}
            {listo.agregados > 0 && listo.quitados > 0 && ' · '}
            {listo.quitados > 0 && `${listo.quitados} ${listo.quitados === 1 ? 'quitado' : 'quitados'}`}
          </h3>
          <p className="text-sm text-neutral max-w-xs">{empleador ? nombreCompleto(empleador) : 'El empleador'} verá a sus alumnos en su lista y podrá validar su asistencia cuando registren su entrada.</p>
          <button className="btn-primary mt-2" onClick={onClose}>Listo</button>
        </div>
      ) : (
        <div className="space-y-5">
          <ol className="flex items-start" aria-label="Pasos">
            {pasos.map((p) => (
              <li key={p.n} className="flex-1 flex flex-col items-center gap-1.5 text-center min-w-0 px-1">
                <span className={cls('relative w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold', p.n === 3 ? 'bg-ink text-white' : 'bg-secondary text-white')}>
                  {p.n === 3 && <span className="absolute inset-0 rounded-full bg-coral anim-ping -z-10" aria-hidden="true" />}
                  {p.n === 3 ? 3 : <Check className="w-4 h-4" strokeWidth={3} />}
                </span>
                <span className={cls('text-xs font-semibold', p.n === 3 ? 'text-on-surface' : 'text-secondary')}>{p.titulo}</span>
                <span className="text-[11px] text-neutral truncate max-w-full">{p.detalle}</span>
              </li>
            ))}
          </ol>

          <p className="rounded-lg bg-surface-low px-3 py-2.5 text-sm text-on-surface-variant">
            Solo aparecen los alumnos vinculados a <b>{empresaNombre}</b>. Si falta alguien, primero vincúlalo a la empresa desde «Mis alumnos».
          </p>

          {filas.length === 0 ? (
            <p className="text-center text-sm text-neutral py-8">Todavía no hay alumnos vinculados a esta empresa.</p>
          ) : (
            <ul className="space-y-2">
              {filas.map(({ v, a }, i) => {
                const marcado = sel.has(a.id)
                const otro = v.empleadorId && v.empleadorId !== empleador?.id ? empleadores.find((e) => e.id === v.empleadorId) : undefined
                const chip = v.empleadorId === empleador?.id
                  ? { t: 'Asignado a este empleador', c: 'bg-primary-container text-secondary' }
                  : otro ? { t: `Con ${nombreCompleto(otro)}`, c: 'bg-surface-container text-on-surface-variant' }
                    : { t: 'Sin empleador', c: 'bg-tertiary-container text-tertiary' }
                return (
                  <li key={a.id} className="anim-rise" style={{ '--d': `${i * 40}ms` } as CSSProperties}>
                    <label className={cls('flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition-colors', marcado ? 'border-brand bg-primary-container/25' : 'border-line hover:bg-surface')}>
                      <input type="checkbox" className="w-5 h-5 accent-[#0B7468] shrink-0" checked={marcado} onChange={() => alternar(a.id)} />
                      <span className="flex-1 min-w-0">
                        <span className="block font-semibold text-sm truncate">{nombreCompleto(a)}</span>
                        <span className="block text-xs text-neutral">{a.grado ? `${a.grado}° · Grupo ${a.grupo ?? ''}` : a.matricula}</span>
                      </span>
                      <span className={cls('chip shrink-0', chip.c)}>{chip.t}</span>
                    </label>
                  </li>
                )
              })}
            </ul>
          )}
          <ErrorBox msg={error} />
        </div>
      )}
    </Drawer>
  )
}

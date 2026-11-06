import { useState } from 'react'
import { CalendarPlus, CalendarOff, Trash2, Info } from 'lucide-react'
import { api } from '../../api'
import { useAsync } from '../../hooks'
import { Empty, ErrorBox, Field, PageHeader, Spinner, StatCard, Tabs, useToast } from '../../components/ui'
import type { DiaNoLaborable } from '../../types'
import { cap, cls, fmtFecha, hoy, parseFecha } from '../../utils'

const TIPOS: Record<DiaNoLaborable['tipo'], { label: string; cls: string }> = {
  FERIADO: { label: 'Feriado oficial', cls: 'bg-primary-container/50 text-secondary' },
  SUSPENSION: { label: 'Suspensión', cls: 'bg-tertiary-container/70 text-tertiary' },
  CTE: { label: 'Consejo Técnico', cls: 'bg-ink/10 text-ink' },
  VACACIONES: { label: 'Vacaciones', cls: 'bg-aqua/20 text-secondary' },
}

export default function DiasNoLaborables() {
  const toast = useToast()
  const { data: dias = [], loading, reload } = useAsync(() => api.diasNoLaborables(), [])
  const [tab, setTab] = useState<'proximos' | 'historial' | 'todos'>('proximos')
  const [f, setF] = useState<Partial<DiaNoLaborable>>({ tipo: 'FERIADO' })
  const [error, setError] = useState<string>()

  const lista = dias.filter((d) => tab === 'todos' || (tab === 'proximos' ? d.fecha >= hoy() : d.fecha < hoy()))
  const proximo = dias.find((d) => d.fecha >= hoy())
  const faltan = proximo ? Math.round((parseFecha(proximo.fecha).getTime() - parseFecha(hoy()).getTime()) / 86400000) : 0

  const guardar = async () => {
    setError(undefined)
    if (!f.fecha || !f.descripcion?.trim()) return setError('Fecha y motivo son obligatorios')
    try { await api.guardarDia(f); toast('Día no laborable registrado'); setF({ tipo: 'FERIADO' }); reload() } catch (e) { setError((e as Error).message) }
  }
  const eliminar = async (d: DiaNoLaborable) => { await api.eliminarDia(d.id); toast('Fecha eliminada'); reload() }

  return (
    <>
      <PageHeader title="Días no laborables" subtitle="Fechas festivas y suspensiones. En estos días no se espera registro y no cuentan como falta en los reportes." />
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <StatCard label="Fechas registradas" value={dias.length} icon={<CalendarOff className="w-5 h-5" />} hint="Ciclo escolar actual" />
        <StatCard label="Próxima suspensión" value={proximo ? fmtFecha(proximo.fecha, { day: 'numeric', month: 'short' }) : '—'} icon={<CalendarPlus className="w-5 h-5" />} tone="amber"
          hint={proximo ? (faltan === 0 ? 'Es hoy' : `Faltan ${faltan} días · ${proximo.descripcion}`) : 'Sin fechas próximas'} />
        <StatCard label="Próximas" value={dias.filter((d) => d.fecha >= hoy()).length} icon={<CalendarOff className="w-5 h-5" />} tone="sky" hint="Fechas por venir" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px] items-start">
        <section className="card overflow-hidden">
          <header className="flex flex-wrap items-center justify-between gap-3 p-5">
            <h2 className="text-lg font-semibold">Fechas programadas</h2>
            <Tabs value={tab} onChange={setTab} items={[{ value: 'proximos', label: 'Próximas' }, { value: 'historial', label: 'Historial' }, { value: 'todos', label: 'Todas' }]} />
          </header>
          {loading ? <Spinner /> : lista.length === 0 ? <Empty icon={<CalendarOff className="w-6 h-6" />} title="No hay fechas en esta vista" /> : (
            <ul>
              {lista.map((d) => {
                const fecha = parseFecha(d.fecha)
                const pasada = d.fecha < hoy()
                return (
                  <li key={d.id} className={cls('flex items-center gap-4 px-5 py-4 border-t border-line', d.id === proximo?.id && 'bg-primary-container/15')}>
                    <div className={cls('w-14 shrink-0 rounded-xl text-center py-1.5', d.id === proximo?.id ? 'bg-secondary text-white' : 'bg-surface-low')}>
                      <p className="text-[10px] font-semibold uppercase">{fecha.toLocaleDateString('es-MX', { month: 'short' })}</p>
                      <p className="text-xl font-bold leading-none">{fecha.getDate()}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cls('font-medium', pasada && 'text-neutral')}>{d.descripcion}</p>
                      <p className="text-xs text-neutral">{cap(fecha.toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric' }))}</p>
                    </div>
                    <span className={cls('chip hidden sm:inline-flex', TIPOS[d.tipo].cls)}>{TIPOS[d.tipo].label}</span>
                    <button className="icon-btn hover:text-error" title="Eliminar" aria-label="Eliminar" onClick={() => eliminar(d)}><Trash2 className="w-4 h-4" /></button>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <aside className="card p-5 lg:sticky lg:top-6">
          <div className="flex items-center gap-3 mb-5">
            <span className="w-10 h-10 rounded-xl bg-primary-container/40 text-secondary flex items-center justify-center"><CalendarPlus className="w-5 h-5" /></span>
            <div><h2 className="font-semibold">Registrar fecha</h2><p className="text-xs text-neutral">Día festivo o suspensión</p></div>
          </div>
          <div className="space-y-4">
            <Field label="Fecha" required><input className="input" type="date" value={f.fecha ?? ''} onChange={(e) => setF({ ...f, fecha: e.target.value })} /></Field>
            <Field label="Motivo" required><input className="input" value={f.descripcion ?? ''} onChange={(e) => setF({ ...f, descripcion: e.target.value })} placeholder="Ej. Consejo Técnico Escolar" /></Field>
            <Field label="Tipo"><select className="input" value={f.tipo} onChange={(e) => setF({ ...f, tipo: e.target.value as DiaNoLaborable['tipo'] })}>
              {Object.entries(TIPOS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></Field>
            <ErrorBox msg={error} />
            <button className="btn-primary w-full" onClick={guardar}>Guardar día no laborable</button>
            <p className="flex gap-2 text-xs text-neutral"><Info className="w-4 h-4 shrink-0" />Si un alumno registra en un día no laborable, sus horas sí se suman.</p>
          </div>
        </aside>
      </div>
    </>
  )
}

import { useEffect, useState } from 'react'
import { Plus, Pencil, Users, LayoutGrid, GraduationCap } from 'lucide-react'
import { api } from '../../api'
import { useAsync } from '../../hooks'
import { CarreraIcon, Drawer, ErrorBox, Field, PageHeader, Spinner, Toggle, useToast } from '../../components/ui'
import type { Carrera } from '../../types'
import { cls } from '../../utils'

export default function Carreras() {
  const { data, loading, reload } = useAsync(() => Promise.all([api.carreras(), api.usuarios({ rol: 'ALUMNO' })]), [])
  const [edit, setEdit] = useState<Partial<Carrera> | null>(null)
  const [sel, setSel] = useState<number | null>(null)

  if (loading || !data) return <Spinner />
  const [carreras, alumnos] = data
  const n = (cid: number, grado?: number, grupo?: number) => alumnos.filter((a) => a.carreraId === cid && (!grado || a.grado === grado) && (!grupo || a.grupo === grupo)).length
  const actual = carreras.find((c) => c.id === (sel ?? carreras[0]?.id))

  return (
    <>
      <PageHeader title="Carreras técnicas" subtitle="Programas de estudio, grados y grupos. Puedes agregar carreras o grupos sin tocar el código."
        actions={<button className="btn-primary" onClick={() => setEdit({ gruposPorGrado: [4, 4, 4], icono: 'book', activa: true })}><Plus className="w-4 h-4" />Nueva carrera</button>} />

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        {carreras.map((c) => (
          <article key={c.id} className={cls('card p-5 flex flex-col cursor-pointer transition', actual?.id === c.id && 'ring-2 ring-primary-container')} onClick={() => setSel(c.id)}
            tabIndex={0} aria-current={actual?.id === c.id ? 'true' : undefined} aria-label={`${c.nombre}: ver grupos`}
            onKeyDown={(e) => { if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); setSel(c.id) } }}>
            <div className="flex items-start justify-between">
              <span className="w-11 h-11 rounded-xl bg-primary-container/40 text-secondary flex items-center justify-center"><CarreraIcon c={c} className="w-6 h-6" /></span>
              <span className={cls('chip', c.activa ? 'bg-primary-container/60 text-secondary' : 'bg-slate-100 text-slate-500')}>{c.activa ? 'Activa' : 'Inactiva'}</span>
            </div>
            <h3 className="text-lg font-semibold mt-4 leading-snug">{c.nombre}</h3>
            <p className="text-sm text-neutral mt-1 flex-1">{c.descripcion}</p>
            <div className="flex items-center gap-4 text-sm text-neutral mt-4">
              <span className="flex items-center gap-1.5"><Users className="w-4 h-4" />{n(c.id)} alumnos</span>
              <span className="flex items-center gap-1.5"><LayoutGrid className="w-4 h-4" />{c.gruposPorGrado.reduce((a, b) => a + b, 0)} grupos</span>
            </div>
            <div className="flex items-center justify-between border-t border-line mt-4 pt-3">
              <span className="text-sm font-semibold text-secondary">Clave {c.clave}</span>
              <button className="icon-btn" onClick={(e) => { e.stopPropagation(); setEdit(c) }} title="Editar" aria-label={`Editar carrera ${c.nombre}`}><Pencil className="w-4 h-4" /></button>
            </div>
          </article>
        ))}
      </div>

      {actual && (
        <section className="card p-5">
          <h2 className="text-lg font-semibold flex items-center gap-2"><GraduationCap className="w-5 h-5 text-secondary" />{actual.nombre}: grupos</h2>
          <p className="text-sm text-neutral mb-5">Alumnos registrados por grado y grupo.</p>
          <div className="space-y-4">
            {actual.gruposPorGrado.map((cant, gi) => (
              <div key={gi} className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="w-28 shrink-0"><p className="font-semibold">{gi + 1}° grado</p><p className="text-xs text-neutral">{n(actual.id, gi + 1)} alumnos</p></div>
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: cant }, (_, k) => (
                    <div key={k} className="w-28 rounded-xl border border-line px-3 py-2 bg-surface/50">
                      <p className="text-xs text-neutral">Grupo {k + 1}</p>
                      <p className="text-lg font-bold tabular-nums">{n(actual.id, gi + 1, k + 1)}<span className="text-xs font-normal text-neutral"> alumnos</span></p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <CarreraDrawer carrera={edit} onClose={() => setEdit(null)} onSaved={reload} />
    </>
  )
}

function CarreraDrawer({ carrera, onClose, onSaved }: { carrera: Partial<Carrera> | null; onClose: () => void; onSaved: () => void }) {
  const toast = useToast()
  const [f, setF] = useState<Partial<Carrera>>({})
  const [error, setError] = useState<string>()
  useEffect(() => { if (carrera) { setF(carrera); setError(undefined) } }, [carrera])

  const guardar = async () => {
    if (!f.nombre?.trim() || !f.clave?.trim()) return setError('Nombre y clave son obligatorios')
    try { await api.guardarCarrera(f); toast('Carrera guardada'); onSaved(); onClose() } catch (e) { setError((e as Error).message) }
  }
  return (
    <Drawer open={!!carrera} onClose={onClose} title={f.id ? 'Editar carrera' : 'Nueva carrera'} icon={<GraduationCap className="w-5 h-5" />}
      footer={<><button className="btn-outline" onClick={onClose}>Cancelar</button><button className="btn-primary" onClick={guardar}>Guardar</button></>}>
      <div className="space-y-4">
        <Field label="Nombre" required><input className="input" value={f.nombre ?? ''} onChange={(e) => setF({ ...f, nombre: e.target.value })} placeholder="Técnico en …" /></Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Clave" required><input className="input uppercase" maxLength={4} value={f.clave ?? ''} onChange={(e) => setF({ ...f, clave: e.target.value.toUpperCase() })} placeholder="INF" /></Field>
          <Field label="Ícono"><select className="input" value={f.icono} onChange={(e) => setF({ ...f, icono: e.target.value as Carrera['icono'] })}>
            <option value="car">Automotriz</option><option value="laptop">Cómputo</option><option value="flask">Laboratorio</option><option value="book">General</option></select></Field>
        </div>
        <Field label="Descripción"><textarea className="input" rows={3} value={f.descripcion ?? ''} onChange={(e) => setF({ ...f, descripcion: e.target.value })} /></Field>
        <div>
          <span className="label">Grupos por grado</span>
          <div className="grid grid-cols-3 gap-3">
            {[0, 1, 2].map((i) => (
              <label key={i} className="block"><span className="text-xs text-neutral">{i + 1}° grado</span>
                <input className="input mt-1" type="number" min={0} max={10} value={f.gruposPorGrado?.[i] ?? 0}
                  onChange={(e) => { const g = [...(f.gruposPorGrado ?? [0, 0, 0])]; g[i] = Math.max(0, Number(e.target.value)); setF({ ...f, gruposPorGrado: g }) }} /></label>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between rounded-xl bg-surface-low p-3">
          <div><p className="text-sm font-medium">Carrera activa</p><p className="text-xs text-neutral">Las inactivas no aparecen al registrar alumnos.</p></div>
          <Toggle checked={!!f.activa} onChange={(v) => setF({ ...f, activa: v })} />
        </div>
        <ErrorBox msg={error} />
      </div>
    </Drawer>
  )
}

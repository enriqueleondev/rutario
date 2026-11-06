import { useEffect, useMemo, useState } from 'react'
import { Plus, Search, Building2, MapPin, Phone, Pencil, Users, Briefcase, Mail, Trash2 } from 'lucide-react'
import { api } from '../../api'
import { useAsync } from '../../hooks'
import { useAuth } from '../../auth/AuthContext'
import { ConfirmarEliminar, Drawer, Empty, ErrorBox, Field, PageHeader, SectionTitle, Spinner, Toggle, useToast } from '../../components/ui'
import { LinkMaps, MapaPuntos, MapaSelector } from '../../components/Mapa'
import type { Empresa } from '../../types'
import { cls } from '../../utils'

export default function Empresas() {
  const { data, loading, reload } = useAsync(() => Promise.all([api.empresas(), api.vinculaciones(), api.usuarios()]), [])
  const [q, setQ] = useState('')
  const [sel, setSel] = useState<number | null>(null)
  const [edit, setEdit] = useState<Partial<Empresa> | null>(null)
  const [borrar, setBorrar] = useState<Empresa | null>(null)
  const { usuario: yo } = useAuth()
  const esAdmin = yo?.rol === 'ROOT' || yo?.rol === 'DIRECTIVO'
  const toastE = useToast()

  const empresas = useMemo(() => (data?.[0] ?? []).filter((e) => !q || (e.nombre + e.direccion + (e.giro ?? '')).toLowerCase().includes(q.toLowerCase())), [data, q])
  if (loading || !data) return <Spinner />
  const [, vincs, usuarios] = data
  const cuenta = (eid: number, rol: 'ALUMNO' | 'DOCENTE') => vincs.filter((v) => v.empresaId === eid && usuarios.find((u) => u.id === v.usuarioId)?.rol === rol).length
  const foco = empresas.filter((e) => !sel || e.id === sel)

  return (
    <>
      <PageHeader title="Empresas receptoras" eyebrow="Módulo de vinculación" subtitle="Da de alta los lugares de práctica con su ubicación exacta para vincular alumnos y docentes."
        actions={<button className="btn-primary" onClick={() => setEdit({ activa: true })}><Plus className="w-4 h-4" />Nueva empresa</button>} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] items-start">
        <div className="space-y-3">
          <label className="relative block">
            <Search className="w-4 h-4 absolute left-3 top-3 text-neutral" />
            <input className="input pl-9 bg-white" placeholder="Buscar empresa, giro o dirección…" value={q} onChange={(e) => setQ(e.target.value)} />
          </label>
          {empresas.length === 0 && <div className="card"><Empty icon={<Building2 className="w-6 h-6" />} title="No hay empresas" text="Registra la primera empresa receptora." /></div>}
          {empresas.map((e) => (
            <article key={e.id} onClick={() => setSel(sel === e.id ? null : e.id)}
              tabIndex={0} aria-current={sel === e.id ? 'true' : undefined} aria-label={`${e.nombre}: mostrar en el mapa`}
              onKeyDown={(ev) => { if (ev.target === ev.currentTarget && (ev.key === 'Enter' || ev.key === ' ')) { ev.preventDefault(); setSel(sel === e.id ? null : e.id) } }}
              className={cls('card p-4 cursor-pointer transition hover:shadow-pop', sel === e.id && 'ring-2 ring-primary-container', !e.activa && 'opacity-60')}>
              <div className="flex items-start gap-3">
                <span className="w-10 h-10 rounded-xl bg-primary-container/40 text-secondary flex items-center justify-center shrink-0"><Building2 className="w-5 h-5" /></span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div><h3 className="font-semibold leading-snug">{e.nombre}</h3>{e.giro && <p className="text-xs text-neutral">{e.giro}</p>}</div>
                    <button className="icon-btn -mt-1 -mr-1" onClick={(ev) => { ev.stopPropagation(); setEdit(e) }} title="Editar" aria-label={`Editar empresa ${e.nombre}`}><Pencil className="w-4 h-4" /></button>
                    {esAdmin && <button className="icon-btn -mt-1 -mr-1 hover:text-error" onClick={(ev) => { ev.stopPropagation(); setBorrar(e) }} title="Eliminar" aria-label={`Eliminar empresa ${e.nombre}`}><Trash2 className="w-4 h-4" /></button>}
                  </div>
                  <p className="text-sm text-neutral mt-2 flex items-start gap-1.5"><MapPin className="w-4 h-4 mt-0.5 shrink-0" />{e.direccion}</p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-sm">
                    <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-neutral" /><b>{cuenta(e.id, 'ALUMNO')}</b> alumnos</span>
                    <span className="flex items-center gap-1.5"><Briefcase className="w-4 h-4 text-neutral" /><b>{cuenta(e.id, 'DOCENTE')}</b> docentes</span>
                    {e.contactoTelefono && <span className="flex items-center gap-1.5 text-neutral"><Phone className="w-4 h-4" />{e.contactoTelefono}</span>}
                    {!e.activa && <span className="chip bg-slate-100 text-slate-500">Inactiva</span>}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="card p-3 lg:sticky lg:top-6">
          <MapaPuntos height={560} puntos={foco.map((e) => ({ lat: e.latitud, lng: e.longitud, titulo: e.nombre, detalle: e.direccion }))} />
          <p className="text-xs text-neutral px-1 pt-2">{sel ? 'Mostrando la empresa seleccionada · vuelve a hacer clic para ver todas' : `${empresas.length} empresas en el mapa`}</p>
        </div>
      </div>

      <ConfirmarEliminar abierto={!!borrar} titulo={`¿Eliminar ${borrar?.nombre ?? ''}?`} onCerrar={() => setBorrar(null)}
        onConfirmar={async () => { await api.eliminarEmpresa(borrar!.id); if (sel === borrar!.id) setSel(null); toastE('Empresa eliminada'); reload() }}>
        {borrar && (() => { const n = vincs.filter((v) => v.empresaId === borrar.id).length
          return n ? <p>Tiene <b>{n} {n === 1 ? 'persona vinculada' : 'personas vinculadas'}</b>: se quitará su vinculación y quedarán como «Sin asignar». Sus registros de asistencia se conservan.</p>
            : <p>No tiene personas vinculadas.</p> })()}
        <p>Si solo ya no recibirá practicantes, mejor márcala como <b>inactiva</b> al editarla.</p>
      </ConfirmarEliminar>

      <EmpresaDrawer empresa={edit} onClose={() => setEdit(null)} onSaved={reload} />
    </>
  )
}

function EmpresaDrawer({ empresa, onClose, onSaved }: { empresa: Partial<Empresa> | null; onClose: () => void; onSaved: () => void }) {
  const toast = useToast()
  const [f, setF] = useState<Partial<Empresa>>({})
  const [error, setError] = useState<string>()
  useEffect(() => { if (empresa) { setF(empresa); setError(undefined) } }, [empresa])
  const set = <K extends keyof Empresa>(k: K, v: Empresa[K]) => setF((x) => ({ ...x, [k]: v }))

  const guardar = async () => {
    if (!f.nombre?.trim() || !f.direccion?.trim()) return setError('Nombre y dirección son obligatorios')
    if (!f.latitud || !f.longitud) return setError('Marca la ubicación de la empresa en el mapa')
    try { await api.guardarEmpresa(f); toast('Empresa guardada'); onSaved(); onClose() } catch (e) { setError((e as Error).message) }
  }

  return (
    <Drawer open={!!empresa} onClose={onClose} wide icon={<Building2 className="w-5 h-5" />} title={f.id ? 'Editar empresa' : 'Nueva empresa receptora'} subtitle="Datos generales, contacto y ubicación."
      footer={<><button className="btn-outline" onClick={onClose}>Cancelar</button><button className="btn-primary" onClick={guardar}>Guardar empresa</button></>}>
      <div className="space-y-8">
        <div>
          <SectionTitle n={1} icon={<Building2 className="w-4 h-4" />}>Datos de la empresa</SectionTitle>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Nombre o razón social" required className="sm:col-span-2"><input className="input" value={f.nombre ?? ''} onChange={(e) => set('nombre', e.target.value)} placeholder="Ej. Taller Automotriz Hernández" /></Field>
            <Field label="Giro"><input className="input" value={f.giro ?? ''} onChange={(e) => set('giro', e.target.value)} placeholder="Ej. Mecánica automotriz" /></Field>
            <div className="flex items-end"><div className="flex items-center justify-between w-full rounded-xl bg-surface-low px-3 h-10"><span className="text-sm">Empresa activa</span><Toggle checked={!!f.activa} onChange={(v) => set('activa', v)} /></div></div>
            <Field label="Dirección" required className="sm:col-span-2"><input className="input" value={f.direccion ?? ''} onChange={(e) => set('direccion', e.target.value)} placeholder="Calle, número, colonia, municipio" /></Field>
          </div>
        </div>
        <div>
          <SectionTitle n={2} icon={<Phone className="w-4 h-4" />}>Contacto en la empresa</SectionTitle>
          <div className="grid sm:grid-cols-3 gap-4">
            <Field label="Responsable"><input className="input" value={f.contactoNombre ?? ''} onChange={(e) => set('contactoNombre', e.target.value)} /></Field>
            <Field label="Teléfono"><input className="input" value={f.contactoTelefono ?? ''} onChange={(e) => set('contactoTelefono', e.target.value)} inputMode="tel" /></Field>
            <Field label="Correo"><div className="relative"><Mail className="w-4 h-4 absolute left-3 top-3 text-neutral" /><input className="input pl-9" type="email" value={f.contactoEmail ?? ''} onChange={(e) => set('contactoEmail', e.target.value)} /></div></Field>
          </div>
        </div>
        <div>
          <SectionTitle n={3} icon={<MapPin className="w-4 h-4" />}>Ubicación</SectionTitle>
          <MapaSelector lat={f.latitud} lng={f.longitud} onChange={(lat, lng) => setF((x) => ({ ...x, latitud: lat, longitud: lng }))} />
          <div className="grid grid-cols-2 gap-3 mt-3">
            <Field label="Latitud"><input className="input mono" type="number" step="0.000001" value={f.latitud ?? ''} onChange={(e) => set('latitud', Number(e.target.value))} /></Field>
            <Field label="Longitud"><input className="input mono" type="number" step="0.000001" value={f.longitud ?? ''} onChange={(e) => set('longitud', Number(e.target.value))} /></Field>
          </div>
          {f.latitud && f.longitud ? <p className="mt-2"><LinkMaps lat={f.latitud} lng={f.longitud} /></p> : null}
        </div>
        <ErrorBox msg={error} />
      </div>
    </Drawer>
  )
}

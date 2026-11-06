import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, FileSpreadsheet, FileText, Timer, CalendarCheck, CalendarX, Gauge, Link2, Mail, Phone, Unlink } from 'lucide-react'
import { api, extension } from '../api'
import { useAsync, useCatalogos } from '../hooks'
import { useAuth } from '../auth/AuthContext'
import { Avatar, ConfirmarEliminar, ErrorBox, RolChip, Spinner, StatCard, useToast } from '../components/ui'
import VinculacionCard from '../components/VinculacionCard'
import VincularDrawer from '../components/VincularDrawer'
import { JornadasTabla } from '../components/Jornadas'
import { descargarBlob, fmtHoras, hoy, nombreCompleto, sumarDias } from '../utils'

export default function PersonaDetalle() {
  const { id } = useParams()
  const uid = Number(id)
  const nav = useNavigate()
  const toast = useToast()
  const { usuario: yo } = useAuth()
  const { empresas, carrera } = useCatalogos()
  const [rango, setRango] = useState({ desde: sumarDias(hoy(), -60), hasta: hoy() })
  const [vincular, setVincular] = useState(false)
  const [quitar, setQuitar] = useState(false)
  const { data, loading, error, reload } = useAsync(() => Promise.all([api.usuario(uid), api.vinculaciones(), api.jornadas(uid, rango.desde, rango.hasta)]), [uid, rango.desde, rango.hasta])

  if (error) return <ErrorBox msg={error} />
  if (loading || !data) return <Spinner />
  const [u, vincs, jornadas] = data
  const v = vincs.find((x) => x.usuarioId === uid)
  const empresa = empresas.find((e) => e.id === v?.empresaId)
  const completas = jornadas.filter((j) => j.completa)
  const horas = completas.reduce((s, j) => s + j.horas, 0)
  const incompletas = jornadas.filter((j) => !j.completa && j.fecha !== hoy()).length
  const puedeVincular = yo?.rol === 'VINCULADOR' || yo?.rol === 'DIRECTIVO' || yo?.rol === 'ROOT'
  const c = carrera(u.carreraId)

  const exportar = async (formato: 'xlsx' | 'docx') => {
    const blob = await api.exportarIndividual(uid, formato, rango.desde, rango.hasta)
    descargarBlob(blob, `reporte-${(u.matricula ?? u.apellidoPaterno).toLowerCase()}-${rango.desde}_${rango.hasta}.${extension(blob, formato)}`)
    toast('Reporte individual descargado')
  }

  return (
    <>
      <button onClick={() => nav(-1)} className="btn-ghost -ml-3 mb-3"><ArrowLeft className="w-4 h-4" />Regresar</button>

      <div className="card p-5 sm:p-6 mb-6 flex flex-col lg:flex-row lg:items-center gap-5">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <Avatar u={u} size={64} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2"><h1 className="text-2xl font-bold">{nombreCompleto(u)}</h1><RolChip rol={u.rol} />{!u.activo && <span className="chip bg-slate-100 text-slate-500">Inactivo</span>}</div>
            <p className="text-sm text-neutral mt-1 flex flex-wrap gap-x-4 gap-y-1">
              {u.matricula && <span>Matrícula <b className="mono text-on-surface">{u.matricula}</b></span>}
              {c && <span>{c.nombre}{u.grado ? ` · ${u.grado}° grupo ${u.grupo}` : ''}</span>}
              {u.email && <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{u.email}</span>}
              {u.telefono && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{u.telefono}</span>}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {puedeVincular && <button className="btn-soft" onClick={() => setVincular(true)}><Link2 className="w-4 h-4" />{v ? 'Editar vinculación' : 'Vincular a empresa'}</button>}
          {v && (yo?.rol === 'ROOT' || yo?.rol === 'DIRECTIVO') && <button className="btn-outline hover:text-error" onClick={() => setQuitar(true)}><Unlink className="w-4 h-4" />Quitar vinculación</button>}
          <button className="btn-outline" onClick={() => exportar('xlsx')}><FileSpreadsheet className="w-4 h-4 text-secondary" />Excel</button>
          <button className="btn-outline" onClick={() => exportar('docx')}><FileText className="w-4 h-4 text-ink" />Word</button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
        <StatCard label="Horas acumuladas" value={fmtHoras(horas)} icon={<Timer className="w-5 h-5" />} hint="En el periodo seleccionado" />
        <StatCard label="Días asistidos" value={completas.length} icon={<CalendarCheck className="w-5 h-5" />} tone="sky" />
        <StatCard label="Días incompletos" value={incompletas} icon={<CalendarX className="w-5 h-5" />} tone="amber" hint="Entrada sin salida" />
        <StatCard label="Promedio por día" value={completas.length ? fmtHoras(horas / completas.length) : '—'} icon={<Gauge className="w-5 h-5" />} tone="slate" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px] items-start">
        <section className="card overflow-hidden">
          <header className="flex flex-wrap items-end justify-between gap-3 p-5">
            <div><h2 className="text-lg font-semibold">Registros por día</h2><p className="text-sm text-neutral">Toca una foto para ver la evidencia y su ubicación.</p></div>
            <div className="flex items-center gap-2">
              <input className="input h-9 w-[150px]" type="date" value={rango.desde} max={rango.hasta} onChange={(e) => setRango({ ...rango, desde: e.target.value })} aria-label="Desde" />
              <span className="text-neutral text-sm">a</span>
              <input className="input h-9 w-[150px]" type="date" value={rango.hasta} min={rango.desde} onChange={(e) => setRango({ ...rango, hasta: e.target.value })} aria-label="Hasta" />
            </div>
          </header>
          <JornadasTabla jornadas={jornadas} usuario={u} empresa={empresa} />
        </section>
        <div className="space-y-4 xl:sticky xl:top-6">
          <VinculacionCard v={v} empresa={empresa} />
          {u.rol === 'DOCENTE' && empresa && (
            <Link to="/reportes" className="card p-4 block text-sm text-neutral hover:text-secondary">Ver horas de los alumnos de {empresa.nombre} en Reportes →</Link>
          )}
        </div>
      </div>

      <ConfirmarEliminar abierto={quitar} titulo="¿Quitar la vinculación?" texto="Quitar vinculación" onCerrar={() => setQuitar(false)}
        onConfirmar={async () => { await api.eliminarVinculacion(uid); toast('Vinculación eliminada'); reload() }}>
        <p><b>{nombreCompleto(u)}</b> dejará de estar vinculado a <b>{empresa?.nombre ?? 'su empresa'}</b> y no podrá registrar asistencia hasta que lo vuelvan a vincular. Sus registros anteriores se conservan.</p>
      </ConfirmarEliminar>

      <VincularDrawer usuario={vincular ? u : null} vinculacion={v} empresas={empresas} onClose={() => setVincular(false)} onSaved={reload} />
    </>
  )
}

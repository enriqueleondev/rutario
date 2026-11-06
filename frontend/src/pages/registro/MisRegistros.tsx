import { useState } from 'react'
import { Timer, CalendarCheck, CalendarX } from 'lucide-react'
import { api } from '../../api'
import { useAsync, useCatalogos } from '../../hooks'
import { useAuth } from '../../auth/AuthContext'
import { PageHeader, Spinner, StatCard } from '../../components/ui'
import { JornadasTabla } from '../../components/Jornadas'
import { fmtHoras, hoy, sumarDias } from '../../utils'

export default function MisRegistros() {
  const { usuario } = useAuth()
  const { empresa } = useCatalogos()
  const [rango, setRango] = useState({ desde: sumarDias(hoy(), -90), hasta: hoy() })
  const { data, loading } = useAsync(() => Promise.all([api.jornadas(usuario!.id, rango.desde, rango.hasta), api.vinculaciones()]), [rango.desde, rango.hasta])

  if (loading || !data) return <Spinner />
  const [jornadas, vincs] = data
  const v = vincs.find((x) => x.usuarioId === usuario!.id)
  const completas = jornadas.filter((j) => j.completa)
  const horas = completas.reduce((s, j) => s + j.horas, 0)

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader title="Mis registros" subtitle="Tus horas acumuladas y el detalle de cada día con foto y ubicación." />
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <StatCard label="Horas acumuladas" value={fmtHoras(horas)} icon={<Timer className="w-5 h-5" />} />
        <StatCard label="Días asistidos" value={completas.length} icon={<CalendarCheck className="w-5 h-5" />} tone="sky" />
        <StatCard label="Días sin salida" value={jornadas.filter((j) => !j.completa && j.fecha !== hoy()).length} icon={<CalendarX className="w-5 h-5" />} tone="amber" hint="Cuentan como falta" />
      </div>
      <section className="card overflow-hidden">
        <header className="flex flex-wrap items-end justify-between gap-3 p-5">
          <h2 className="text-lg font-semibold">Desglose por día</h2>
          <div className="flex items-center gap-2">
            <input className="input h-9 w-[150px]" type="date" value={rango.desde} max={rango.hasta} onChange={(e) => setRango({ ...rango, desde: e.target.value })} aria-label="Desde" />
            <span className="text-neutral text-sm">a</span>
            <input className="input h-9 w-[150px]" type="date" value={rango.hasta} min={rango.desde} onChange={(e) => setRango({ ...rango, hasta: e.target.value })} aria-label="Hasta" />
          </div>
        </header>
        <JornadasTabla jornadas={jornadas} usuario={usuario!} empresa={empresa(v?.empresaId)} size={12} />
      </section>
    </div>
  )
}

import { Link } from 'react-router-dom'
import { Building2, ChevronRight, Users, Timer, CalendarCheck } from 'lucide-react'
import { api } from '../../api'
import { useAsync, useCatalogos } from '../../hooks'
import { useAuth } from '../../auth/AuthContext'
import { Avatar, Empty, PageHeader, Spinner, StatCard, TipoChip } from '../../components/ui'
import { fmtHora, fmtHorasCorto, hoy, nombreCompleto, sumarDias, ymd } from '../../utils'

/** Docente: alumnos vinculados a la misma empresa que supervisa */
export default function AlumnosEmpresa() {
  const { usuario } = useAuth()
  const { carrera, empresa } = useCatalogos()
  const { data, loading } = useAsync(() => Promise.all([api.reporte({ rol: 'ALUMNO', desde: sumarDias(hoy(), -120) }), api.vinculaciones()]), [])
  if (loading || !data) return <Spinner />
  const [alumnos, vincs] = data
  const miEmpresa = empresa(vincs.find((v) => v.usuarioId === usuario!.id)?.empresaId)
  const presentes = alumnos.filter((a) => a.ultimoRegistro && ymd(new Date(a.ultimoRegistro.timestamp)) === hoy() && a.ultimoRegistro.tipo === 'ENTRADA').length
  const horas = alumnos.reduce((s, a) => s + a.horasTotales, 0)

  return (
    <>
      <PageHeader title="Mis alumnos" subtitle={miEmpresa ? <span className="flex items-center gap-1.5"><Building2 className="w-4 h-4" />Alumnos vinculados a {miEmpresa.nombre}</span> : 'Aún no estás vinculado a una empresa.'} />
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <StatCard label="Alumnos" value={alumnos.length} icon={<Users className="w-5 h-5" />} tone="sky" />
        <StatCard label="En la empresa ahora" value={presentes} icon={<CalendarCheck className="w-5 h-5" />} hint="Con entrada y sin salida hoy" />
        <StatCard label="Horas acumuladas" value={Math.round(horas)} icon={<Timer className="w-5 h-5" />} tone="amber" hint="Últimos 4 meses" />
      </div>
      <div className="card overflow-hidden">
        {alumnos.length === 0 ? <Empty icon={<Users className="w-6 h-6" />} title="Sin alumnos en tu empresa" /> : (
          <ul className="divide-y divide-line">
            {alumnos.map((a) => (
              <li key={a.usuario.id}>
                <Link to={`/persona/${a.usuario.id}`} className="flex items-center gap-4 p-4 hover:bg-primary-container/10">
                  <Avatar u={a.usuario} size={42} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{nombreCompleto(a.usuario)}</p>
                    <p className="text-xs text-neutral"><span className="mono">{a.usuario.matricula}</span> · {carrera(a.usuario.carreraId)?.clave} {a.usuario.grado}°{a.usuario.grupo}</p>
                  </div>
                  <div className="hidden sm:block"><TipoChip tipo={a.vinculacion?.tipoPractica} /></div>
                  <div className="text-right w-24">
                    <p className="font-bold tabular-nums">{fmtHorasCorto(a.horasTotales)}</p>
                    <p className="text-xs text-neutral">{a.ultimoRegistro ? `Últ. ${a.ultimoRegistro.tipo === 'ENTRADA' ? 'entrada' : 'salida'} ${fmtHora(a.ultimoRegistro.timestamp)}` : 'Sin registros'}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}

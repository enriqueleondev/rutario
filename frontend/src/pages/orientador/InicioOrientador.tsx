import { Link } from 'react-router-dom'
import { Users, Briefcase, CalendarCheck, Timer, ArrowRight, LayoutGrid } from 'lucide-react'
import { api } from '../../api'
import { useAsync, useCatalogos } from '../../hooks'
import { useAuth } from '../../auth/AuthContext'
import { Empty, PageHeader, Section, Spinner, StatCard, TipoRegistroChip } from '../../components/ui'
import { FotoThumb } from '../../components/Evidencia'
import { fmtHora, fmtHorasCorto, hoy, nombreCompleto, sumarDias } from '../../utils'

export default function InicioOrientador() {
  const { usuario } = useAuth()
  const { carrera } = useCatalogos()
  const { data, loading } = useAsync(() => Promise.all([api.reporte({ desde: sumarDias(hoy(), -30) }), api.registros({ desde: hoy(), hasta: hoy() })]), [])
  if (loading || !data) return <Spinner />
  const [resumen, regsHoy] = data
  const alumnos = resumen.filter((r) => r.usuario.rol === 'ALUMNO')
  const docentes = resumen.filter((r) => r.usuario.rol === 'DOCENTE')
  const presentes = new Set(regsHoy.filter((r) => r.tipo === 'ENTRADA').map((r) => r.usuarioId)).size
  const horas = resumen.reduce((s, r) => s + r.horasTotales, 0)
  const grupos = usuario?.gruposAsignados ?? []

  return (
    <>
      <PageHeader title={`Hola, ${usuario?.nombre}`} eyebrow="Orientación educativa" subtitle="Consulta de horas y asistencia de tus grupos asignados."
        actions={<Link to="/reportes" className="btn-primary">Generar reporte <ArrowRight className="w-4 h-4" /></Link>} />

      <div className="flex flex-wrap items-center gap-2 mb-6">
        <span className="eyebrow mr-1">Mis grupos:</span>
        {grupos.map((g, i) => <span key={i} className="chip bg-white border border-line text-on-surface py-1 px-3 text-sm"><LayoutGrid className="w-3.5 h-3.5 text-secondary" />{carrera(g.carreraId)?.clave} · {g.grado}° {g.grupo}</span>)}
        {grupos.length === 0 && <span className="text-sm text-neutral">Dirección aún no te asigna grupos.</span>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
        <StatCard label="Alumnos en mis grupos" value={alumnos.length} icon={<Users className="w-5 h-5" />} hint={`${alumnos.filter((a) => a.vinculacion).length} con práctica asignada`} />
        <StatCard label="Docentes relacionados" value={docentes.length} icon={<Briefcase className="w-5 h-5" />} tone="sky" hint="Supervisan a tus alumnos" />
        <StatCard label="Asistencias hoy" value={presentes} icon={<CalendarCheck className="w-5 h-5" />} tone="slate" />
        <StatCard label="Horas · 30 días" value={Math.round(horas)} icon={<Timer className="w-5 h-5" />} tone="amber" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px] items-start">
        <Section title="Resumen por grupo" subtitle="Últimos 30 días" bodyClass="pt-3">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px]">
              <thead><tr className="bg-surface-low"><th className="th">Grupo</th><th className="th text-right">Alumnos</th><th className="th text-right">Con empresa</th><th className="th text-right">Horas totales</th><th className="th text-right">Promedio</th></tr></thead>
              <tbody>
                {grupos.map((g, i) => {
                  const del = alumnos.filter((a) => a.usuario.carreraId === g.carreraId && a.usuario.grado === g.grado && a.usuario.grupo === g.grupo)
                  const h = del.reduce((s, a) => s + a.horasTotales, 0)
                  return (
                    <tr key={i} className="tr">
                      <td className="td font-medium">{carrera(g.carreraId)?.nombre.replace(/Técnico (en|como) /, '')} · {g.grado}° {g.grupo}</td>
                      <td className="td text-right tabular-nums">{del.length}</td>
                      <td className="td text-right tabular-nums">{del.filter((a) => a.vinculacion).length}</td>
                      <td className="td text-right tabular-nums font-semibold">{fmtHorasCorto(h)}</td>
                      <td className="td text-right tabular-nums text-neutral">{del.length ? fmtHorasCorto(h / del.length) : '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="Registros de hoy" bodyClass="p-3" actions={<Link to="/registros" className="text-sm font-semibold text-secondary hover:underline">Ver todos</Link>}>
          {regsHoy.length === 0 ? <Empty title="Sin registros hoy" /> : (
            <ul className="space-y-1">
              {regsHoy.slice(0, 8).map((r) => (
                <li key={r.id} className="flex items-center gap-3 rounded-xl p-2 hover:bg-surface-low">
                  <FotoThumb data={{ registro: r, usuario: r.usuario, empresa: r.empresa }} />
                  <div className="flex-1 min-w-0">
                    <Link to={`/persona/${r.usuarioId}`} className="text-sm font-medium truncate block hover:text-secondary">{nombreCompleto(r.usuario)}</Link>
                    <p className="text-xs text-neutral truncate">{r.empresa?.nombre}</p>
                  </div>
                  <div className="text-right"><TipoRegistroChip tipo={r.tipo} /><p className="text-xs mono text-neutral mt-0.5">{fmtHora(r.timestamp)}</p></div>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </>
  )
}

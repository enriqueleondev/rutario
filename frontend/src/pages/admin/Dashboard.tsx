import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Users, CalendarCheck, UserX, Building2 } from 'lucide-react'
import { api } from '../../api'
import { useAsync, useCatalogos } from '../../hooks'
import { useAuth } from '../../auth/AuthContext'
import { Avatar, CountUp, Section, Spinner, StatCard, TipoRegistroChip, Empty } from '../../components/ui'
import { PuntoVivo, RutaAnimada } from '../../components/Marca'
import { FotoThumb } from '../../components/Evidencia'
import { MapaPuntos } from '../../components/Mapa'
import type { DiaSemana, TipoPractica } from '../../types'
import { TIPO_LABEL } from '../../types'
import { fmtFecha, fmtHora, hoy, nombreCompleto, parseFecha, sumarDias, ymd, cls } from '../../utils'

const DIAS_SEMANA: { key: DiaSemana; label: string }[] = [
  { key: 'LUNES', label: 'Lunes' }, { key: 'MARTES', label: 'Martes' }, { key: 'MIERCOLES', label: 'Miércoles' }, { key: 'JUEVES', label: 'Jueves' }, { key: 'VIERNES', label: 'Viernes' },
]
const TIPO_COLOR: Record<TipoPractica | 'NONE', string> = { SERVICIO_SOCIAL: '#0B7468', ESTADIAS: '#0B1630', EJECUCION: '#FF6B3D', NONE: '#94a3b8' }

export default function Dashboard() {
  const { usuario } = useAuth()
  const { carrera, empresa } = useCatalogos()
  const lunes = (() => { const d = new Date(); const dow = (d.getDay() + 6) % 7; return ymd(new Date(d.getFullYear(), d.getMonth(), d.getDate() - dow)) })()
  const { data, loading } = useAsync(() => Promise.all([
    api.usuarios(), api.registros({ desde: sumarDias(hoy(), -7) }), api.vinculaciones(), api.reporte({ desde: sumarDias(hoy(), -30) }), api.validaciones(hoy(), hoy()),
  ]), [])

  if (loading || !data) return <Spinner />
  const [usuarios, registros, vincs, resumen30, validacionesHoy] = data
  const alumnos = usuarios.filter((u) => u.rol === 'ALUMNO' && u.activo)
  const docentes = usuarios.filter((u) => u.rol === 'DOCENTE' && u.activo)
  const deHoy = registros.filter((r) => ymd(new Date(r.timestamp)) === hoy())
  const presentesHoy = new Set(deHoy.filter((r) => r.tipo === 'ENTRADA').map((r) => r.usuarioId))
  const enSitio = [...presentesHoy].filter((id) => !deHoy.some((r) => r.usuarioId === id && r.tipo === 'SALIDA')).length
  const horas30 = resumen30.reduce((s, r) => s + r.horasTotales, 0)
  const vinculados = new Set(vincs.map((v) => v.usuarioId))
  const keyHoy = ['DOMINGO', 'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'][new Date().getDay()]
  const programadosHoy = vincs.filter((v) => v.horario.some((h) => h.dia === keyHoy)).length
  const sinEmpleador = vincs.filter((v) => !v.empleadorId && alumnos.some((a) => a.id === v.usuarioId))
  const alumnosConEntrada = new Set(deHoy.filter((r) => r.tipo === 'ENTRADA' && r.usuario.rol === 'ALUMNO').map((r) => r.usuarioId)).size
  const validados = validacionesHoy.length
  const frac = alumnosConEntrada ? Math.min(1, validados / alumnosConEntrada) : 0
  const anillo = Math.round(176 * (1 - frac))
  const h = new Date().getHours()
  const saludo = h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches'

  // Asistencia de la semana actual: personas con entrada / personas programadas ese día
  const semana = DIAS_SEMANA.map((d, i) => {
    const fecha = sumarDias(lunes, i)
    const programados = vincs.filter((v) => v.horario.some((h) => h.dia === d.key)).length
    const asistieron = new Set(registros.filter((r) => r.tipo === 'ENTRADA' && ymd(new Date(r.timestamp)) === fecha).map((r) => r.usuarioId)).size
    const futuro = fecha > hoy()
    return { ...d, fecha, programados, asistieron, pct: programados ? Math.round((asistieron / programados) * 100) : 0, futuro }
  })
  const pasados = semana.filter((d) => !d.futuro && d.programados)
  const promedio = pasados.length ? Math.round(pasados.reduce((s, d) => s + d.pct, 0) / pasados.length) : 0

  // Distribución por tipo de práctica (alumnos)
  const dist = (['SERVICIO_SOCIAL', 'ESTADIAS', 'EJECUCION'] as TipoPractica[]).map((t) => ({
    key: t as TipoPractica | 'NONE', label: TIPO_LABEL[t], n: vincs.filter((v) => v.tipoPractica === t && alumnos.some((a) => a.id === v.usuarioId)).length,
  }))
  dist.push({ key: 'NONE', label: 'Sin vincular', n: alumnos.filter((a) => !vinculados.has(a.id)).length })
  const totalDist = dist.reduce((s, d) => s + d.n, 0) || 1
  let acc = 0
  const R = 52, C = 2 * Math.PI * R

  const ultimos = registros.slice(0, 7)
  const diaMapa = registros.find((r) => r.tipo === 'ENTRADA') ? ymd(new Date(registros.find((r) => r.tipo === 'ENTRADA')!.timestamp)) : undefined
  const entradasMapa = registros.filter((r) => r.tipo === 'ENTRADA' && ymd(new Date(r.timestamp)) === diaMapa)

  return (
    <>
      <section className="on-dark relative overflow-hidden rounded-2xl bg-ink text-white px-6 sm:px-9 py-7 mb-6 flex flex-wrap items-center gap-6 anim-rise">
        <div className="relative z-10 flex-1 basis-72 min-w-0">
          <p className="text-[13px] font-medium text-[#A9B8D0] first-letter:uppercase">{new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          <h1 className="text-3xl font-extrabold mt-1 leading-tight">{saludo}, {usuario?.nombre}</h1>
          <p className="text-[#C7D2E5] mt-2">
            <b className="font-display text-lg text-aqua tabular-nums"><CountUp n={enSitio} /></b> {enSitio === 1 ? 'persona está' : 'personas están'} en su lugar de práctica ahora. CBT Lic. Julián Díaz Arias.
          </p>
        </div>
        <RutaAnimada className="relative z-10 w-full max-w-[460px] shrink" />
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
        <StatCard label="Alumnos activos" value={alumnos.length} icon={<Users className="w-5 h-5" />} delay={100}
          hint={`${alumnos.filter((a) => vinculados.has(a.id)).length} vinculados a empresa · ${docentes.length} docentes`} />
        <StatCard label={<span className="inline-flex items-center gap-2"><PuntoVivo />En práctica ahora</span>} value={enSitio} icon={<CalendarCheck className="w-5 h-5" />} delay={180}
          hint={`de ${programadosHoy} programados hoy · ${presentesHoy.size} ya registraron entrada`} />
        <StatCard label="Sin empleador" value={sinEmpleador.length} icon={<UserX className="w-5 h-5" />} tone="amber" delay={260}
          hint={sinEmpleador.length ? <Link to="/empleadores" className="font-semibold text-tertiary hover:underline">Asignar ahora →</Link> : 'Todos tienen quien valide su asistencia'} />
        <div className="card p-5 border-l-[3px] border-l-brand lift anim-rise flex items-center gap-4" style={{ '--d': '340ms' } as CSSProperties}>
          <svg width="72" height="72" viewBox="0 0 72 72" className="shrink-0" role="img" aria-label={`${validados} de ${alumnosConEntrada} alumnos validados hoy por su empleador`}>
            <circle cx="36" cy="36" r="28" fill="none" stroke="#EAF2F1" strokeWidth="8" />
            <circle cx="36" cy="36" r="28" fill="none" stroke="#0F8F82" strokeWidth="8" strokeLinecap="round" strokeDasharray="176" strokeDashoffset={anillo}
              transform="rotate(-90 36 36)" className="anim-ring" style={{ '--ring-from': 176, '--ring-to': anillo } as CSSProperties} />
          </svg>
          <div>
            <p className="eyebrow">Validados por la empresa</p>
            <p className="font-display text-3xl font-extrabold leading-tight tabular-nums"><CountUp n={validados} /><span className="text-base font-semibold text-neutral"> / {alumnosConEntrada}</span></p>
            <p className="text-xs text-neutral">alumnos con entrada hoy</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3 mb-6">
        <Section className="xl:col-span-2" title="Asistencia de la semana" subtitle="Personas que registraron entrada vs. programadas según su horario">
          <div className="flex items-end gap-3 sm:gap-6 h-56 mt-4 px-1">
            {semana.map((d, i) => (
              <div key={d.key} className="flex-1 flex flex-col items-center justify-end h-full gap-2">
                <span className={cls('text-xs font-semibold tabular-nums', d.futuro ? 'text-slate-300' : 'text-secondary')}>{d.futuro ? '—' : `${d.pct}%`}</span>
                <div className="w-full max-w-16 flex-1 flex items-end rounded-t-lg bg-surface-low overflow-hidden" title={`${d.asistieron} de ${d.programados}`}>
                  <div className={cls('w-full rounded-t-lg anim-grow', d.fecha === hoy() ? 'bg-primary-container' : 'bg-secondary')} style={{ height: `${d.futuro ? 0 : d.pct}%`, '--d': `${300 + i * 90}ms` } as CSSProperties} />
                </div>
                <span className={cls('text-xs sm:text-sm', d.fecha === hoy() ? 'font-semibold text-secondary' : 'text-neutral')}>{d.label}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap justify-between gap-2 border-t border-line mt-5 pt-4 text-sm text-neutral">
            <span>Promedio de la semana: <b className="text-on-surface">{promedio}%</b> · Horas en 30 días: <b className="text-on-surface">{Math.round(horas30).toLocaleString('es-MX')}</b></span>
            <span className="flex items-center gap-3">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-secondary" />Días anteriores</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-primary-container" />Hoy (en curso)</span>
            </span>
          </div>
        </Section>

        <Section title="Tipo de práctica" subtitle="Distribución de alumnos">
          <div className="flex justify-center my-3">
            <svg width="150" height="150" viewBox="0 0 150 150" role="img" aria-label="Distribución por tipo de práctica">
              <circle cx="75" cy="75" r={R} fill="none" stroke="#eff4ff" strokeWidth="16" />
              {dist.map((d) => {
                const len = (d.n / totalDist) * C
                const el = <circle key={d.key} cx="75" cy="75" r={R} fill="none" stroke={TIPO_COLOR[d.key]} strokeWidth="16" strokeDasharray={`${Math.max(0, len - 2)} ${C}`} strokeDashoffset={-acc} transform="rotate(-90 75 75)" />
                acc += len
                return el
              })}
              <text x="75" y="72" textAnchor="middle" className="fill-on-surface" style={{ font: '700 26px Inter' }}>{alumnos.length}</text>
              <text x="75" y="92" textAnchor="middle" style={{ font: '600 10px Inter', fill: '#64748b', letterSpacing: 1 }}>ALUMNOS</text>
            </svg>
          </div>
          <ul className="space-y-3">
            {dist.map((d) => (
              <li key={d.key}>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{ background: TIPO_COLOR[d.key] }} />{d.label}</span>
                  <span className="tabular-nums"><b>{Math.round((d.n / totalDist) * 100)}%</b> <span className="text-neutral">({d.n})</span></span>
                </div>
                <div className="h-1.5 rounded-full bg-surface-low mt-1.5"><div className="h-full rounded-full" style={{ width: `${(d.n / totalDist) * 100}%`, background: TIPO_COLOR[d.key] }} /></div>
              </li>
            ))}
          </ul>
        </Section>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Section className="xl:col-span-2" bodyClass="pt-3" title={<span className="flex items-center gap-2">Últimos registros <span className="chip bg-primary-container/50 text-secondary"><span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />En vivo</span></span>}
          actions={<Link to="/registros" className="text-sm font-semibold text-secondary inline-flex items-center gap-1 hover:underline">Ver todos <ArrowRight className="w-4 h-4" /></Link>}>
          {ultimos.length === 0 ? <Empty title="Sin registros recientes" /> : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead><tr className="bg-surface-low"><th className="th">Foto</th><th className="th">Persona</th><th className="th">Carrera</th><th className="th">Lugar</th><th className="th">Hora</th><th className="th text-right">Tipo</th></tr></thead>
                <tbody>
                  {ultimos.map((r) => (
                    <tr key={r.id} className="tr">
                      <td className="td"><FotoThumb data={{ registro: r, usuario: r.usuario, empresa: r.empresa }} /></td>
                      <td className="td"><Link to={`/persona/${r.usuarioId}`} className="font-medium hover:text-secondary">{nombreCompleto(r.usuario)}</Link><p className="text-xs text-neutral">{r.usuario.rol === 'DOCENTE' ? 'Docente' : r.usuario.matricula}</p></td>
                      <td className="td text-neutral">{carrera(r.usuario.carreraId)?.nombre.replace('Técnico en ', '').replace('Técnico como ', '') ?? '—'}</td>
                      <td className="td text-neutral">{r.empresa?.nombre ?? '—'}</td>
                      <td className="td mono text-neutral whitespace-nowrap">{ymd(new Date(r.timestamp)) === hoy() ? '' : parseFecha(ymd(new Date(r.timestamp))).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }) + ' · '}{fmtHora(r.timestamp)}</td>
                      <td className="td text-right"><TipoRegistroChip tipo={r.tipo} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>

        <div className="space-y-6">
          <Section title="¿Dónde están?" subtitle={diaMapa === hoy() ? 'Ubicación de las entradas de hoy' : diaMapa ? `Aún no hay entradas hoy · mostrando ${fmtFecha(diaMapa, { weekday: 'long', day: 'numeric' })}` : 'Sin entradas recientes'} actions={<Building2 className="w-5 h-5 text-neutral" />}>
            {entradasMapa.length ? (
              <MapaPuntos height={300} puntos={entradasMapa.map((r) => ({ lat: r.latitud, lng: r.longitud, titulo: nombreCompleto(r.usuario), detalle: `${r.empresa?.nombre ?? ''} · ${fmtHora(r.timestamp)}` }))} />
            ) : <Empty title="Sin entradas recientes" text="Cuando alumnos y docentes registren su entrada aparecerán aquí." />}
          </Section>
          <Section title="Sin empleador" subtitle="Alumnos con empresa que nadie valida todavía" bodyClass="p-3"
            actions={<Link to="/empleadores" className="text-sm font-semibold text-secondary inline-flex items-center gap-1 hover:underline">Empleadores <ArrowRight className="w-4 h-4" /></Link>}>
            {sinEmpleador.length === 0 ? <Empty title="Todos tienen empleador" text="Cada alumno con empresa tiene a quién validar su asistencia." /> : (
              <ul>
                {sinEmpleador.slice(0, 4).map((v) => {
                  const al = alumnos.find((a) => a.id === v.usuarioId)!
                  return (
                    <li key={v.id} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-surface transition-colors">
                      <Avatar u={al} size={36} />
                      <div className="flex-1 min-w-0"><p className="font-medium text-sm truncate">{nombreCompleto(al)}</p><p className="text-xs text-neutral truncate">{empresa(v.empresaId)?.nombre ?? '—'}</p></div>
                      <Link to="/empleadores" className="btn-soft h-8 px-3 text-xs">Asignar</Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </Section>
        </div>
      </div>
    </>
  )
}

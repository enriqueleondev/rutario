import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, CalendarCheck, Building2, Link2, RefreshCw, ArrowRight, CheckCircle2 } from 'lucide-react'
import { api } from '../../api'
import { useAsync, useCatalogos } from '../../hooks'
import { useAuth } from '../../auth/AuthContext'
import { Avatar, Empty, PageHeader, Section, Spinner, StatCard, TipoRegistroChip } from '../../components/ui'
import { FotoThumb } from '../../components/Evidencia'
import VincularDrawer from '../../components/VincularDrawer'
import type { Usuario } from '../../types'
import { fmtHora, hoy, nombreCompleto } from '../../utils'

export default function InicioVinculador() {
  const { usuario } = useAuth()
  const { empresas, carrera } = useCatalogos()
  const { data, loading, reload } = useAsync(() => Promise.all([api.usuarios(), api.vinculaciones(), api.registros({ desde: hoy(), hasta: hoy() })]), [])
  const [vincular, setVincular] = useState<Usuario | null>(null)

  if (loading || !data) return <Spinner />
  const [personas, vincs, regsHoy] = data
  const alumnos = personas.filter((p) => p.rol === 'ALUMNO' && p.activo)
  const docentes = personas.filter((p) => p.rol === 'DOCENTE' && p.activo)
  const vinculados = new Set(vincs.map((v) => v.usuarioId))
  const pendientes = [...alumnos, ...docentes].filter((p) => !vinculados.has(p.id))
  const presentes = new Set(regsHoy.filter((r) => r.tipo === 'ENTRADA').map((r) => r.usuarioId))
  const misEmpresas = new Set(vincs.map((v) => v.empresaId))

  return (
    <>
      <PageHeader title={`Hola, ${usuario?.nombre}`} eyebrow="Vinculación escolar" subtitle="Resumen de tus alumnos y docentes vinculados." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
        <StatCard label="Mis alumnos" value={alumnos.length} icon={<Users className="w-5 h-5" />} hint={`${docentes.length} docentes a tu cargo`} />
        <StatCard label="Asistencias hoy" value={presentes.size} icon={<CalendarCheck className="w-5 h-5" />} tone="sky" hint={`de ${vinculados.size} personas vinculadas`} />
        <StatCard label="Empresas con prácticas" value={misEmpresas.size} icon={<Building2 className="w-5 h-5" />} tone="slate" hint={`${empresas.filter((e) => e.activa).length} empresas registradas`} />
        <StatCard label="Pendientes de vincular" value={pendientes.length} icon={<Link2 className="w-5 h-5" />} tone="amber" hint={pendientes.length ? 'Sin empresa asignada' : 'Todo al día'} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px] items-start">
        <Section bodyClass="pt-3" title={<span className="flex items-center gap-2">Monitoreo de hoy <span className="chip bg-primary-container/50 text-secondary"><span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />En vivo</span></span>}
          subtitle="Últimos registros de tus alumnos y docentes"
          actions={<button className="btn-outline h-9" onClick={reload}><RefreshCw className="w-4 h-4" />Refrescar</button>}>
          {regsHoy.length === 0 ? <Empty icon={<CalendarCheck className="w-6 h-6" />} title="Aún no hay registros hoy" text="Aquí verás cada entrada y salida en cuanto se sincronice." /> : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px]">
                <thead><tr className="bg-surface-low"><th className="th">Foto</th><th className="th">Persona</th><th className="th">Empresa</th><th className="th">Hora</th><th className="th text-right">Tipo</th></tr></thead>
                <tbody>
                  {regsHoy.slice(0, 10).map((r) => (
                    <tr key={r.id} className="tr">
                      <td className="td"><FotoThumb data={{ registro: r, usuario: r.usuario, empresa: r.empresa }} /></td>
                      <td className="td"><Link to={`/persona/${r.usuarioId}`} className="font-medium hover:text-secondary">{nombreCompleto(r.usuario)}</Link><p className="text-xs text-neutral mono">{r.usuario.matricula ?? 'Docente'}</p></td>
                      <td className="td text-neutral"><span className="flex items-center gap-2"><Building2 className="w-4 h-4 shrink-0" />{r.empresa?.nombre}</span></td>
                      <td className="td mono">{fmtHora(r.timestamp)}</td>
                      <td className="td text-right"><TipoRegistroChip tipo={r.tipo} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="flex justify-between items-center border-t border-line mt-3 pt-3 text-sm">
            <span className="text-neutral">{Math.min(10, regsHoy.length)} de {regsHoy.length} registros de hoy</span>
            <Link to="/registros" className="font-semibold text-secondary inline-flex items-center gap-1 hover:underline">Ver historial <ArrowRight className="w-4 h-4" /></Link>
          </div>
        </Section>

        <Section title="Pendientes de vincular" subtitle="Asígnales empresa y tipo de práctica" bodyClass="p-3">
          {pendientes.length === 0 ? (
            <Empty icon={<CheckCircle2 className="w-6 h-6" />} title="Todos están vinculados" />
          ) : (
            <ul className="space-y-2">
              {pendientes.map((p) => (
                <li key={p.id} className="flex items-center gap-3 rounded-xl bg-surface-low p-3">
                  <Avatar u={p} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{nombreCompleto(p)}</p>
                    <p className="text-xs text-neutral">{p.rol === 'ALUMNO' ? `${carrera(p.carreraId)?.clave} · ${p.grado}°${p.grupo} · ${p.matricula}` : 'Docente'}</p>
                  </div>
                  <button className="btn-primary h-8 px-3 text-xs" onClick={() => setVincular(p)}>Asignar</button>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      <VincularDrawer usuario={vincular} empresas={empresas} onClose={() => setVincular(null)} onSaved={reload} />
    </>
  )
}

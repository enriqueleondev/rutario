import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, UserPlus, Eye, Link2, Users, Building2, AlertTriangle, Timer, FileSpreadsheet, KeyRound, UserCheck } from 'lucide-react'
import { RestablecerPassword } from '../../components/RestablecerPassword'
import { api, extension } from '../../api'
import { useAsync, useCatalogos } from '../../hooks'
import { Avatar, Empty, PageHeader, Pager, Spinner, StatCard, TipoChip, usePaged, useToast } from '../../components/ui'
import UsuarioDrawer from '../../components/UsuarioDrawer'
import VincularDrawer from '../../components/VincularDrawer'
import { TIPO_LABEL, type TipoPractica, type Usuario } from '../../types'
import { descargarBlob, fmtHorasCorto, hoy, nombreCompleto, sumarDias } from '../../utils'

export default function MisPersonas({ rol }: { rol: 'ALUMNO' | 'DOCENTE' }) {
  const toast = useToast()
  const { empresas, carrera } = useCatalogos()
  const desde = sumarDias(hoy(), -120)
  const { data = [], loading, reload } = useAsync(() => api.reporte({ rol, desde }), [rol])
  const { data: empleadores = [] } = useAsync(() => (rol === 'ALUMNO' ? api.usuarios({ rol: 'EMPLEADOR' }) : Promise.resolve([] as Usuario[])), [rol])
  const [q, setQ] = useState('')
  const [tipo, setTipo] = useState<TipoPractica | '' | 'SIN'>('')
  const [nuevo, setNuevo] = useState(false)
  const [vincular, setVincular] = useState<Usuario | null>(null)
  const [clave, setClave] = useState<Usuario | null>(null)
  const esAlumno = rol === 'ALUMNO'

  const filas = useMemo(() => data.filter((r) =>
    (!q || (nombreCompleto(r.usuario) + (r.usuario.matricula ?? '') + (r.empresa?.nombre ?? '')).toLowerCase().includes(q.toLowerCase())) &&
    (!tipo || (tipo === 'SIN' ? !r.vinculacion : r.vinculacion?.tipoPractica === tipo))), [data, q, tipo])
  const pg = usePaged(filas, 10)
  const sinEmpresa = data.filter((r) => !r.vinculacion).length
  const horas = data.reduce((s, r) => s + r.horasTotales, 0)
  const actualV = vincular ? data.find((r) => r.usuario.id === vincular.id)?.vinculacion : undefined

  const exportar = async () => {
    const blob = await api.exportarReporte({ rol, desde }, 'xlsx')
    descargarBlob(blob, `mis-${esAlumno ? 'alumnos' : 'docentes'}.${extension(blob, 'xlsx')}`)
    toast('Listado exportado')
  }

  return (
    <>
      <PageHeader title={esAlumno ? 'Mis alumnos' : 'Mis docentes'} eyebrow="Módulo de vinculación"
        subtitle={esAlumno ? 'Alumnos que registraste: asigna su empresa, tipo de práctica y horario.' : 'Docentes que supervisan prácticas: vincúlalos a la empresa que visitan.'}
        actions={<>
          <button className="btn-outline" onClick={exportar}><FileSpreadsheet className="w-4 h-4 text-secondary" />Exportar</button>
          <button className="btn-primary" onClick={() => setNuevo(true)}><UserPlus className="w-4 h-4" />{esAlumno ? 'Nuevo alumno' : 'Nuevo docente'}</button>
        </>} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
        <StatCard label={esAlumno ? 'Total asignados' : 'Total docentes'} value={data.length} icon={<Users className="w-5 h-5" />} tone="sky" />
        <StatCard label="Con empresa" value={data.length - sinEmpresa} icon={<Building2 className="w-5 h-5" />} hint={data.length ? `${Math.round(((data.length - sinEmpresa) / data.length) * 100)}% de cobertura` : undefined} />
        <StatCard label="Sin empresa" value={sinEmpresa} icon={<AlertTriangle className="w-5 h-5" />} tone="amber" hint={sinEmpresa ? 'Pendientes de vincular' : 'Todos vinculados'} />
        <StatCard label="Horas acumuladas" value={Math.round(horas).toLocaleString('es-MX')} icon={<Timer className="w-5 h-5" />} tone="slate" hint="Últimos 4 meses" />
      </div>

      <div className="card p-4 mb-4 flex flex-col sm:flex-row gap-3">
        <label className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-neutral" />
          <input className="input pl-9" placeholder={esAlumno ? 'Buscar por alumno, matrícula o empresa…' : 'Buscar por docente o empresa…'} value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <select className="input sm:w-64" value={tipo} onChange={(e) => setTipo(e.target.value as typeof tipo)} aria-label="Tipo de práctica">
          <option value="">Todos los tipos</option>
          {(Object.keys(TIPO_LABEL) as TipoPractica[]).map((t) => <option key={t} value={t}>{TIPO_LABEL[t]}</option>)}
          <option value="SIN">Sin empresa asignada</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        {loading ? <Spinner /> : filas.length === 0 ? <Empty icon={<Users className="w-6 h-6" />} title="Sin resultados" /> : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1040px]">
                <thead><tr className="bg-surface-low">
                  {esAlumno && <th className="th">Matrícula</th>}<th className="th">{esAlumno ? 'Alumno' : 'Docente'}</th><th className="th">Carrera</th><th className="th">Tipo</th><th className="th">Empresa receptora</th>{esAlumno && <th className="th">Empleador</th>}<th className="th text-right">Horas</th><th className="th text-right">Acciones</th>
                </tr></thead>
                <tbody>
                  {pg.slice.map((r) => (
                    <tr key={r.usuario.id} className={`tr ${!r.vinculacion ? 'bg-error-container/20' : ''}`}>
                      {esAlumno && <td className="td mono text-neutral">{r.usuario.matricula}</td>}
                      <td className="td"><div className="flex items-center gap-3"><Avatar u={r.usuario} size={34} /><div><p className="font-medium">{nombreCompleto(r.usuario)}</p><p className="text-xs text-neutral">{esAlumno ? `${r.usuario.grado}° · Grupo ${r.usuario.grupo}` : r.usuario.email}</p></div></div></td>
                      <td className="td text-neutral">{carrera(r.usuario.carreraId)?.nombre.replace(/Técnico (en|como) /, '') ?? '—'}</td>
                      <td className="td"><TipoChip tipo={r.vinculacion?.tipoPractica} /></td>
                      <td className="td">{r.empresa ? <span className="flex items-center gap-2"><Building2 className="w-4 h-4 text-neutral shrink-0" />{r.empresa.nombre}</span> : <span className="text-error text-sm font-medium">Sin asignar</span>}</td>
                      {esAlumno && (
                        <td className="td">
                          {!r.vinculacion ? <span className="text-neutral">—</span>
                            : r.vinculacion.empleadorId
                              ? <span className="chip bg-primary-container text-secondary"><UserCheck className="w-3.5 h-3.5" />{nombreCompleto(empleadores.find((e) => e.id === r.vinculacion?.empleadorId) ?? { nombre: 'Asignado', apellidoPaterno: '' })}</span>
                              : <button className="chip bg-tertiary-container text-tertiary hover:brightness-95 cursor-pointer" onClick={() => setVincular(r.usuario)} title="Elige al empleador en la sección Empresa">+ Asignar empleador</button>}
                        </td>
                      )}
                      <td className="td text-right whitespace-nowrap"><b className="tabular-nums">{fmtHorasCorto(r.horasTotales)}</b><p className="text-xs text-neutral">{r.diasAsistidos} días</p></td>
                      <td className="td text-right whitespace-nowrap">
                        {r.vinculacion ? <>
                          <Link to={`/persona/${r.usuario.id}`} className="icon-btn" title="Ver registros" aria-label="Ver registros"><Eye className="w-4 h-4" /></Link>
                          <button className="icon-btn" title="Editar vinculación" aria-label="Editar vinculación" onClick={() => setVincular(r.usuario)}><Link2 className="w-4 h-4" /></button>
                        </> : <button className="btn-primary h-8 px-3 text-xs" onClick={() => setVincular(r.usuario)}><Link2 className="w-3.5 h-3.5" />Asignar</button>}
                        <button className="icon-btn" title="Restablecer contraseña" aria-label={`Restablecer contraseña de ${nombreCompleto(r.usuario)}`} onClick={() => setClave(r.usuario)}><KeyRound className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pager {...pg} unidad={esAlumno ? 'alumnos' : 'docentes'} />
          </>
        )}
      </div>

      <UsuarioDrawer open={nuevo} roles={[rol]} onClose={() => setNuevo(false)} onSaved={(u) => { reload(); setVincular(u) }} />
      <RestablecerPassword usuario={clave} onCerrar={() => setClave(null)} />
      <VincularDrawer usuario={vincular} vinculacion={actualV} empresas={empresas} onClose={() => setVincular(null)} onSaved={reload} />
    </>
  )
}

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Filter, RotateCcw, FileSpreadsheet, FileText, Users, Timer, CalendarCheck, CalendarX, ChevronRight, MapPin } from 'lucide-react'
import { api, extension, type FiltroReporte } from '../api'
import { useAsync, useCatalogos } from '../hooks'
import { useAuth } from '../auth/AuthContext'
import { Avatar, Empty, PageHeader, Pager, RolChip, Spinner, StatCard, TipoChip, usePaged, useToast } from '../components/ui'
import { TIPO_LABEL, type TipoPractica } from '../types'
import { descargarBlob, fmtHorasCorto, hoy, nombreCompleto, sumarDias } from '../utils'

const inicial = (): FiltroReporte => ({ desde: sumarDias(hoy(), -60), hasta: hoy(), rol: '', carreraId: '', grado: '', grupo: '', tipoPractica: '', empresaId: '', estatus: '', q: '' })

export default function Reportes() {
  const { usuario } = useAuth()
  const toast = useToast()
  const { carreras, empresas, carrera } = useCatalogos()
  const [f, setF] = useState<FiltroReporte>(inicial)
  const [aplicado, setAplicado] = useState<FiltroReporte>(inicial)
  const [exportando, setExportando] = useState<string>()
  const { data = [], loading } = useAsync(() => api.reporte(aplicado), [aplicado])
  const pg = usePaged(data, 10)
  const set = (k: keyof FiltroReporte, v: string) => setF((x) => ({ ...x, [k]: v }))

  const horas = data.reduce((s, r) => s + r.horasTotales, 0)
  const incompletos = data.reduce((s, r) => s + r.diasIncompletos, 0)
  const conPractica = data.filter((r) => r.vinculacion).length

  const exportar = async (formato: 'xlsx' | 'docx') => {
    setExportando(formato)
    try {
      const blob = await api.exportarReporte(aplicado, formato)
      descargarBlob(blob, `reporte-horas-${aplicado.desde}_${aplicado.hasta}.${extension(blob, formato)}`)
      toast('Reporte descargado')
    } catch (e) { toast((e as Error).message, 'error') } finally { setExportando(undefined) }
  }

  const alcance = usuario?.rol === 'VINCULADOR' ? 'de tus alumnos y docentes vinculados' : usuario?.rol === 'ORIENTADOR' ? 'de tus grupos asignados' : 'de todo el plantel'

  return (
    <>
      <PageHeader title="Reportes de horas" eyebrow="Prácticas y servicio social" subtitle={`Horas y lugar de práctica ${alcance}. Exporta a Excel o Word.`}
        actions={<>
          <button className="btn-outline" onClick={() => exportar('xlsx')} disabled={!!exportando || !data.length}><FileSpreadsheet className="w-4 h-4 text-secondary" />{exportando === 'xlsx' ? 'Generando…' : 'Excel'}</button>
          <button className="btn-outline" onClick={() => exportar('docx')} disabled={!!exportando || !data.length}><FileText className="w-4 h-4 text-ink" />{exportando === 'docx' ? 'Generando…' : 'Word'}</button>
        </>} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
        <StatCard label="Personas en el reporte" value={data.length} icon={<Users className="w-5 h-5" />} hint={`${data.filter((r) => r.usuario.rol === 'ALUMNO').length} alumnos · ${data.filter((r) => r.usuario.rol === 'DOCENTE').length} docentes`} tone="sky" />
        <StatCard label="Horas totales" value={Math.round(horas)} icon={<Timer className="w-5 h-5" />} hint={`Promedio ${data.length ? (horas / data.length).toFixed(1) : 0} h por persona`} />
        <StatCard label="Con práctica asignada" value={conPractica} icon={<CalendarCheck className="w-5 h-5" />} hint={`${data.length - conPractica} sin empresa`} />
        <StatCard label="Días incompletos" value={incompletos} icon={<CalendarX className="w-5 h-5" />} tone="amber" hint="Entrada sin salida = falta" />
      </div>

      <section className="card p-5 mb-6">
        <header className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2"><Filter className="w-4 h-4 text-secondary" />Filtros de consulta</h2>
        </header>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label><span className="label">Desde</span><input className="input" type="date" value={f.desde} max={f.hasta} onChange={(e) => set('desde', e.target.value)} /></label>
          <label><span className="label">Hasta</span><input className="input" type="date" value={f.hasta} min={f.desde} onChange={(e) => set('hasta', e.target.value)} /></label>
          <label><span className="label">Personas</span><select className="input" value={f.rol} onChange={(e) => set('rol', e.target.value)}><option value="">Alumnos y docentes</option><option value="ALUMNO">Solo alumnos</option><option value="DOCENTE">Solo docentes</option></select></label>
          <label><span className="label">Tipo de práctica</span><select className="input" value={f.tipoPractica} onChange={(e) => set('tipoPractica', e.target.value)}><option value="">Todos los tipos</option>{(Object.keys(TIPO_LABEL) as TipoPractica[]).map((t) => <option key={t} value={t}>{TIPO_LABEL[t]}</option>)}</select></label>
          <label><span className="label">Carrera</span><select className="input" value={f.carreraId} onChange={(e) => set('carreraId', e.target.value)}><option value="">Todas</option>{carreras.map((c) => <option key={c.id} value={c.id}>{c.nombre.replace(/Técnico (en|como) /, '')}</option>)}</select></label>
          <div className="grid grid-cols-2 gap-3">
            <label><span className="label">Grado</span><select className="input" value={f.grado} onChange={(e) => set('grado', e.target.value)}><option value="">—</option>{[1, 2, 3].map((g) => <option key={g} value={g}>{g}°</option>)}</select></label>
            <label><span className="label">Grupo</span><select className="input" value={f.grupo} onChange={(e) => set('grupo', e.target.value)}><option value="">—</option>{[1, 2, 3, 4].map((g) => <option key={g} value={g}>{g}</option>)}</select></label>
          </div>
          <label><span className="label">Empresa</span><select className="input" value={f.empresaId} onChange={(e) => set('empresaId', e.target.value)}><option value="">Todas</option>{empresas.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}</select></label>
          <label><span className="label">Estatus de práctica</span><select className="input" value={f.estatus} onChange={(e) => set('estatus', e.target.value)}><option value="">Todos</option><option value="ACTIVO">En curso</option><option value="FINALIZADO">Finalizada</option></select></label>
          <label className="sm:col-span-2"><span className="label">Buscar</span><input className="input" placeholder="Nombre, matrícula o correo" value={f.q} onChange={(e) => set('q', e.target.value)} /></label>
        </div>
        <div className="flex flex-wrap justify-end gap-2 border-t border-line mt-5 pt-4">
          <button className="btn-ghost" onClick={() => { setF(inicial()); setAplicado(inicial()) }}><RotateCcw className="w-4 h-4" />Limpiar filtros</button>
          <button className="btn-primary" onClick={() => setAplicado({ ...f })}><Filter className="w-4 h-4" />Generar reporte</button>
        </div>
      </section>

      <section className="card overflow-hidden">
        <header className="px-5 py-4"><h2 className="font-semibold">Detalle de horas por persona</h2><p className="text-sm text-neutral">Del {aplicado.desde} al {aplicado.hasta}. Usa la flecha de cada fila para ver su reporte individual.</p></header>
        {loading ? <Spinner /> : data.length === 0 ? <Empty icon={<Users className="w-6 h-6" />} title="Sin resultados" text="Ajusta los filtros y vuelve a generar el reporte." /> : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px]">
                <thead><tr className="bg-surface-low"><th className="th">Persona</th><th className="th">Carrera · grupo</th><th className="th">Tipo</th><th className="th">Lugar de práctica</th><th className="th text-right">Días</th><th className="th text-right">Incompl.</th><th className="th text-right">Horas totales</th><th className="th" /></tr></thead>
                <tbody>
                  {pg.slice.map((r) => (
                    <tr key={r.usuario.id} className="tr">
                      <td className="td"><Link to={`/persona/${r.usuario.id}`} className="flex items-center gap-3"><Avatar u={r.usuario} size={32} /><span className="min-w-0"><span className="font-medium block hover:text-secondary">{nombreCompleto(r.usuario)}</span><span className="flex items-center gap-1.5 mt-0.5"><RolChip rol={r.usuario.rol} /><span className="text-xs text-neutral mono truncate max-w-[150px]">{r.usuario.matricula ?? r.usuario.email}</span></span></span></Link></td>
                      <td className="td text-neutral whitespace-nowrap">{carrera(r.usuario.carreraId)?.clave ?? '—'}{r.usuario.grado ? ` · ${r.usuario.grado}°${r.usuario.grupo}` : ''}</td>
                      <td className="td"><TipoChip tipo={r.vinculacion?.tipoPractica} /></td>
                      <td className="td max-w-[260px]">{r.empresa ? <><p className="font-medium truncate">{r.empresa.nombre}</p><p className="text-xs text-neutral flex items-center gap-1 truncate" title={r.empresa.direccion}><MapPin className="w-3 h-3 shrink-0" /><span className="truncate">{r.empresa.direccion}</span></p></> : <span className="text-neutral">—</span>}</td>
                      <td className="td text-right tabular-nums">{r.diasAsistidos}</td>
                      <td className="td text-right tabular-nums">{r.diasIncompletos ? <span className="text-tertiary font-semibold">{r.diasIncompletos}</span> : 0}</td>
                      <td className="td text-right font-bold tabular-nums whitespace-nowrap">{fmtHorasCorto(r.horasTotales)}</td>
                      <td className="td"><Link to={`/persona/${r.usuario.id}`} className="icon-btn" title="Reporte individual" aria-label="Reporte individual"><ChevronRight className="w-4 h-4" /></Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pager {...pg} unidad="personas" />
          </>
        )}
      </section>
    </>
  )
}

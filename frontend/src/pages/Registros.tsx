import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, ClipboardList, Smartphone, Globe, WifiOff, List, Map as MapIcon, Trash2 } from 'lucide-react'
import { api, type FiltroRegistros, type RegistroDetalle } from '../api'
import { useAsync } from '../hooks'
import { useAuth } from '../auth/AuthContext'
import { useToast } from '../components/ui'
import { ConfirmarEliminar, Empty, PageHeader, Pager, RolChip, Spinner, Tabs, TipoRegistroChip, ValidacionChip, usePaged } from '../components/ui'
import { FotoThumb } from '../components/Evidencia'
import { MapaPuntos } from '../components/Mapa'
import { fmtFecha, fmtHora, hoy, nombreCompleto, sumarDias, ymd } from '../utils'

const SUB: Record<string, string> = {
  ROOT: 'Todos los registros de entrada y salida del plantel, con su foto y ubicación.',
  DIRECTIVO: 'Todos los registros de entrada y salida del plantel, con su foto y ubicación.',
  VINCULADOR: 'Registros de los alumnos y docentes que tú vinculaste.',
  ORIENTADOR: 'Registros de los alumnos de tus grupos y de sus docentes.',
}

export default function Registros() {
  const { usuario } = useAuth()
  const [f, setF] = useState<FiltroRegistros>({ desde: sumarDias(hoy(), -6), hasta: hoy(), tipo: '', q: '' })
  const [vista, setVista] = useState<'lista' | 'mapa'>('lista')
  const { data = [], loading, reload } = useAsync(() => api.registros(f), [f.desde, f.hasta, f.tipo, f.q])
  // Confirmaciones de las empresas (si la consulta falla, la tabla se muestra igual sin esa columna de datos)
  const { data: validaciones = [] } = useAsync(() => api.validaciones(f.desde, f.hasta).catch(() => []), [f.desde, f.hasta])
  const validacionDe = new Map(validaciones.map((v) => [v.registroId, v]))
  const esAdmin = usuario?.rol === 'ROOT' || usuario?.rol === 'DIRECTIVO'
  const [borrar, setBorrar] = useState<RegistroDetalle | null>(null)
  const toast = useToast()
  const pg = usePaged(data, 12)

  return (
    <>
      <PageHeader title="Registros de asistencia" subtitle={SUB[usuario!.rol]}
        actions={<Tabs value={vista} onChange={setVista} items={[{ value: 'lista', label: <span className="flex items-center gap-1.5"><List className="w-4 h-4" />Lista</span> }, { value: 'mapa', label: <span className="flex items-center gap-1.5"><MapIcon className="w-4 h-4" />Mapa</span> }]} />} />

      <div className="card p-4 mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_160px_160px_160px]">
        <label className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-neutral" />
          <input className="input pl-9" placeholder="Buscar por nombre o matrícula…" value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} />
        </label>
        <input className="input" type="date" value={f.desde} max={f.hasta} onChange={(e) => setF({ ...f, desde: e.target.value })} aria-label="Desde" />
        <input className="input" type="date" value={f.hasta} min={f.desde} onChange={(e) => setF({ ...f, hasta: e.target.value })} aria-label="Hasta" />
        <select className="input" value={f.tipo} onChange={(e) => setF({ ...f, tipo: e.target.value as FiltroRegistros['tipo'] })} aria-label="Tipo">
          <option value="">Entradas y salidas</option><option value="ENTRADA">Solo entradas</option><option value="SALIDA">Solo salidas</option>
        </select>
      </div>

      {loading ? <div className="card"><Spinner /></div> : data.length === 0 ? (
        <div className="card"><Empty icon={<ClipboardList className="w-6 h-6" />} title="Sin registros en este periodo" text="Cambia el rango de fechas o los filtros." /></div>
      ) : vista === 'mapa' ? (
        <div className="card p-4">
          <MapaPuntos height={520} puntos={data.slice(0, 400).map((r) => ({ lat: r.latitud, lng: r.longitud, color: r.tipo === 'ENTRADA' ? 'verde' : 'ambar', titulo: nombreCompleto(r.usuario), detalle: `${r.tipo === 'ENTRADA' ? 'Entrada' : 'Salida'} · ${fmtFecha(ymd(new Date(r.timestamp)), { day: 'numeric', month: 'short' })} ${fmtHora(r.timestamp)} · ${r.empresa?.nombre ?? ''}` }))} />
          <p className="text-xs text-neutral mt-3 flex gap-4"><span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-secondary" />Entrada</span><span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#E5532A]" />Salida</span>{data.length > 400 && <span>Mostrando los 400 más recientes</span>}</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px]">
              <thead><tr className="bg-surface-low"><th className="th">Foto</th><th className="th">Persona</th><th className="th">Rol</th><th className="th">Lugar</th><th className="th">Fecha</th><th className="th">Hora</th><th className="th">Tipo</th><th className="th">Empresa</th><th className="th">Origen</th>{esAdmin && <th className="th text-right"><span className="sr-only">Acciones</span></th>}</tr></thead>
              <tbody>
                {pg.slice.map((r) => (
                  <tr key={r.id} className="tr">
                    <td className="td"><FotoThumb data={{ registro: r, usuario: r.usuario, empresa: r.empresa }} /></td>
                    <td className="td"><Link to={`/persona/${r.usuarioId}`} className="font-medium hover:text-secondary">{nombreCompleto(r.usuario)}</Link><p className="text-xs text-neutral mono">{r.usuario.matricula ?? r.usuario.email}</p></td>
                    <td className="td"><RolChip rol={r.usuario.rol} /></td>
                    <td className="td text-neutral">{r.empresa?.nombre ?? '—'}</td>
                    <td className="td whitespace-nowrap">{fmtFecha(ymd(new Date(r.timestamp)), { weekday: 'short', day: 'numeric', month: 'short' })}</td>
                    <td className="td mono">{fmtHora(r.timestamp)}</td>
                    <td className="td"><TipoRegistroChip tipo={r.tipo} /></td>
                    <td className="td">{r.tipo === 'ENTRADA' ? <ValidacionChip v={validacionDe.get(r.id)} /> : <span className="text-neutral">—</span>}</td>
                    <td className="td text-neutral"><span className="flex items-center gap-1.5">{r.origen === 'APP' ? <Smartphone className="w-4 h-4" /> : <Globe className="w-4 h-4" />}{r.origen === 'APP' ? 'App' : 'Web'}{r.offline && <span title="Capturado sin conexión"><WifiOff className="w-3.5 h-3.5 text-tertiary" /></span>}</span></td>
                    {esAdmin && <td className="td text-right"><button className="icon-btn hover:text-error" title="Eliminar registro" aria-label={`Eliminar ${r.tipo === 'ENTRADA' ? 'entrada' : 'salida'} de ${nombreCompleto(r.usuario)} del ${fmtFecha(ymd(new Date(r.timestamp)), { day: 'numeric', month: 'short' })}`} onClick={() => setBorrar(r)}><Trash2 className="w-4 h-4" /></button></td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager {...pg} />
        </div>
      )}

      <ConfirmarEliminar abierto={!!borrar} titulo="¿Eliminar este registro?" onCerrar={() => setBorrar(null)}
        onConfirmar={async () => { await api.eliminarRegistro(borrar!.id); toast('Registro eliminado'); reload() }}>
        {borrar && <p>{borrar.tipo === 'ENTRADA' ? 'Entrada' : 'Salida'} de <b>{nombreCompleto(borrar.usuario)}</b> del {fmtFecha(ymd(new Date(borrar.timestamp)), { weekday: 'long', day: 'numeric', month: 'long' })} a las {fmtHora(borrar.timestamp)}. Se borra también su foto y las horas de ese día se recalculan.</p>}
      </ConfirmarEliminar>
    </>
  )
}

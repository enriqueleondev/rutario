import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Pencil, Eye, Users, Trash2, KeyRound } from 'lucide-react'
import { RestablecerPassword } from '../../components/RestablecerPassword'
import { api, type FiltroUsuarios } from '../../api'
import { useAsync, useCatalogos } from '../../hooks'
import { useAuth } from '../../auth/AuthContext'
import { Avatar, ConfirmarEliminar, Empty, PageHeader, Pager, RolChip, Spinner, TipoChip, Toggle, usePaged, useToast } from '../../components/ui'
import UsuarioDrawer from '../../components/UsuarioDrawer'
import type { Rol, Usuario } from '../../types'
import { ROL_LABEL } from '../../types'
import { nombreCompleto } from '../../utils'

export default function Usuarios() {
  const { usuario: yo } = useAuth()
  const toast = useToast()
  const { carreras, carrera, empresa } = useCatalogos()
  const [f, setF] = useState<FiltroUsuarios>({ rol: '', carreraId: '', grado: '', grupo: '', q: '' })
  const { data, loading, reload, setData } = useAsync(() => Promise.all([api.usuarios(f), api.vinculaciones()]), [f.rol, f.carreraId, f.grado, f.grupo, f.q])
  const [drawer, setDrawer] = useState<{ open: boolean; u?: Usuario | null }>({ open: false })
  const [borrar, setBorrar] = useState<Usuario | null>(null)
  const [clave, setClave] = useState<Usuario | null>(null)
  const puedeBorrar = (u: Usuario) => u.id !== yo?.id && u.rol !== 'ROOT' && (yo?.rol === 'ROOT' || (yo?.rol === 'DIRECTIVO' && u.rol !== 'DIRECTIVO'))
  const roles: Rol[] = yo?.rol === 'ROOT' ? ['DIRECTIVO', 'VINCULADOR', 'ORIENTADOR', 'DOCENTE', 'ALUMNO', 'EMPLEADOR', 'ROOT'] : ['VINCULADOR', 'ORIENTADOR', 'DOCENTE', 'ALUMNO', 'EMPLEADOR']
  const usuarios = useMemo(() => data?.[0] ?? [], [data])
  const vinc = (id: number) => data?.[1].find((v) => v.usuarioId === id)
  const pg = usePaged(usuarios, 10)
  const conteo = useMemo(() => roles.map((r) => ({ r, n: usuarios.filter((u) => u.rol === r).length })), [usuarios, roles])

  const toggle = async (u: Usuario, activo: boolean) => {
    await api.setActivo(u.id, activo)
    setData(data && [data[0].map((x) => (x.id === u.id ? { ...x, activo } : x)), data[1]])
    toast(activo ? 'Usuario activado' : 'Usuario desactivado: ya no podrá iniciar sesión')
  }
  const set = (k: keyof FiltroUsuarios, v: string) => setF((x) => ({ ...x, [k]: v, ...(k === 'carreraId' || k === 'grado' ? { grupo: '' } : {}) }))
  const gruposDisp = f.carreraId && f.grado ? carrera(Number(f.carreraId))?.gruposPorGrado[Number(f.grado) - 1] ?? 0 : 4

  return (
    <>
      <PageHeader title="Gestión de usuarios" subtitle="Alta, edición y desactivación de cuentas de todos los roles."
        actions={<button className="btn-soft" onClick={() => setDrawer({ open: true, u: null })}><Plus className="w-4 h-4" />Nuevo usuario</button>} />

      <div className="card p-4 mb-4 grid gap-3 md:grid-cols-[1fr_repeat(4,minmax(0,150px))]">
        <label className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-neutral" />
          <input className="input pl-9" placeholder="Buscar por nombre, correo o matrícula…" value={f.q} onChange={(e) => set('q', e.target.value)} />
        </label>
        <select className="input" value={f.rol} onChange={(e) => set('rol', e.target.value)} aria-label="Rol">
          <option value="">Todos los roles</option>{roles.map((r) => <option key={r} value={r}>{ROL_LABEL[r]}</option>)}
        </select>
        <select className="input" value={f.carreraId} onChange={(e) => set('carreraId', e.target.value)} aria-label="Carrera">
          <option value="">Todas las carreras</option>{carreras.map((c) => <option key={c.id} value={c.id}>{c.nombre.replace(/Técnico (en|como) /, '')}</option>)}
        </select>
        <select className="input" value={f.grado} onChange={(e) => set('grado', e.target.value)} aria-label="Grado">
          <option value="">Grado</option>{[1, 2, 3].map((g) => <option key={g} value={g}>{g}°</option>)}
        </select>
        <select className="input" value={f.grupo} onChange={(e) => set('grupo', e.target.value)} aria-label="Grupo">
          <option value="">Grupo</option>{Array.from({ length: gruposDisp }, (_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}
        </select>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {conteo.filter((c) => c.n).map((c) => (
          <button key={c.r} onClick={() => set('rol', f.rol === c.r ? '' : c.r)} className={`chip py-1 px-3 text-xs border ${f.rol === c.r ? 'border-secondary bg-primary-container/40 text-secondary' : 'border-line bg-white text-neutral'}`}>
            {ROL_LABEL[c.r]} <b className="text-on-surface">{c.n}</b>
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        {loading ? <Spinner /> : usuarios.length === 0 ? <Empty icon={<Users className="w-6 h-6" />} title="Sin resultados" text="Prueba con otros filtros." /> : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead><tr className="bg-surface-low"><th className="th">Nombre</th><th className="th">Usuario</th><th className="th">Rol</th><th className="th">Carrera</th><th className="th">Grado / Grupo</th><th className="th">Tipo de práctica</th><th className="th">Activo</th><th className="th text-right">Acciones</th></tr></thead>
                <tbody>
                  {pg.slice.map((u) => (
                    <tr key={u.id} className={`tr ${u.activo ? '' : 'opacity-60'}`}>
                      <td className="td"><div className="flex items-center gap-3"><Avatar u={u} /><span className="font-medium">{nombreCompleto(u)}</span></div></td>
                      <td className="td text-neutral">{u.rol === 'ALUMNO' ? <span className="mono">{u.matricula}</span> : u.email}</td>
                      <td className="td"><RolChip rol={u.rol} /></td>
                      <td className="td text-neutral">{carrera(u.carreraId)?.nombre.replace(/Técnico (en|como) /, '') ?? (u.rol === 'ORIENTADOR' ? `${u.gruposAsignados?.length ?? 0} grupos` : u.rol === 'EMPLEADOR' ? (empresa(u.empresaId)?.nombre ?? '—') : '—')}</td>
                      <td className="td">{u.grado ? `${u.grado}° · ${u.grupo}` : '—'}</td>
                      <td className="td">{u.rol === 'ALUMNO' || u.rol === 'DOCENTE' ? <TipoChip tipo={vinc(u.id)?.tipoPractica} /> : <span className="text-neutral">—</span>}</td>
                      <td className="td"><Toggle checked={u.activo} onChange={(v) => toggle(u, v)} label="Activo" /></td>
                      <td className="td text-right whitespace-nowrap">
                        {(u.rol === 'ALUMNO' || u.rol === 'DOCENTE') && <Link to={`/persona/${u.id}`} className="icon-btn" title="Ver registros" aria-label="Ver registros"><Eye className="w-4 h-4" /></Link>}
                        {(yo?.rol === 'ROOT' || u.rol !== 'DIRECTIVO') && <button className="icon-btn" title="Editar" aria-label="Editar" onClick={() => setDrawer({ open: true, u })}><Pencil className="w-4 h-4" /></button>}
                        {u.id !== yo?.id && (yo?.rol === 'ROOT' || (u.rol !== 'ROOT' && u.rol !== 'DIRECTIVO')) && <button className="icon-btn" title="Restablecer contraseña" aria-label={`Restablecer contraseña de ${nombreCompleto(u)}`} onClick={() => setClave(u)}><KeyRound className="w-4 h-4" /></button>}
                        {puedeBorrar(u) && <button className="icon-btn hover:text-error" title="Eliminar" aria-label={`Eliminar a ${nombreCompleto(u)}`} onClick={() => setBorrar(u)}><Trash2 className="w-4 h-4" /></button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pager {...pg} unidad="usuarios" />
          </>
        )}
      </div>

      <RestablecerPassword usuario={clave} onCerrar={() => setClave(null)} />

      <ConfirmarEliminar abierto={!!borrar} titulo={`¿Eliminar a ${borrar ? nombreCompleto(borrar) : ''}?`} onCerrar={() => setBorrar(null)}
        onConfirmar={async () => { await api.eliminarUsuario(borrar!.id); toast('Usuario eliminado'); reload() }}>
        <p>Se borrará su cuenta{borrar?.rol === 'ALUMNO' || borrar?.rol === 'DOCENTE' ? ', su vinculación y todos sus registros de asistencia con sus fotos' : ''}.</p>
        <p>Si solo quieres impedir que entre al sistema, mejor <b>desactívalo</b> con el interruptor «Activo».</p>
      </ConfirmarEliminar>

      <UsuarioDrawer open={drawer.open} usuario={drawer.u} roles={drawer.u ? [drawer.u.rol] : roles} onClose={() => setDrawer({ open: false })} onSaved={reload} />
    </>
  )
}

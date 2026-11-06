import { useMemo, useState } from 'react'
import { Plus, Search, Pencil, KeyRound, UserCog, Link2, AlertTriangle } from 'lucide-react'
import { api } from '../../api'
import { useAsync, useCatalogos } from '../../hooks'
import { Avatar, Empty, PageHeader, Pager, Spinner, Toggle, usePaged, useToast } from '../../components/ui'
import { RestablecerPassword } from '../../components/RestablecerPassword'
import UsuarioDrawer from '../../components/UsuarioDrawer'
import AsignarAlumnosDrawer from '../../components/AsignarAlumnosDrawer'
import type { Usuario } from '../../types'
import { nombreCompleto } from '../../utils'

/** Cuentas de las personas de las empresas que validan la asistencia. Root, Directivo y Vinculador. */
export default function Empleadores() {
  const toast = useToast()
  const { empresa } = useCatalogos()
  const { data, loading, reload, setData } = useAsync(() => Promise.all([api.usuarios({ rol: 'EMPLEADOR' }), api.vinculaciones(), api.usuarios({ rol: 'ALUMNO' })]), [])
  const [q, setQ] = useState('')
  const [drawer, setDrawer] = useState<{ open: boolean; u?: Usuario | null }>({ open: false })
  const [clave, setClave] = useState<Usuario | null>(null)
  const [asignar, setAsignar] = useState<Usuario | null>(null)

  const asignados = (id: number) => data?.[1].filter((v) => v.empleadorId === id).length ?? 0
  // Alumnos con empresa cuyo empleador aún no se asigna, pero su empresa ya tiene uno activo
  const pendientes = useMemo(() => {
    if (!data) return 0
    const conEmpleador = new Set(data[0].filter((e) => e.activo).map((e) => e.empresaId))
    return data[1].filter((v) => !v.empleadorId && conEmpleador.has(v.empresaId) && data[2].some((a) => a.id === v.usuarioId && a.activo)).length
  }, [data])
  const filas = useMemo(() => (data?.[0] ?? []).filter((u) =>
    !q || (nombreCompleto(u) + (u.email ?? '') + (empresa(u.empresaId)?.nombre ?? '')).toLowerCase().includes(q.toLowerCase())),
    [data, q, empresa])
  const pg = usePaged(filas, 10)

  const toggle = async (u: Usuario, activo: boolean) => {
    await api.setActivo(u.id, activo)
    setData(data && [data[0].map((x) => (x.id === u.id ? { ...x, activo } : x)), data[1], data[2]])
    toast(activo ? 'Empleador activado' : 'Empleador desactivado: ya no podrá iniciar sesión')
  }

  return (
    <>
      <PageHeader title="Empleadores" eyebrow="Módulo de vinculación"
        subtitle={<>Personas de las empresas que confirman si el alumno se presentó. Crea su cuenta y luego pulsa <b>Asignar alumnos</b> en su fila.</>}
        actions={<button className="btn-primary" onClick={() => setDrawer({ open: true, u: null })}><Plus className="w-4 h-4" />Nuevo empleador</button>} />

      {pendientes > 0 && (
        <div className="anim-rise flex items-center gap-3 rounded-xl bg-tertiary-container text-[#7A2509] px-4 py-3 mb-4 text-sm" role="status">
          <AlertTriangle className="w-5 h-5 shrink-0" aria-hidden="true" />
          <span><b>{pendientes} {pendientes === 1 ? 'alumno' : 'alumnos'}</b> ya {pendientes === 1 ? 'tiene' : 'tienen'} empresa con empleador disponible, pero nadie valida su asistencia todavía.</span>
        </div>
      )}

      <div className="card p-4 mb-4">
        <label className="relative block">
          <Search className="w-4 h-4 absolute left-3 top-3 text-neutral" />
          <input className="input pl-9" placeholder="Buscar por nombre, correo o empresa…" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
      </div>

      <div className="card overflow-hidden">
        {loading ? <Spinner /> : filas.length === 0 ? (
          <Empty icon={<UserCog className="w-6 h-6" />} title="Aún no hay empleadores" text="Crea la cuenta de la persona de la empresa que validará la asistencia de tus alumnos." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead><tr className="bg-surface-low"><th className="th">Empleador</th><th className="th">Correo</th><th className="th">Empresa</th><th className="th text-right">Alumnos asignados</th><th className="th">Activo</th><th className="th text-right">Acciones</th></tr></thead>
                <tbody>
                  {pg.slice.map((u) => (
                    <tr key={u.id} className={`tr ${u.activo ? '' : 'opacity-60'}`}>
                      <td className="td"><div className="flex items-center gap-3"><Avatar u={u} /><span className="font-medium">{nombreCompleto(u)}</span></div></td>
                      <td className="td text-neutral">{u.email}</td>
                      <td className="td">{empresa(u.empresaId)?.nombre ?? <span className="text-neutral">—</span>}</td>
                      <td className="td text-right">{asignados(u.id) === 0 ? <span className="chip bg-tertiary-container text-tertiary">Sin alumnos</span> : <b className="tabular-nums">{asignados(u.id)}</b>}</td>
                      <td className="td"><Toggle checked={u.activo} onChange={(v) => toggle(u, v)} label={`Activo: ${nombreCompleto(u)}`} /></td>
                      <td className="td text-right whitespace-nowrap">
                        {u.activo && <button className="btn-primary h-8 px-3 text-xs mr-1" onClick={() => setAsignar(u)}><Link2 className="w-3.5 h-3.5" />Asignar alumnos</button>}
                        <button className="icon-btn" title="Editar" aria-label={`Editar a ${nombreCompleto(u)}`} onClick={() => setDrawer({ open: true, u })}><Pencil className="w-4 h-4" /></button>
                        <button className="icon-btn" title="Restablecer contraseña" aria-label={`Restablecer contraseña de ${nombreCompleto(u)}`} onClick={() => setClave(u)}><KeyRound className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pager {...pg} unidad="empleadores" />
          </>
        )}
      </div>

      <AsignarAlumnosDrawer empleador={asignar} empresaNombre={empresa(asignar?.empresaId)?.nombre} alumnos={data?.[2] ?? []} vinculaciones={data?.[1] ?? []} empleadores={data?.[0] ?? []}
        onClose={() => setAsignar(null)} onSaved={reload} />
      <RestablecerPassword usuario={clave} onCerrar={() => setClave(null)} />
      <UsuarioDrawer open={drawer.open} usuario={drawer.u} roles={['EMPLEADOR']} onClose={() => setDrawer({ open: false })} onSaved={reload} />
    </>
  )
}

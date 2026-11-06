import { useEffect, useState } from 'react'
import { UserPlus, User, KeyRound, GraduationCap, Plus, X, Info, Building2 } from 'lucide-react'
import { api } from '../api'
import { useCatalogos } from '../hooks'
import type { GrupoRef, Rol, Usuario } from '../types'
import { ROL_LABEL } from '../types'
import { Drawer, ErrorBox, Field, SectionTitle, useToast } from './ui'

interface Props {
  open: boolean
  onClose: () => void
  onSaved: (u: Usuario) => void
  usuario?: Usuario | null
  roles: Rol[]
}

const vacio = (rol: Rol): Partial<Usuario> => ({ rol, nombre: '', apellidoPaterno: '', apellidoMaterno: '', email: '', matricula: '', gruposAsignados: [] })

export default function UsuarioDrawer({ open, onClose, onSaved, usuario, roles }: Props) {
  const toast = useToast()
  const { carreras, carrera, empresas } = useCatalogos()
  const [f, setF] = useState<Partial<Usuario>>(vacio(roles[0]))
  const [pass, setPass] = useState('')
  const [error, setError] = useState<string>()
  const [guardando, setGuardando] = useState(false)
  const [nuevoGrupo, setNuevoGrupo] = useState<Partial<GrupoRef>>({})

  const rolInicial = roles[0]
  useEffect(() => {
    if (open) { setF(usuario ? { ...usuario } : vacio(rolInicial)); setPass(''); setError(undefined); setNuevoGrupo({}) }
  }, [open, usuario, rolInicial])

  const set = <K extends keyof Usuario>(k: K, v: Usuario[K]) => setF((x) => ({ ...x, [k]: v }))
  const esAlumno = f.rol === 'ALUMNO'
  const esEmpleador = f.rol === 'EMPLEADOR'
  const grupos = (cid?: number, grado?: number) => {
    const c = carrera(cid)
    return c && grado ? Array.from({ length: c.gruposPorGrado[grado - 1] ?? 0 }, (_, i) => i + 1) : []
  }

  const guardar = async () => {
    setError(undefined)
    if (!f.nombre?.trim() || !f.apellidoPaterno?.trim()) return setError('Nombre y apellido paterno son obligatorios')
    if (esAlumno && !/^\d{8}$/.test(f.matricula ?? '')) return setError('La matrícula debe tener 8 dígitos')
    if (!esAlumno && !/^\S+@\S+\.\S+$/.test(f.email ?? '')) return setError('Escribe un correo válido')
    if (esAlumno && (!f.carreraId || !f.grado || !f.grupo)) return setError('Selecciona carrera, grado y grupo')
    if (esEmpleador && !f.empresaId) return setError('Selecciona la empresa a la que pertenece el empleador')
    if (!usuario && pass.length < 8) return setError('La contraseña inicial debe tener al menos 8 caracteres')
    const datos: Partial<Usuario> = { ...f, email: esAlumno ? f.email || undefined : f.email, matricula: esAlumno ? f.matricula : undefined }
    if (!esAlumno) { datos.grado = undefined; datos.grupo = undefined }
    if (f.rol !== 'ORIENTADOR') datos.gruposAsignados = undefined
    if (!esEmpleador) datos.empresaId = undefined
    setGuardando(true)
    try {
      const u = await api.guardarUsuario(datos, pass || undefined)
      toast(usuario ? 'Usuario actualizado' : `${ROL_LABEL[u.rol]} registrado correctamente`)
      onSaved(u)
      onClose()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setGuardando(false)
    }
  }

  const agregarGrupo = () => {
    const g = nuevoGrupo as GrupoRef
    if (!g.carreraId || !g.grado || !g.grupo) return
    const ya = f.gruposAsignados?.some((x) => x.carreraId === g.carreraId && x.grado === g.grado && x.grupo === g.grupo)
    if (!ya) set('gruposAsignados', [...(f.gruposAsignados ?? []), g])
    setNuevoGrupo({ carreraId: g.carreraId, grado: g.grado })
  }

  return (
    <Drawer open={open} onClose={onClose} icon={<UserPlus className="w-5 h-5" />}
      title={usuario ? 'Editar usuario' : `Registrar ${roles.length === 1 ? ROL_LABEL[roles[0]].toLowerCase() : 'usuario'}`}
      subtitle={usuario ? undefined : 'Ingresa la información y las credenciales de acceso.'}
      footer={<>
        <span className="mr-auto text-xs text-neutral"><span className="text-error">*</span> Campos obligatorios</span>
        <button className="btn-outline" onClick={onClose}>Cancelar</button>
        <button className="btn-primary" onClick={guardar} disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar'}</button>
      </>}>
      <div className="space-y-8">
        {roles.length > 1 && !usuario && (
          <Field label="Tipo de usuario" required>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {roles.map((r) => (
                <button key={r} type="button" onClick={() => set('rol', r)}
                  className={`h-10 rounded-lg border text-sm font-medium transition ${f.rol === r ? 'border-secondary bg-primary-container/40 text-secondary' : 'border-line hover:border-primary-container'}`}>
                  {ROL_LABEL[r]}
                </button>
              ))}
            </div>
          </Field>
        )}

        <div>
          <SectionTitle n={1} icon={<User className="w-4 h-4" />}>Datos personales</SectionTitle>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Nombre(s)" required className="sm:col-span-2"><input className="input" value={f.nombre ?? ''} onChange={(e) => set('nombre', e.target.value)} placeholder="Ej. Carlos Eduardo" /></Field>
            <Field label="Apellido paterno" required><input className="input" value={f.apellidoPaterno ?? ''} onChange={(e) => set('apellidoPaterno', e.target.value)} placeholder="Ej. Ramírez" /></Field>
            <Field label="Apellido materno"><input className="input" value={f.apellidoMaterno ?? ''} onChange={(e) => set('apellidoMaterno', e.target.value)} placeholder="Ej. Mendoza" /></Field>
            <Field label="Teléfono" className="sm:col-span-2"><input className="input" value={f.telefono ?? ''} onChange={(e) => set('telefono', e.target.value)} placeholder="722 000 0000" inputMode="tel" /></Field>
          </div>
        </div>

        <div>
          <SectionTitle n={2} icon={<KeyRound className="w-4 h-4" />}>Acceso</SectionTitle>
          <div className="grid sm:grid-cols-2 gap-4">
            {esAlumno ? (
              <Field label="Matrícula" required hint="8 dígitos. Es su usuario para iniciar sesión."><input className="input mono" value={f.matricula ?? ''} maxLength={8} inputMode="numeric"
                onChange={(e) => set('matricula', e.target.value.replace(/\D/g, ''))} placeholder="20000001" /></Field>
            ) : (
              <Field label="Correo institucional" required hint="Es su usuario para iniciar sesión."><input className="input" type="email" value={f.email ?? ''} onChange={(e) => set('email', e.target.value)} placeholder={esEmpleador ? 'nombre@empresa.com' : 'nombre@example.org'} /></Field>
            )}
            <Field label={usuario ? 'Nueva contraseña' : 'Contraseña inicial'} required={!usuario} hint={usuario ? 'Déjala vacía para no cambiarla. Si la cambias, el usuario deberá crear la suya al entrar.' : 'Mínimo 8 caracteres. El usuario deberá cambiarla en su primer acceso.'}>
              <input className="input" type="text" value={pass} onChange={(e) => setPass(e.target.value)} autoComplete="new-password" />
            </Field>
            {esAlumno && <Field label="Correo (opcional)" className="sm:col-span-2" hint="Más adelante los alumnos también podrán entrar con correo."><input className="input" type="email" value={f.email ?? ''} onChange={(e) => set('email', e.target.value)} /></Field>}
          </div>
        </div>

        {esEmpleador && (
          <div>
            <SectionTitle n={3} icon={<Building2 className="w-4 h-4" />}>Empresa</SectionTitle>
            <Field label="Empresa a la que pertenece" required hint={empresas.length ? undefined : 'Primero da de alta la empresa en el módulo «Empresas».'}>
              <select className="input" value={f.empresaId ?? ''} onChange={(e) => set('empresaId', Number(e.target.value) || undefined)}>
                <option value="">Selecciona una empresa</option>
                {empresas.filter((e) => e.activa || e.id === f.empresaId).map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
              </select>
            </Field>
            <p className="flex gap-2 text-xs text-neutral bg-surface-low rounded-lg p-3 mt-4"><Info className="w-4 h-4 shrink-0 text-secondary" />El empleador solo ve a los alumnos que le asignes desde su vinculación y únicamente confirma si se presentaron, una vez que registran su entrada. No se le pide foto ni ubicación.</p>
          </div>
        )}

        {(esAlumno || f.rol === 'DOCENTE' || f.rol === 'ORIENTADOR') && (
          <div>
            <SectionTitle n={3} icon={<GraduationCap className="w-4 h-4" />}>{f.rol === 'ORIENTADOR' ? 'Grupos que consulta' : 'Datos académicos'}</SectionTitle>
            {f.rol === 'ORIENTADOR' ? (
              <div className="space-y-3">
                <div className="grid grid-cols-[1fr_80px_80px_auto] gap-2 items-end">
                  <Field label="Carrera"><select className="input" value={nuevoGrupo.carreraId ?? ''} onChange={(e) => setNuevoGrupo({ carreraId: Number(e.target.value) || undefined })}>
                    <option value="">Selecciona</option>{carreras.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select></Field>
                  <Field label="Grado"><select className="input" value={nuevoGrupo.grado ?? ''} onChange={(e) => setNuevoGrupo({ ...nuevoGrupo, grado: Number(e.target.value) || undefined, grupo: undefined })}>
                    <option value="">—</option>{[1, 2, 3].map((g) => <option key={g} value={g}>{g}°</option>)}</select></Field>
                  <Field label="Grupo"><select className="input" value={nuevoGrupo.grupo ?? ''} onChange={(e) => setNuevoGrupo({ ...nuevoGrupo, grupo: Number(e.target.value) || undefined })}>
                    <option value="">—</option>{grupos(nuevoGrupo.carreraId, nuevoGrupo.grado).map((g) => <option key={g} value={g}>{g}</option>)}</select></Field>
                  <button type="button" className="btn-soft px-3" onClick={agregarGrupo} aria-label="Agregar grupo"><Plus className="w-4 h-4" /></button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(f.gruposAsignados ?? []).length === 0 && <p className="text-sm text-neutral">Aún no tiene grupos asignados.</p>}
                  {f.gruposAsignados?.map((g, i) => (
                    <span key={i} className="chip bg-surface-container text-on-surface py-1 pl-3 pr-1.5 text-sm font-medium">
                      {carrera(g.carreraId)?.clave} · {g.grado}° {g.grupo}
                      <button type="button" className="rounded-full hover:bg-white p-0.5" aria-label="Quitar" onClick={() => set('gruposAsignados', f.gruposAsignados!.filter((_, j) => j !== i))}><X className="w-3.5 h-3.5" /></button>
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="grid sm:grid-cols-3 gap-4">
                <Field label="Carrera técnica" required={esAlumno} className="sm:col-span-3"><select className="input" value={f.carreraId ?? ''} onChange={(e) => setF({ ...f, carreraId: Number(e.target.value) || undefined, grupo: undefined })}>
                  <option value="">Selecciona carrera</option>{carreras.filter((c) => c.activa).map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select></Field>
                {esAlumno && <>
                  <Field label="Grado" required><select className="input" value={f.grado ?? ''} onChange={(e) => setF({ ...f, grado: Number(e.target.value) || undefined, grupo: undefined })}>
                    <option value="">Selecciona</option>{[1, 2, 3].map((g) => <option key={g} value={g}>{g}°</option>)}</select></Field>
                  <Field label="Grupo" required><select className="input" value={f.grupo ?? ''} onChange={(e) => set('grupo', Number(e.target.value) || undefined)}>
                    <option value="">Selecciona</option>{grupos(f.carreraId, f.grado).map((g) => <option key={g} value={g}>{g}</option>)}</select></Field>
                </>}
              </div>
            )}
            {(esAlumno || f.rol === 'DOCENTE') && (
              <p className="flex gap-2 text-xs text-neutral bg-surface-low rounded-lg p-3 mt-4"><Info className="w-4 h-4 shrink-0 text-secondary" />La empresa, el tipo de práctica y el horario los asigna el vinculador desde «Mis alumnos» / «Mis docentes».</p>
            )}
          </div>
        )}
        <ErrorBox msg={error} />
      </div>
    </Drawer>
  )
}

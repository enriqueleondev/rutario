import { useEffect, useState } from 'react'
import { Link2, Building2, ClipboardList, CalendarDays, MapPin, UserCheck } from 'lucide-react'
import { api } from '../api'
import type { DiaSemana, Empresa, HorarioDia, TipoPractica, Usuario, Vinculacion } from '../types'
import { DIAS, TIPO_LABEL } from '../types'
import { cls, nombreCompleto } from '../utils'
import { Drawer, ErrorBox, Field, SectionTitle, useToast } from './ui'
import { MapaPuntos } from './Mapa'

interface Props {
  usuario: Usuario | null
  vinculacion?: Vinculacion
  empresas: Empresa[]
  onClose: () => void
  onSaved: () => void
}

const TIPO_DESC: Record<TipoPractica, string> = {
  SERVICIO_SOCIAL: 'Apoyo comunitario o institucional',
  ESTADIAS: 'Inmersión en empresa de su carrera',
  EJECUCION: 'Prácticas supervisadas en entorno real',
}

export default function VincularDrawer({ usuario, vinculacion, empresas, onClose, onSaved }: Props) {
  const toast = useToast()
  const [f, setF] = useState<Partial<Vinculacion>>({})
  const [error, setError] = useState<string>()
  const [guardando, setGuardando] = useState(false)
  const [empleadores, setEmpleadores] = useState<Usuario[]>([])

  useEffect(() => {
    if (usuario) {
      setError(undefined)
      // Vinculaciones antiguas pueden traer sábado: el horario de práctica es de lunes a viernes
      setF(vinculacion ? { ...vinculacion, horario: vinculacion.horario.filter((h) => DIAS.some((d) => d.key === h.dia)) } : {
        usuarioId: usuario.id, tipoPractica: usuario.rol === 'DOCENTE' ? 'ESTADIAS' : 'SERVICIO_SOCIAL', actividades: '',
        horario: ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES'].map((d) => ({ dia: d as DiaSemana, inicio: '08:00', fin: '13:00' })),
      })
    }
  }, [usuario, vinculacion])

  // Empleadores (personas de la empresa que validan la asistencia): solo se asignan a alumnos
  useEffect(() => {
    if (usuario?.rol === 'ALUMNO') api.usuarios({ rol: 'EMPLEADOR' }).then(setEmpleadores).catch(() => setEmpleadores([]))
  }, [usuario])
  const candidatos = empleadores.filter((e) => e.empresaId === f.empresaId && (e.activo || e.id === f.empleadorId))

  const empresa = empresas.find((e) => e.id === f.empresaId)
  const horario = f.horario ?? []
  const diaDe = (d: DiaSemana) => horario.find((h) => h.dia === d)
  const setDia = (d: DiaSemana, h?: HorarioDia) => setF({ ...f, horario: h ? [...horario.filter((x) => x.dia !== d), h].sort((a, b) => DIAS.findIndex((x) => x.key === a.dia) - DIAS.findIndex((x) => x.key === b.dia)) : horario.filter((x) => x.dia !== d) })

  const guardar = async () => {
    setError(undefined)
    if (!f.empresaId) return setError('Selecciona la empresa')
    if (!f.tipoPractica) return setError('Selecciona el tipo de práctica')
    if (!f.actividades?.trim()) return setError('Describe las actividades')
    if (horario.some((h) => h.inicio >= h.fin)) return setError('En el horario, la hora de salida debe ser mayor que la de entrada')
    setGuardando(true)
    try {
      await api.guardarVinculacion({ ...f, usuarioId: usuario!.id })
      toast(`${nombreCompleto(usuario!)} vinculado a ${empresa?.nombre}`)
      onSaved(); onClose()
    } catch (e) { setError((e as Error).message) } finally { setGuardando(false) }
  }

  return (
    <Drawer open={!!usuario} onClose={onClose} icon={<Link2 className="w-5 h-5" />}
      title={vinculacion ? 'Editar vinculación' : 'Vincular a empresa'} subtitle={usuario ? `${nombreCompleto(usuario)} · ${usuario.rol === 'ALUMNO' ? `Matrícula ${usuario.matricula}` : 'Docente'}` : ''}
      footer={<><button className="btn-outline" onClick={onClose}>Cancelar</button><button className="btn-primary" onClick={guardar} disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar vinculación'}</button></>}>
      <div className="space-y-8">
        <div>
          <SectionTitle n={1} icon={<Building2 className="w-4 h-4" />}>Empresa y tipo de práctica</SectionTitle>
          <div className="space-y-4">
            <Field label="Empresa receptora" required hint={empresas.length ? undefined : 'Primero da de alta una empresa en el módulo «Empresas».'}>
              <select className="input" value={f.empresaId ?? ''} onChange={(e) => setF({ ...f, empresaId: Number(e.target.value) || undefined, empleadorId: undefined })}>
                <option value="">Selecciona una empresa</option>
                {empresas.filter((e) => e.activa).map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
              </select>
            </Field>
            {empresa && (
              <div className="rounded-xl border border-line p-3 space-y-2">
                <p className="text-sm flex items-start gap-1.5 text-neutral"><MapPin className="w-4 h-4 mt-0.5 shrink-0 text-secondary" />{empresa.direccion}</p>
                <MapaPuntos height={150} puntos={[{ lat: empresa.latitud, lng: empresa.longitud, titulo: empresa.nombre }]} />
              </div>
            )}
            {usuario?.rol === 'ALUMNO' && empresa && (
              <Field label="Empleador (valida su asistencia)" hint={candidatos.length
                ? 'Verá al alumno en su panel y confirmará si se presentó, una vez que registre su entrada. Opcional.'
                : 'Esta empresa aún no tiene empleadores. Créalo en el módulo «Empleadores» y vuelve a editar la vinculación.'}>
                <div className="relative">
                  <UserCheck className="w-4 h-4 absolute left-3 top-3 text-neutral pointer-events-none" />
                  <select className="input pl-9" value={f.empleadorId ?? ''} onChange={(e) => setF({ ...f, empleadorId: Number(e.target.value) || undefined })}>
                    <option value="">Sin empleador asignado</option>
                    {candidatos.map((e) => <option key={e.id} value={e.id}>{nombreCompleto(e)}{e.activo ? '' : ' (desactivado)'}</option>)}
                  </select>
                </div>
              </Field>
            )}
            <div>
              <span className="label">Tipo de práctica <span className="text-error">*</span></span>
              <div className="grid sm:grid-cols-3 gap-2">
                {(Object.keys(TIPO_LABEL) as TipoPractica[]).map((t) => (
                  <button key={t} type="button" onClick={() => setF({ ...f, tipoPractica: t })}
                    className={cls('text-left rounded-xl border p-3 transition', f.tipoPractica === t ? 'border-secondary bg-primary-container/30 ring-1 ring-secondary' : 'border-line hover:border-primary-container')}>
                    <p className="text-sm font-semibold">{TIPO_LABEL[t]}</p>
                    <p className="text-xs text-neutral mt-0.5">{TIPO_DESC[t]}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div>
          <SectionTitle n={2} icon={<ClipboardList className="w-4 h-4" />}>Actividades y periodo</SectionTitle>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Descripción de actividades" required className="sm:col-span-2">
              <textarea className="input" rows={3} value={f.actividades ?? ''} onChange={(e) => setF({ ...f, actividades: e.target.value })} placeholder="Ej. Soporte técnico a equipos de cómputo y mantenimiento de red" />
            </Field>
            <Field label="Fecha de inicio"><input className="input" type="date" value={f.fechaInicio ?? ''} onChange={(e) => setF({ ...f, fechaInicio: e.target.value })} /></Field>
            <Field label="Fecha de término"><input className="input" type="date" value={f.fechaFin ?? ''} min={f.fechaInicio} onChange={(e) => setF({ ...f, fechaFin: e.target.value })} /></Field>
          </div>
        </div>

        <div>
          <SectionTitle n={3} icon={<CalendarDays className="w-4 h-4" />}>Horario</SectionTitle>
          <div className="space-y-2">
            {DIAS.map((d) => {
              const h = diaDe(d.key)
              return (
                <div key={d.key} className={cls('flex items-center gap-3 rounded-xl border px-3 py-2', h ? 'border-primary-container bg-primary-container/10' : 'border-line')}>
                  <label className="flex items-center gap-2 w-24 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 accent-[#0B7468]" checked={!!h} onChange={(e) => setDia(d.key, e.target.checked ? { dia: d.key, inicio: '08:00', fin: '13:00' } : undefined)} />
                    <span className="text-sm font-medium">{d.corto}</span>
                  </label>
                  {h ? (
                    <div className="flex items-center gap-2 text-sm">
                      <input type="time" className="input h-9 w-32" value={h.inicio} onChange={(e) => setDia(d.key, { ...h, inicio: e.target.value })} aria-label={`Entrada ${d.corto}`} />
                      <span className="text-neutral">a</span>
                      <input type="time" className="input h-9 w-32" value={h.fin} onChange={(e) => setDia(d.key, { ...h, fin: e.target.value })} aria-label={`Salida ${d.corto}`} />
                    </div>
                  ) : <span className="text-sm text-neutral">No asiste</span>}
                </div>
              )
            })}
          </div>
          <p className="text-xs text-neutral mt-2">El horario es informativo: las horas se calculan con la entrada y salida reales.</p>
        </div>
        <ErrorBox msg={error} />
      </div>
    </Drawer>
  )
}

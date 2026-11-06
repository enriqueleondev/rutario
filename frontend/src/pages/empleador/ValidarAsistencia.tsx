import { useState, type CSSProperties } from 'react'
import { CheckCircle2, XCircle, Clock, UserX, RefreshCw, ClipboardCheck, Building2, Lock, ChevronDown } from 'lucide-react'
import { api } from '../../api'
import { useAsync } from '../../hooks'
import { useAuth } from '../../auth/AuthContext'
import { CountUp, Empty, ErrorBox, PageHeader, Spinner, TipoChip, useToast } from '../../components/ui'
import type { Asignado } from '../../types'
import { cls, fmtFecha, fmtHora, hoy } from '../../utils'

const CHIP: Record<Asignado['estado'], { label: string; clase: string }> = {
  SIN_ENTRADA: { label: 'Sin entrada', clase: 'bg-surface-low text-neutral' },
  PENDIENTE: { label: 'Por validar', clase: 'bg-surface-low text-on-surface-variant' },
  PRESENTE: { label: 'Se presentó', clase: 'bg-primary-container text-secondary' },
  AUSENTE: { label: 'No se presentó', clase: 'bg-tertiary-container text-tertiary' },
}
const AVATAR: Record<Asignado['estado'], string> = {
  SIN_ENTRADA: 'bg-surface-low text-neutral',
  PENDIENTE: 'bg-primary-container text-secondary',
  PRESENTE: 'bg-secondary text-white',
  AUSENTE: 'bg-tertiary-container text-tertiary',
}
const BORDE: Record<Asignado['estado'], string> = {
  SIN_ENTRADA: 'border-line', PENDIENTE: 'border-line', PRESENTE: 'border-[#9FD9D0]', AUSENTE: 'border-[#FFB59C]',
}

/** Portal de la empresa: confirmar si cada alumno asignado se presentó. Sin foto ni ubicación. */
export default function ValidarAsistencia() {
  const { usuario } = useAuth()
  const { data = [], loading, error, reload } = useAsync(() => api.empleadorHoy(), [])
  const [abierto, setAbierto] = useState<number | null | undefined>(undefined) // undefined: abre el primer pendiente

  const conEntrada = data.filter((a) => a.estado !== 'SIN_ENTRADA')
  const hechos = conEntrada.filter((a) => a.estado === 'PRESENTE' || a.estado === 'AUSENTE').length
  const pendientes = conEntrada.length - hechos
  const sinEntrada = data.length - conEntrada.length
  const frac = conEntrada.length ? hechos / conEntrada.length : 0
  const anillo = Math.round(176 * (1 - frac))
  const primerPendiente = data.find((a) => a.estado === 'PENDIENTE')?.usuarioId ?? null
  const actual = abierto === undefined ? primerPendiente : abierto

  /** Tras validar, abre automáticamente al siguiente alumno por validar. */
  const despuesDeValidar = (id: number) => {
    setAbierto(data.find((a) => a.estado === 'PENDIENTE' && a.usuarioId !== id)?.usuarioId ?? null)
    reload()
  }

  return (
    <>
      <PageHeader title="Validar asistencia" eyebrow={usuario?.nombre ? `Hola, ${usuario.nombre}` : 'Portal de la empresa'}
        subtitle={`${fmtFecha(hoy(), { weekday: 'long', day: 'numeric', month: 'long' })}. Confirma si cada alumno se presentó a sus actividades. Solo puedes validar a quien ya registró su entrada.`}
        actions={<button className="btn-outline" onClick={reload}><RefreshCw className="w-4 h-4" />Actualizar</button>} />

      {error && <div className="mb-4"><ErrorBox msg={error} /></div>}
      {loading ? <div className="card"><Spinner /></div> : data.length === 0 ? (
        <div className="card"><Empty icon={<ClipboardCheck className="w-6 h-6" />} title="No tienes alumnos asignados hoy"
          text="Cuando el vinculador te asigne alumnos con práctica vigente, aparecerán aquí." /></div>
      ) : (
        <>
          <section className="on-dark anim-rise rounded-2xl bg-ink text-white px-5 sm:px-7 py-5 mb-5 flex flex-wrap items-center gap-x-6 gap-y-4" aria-live="polite">
            <svg width="84" height="84" viewBox="0 0 72 72" className="shrink-0" role="img" aria-label={`${hechos} de ${conEntrada.length} alumnos validados`}>
              <circle cx="36" cy="36" r="28" fill="none" stroke="rgba(255,255,255,.14)" strokeWidth="8" />
              <circle cx="36" cy="36" r="28" fill="none" stroke="#2EE6C5" strokeWidth="8" strokeLinecap="round" strokeDasharray="176" strokeDashoffset={anillo}
                transform="rotate(-90 36 36)" style={{ transition: 'stroke-dashoffset .7s cubic-bezier(.2,.7,.2,1)' }} />
            </svg>
            <div className="flex-1 basis-56 min-w-0">
              <p className="font-display text-2xl sm:text-[26px] font-extrabold leading-tight"><CountUp n={hechos} ms={800} /> de {conEntrada.length} validados</p>
              <p className="text-sm text-[#C7D2E5] mt-1">
                {pendientes > 0 ? `Te ${pendientes === 1 ? 'falta 1 alumno' : `faltan ${pendientes} alumnos`} por confirmar. Puedes corregir tu respuesta durante el día.` : 'No tienes validaciones pendientes por ahora.'}
              </p>
            </div>
            <div className="flex gap-3">
              <div className="rounded-xl bg-white/10 px-4 py-2"><p className="text-xs text-[#A9B8D0]">Pendientes</p><p className="font-display text-xl font-extrabold tabular-nums">{pendientes}</p></div>
              <div className="rounded-xl bg-white/10 px-4 py-2"><p className="text-xs text-[#A9B8D0]">Sin entrada</p><p className="font-display text-xl font-extrabold tabular-nums">{sinEntrada}</p></div>
            </div>
          </section>

          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3 items-start">
            {data.map((a, i) => (
              <TarjetaAlumno key={a.usuarioId} a={a} indice={i} abierto={actual === a.usuarioId}
                onAlternar={() => setAbierto(actual === a.usuarioId ? null : a.usuarioId)} onSaved={() => despuesDeValidar(a.usuarioId)} />
            ))}
          </div>

          <p className="flex items-center gap-2 text-xs text-neutral mt-6"><Lock className="w-4 h-4 shrink-0" aria-hidden="true" />Rutario no te pide ubicación ni fotos. Solo confirmas si el alumno se presentó.</p>
        </>
      )}
    </>
  )
}

function TarjetaAlumno({ a, indice, abierto, onAlternar, onSaved }: { a: Asignado; indice: number; abierto: boolean; onAlternar: () => void; onSaved: () => void }) {
  const toast = useToast()
  const [coment, setComent] = useState(a.comentario ?? '')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string>()
  const bloqueado = a.estado === 'SIN_ENTRADA' || a.registroId === undefined
  const ini = a.nombre.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
  const sub = bloqueado ? 'Aún no registra su entrada' : `Entró a las ${fmtHora(a.entrada!)}${a.salida ? ` · salió a las ${fmtHora(a.salida)}` : ''}`

  const enviar = async (presente: boolean) => {
    setError(undefined)
    setGuardando(true)
    try {
      await api.validarAsistencia(a.registroId!, presente, coment.trim() || undefined)
      toast(presente ? `${a.nombre}: se presentó` : `${a.nombre}: no se presentó`)
      onSaved()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <article className={cls('card overflow-hidden lift anim-rise', BORDE[a.estado])} style={{ '--d': `${100 + indice * 70}ms` } as CSSProperties}>
      <button type="button" onClick={onAlternar} disabled={bloqueado} aria-expanded={abierto}
        className="w-full min-h-[72px] px-4 py-3 flex items-center gap-3 text-left disabled:cursor-not-allowed">
        <span className={cls('w-11 h-11 rounded-full flex items-center justify-center font-display font-bold text-sm shrink-0', AVATAR[a.estado])} aria-hidden="true">{ini}</span>
        <span className="flex-1 min-w-0">
          <span className="block font-semibold leading-snug">{a.nombre}</span>
          <span className="block text-xs text-neutral">{sub}</span>
        </span>
        <span key={a.estado} className={cls('chip shrink-0 anim-pop', CHIP[a.estado].clase)}>
          {a.estado === 'PRESENTE' && <CheckCircle2 className="w-3.5 h-3.5" />}{a.estado === 'AUSENTE' && <XCircle className="w-3.5 h-3.5" />}
          {a.estado === 'SIN_ENTRADA' && <UserX className="w-3.5 h-3.5" />}{CHIP[a.estado].label}
        </span>
        {!bloqueado && <ChevronDown className={cls('w-4 h-4 text-neutral shrink-0 transition-transform', abierto && 'rotate-180')} aria-hidden="true" />}
      </button>

      {abierto && !bloqueado && (
        <div className="anim-expand px-4 pb-4 space-y-3">
          <div className="text-sm space-y-1.5 text-on-surface-variant">
            <p className="flex items-center gap-2"><TipoChip tipo={a.tipoPractica} /></p>
            <p className="flex items-start gap-2"><Building2 className="w-4 h-4 mt-0.5 shrink-0 text-neutral" />{a.actividades}</p>
            <p className="flex items-center gap-2"><Clock className="w-4 h-4 shrink-0 text-neutral" />{a.horarioInicio ? `Horario de hoy: ${a.horarioInicio}–${a.horarioFin}` : 'Sin horario programado hoy'}</p>
          </div>
          <label className="block">
            <span className="label">Comentario (opcional)</span>
            <textarea className="input" rows={2} maxLength={500} value={coment} onChange={(e) => setComent(e.target.value)} placeholder="Ej. Llegó 20 minutos tarde / Se retiró temprano con permiso" />
          </label>
          <ErrorBox msg={error} />
          <div className="flex flex-wrap gap-3">
            <button className="btn-primary h-12 text-base flex-1 basis-40" disabled={guardando} onClick={() => enviar(true)}><CheckCircle2 className="w-5 h-5 shrink-0" />Se presentó</button>
            <button className="btn-outline h-12 text-base flex-1 basis-40 !border-[#B83A14] !text-tertiary hover:!bg-tertiary-container/50" disabled={guardando} onClick={() => enviar(false)}><XCircle className="w-5 h-5 shrink-0" />No se presentó</button>
          </div>
          {(a.estado === 'PRESENTE' || a.estado === 'AUSENTE') && a.validadoEn && <p className="text-xs text-neutral">Validado a las <b className="tabular-nums">{fmtHora(a.validadoEn)}</b>. Puedes corregirlo hoy.</p>}
        </div>
      )}
    </article>
  )
}

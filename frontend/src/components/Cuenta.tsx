import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, KeyRound, Loader2, LogOut, ShieldCheck } from 'lucide-react'
import { api } from '../api'
import { useAuth } from '../auth/AuthContext'
import { AvisoIntegral, AvisoSimplificado } from '../pages/legal/Legal'
import { CreditoDesarrollador, PieInstitucional } from './Pies'
import { ErrorBox, Modal, useToast } from './ui'

function PantallaCuenta({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <main id="contenido" className="flex-1 flex items-start sm:items-center justify-center px-4 py-10">
        <div className="w-full max-w-2xl">
          {children}
          <PieInstitucional className="mt-6 text-center [&_nav]:justify-center" />
        </div>
      </main>
      <CreditoDesarrollador />
    </div>
  )
}

/** Primer acceso (o aviso actualizado): hay que leer y aceptar el aviso de privacidad para continuar */
export function AceptarAviso() {
  const { usuario, actualizarUsuario, logout } = useAuth()
  const [acepto, setAcepto] = useState(false)
  const [completo, setCompleto] = useState(false)
  const [error, setError] = useState<string>()
  const [enviando, setEnviando] = useState(false)

  const aceptar = async () => {
    setError(undefined)
    setEnviando(true)
    try { actualizarUsuario(await api.aceptarAviso()) } catch (e) { setError((e as Error).message) } finally { setEnviando(false) }
  }

  return (
    <PantallaCuenta>
      <section className="card p-6 sm:p-8" aria-labelledby="aviso-titulo">
        <div className="flex items-center gap-3">
          <span className="w-11 h-11 rounded-xl bg-primary-container/40 text-secondary flex items-center justify-center"><ShieldCheck className="w-6 h-6" /></span>
          <div>
            <h1 id="aviso-titulo" className="text-xl font-bold text-secondary">Aviso de privacidad</h1>
            <p className="text-sm text-neutral">Léelo antes de usar Rutario{usuario ? `, ${usuario.nombre}` : ''}.</p>
          </div>
        </div>
        <div className="mt-5"><AvisoSimplificado /></div>
        {usuario?.rol === 'ALUMNO' && (
          <p className="mt-3 text-sm rounded-lg bg-tertiary-container/40 text-tertiary px-3 py-2">
            Si eres menor de edad, tu madre, padre o tutor debe conocer este aviso y firmar el{' '}
            <Link to="/autorizacion-tutor" className="underline font-medium">formato de autorización</Link> que se entrega en Vinculación.
          </p>
        )}
        <button type="button" className="mt-4 text-sm font-semibold text-secondary inline-flex items-center gap-1" aria-expanded={completo} aria-controls="aviso-integral"
          onClick={() => setCompleto(!completo)}>
          {completo ? 'Ocultar' : 'Leer'} el aviso de privacidad integral <ChevronDown className={`w-4 h-4 transition ${completo ? 'rotate-180' : ''}`} />
        </button>
        {completo && <div id="aviso-integral" className="mt-3 max-h-[50vh] overflow-y-auto rounded-xl border border-line p-4 sm:p-5"><AvisoIntegral /></div>}

        <label className="mt-6 flex items-start gap-3 cursor-pointer">
          <input type="checkbox" className="w-5 h-5 mt-0.5 accent-[#0B7468]" checked={acepto} onChange={(e) => setAcepto(e.target.checked)} />
          <span className="text-sm">
            He leído el aviso de privacidad y los <Link to="/terminos" className="text-secondary underline">términos y condiciones</Link>, y acepto el
            tratamiento de mis datos para las finalidades descritas.
          </span>
        </label>
        <div className="mt-4"><ErrorBox msg={error} /></div>
        <div className="mt-5 flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
          <button type="button" className="btn-outline" onClick={logout}><LogOut className="w-4 h-4" />Salir</button>
          <button type="button" className="btn-primary" disabled={!acepto || enviando} onClick={aceptar}>
            {enviando ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Aceptar y continuar'}
          </button>
        </div>
      </section>
    </PantallaCuenta>
  )
}

/** Formulario de cambio de contraseña (pantalla obligatoria o modal desde el menú) */
function FormPassword({ obligatorio, onListo, onCancelar }: { obligatorio?: boolean; onListo: () => void; onCancelar?: () => void }) {
  const { actualizarUsuario } = useAuth()
  const [f, setF] = useState({ actual: '', nueva: '', confirma: '' })
  const [error, setError] = useState<string>()
  const [enviando, setEnviando] = useState(false)

  const guardar = async (e: FormEvent) => {
    e.preventDefault()
    setError(undefined)
    if (f.nueva !== f.confirma) return setError('La confirmación no coincide con la nueva contraseña')
    setEnviando(true)
    try { actualizarUsuario(await api.cambiarPassword(f.actual, f.nueva)); onListo() } catch (err) { setError((err as Error).message) } finally { setEnviando(false) }
  }
  const campo = (k: keyof typeof f, label: string, auto: string, ayuda?: string) => (
    <label className="block">
      <span className="label">{label}</span>
      <input className="input h-11" type="password" required value={f[k]} autoComplete={auto} aria-describedby={ayuda ? `${k}-ayuda` : undefined}
        onChange={(e) => setF({ ...f, [k]: e.target.value })} {...(k === 'actual' ? { 'data-autofocus': true } : {})} />
      {ayuda && <span id={`${k}-ayuda`} className="block text-xs text-neutral mt-1">{ayuda}</span>}
    </label>
  )
  return (
    <form onSubmit={guardar} className="space-y-4">
      {campo('actual', obligatorio ? 'Contraseña que te asignaron' : 'Contraseña actual', 'current-password')}
      {campo('nueva', 'Nueva contraseña', 'new-password', 'Mínimo 8 caracteres, con letras y números. No uses tu matrícula ni tu correo.')}
      {campo('confirma', 'Confirma la nueva contraseña', 'new-password')}
      <ErrorBox msg={error} />
      <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end pt-1">
        {onCancelar && <button type="button" className="btn-outline" onClick={onCancelar}>{obligatorio ? <><LogOut className="w-4 h-4" />Salir</> : 'Cancelar'}</button>}
        <button className="btn-primary" disabled={enviando}>{enviando ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Guardar contraseña'}</button>
      </div>
    </form>
  )
}

/** Primer acceso con contraseña asignada por otra persona: debe crear la suya */
export function CambioPasswordObligatorio() {
  const { logout } = useAuth()
  const toast = useToast()
  return (
    <PantallaCuenta>
      <section className="card p-6 sm:p-8 max-w-md mx-auto" aria-labelledby="pw-titulo">
        <div className="flex items-center gap-3 mb-5">
          <span className="w-11 h-11 rounded-xl bg-primary-container/40 text-secondary flex items-center justify-center"><KeyRound className="w-6 h-6" /></span>
          <div>
            <h1 id="pw-titulo" className="text-xl font-bold text-secondary">Crea tu contraseña</h1>
            <p className="text-sm text-neutral">Tu contraseña actual la asignó otra persona. Por seguridad, cámbiala para continuar.</p>
          </div>
        </div>
        <FormPassword obligatorio onListo={() => toast('Contraseña actualizada')} onCancelar={logout} />
      </section>
    </PantallaCuenta>
  )
}

/** Botón del menú lateral para cambiar la contraseña en cualquier momento */
export function BotonCambiarPassword() {
  const [open, setOpen] = useState(false)
  const toast = useToast()
  return (
    <>
      <button className="icon-btn" onClick={() => setOpen(true)} title="Cambiar contraseña" aria-label="Cambiar contraseña"><KeyRound className="w-5 h-5" /></button>
      <Modal open={open} onClose={() => setOpen(false)} maxW="max-w-md" label="Cambiar contraseña">
        <div className="p-6">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4"><KeyRound className="w-5 h-5 text-secondary" />Cambiar contraseña</h2>
          <FormPassword onListo={() => { setOpen(false); toast('Contraseña actualizada') }} onCancelar={() => setOpen(false)} />
        </div>
      </Modal>
    </>
  )
}

import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Eye, EyeOff, LogIn, Loader2 } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { ErrorBox } from '../components/ui'
import { USE_MOCK } from '../api'
import { DEMO, resetMock } from '../api/mock'
import { ROL_LABEL } from '../types'
import { CreditoDesarrollador, PieInstitucional } from '../components/Pies'
import { MarcaPin, RutaDecor } from '../components/Marca'

export default function Login() {
  const { login } = useAuth()
  const [id, setId] = useState('')
  const [pass, setPass] = useState('')
  const [ver, setVer] = useState(false)
  const [error, setError] = useState<string>()
  const [cargando, setCargando] = useState(false)

  const entrar = async (e?: FormEvent, ident = id, p = pass) => {
    e?.preventDefault()
    setError(undefined)
    setCargando(true)
    try { await login(ident, p) } catch (err) { setError((err as Error).message) } finally { setCargando(false) }
  }

  const esMatricula = /^\d+$/.test(id.trim())

  return (
    <div className="min-h-screen flex flex-col bg-surface">
    <div className="flex-1 grid lg:grid-cols-[1fr_1fr]">
      {/* Panel de marca (solo escritorio) */}
      <aside className="on-dark relative hidden lg:flex flex-col justify-between overflow-hidden bg-ink text-white p-12 xl:p-16" aria-label="Rutario">
        <RutaDecor className="absolute -right-20 bottom-24 w-[560px] max-w-none opacity-90" />
        <div className="relative flex items-center gap-3">
          <MarcaPin oscuro className="w-12 h-12" />
          <span className="font-display text-3xl font-extrabold tracking-tight">Rutario</span>
        </div>
        <div className="relative max-w-md">
          <p className="eyebrow !text-aqua mb-3">Control de prácticas escolares</p>
          <h2 className="font-display text-4xl xl:text-5xl font-extrabold leading-[1.1]">De la ruta al reporte, en un toque.</h2>
          <ul className="mt-8 space-y-3 text-white/80">
            <li className="flex gap-3"><span className="mt-2 w-1.5 h-1.5 rounded-full bg-coral shrink-0" />Entrada y salida con foto y ubicación desde el celular.</li>
            <li className="flex gap-3"><span className="mt-2 w-1.5 h-1.5 rounded-full bg-coral shrink-0" />La empresa confirma que el alumno se presentó.</li>
            <li className="flex gap-3"><span className="mt-2 w-1.5 h-1.5 rounded-full bg-coral shrink-0" />Reportes de horas en Excel y Word.</li>
          </ul>
        </div>
        <p className="relative flex items-center gap-3 text-sm text-white/70">
          
          CBT Lic. Julián Díaz Arias · Chapultepec, Edo. Méx.
        </p>
      </aside>

      <main id="contenido" className="flex items-center justify-center px-4 py-10 sm:px-10">
        <div className="w-full max-w-md">
          <div className="flex flex-col items-start">
            <div className="lg:hidden flex items-center gap-3 mb-6">
              <MarcaPin className="w-12 h-12" />
              <span className="font-display text-3xl font-extrabold tracking-tight text-ink">Rutario</span>
            </div>
            <p className="eyebrow !text-brand flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-coral" />Bienvenido</p>
            <h1 className="text-[32px] font-extrabold text-on-surface mt-1 leading-tight">Inicia sesión</h1>
            <p className="text-neutral text-sm mt-2 flex items-center gap-2 lg:hidden">
              Control de prácticas · CBT Lic. Julián Díaz Arias
            </p>
            <div className="ruta-divider w-24 mt-4" aria-hidden="true" />
          </div>

          <form onSubmit={entrar} className="mt-8 space-y-5">
            <label className="block">
              <span className="label">Matrícula o correo institucional</span>
              <input className="input h-12 text-base" value={id} onChange={(e) => setId(e.target.value)} autoComplete="username"
                placeholder="12345678 o tu correo" inputMode={esMatricula ? 'numeric' : 'email'} required />
              <span className="block text-xs text-neutral mt-1">Alumnos: matrícula de 8 dígitos. Personal y empresas: correo.</span>
            </label>
            <label className="block">
              <span className="label">Contraseña</span>
              <div className="relative">
                <input className="input h-12 text-base pr-11" type={ver ? 'text' : 'password'} value={pass} onChange={(e) => setPass(e.target.value)} autoComplete="current-password" required />
                <button type="button" className="icon-btn absolute right-1.5 top-1.5" onClick={() => setVer(!ver)} aria-label={ver ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                  {ver ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </label>
            <ErrorBox msg={error} />
            <button className="btn-primary w-full h-12 text-base bg-primary hover:bg-secondary" disabled={cargando}>
              {cargando ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Iniciar sesión <LogIn className="w-5 h-5" /></>}
            </button>
          </form>
          <p className="text-xs text-neutral mt-6">¿Olvidaste tu contraseña? Pide a tu vinculador o a Dirección que la restablezca; te darán una temporal.</p>
          <p className="text-xs text-neutral mt-3">Al iniciar sesión aceptas los <Link to="/terminos" className="text-secondary underline">términos y condiciones</Link> y
            el <Link to="/privacidad" className="text-secondary underline">aviso de privacidad</Link>.</p>

        {USE_MOCK && (
          <div className="mt-5 card p-5">
            <p className="eyebrow mb-3">Entrar como (demo · contraseña: rutario)</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {DEMO.map((d) => (
                <button key={d.rol} type="button" className="btn-outline h-9 text-xs" disabled={cargando}
                  onClick={() => { setId(d.id); setPass('rutario'); entrar(undefined, d.id, 'rutario') }}>
                  {ROL_LABEL[d.rol]}
                </button>
              ))}
            </div>
            <button type="button" className="text-xs text-neutral hover:text-secondary mt-3" onClick={() => { resetMock(); location.reload() }}>Reiniciar datos de prueba</button>
          </div>
        )}
          <PieInstitucional className="mt-6 [&_nav]:justify-start" />
        </div>
      </main>
    </div>
    <CreditoDesarrollador />
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AvisoSimplificado } from '../legal/Legal'
import { Camera, LogIn, LogOut, MapPin, Loader2, RotateCcw, Undo2, CheckCircle2, WifiOff, CalendarOff, Timer, ArrowRight, Crosshair, Smartphone } from 'lucide-react'
import { api, USE_MOCK } from '../../api'
import { useAsync, useCatalogos, useNow, useOnline } from '../../hooks'
import { useAuth } from '../../auth/AuthContext'
import { ErrorBox, Modal, Spinner, useToast } from '../../components/ui'
import { MapaPuntos } from '../../components/Mapa'
import { EvidenciaModal } from '../../components/Evidencia'
import VinculacionCard from '../../components/VinculacionCard'
import type { Registro } from '../../types'
import { calcularJornadas, cls, comprimirFoto, coords, fmtHora, fmtHoras, fotoSrc, hoy, sumarDias, ymd } from '../../utils'

const VENTANA_DESHACER = 5 * 60 * 1000

export default function Registrar() {
  const { usuario } = useAuth()
  const toast = useToast()
  const online = useOnline()
  const now = useNow(1000)
  const { empresa: empresaDe } = useCatalogos()
  const lunes = (() => { const d = new Date(); return sumarDias(hoy(), -((d.getDay() + 6) % 7)) })()
  const { data, loading, reload } = useAsync(() => Promise.all([
    api.vinculaciones(), api.registros({ usuarioId: usuario!.id, desde: lunes, hasta: hoy() }), api.diasNoLaborables(),
  ]), [])
  const [captura, setCaptura] = useState<'ENTRADA' | 'SALIDA' | null>(null)
  const [ver, setVer] = useState<Registro | null>(null)

  if (loading || !data) return <Spinner />
  const [vincs, regsSemana, dias] = data
  const v = vincs.find((x) => x.usuarioId === usuario!.id)
  const empresa = empresaDe(v?.empresaId)
  const deHoy = regsSemana.filter((r) => ymd(new Date(r.timestamp)) === hoy())
  const entrada = deHoy.filter((r) => r.tipo === 'ENTRADA').sort((a, b) => a.timestamp.localeCompare(b.timestamp))[0]
  const salida = deHoy.filter((r) => r.tipo === 'SALIDA').sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0]
  const ultimo = [...deHoy].sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0]
  const restante = ultimo ? VENTANA_DESHACER - (now.getTime() - new Date(ultimo.timestamp).getTime()) : 0
  const noLaborable = dias.find((d) => d.fecha === hoy())
  const semana = calcularJornadas(regsSemana)
  const horasSemana = semana.reduce((s, j) => s + j.horas, 0)
  const transcurrido = entrada && !salida ? (now.getTime() - new Date(entrada.timestamp).getTime()) / 3600000 : 0

  const deshacer = async () => {
    try { await api.deshacerRegistro(ultimo.id); toast('Registro eliminado. Puedes volver a registrarlo.'); reload() } catch (e) { toast((e as Error).message, 'error') }
  }

  const estado = !entrada ? 'sin-entrada' : !salida ? 'en-curso' : 'completa'

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <p className="eyebrow">{now.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        <h1 className="text-2xl sm:text-[28px] font-bold text-secondary">Hola, {usuario?.nombre.split(' ')[0]}</h1>
      </div>

      {!online && (
        <div className="flex gap-3 rounded-2xl bg-slate-800 text-white p-4 mb-4 text-sm">
          <WifiOff className="w-5 h-5 shrink-0" />
          <p><b>Sin conexión.</b> En la versión web necesitas internet para registrar. Usa la app Rutario para Android: guarda tu registro sin señal y lo envía al recuperar conexión.</p>
        </div>
      )}
      {noLaborable && (
        <div className="flex gap-3 rounded-2xl bg-tertiary-container/60 text-tertiary p-4 mb-4 text-sm">
          <CalendarOff className="w-5 h-5 shrink-0" />
          <p>Hoy es día no laborable: <b>{noLaborable.descripcion}</b>. Si de todos modos asistes, puedes registrar y tus horas se sumarán.</p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_380px] items-start">
        <div className="space-y-6">
          {/* Tarjeta principal */}
          <section className="card overflow-hidden">
            <div className="p-6 sm:p-8 text-center">
              <p className="text-5xl sm:text-6xl font-bold tabular-nums tracking-tight">{now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false })}<span className="text-2xl text-neutral">:{String(now.getSeconds()).padStart(2, '0')}</span></p>
              <p className="text-neutral mt-1">
                {estado === 'sin-entrada' && 'Aún no registras tu entrada de hoy.'}
                {estado === 'en-curso' && <>Llevas <b className="text-secondary">{fmtHoras(transcurrido)}</b> desde tu entrada.</>}
                {estado === 'completa' && 'Tu jornada de hoy está completa.'}
              </p>

              {estado !== 'completa' ? (
                <button disabled={!online || !v} onClick={() => setCaptura(estado === 'sin-entrada' ? 'ENTRADA' : 'SALIDA')}
                  className={cls('mt-6 w-full max-w-sm mx-auto h-16 rounded-2xl text-lg font-bold flex items-center justify-center gap-3 shadow-card transition active:scale-[.98] disabled:opacity-50',
                    estado === 'sin-entrada' ? 'bg-secondary text-white hover:bg-primary' : 'bg-tertiary-container text-tertiary hover:bg-[#ffc685]')}>
                  {estado === 'sin-entrada' ? <><LogIn className="w-6 h-6" />Registrar ENTRADA</> : <><LogOut className="w-6 h-6" />Registrar SALIDA</>}
                </button>
              ) : (
                <div className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-primary-container/40 text-secondary px-5 py-3 font-semibold">
                  <CheckCircle2 className="w-5 h-5" />{fmtHoras((new Date(salida!.timestamp).getTime() - new Date(entrada!.timestamp).getTime()) / 3600000)} registradas hoy
                </div>
              )}
              {!v && <p className="text-sm text-error mt-3">Tu vinculador aún no te asigna empresa. Cuando lo haga podrás registrar.</p>}
              <p className="text-xs text-neutral mt-3 flex items-center justify-center gap-1.5"><Camera className="w-3.5 h-3.5" aria-hidden="true" />Se pedirá una foto tuya en el lugar y tu ubicación GPS.</p>
              <div className="mt-3 max-w-md mx-auto text-left"><AvisoSimplificado compacto /></div>
            </div>

            {(entrada || salida) && (
              <div className="grid grid-cols-2 border-t border-line">
                {[entrada, salida].map((r, i) => (
                  <button key={i} disabled={!r} onClick={() => r && setVer(r)} className={cls('flex items-center gap-3 p-4 text-left', i === 0 && 'border-r border-line', r && 'hover:bg-surface-low')}>
                    {r?.fotoUrl ? <img src={fotoSrc(r.fotoUrl)} alt="" className="w-12 h-12 rounded-lg object-cover ring-1 ring-line" /> : <span className="w-12 h-12 rounded-lg bg-surface-low" />}
                    <span><span className="eyebrow block">{i === 0 ? 'Entrada' : 'Salida'}</span><span className="text-xl font-bold mono">{r ? fmtHora(r.timestamp) : '--:--'}</span></span>
                  </button>
                ))}
              </div>
            )}

            {ultimo && restante > 0 && (
              <div className="flex items-center gap-3 bg-surface-low border-t border-line px-5 py-3">
                <Undo2 className="w-4 h-4 text-neutral" />
                <p className="text-sm flex-1">¿Te equivocaste? Puedes deshacer tu {ultimo.tipo === 'ENTRADA' ? 'entrada' : 'salida'} durante <b className="tabular-nums">{Math.floor(restante / 60000)}:{String(Math.floor((restante % 60000) / 1000)).padStart(2, '0')}</b></p>
                <button className="btn-outline h-8 px-3 text-xs" onClick={deshacer}>Deshacer</button>
              </div>
            )}
          </section>

          {/* Semana */}
          <section className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Esta semana</h2>
              <span className="chip bg-primary-container/40 text-secondary py-1 px-3 text-sm"><Timer className="w-4 h-4" />{fmtHoras(horasSemana)}</span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {['Lun', 'Mar', 'Mié', 'Jue', 'Vie'].map((d, i) => {
                const f = sumarDias(lunes, i)
                const j = semana.find((x) => x.fecha === f)
                const futuro = f > hoy()
                return (
                  <div key={d} className={cls('rounded-xl p-2 sm:p-3 text-center border', f === hoy() ? 'border-secondary' : 'border-line', j?.completa ? 'bg-primary-container/25' : j ? 'bg-tertiary-container/30' : 'bg-white')}>
                    <p className="text-xs text-neutral">{d}</p>
                    <p className={cls('font-bold tabular-nums mt-0.5', j && !j.completa ? 'text-[11px] sm:text-xs py-0.5' : 'text-sm sm:text-base', futuro && 'text-slate-300', j && !j.completa && f < hoy() && 'text-tertiary')}>{j?.completa ? `${j.horas.toFixed(1)}h` : j ? (f === hoy() ? 'En curso' : 'Falta') : futuro ? '—' : '0h'}</p>
                  </div>
                )
              })}
            </div>
            <Link to="/mis-registros" className="text-sm font-semibold text-secondary inline-flex items-center gap-1 mt-4 hover:underline">Ver todo mi historial <ArrowRight className="w-4 h-4" /></Link>
          </section>
        </div>

        <div className="space-y-4">
          <VinculacionCard v={v} empresa={empresa} compacta />
          <div className="card p-4 flex gap-3 text-sm">
            <Smartphone className="w-5 h-5 text-secondary shrink-0" />
            <p className="text-neutral"><b className="text-on-surface">¿Sin señal en tu práctica?</b> Usa la app de Android: guarda foto, GPS y hora aunque no tengas internet.</p>
          </div>
        </div>
      </div>

      {captura && <Captura tipo={captura} onClose={() => setCaptura(null)} onDone={() => { setCaptura(null); reload() }} fallback={empresa ? [empresa.latitud, empresa.longitud] : undefined} />}
      <EvidenciaModal data={ver ? { registro: ver, empresa } : null} onClose={() => setVer(null)} />
    </div>
  )
}

/* ---------- Flujo de captura: foto + GPS + confirmación ---------- */
function Captura({ tipo, onClose, onDone, fallback }: { tipo: 'ENTRADA' | 'SALIDA'; onClose: () => void; onDone: () => void; fallback?: [number, number] }) {
  const toast = useToast()
  const input = useRef<HTMLInputElement>(null)
  const [foto, setFoto] = useState<{ blob: Blob; url: string; ts: string } | null>(null)
  const [gps, setGps] = useState<{ lat: number; lng: number; acc?: number } | null>(null)
  const [gpsEstado, setGpsEstado] = useState<'buscando' | 'ok' | 'error'>('buscando')
  const [gpsError, setGpsError] = useState<{ titulo: string; ayuda: string }>()
  const [camara, setCamara] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string>()

  // Primero GPS preciso; si tarda o no hay señal, se reintenta con precisión normal (Wi-Fi/antenas) antes de marcar error
  const pedirGps = () => {
    setGpsEstado('buscando'); setGpsError(undefined)
    if (!window.isSecureContext || !navigator.geolocation) {
      setGpsError({ titulo: 'Tu navegador no permite la ubicación', ayuda: 'Abre Rutario en Chrome (Android) o Safari (iPhone) con la dirección https://rutario.example.org.' })
      return setGpsEstado('error')
    }
    const ok = (p: GeolocationPosition) => { setGps({ lat: +p.coords.latitude.toFixed(6), lng: +p.coords.longitude.toFixed(6), acc: Math.round(p.coords.accuracy) }); setGpsEstado('ok') }
    const fallo = (e: GeolocationPositionError) => {
      setGpsError(e.code === e.PERMISSION_DENIED
        ? { titulo: 'Bloqueaste el permiso de ubicación', ayuda: esIOS()
            ? 'iPhone: Ajustes › Privacidad y seguridad › Localización › activa «Localización» y en Safari elige «Al usar la app». Luego recarga la página.'
            : 'Android: toca el candado junto a la dirección › Permisos › Ubicación › Permitir. Revisa también que la ubicación del teléfono esté encendida. Luego recarga la página.' }
        : { titulo: 'No hay señal de ubicación', ayuda: 'Enciende la ubicación (GPS) del teléfono, sal a un lugar abierto o cerca de una ventana, activa el Wi-Fi (ayuda a ubicarte aunque no te conectes) y toca «Reintentar».' })
      setGpsEstado('error')
    }
    navigator.geolocation.getCurrentPosition(ok,
      (e) => e.code === e.PERMISSION_DENIED ? fallo(e)
        : navigator.geolocation.getCurrentPosition(ok, fallo, { enableHighAccuracy: false, timeout: 20000, maximumAge: 120000 }),
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 })
  }
  useEffect(pedirGps, [])
  useEffect(() => () => { if (foto) URL.revokeObjectURL(foto.url) }, [foto])

  const onFoto = async (file?: Blob) => {
    setCamara(false)
    if (!file) return
    const blob = await comprimirFoto(file)
    setFoto({ blob, url: URL.createObjectURL(blob), ts: new Date().toISOString() })
    pedirGps() // RF-11: coordenadas al momento de la foto
  }

  const confirmar = async () => {
    if (!foto || !gps) return
    setEnviando(true); setError(undefined)
    try {
      await api.crearRegistro({ tipo, foto: foto.blob, latitud: gps.lat, longitud: gps.lng, timestamp: foto.ts })
      toast(tipo === 'ENTRADA' ? 'Entrada registrada' : 'Salida registrada')
      onDone()
    } catch (e) { setError((e as Error).message); setEnviando(false) }
  }

  const esEntrada = tipo === 'ENTRADA'
  return (
    <Modal open onClose={onClose} maxW="max-w-lg">
      <div className="p-5 sm:p-6">
        <p className={cls('chip mb-2', esEntrada ? 'bg-primary-container/50 text-secondary' : 'bg-tertiary-container/70 text-tertiary')}>{esEntrada ? 'Entrada' : 'Salida'}</p>
        <h2 className="text-xl font-bold">{esEntrada ? 'Registrar entrada' : 'Registrar salida'}</h2>
        <p className="text-sm text-neutral">Tómate una foto donde se vea que estás en tu lugar de práctica.</p>

        {/* Paso 1: foto */}
        <input ref={input} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => onFoto(e.target.files?.[0])} />
        <div className="mt-5">
          {foto ? (
            <div className="relative rounded-2xl overflow-hidden bg-slate-900">
              <img src={foto.url} alt="Foto de evidencia" className="w-full max-h-72 object-contain" />
              <button className="btn-outline h-8 px-3 text-xs absolute right-2 bottom-2" onClick={() => setCamara(true)}><RotateCcw className="w-3.5 h-3.5" />Repetir</button>
            </div>
          ) : camara ? (
            <CamaraEnVivo onFoto={onFoto} onUsarApp={() => { setCamara(false); input.current?.click() }} />
          ) : (
            <button onClick={() => setCamara(true)} className="w-full h-48 rounded-2xl border-2 border-dashed border-primary-container bg-primary-container/10 flex flex-col items-center justify-center gap-2 text-secondary hover:bg-primary-container/20 transition">
              <span className="w-14 h-14 rounded-full bg-secondary text-white flex items-center justify-center"><Camera className="w-7 h-7" /></span>
              <span className="font-semibold">Tomar foto</span>
              <span className="text-xs text-neutral">Se abre aquí mismo; no ocupa espacio en tu teléfono</span>
            </button>
          )}
        </div>

        {/* Paso 2: GPS */}
        <div className="mt-4 rounded-2xl border border-line p-4">
          <div className="flex items-center gap-3">
            <span className={cls('w-9 h-9 rounded-full flex items-center justify-center', gpsEstado === 'ok' ? 'bg-primary-container/50 text-secondary' : gpsEstado === 'error' ? 'bg-error-container text-error' : 'bg-surface-low text-neutral')}>
              {gpsEstado === 'buscando' ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
            </span>
            <div className="flex-1 min-w-0 text-sm">
              {gpsEstado === 'buscando' && <p>Obteniendo tu ubicación…</p>}
              {gpsEstado === 'ok' && gps && <><p className="font-medium">Ubicación capturada</p><p className="text-xs text-neutral mono">{coords(gps.lat, gps.lng)}{gps.acc ? ` · ±${gps.acc} m` : ''}</p>
                {gps.acc && gps.acc > 300 && <p className="text-xs text-tertiary mt-0.5">Ubicación aproximada. Si puedes, activa el GPS y toca «Reintentar» para mayor precisión.</p>}</>}
              {gpsEstado === 'error' && <><p className="font-medium text-error">{gpsError?.titulo ?? 'No se pudo obtener tu ubicación'}</p><p className="text-xs text-neutral">{gpsError?.ayuda ?? 'Activa el GPS y permite el acceso a la ubicación.'}</p></>}
            </div>
            {gpsEstado !== 'buscando' && (gpsEstado === 'error' || (gps?.acc ?? 0) > 300) && <button className="btn-outline h-8 px-3 text-xs" onClick={pedirGps}>Reintentar</button>}
          </div>
          {gpsEstado === 'error' && USE_MOCK && fallback && (
            <button className="btn-ghost h-8 px-2 text-xs mt-2" onClick={() => { setGps({ lat: fallback[0] + 0.0002, lng: fallback[1] - 0.0002 }); setGpsEstado('ok') }}>
              <Crosshair className="w-3.5 h-3.5" />Usar ubicación de prueba (solo demo)
            </button>
          )}
          {gps && <div className="mt-3"><MapaPuntos height={150} puntos={[{ lat: gps.lat, lng: gps.lng, titulo: 'Estás aquí' }]} /></div>}
        </div>

        <div className="mt-4"><ErrorBox msg={error} /></div>
        <div className="flex gap-2 mt-5">
          <button className="btn-outline flex-1 h-12" onClick={onClose}>Cancelar</button>
          <button className={cls('flex-[2] h-12 btn text-base', esEntrada ? 'bg-secondary text-white hover:bg-primary' : 'bg-tertiary-container text-tertiary hover:bg-[#ffc685]')}
            disabled={!foto || gpsEstado !== 'ok' || enviando} onClick={confirmar}>
            {enviando ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}{enviando ? 'Guardando…' : `Confirmar ${esEntrada ? 'entrada' : 'salida'}`}
          </button>
        </div>
        {!foto && <p className="text-xs text-center text-neutral mt-3">La foto es obligatoria para registrar.</p>}
      </div>
    </Modal>
  )
}

const esIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

/** Cámara dentro del navegador: la foto se toma en memoria y no se guarda en la galería (sirve con el almacenamiento lleno). */
function CamaraEnVivo({ onFoto, onUsarApp }: { onFoto: (b: Blob) => void; onUsarApp: () => void }) {
  const video = useRef<HTMLVideoElement>(null)
  const [estado, setEstado] = useState<'abriendo' | 'lista' | 'error'>('abriendo')
  const [msg, setMsg] = useState('')
  const [frontal, setFrontal] = useState(false)

  useEffect(() => {
    let stream: MediaStream | undefined
    let cancelado = false
    setEstado('abriendo')
    if (!navigator.mediaDevices?.getUserMedia) { setMsg('Este navegador no puede abrir la cámara aquí.'); setEstado('error'); return }
    navigator.mediaDevices.getUserMedia({ video: { facingMode: frontal ? 'user' : 'environment', width: { ideal: 1280 }, height: { ideal: 1280 } }, audio: false })
      .then((s) => {
        if (cancelado) { s.getTracks().forEach((t) => t.stop()); return }
        stream = s
        if (video.current) { video.current.srcObject = s; video.current.play().catch(() => {}) }
        setEstado('lista')
      })
      .catch((e: DOMException) => {
        setMsg(e.name === 'NotAllowedError'
          ? (esIOS() ? 'Permiso de cámara bloqueado. iPhone: Ajustes › Safari › Cámara › Permitir, y recarga.' : 'Permiso de cámara bloqueado. Toca el candado junto a la dirección › Permisos › Cámara › Permitir, y recarga.')
          : 'No se pudo abrir la cámara aquí.')
        setEstado('error')
      })
    return () => { cancelado = true; stream?.getTracks().forEach((t) => t.stop()) }
  }, [frontal])

  const disparar = () => {
    const v = video.current
    if (!v || !v.videoWidth) return
    const k = Math.min(1, 1280 / Math.max(v.videoWidth, v.videoHeight))
    const c = document.createElement('canvas')
    c.width = Math.round(v.videoWidth * k); c.height = Math.round(v.videoHeight * k)
    c.getContext('2d')!.drawImage(v, 0, 0, c.width, c.height)
    c.toBlob((b) => b && onFoto(b), 'image/jpeg', 0.75)
  }

  if (estado === 'error') return (
    <div className="rounded-2xl border border-line p-4 text-sm">
      <p className="font-medium text-error">{msg}</p>
      <button className="btn-primary h-10 mt-3 w-full" onClick={onUsarApp}><Camera className="w-4 h-4" />Usar la app de cámara del teléfono</button>
    </div>
  )
  return (
    <div className="rounded-2xl overflow-hidden bg-slate-900">
      <video ref={video} playsInline muted className="w-full max-h-80 object-contain" aria-label="Vista previa de la cámara" />
      <div className="flex items-center justify-between gap-2 p-2">
        <button className="btn-ghost h-9 px-2 text-xs text-slate-200 hover:text-white hover:bg-white/10" onClick={() => setFrontal(!frontal)}><RotateCcw className="w-3.5 h-3.5" />Girar</button>
        <button className="w-14 h-14 rounded-full bg-white ring-4 ring-white/30 disabled:opacity-50" onClick={disparar} disabled={estado !== 'lista'} aria-label="Tomar foto">
          {estado === 'abriendo' && <Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-500" />}
        </button>
        <button className="btn-ghost h-9 px-2 text-xs text-slate-200 hover:text-white hover:bg-white/10" onClick={onUsarApp}>Usar app</button>
      </div>
    </div>
  )
}

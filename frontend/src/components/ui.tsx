import { Children, cloneElement, createContext, isValidElement, useCallback, useContext, useEffect, useId, useRef, useState, type CSSProperties, type ReactElement, type ReactNode, type RefObject } from 'react'
import { AlertCircle, CheckCircle2, Loader2, X, Car, Laptop, FlaskConical, BookOpen, Trash2 } from 'lucide-react'
import type { Carrera, Rol, TipoPractica, Usuario } from '../types'
import { ROL_LABEL, TIPO_LABEL } from '../types'
import { cls, iniciales } from '../utils'
import { useCountUp } from '../anim'

/* ---------- Chips ---------- */
const ROL_STYLE: Record<Rol, string> = {
  ROOT: 'bg-ink text-white',
  DIRECTIVO: 'bg-secondary text-white',
  VINCULADOR: 'bg-primary-container text-secondary',
  ORIENTADOR: 'bg-ink/10 text-ink',
  DOCENTE: 'bg-aqua/20 text-secondary',
  ALUMNO: 'bg-surface-container text-on-surface-variant',
  EMPLEADOR: 'bg-tertiary-container text-tertiary',
}
export const RolChip = ({ rol }: { rol: Rol }) => <span className={cls('chip', ROL_STYLE[rol])}>{ROL_LABEL[rol]}</span>

const TIPO_STYLE: Record<TipoPractica, string> = {
  SERVICIO_SOCIAL: 'bg-primary-container/40 text-secondary',
  ESTADIAS: 'bg-ink/10 text-ink',
  EJECUCION: 'bg-tertiary-container/60 text-tertiary',
}
export const TipoChip = ({ tipo }: { tipo?: TipoPractica }) =>
  tipo ? <span className={cls('chip', TIPO_STYLE[tipo])}><span className="w-1.5 h-1.5 rounded-full bg-current" />{TIPO_LABEL[tipo]}</span>
    : <span className="chip bg-error-container text-error">Sin asignar</span>

export const TipoRegistroChip = ({ tipo }: { tipo: 'ENTRADA' | 'SALIDA' }) =>
  tipo === 'ENTRADA'
    ? <span className="chip bg-primary-container/50 text-secondary">Entrada</span>
    : <span className="chip bg-tertiary-container/70 text-tertiary">Salida</span>

/** Confirmación de la empresa sobre una entrada: se presentó / no se presentó (con el comentario como ayuda) */
export function ValidacionChip({ v }: { v?: { presente: boolean; comentario?: string; empleadorNombre?: string } }) {
  if (!v) return <span className="text-neutral">—</span>
  const detalle = [v.empleadorNombre && `Validó: ${v.empleadorNombre}`, v.comentario].filter(Boolean).join(' · ')
  return v.presente
    ? <span className="chip bg-primary-container text-secondary" title={detalle || undefined}><CheckCircle2 className="w-3.5 h-3.5" />Empresa: sí se presentó</span>
    : <span className="chip bg-error-container text-error" title={detalle || undefined}><AlertCircle className="w-3.5 h-3.5" />Empresa: no se presentó</span>
}

/* ---------- Avatar ---------- */
const AV = ['bg-primary-container text-secondary', 'bg-ink/10 text-ink', 'bg-tertiary-container text-tertiary', 'bg-aqua/20 text-secondary', 'bg-surface-container text-on-surface-variant']
export function Avatar({ u, size = 36 }: { u?: Pick<Usuario, 'id' | 'nombre' | 'apellidoPaterno'>; size?: number }) {
  return (
    <span className={cls('inline-flex shrink-0 items-center justify-center rounded-full font-semibold', AV[(u?.id ?? 0) % AV.length])}
      style={{ width: size, height: size, fontSize: size * 0.36 }}>
      {iniciales(u)}
    </span>
  )
}

export function CarreraIcon({ c, className = 'w-5 h-5' }: { c?: Carrera; className?: string }) {
  const I = { car: Car, laptop: Laptop, flask: FlaskConical, book: BookOpen }[c?.icono ?? 'book']
  return <I className={className} />
}

/* ---------- Layout helpers ---------- */
export function PageHeader({ title, subtitle, eyebrow, actions }: { title: string; subtitle?: ReactNode; eyebrow?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          {eyebrow && <p className="eyebrow mb-1 flex items-center gap-1.5 !text-brand"><span className="w-1.5 h-1.5 rounded-full bg-coral" />{eyebrow}</p>}
          <h1 className="text-2xl sm:text-[30px] font-extrabold text-on-surface leading-tight">{title}</h1>
          {subtitle && <p className="text-sm text-neutral mt-1 max-w-2xl">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2 shrink-0">{actions}</div>}
      </div>
      <div className="ruta-divider mt-4 opacity-80" aria-hidden="true" />
    </div>
  )
}

/** Número que cuenta hasta su valor al aparecer (respeta «reducir movimiento»). */
export function CountUp({ n, ms }: { n: number; ms?: number }) {
  return <>{useCountUp(n, ms).toLocaleString('es-MX')}</>
}

export function StatCard({ label, value, icon, hint, tone = 'green', delay = 0 }: { label: ReactNode; value: ReactNode; icon: ReactNode; hint?: ReactNode; tone?: 'green' | 'sky' | 'amber' | 'slate'; delay?: number }) {
  // Borde izquierdo de color + ícono sin caja: se aleja del look de «tarjeta con ícono pastel»
  const t = { green: 'border-l-brand text-brand', sky: 'border-l-ink text-ink', amber: 'border-l-coral text-tertiary', slate: 'border-l-neutral text-neutral' }[tone]
  return (
    <div className={cls('card p-5 border-l-[3px] lift anim-rise', t.split(' ')[0])} style={{ '--d': `${delay}ms` } as CSSProperties}>
      <div className="flex items-center justify-between gap-3">
        <p className="eyebrow">{label}</p>
        <span className={cls('shrink-0', t.split(' ')[1])} aria-hidden="true">{icon}</span>
      </div>
      <p className="font-display text-3xl font-extrabold leading-tight mt-2 tabular-nums whitespace-nowrap">{typeof value === 'number' ? <CountUp n={value} /> : value}</p>
      {hint && <p className="text-xs text-neutral mt-1">{hint}</p>}
    </div>
  )
}
export function Section({ title, subtitle, actions, children, className, bodyClass = 'p-5' }: { title?: ReactNode; subtitle?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string; bodyClass?: string }) {
  return (
    <section className={cls('card overflow-hidden', className)}>
      {(title || actions) && (
        <header className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5">
          <div>
            {title && <h2 className="text-lg font-semibold">{title}</h2>}
            {subtitle && <p className="text-sm text-neutral">{subtitle}</p>}
          </div>
          {actions}
        </header>
      )}
      <div className={bodyClass}>{children}</div>
    </section>
  )
}

export function Spinner({ label = 'Cargando…' }: { label?: string }) {
  return <div className="flex items-center justify-center gap-2 py-12 text-neutral text-sm"><Loader2 className="w-4 h-4 animate-spin" />{label}</div>
}

export function Empty({ icon, title, text, action }: { icon?: ReactNode; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center text-center py-12 px-6">
      {icon && <span className="w-12 h-12 rounded-2xl bg-surface-low text-neutral flex items-center justify-center mb-3">{icon}</span>}
      <p className="font-semibold">{title}</p>
      {text && <p className="text-sm text-neutral mt-1 max-w-sm">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function ErrorBox({ msg }: { msg?: string }) {
  if (!msg) return null
  return <div role="alert" className="flex items-start gap-2 rounded-lg bg-error-container text-[#93000a] text-sm px-3 py-2"><AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />{msg}</div>
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)}
      className={cls('relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors', checked ? 'bg-secondary' : 'bg-slate-300')}>
      <span className={cls('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform', checked ? 'translate-x-[22px]' : 'translate-x-0.5')} />
    </button>
  )
}

export function Field({ label, required, children, hint, className }: { label: string; required?: boolean; children: ReactNode; hint?: ReactNode; className?: string }) {
  return (
    <label className={cls('block', className)}>
      <span className="label">{label}{required && <span className="text-error" aria-hidden="true"> *</span>}</span>
      {required ? Children.map(children, (c) => isValidElement(c) ? cloneElement(c as ReactElement<{ 'aria-required'?: boolean }>, { 'aria-required': true }) : c) : children}
      {hint && <span className="block text-xs text-neutral mt-1">{hint}</span>}
    </label>
  )
}

export function Tabs<T extends string>({ value, onChange, items }: { value: T; onChange: (v: T) => void; items: { value: T; label: ReactNode }[] }) {
  return (
    <div className="inline-flex rounded-lg bg-surface-low p-1 gap-1">
      {items.map((it) => (
        <button key={it.value} type="button" onClick={() => onChange(it.value)} aria-pressed={value === it.value}
          className={cls('px-3 h-8 rounded-md text-sm font-medium transition', value === it.value ? 'bg-white text-secondary shadow-card' : 'text-neutral hover:text-secondary')}>
          {it.label}
        </button>
      ))}
    </div>
  )
}

/* ---------- Drawer / Modal ---------- */
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/** Accesibilidad de ventanas: Esc cierra, el foco se queda dentro (Tab/Shift+Tab) y regresa al botón que la abrió. */
export function useDialogo(open: boolean, onClose: () => void, ref: RefObject<HTMLElement | null>) {
  const cerrar = useRef(onClose)
  cerrar.current = onClose
  useEffect(() => {
    if (!open) return
    const previo = document.activeElement as HTMLElement | null
    const cont = ref.current
    const primero = cont?.querySelector<HTMLElement>('[data-autofocus]') ?? cont?.querySelector<HTMLElement>(FOCUSABLE)
    ;(primero ?? cont)?.focus()
    const k = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); cerrar.current(); return }
      if (e.key !== 'Tab' || !cont) return
      const els = Array.from(cont.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null)
      if (!els.length) { e.preventDefault(); return }
      const [a, z] = [els[0], els[els.length - 1]]
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus() }
      else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus() }
    }
    window.addEventListener('keydown', k)
    return () => { window.removeEventListener('keydown', k); previo?.focus?.() }
  }, [open, ref])
}

export function Drawer({ open, onClose, title, subtitle, icon, children, footer, wide }: { open: boolean; onClose: () => void; title: string; subtitle?: string; icon?: ReactNode; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLElement>(null)
  const tituloId = useId()
  useDialogo(open, onClose, ref)
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] animate-fade-in" onClick={onClose} aria-hidden="true" />
      <aside ref={ref} role="dialog" aria-modal="true" aria-labelledby={tituloId} tabIndex={-1}
        className={cls('relative h-full w-full bg-white shadow-pop flex flex-col animate-slide-in', wide ? 'max-w-3xl' : 'max-w-xl')}>
        <header className="flex items-start gap-3 px-6 py-5 border-b border-line">
          {icon && <span className="w-10 h-10 rounded-xl bg-primary-container/40 text-secondary flex items-center justify-center shrink-0">{icon}</span>}
          <div className="flex-1 min-w-0">
            <h2 id={tituloId} className="text-lg font-semibold leading-tight">{title}</h2>
            {subtitle && <p className="text-sm text-neutral mt-0.5">{subtitle}</p>}
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Cerrar"><X className="w-5 h-5" /></button>
        </header>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <footer className="px-6 py-4 border-t border-line bg-surface/60 flex items-center justify-end gap-2">{footer}</footer>}
      </aside>
    </div>
  )
}

export function Modal({ open, onClose, children, maxW = 'max-w-3xl', label = 'Detalle', cerrable = true }: { open: boolean; onClose: () => void; children: ReactNode; maxW?: string; label?: string; cerrable?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  useDialogo(open, cerrable ? onClose : () => {}, ref)
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 animate-fade-in" onClick={cerrable ? onClose : undefined} aria-hidden="true" />
      <div ref={ref} role="dialog" aria-modal="true" aria-label={label} tabIndex={-1}
        className={cls('relative w-full bg-white rounded-2xl shadow-pop max-h-[92vh] overflow-y-auto animate-fade-in', maxW)}>
        {cerrable && <button className="icon-btn absolute right-3 top-3 z-10 bg-white/80" onClick={onClose} aria-label="Cerrar"><X className="w-5 h-5" /></button>}
        {children}
      </div>
    </div>
  )
}

export function SectionTitle({ n, icon, children }: { n?: number; icon: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-center gap-3 pb-3 mb-4 border-b border-line">
      <span className="w-7 h-7 rounded-lg bg-primary-container/40 text-secondary flex items-center justify-center">{icon}</span>
      <h3 className="text-sm font-semibold uppercase tracking-wide">{n ? `${n}. ` : ''}{children}</h3>
    </div>
  )
}

/* ---------- Confirmación de eliminación ---------- */
export function ConfirmarEliminar({ abierto, titulo, children, onConfirmar, onCerrar, texto = 'Eliminar definitivamente' }:
  { abierto: boolean; titulo: string; children: ReactNode; onConfirmar: () => Promise<void>; onCerrar: () => void; texto?: string }) {
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string>()
  useEffect(() => { if (abierto) { setError(undefined); setEnviando(false) } }, [abierto])
  const confirmar = async () => {
    setEnviando(true); setError(undefined)
    try { await onConfirmar(); onCerrar() } catch (e) { setError((e as Error).message) } finally { setEnviando(false) }
  }
  return (
    <Modal open={abierto} onClose={onCerrar} maxW="max-w-md" label={titulo}>
      <div className="p-6">
        <div className="flex items-start gap-3">
          <span className="w-10 h-10 rounded-xl bg-error-container text-error flex items-center justify-center shrink-0"><Trash2 className="w-5 h-5" /></span>
          <div className="min-w-0 pr-6">
            <h2 className="text-lg font-semibold">{titulo}</h2>
            <div className="text-sm text-on-surface-variant mt-1 space-y-2">{children}</div>
            <p className="text-sm font-semibold text-error mt-3">Esta acción no se puede deshacer.</p>
          </div>
        </div>
        <div className="mt-4"><ErrorBox msg={error} /></div>
        <div className="mt-5 flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
          <button type="button" className="btn-outline" onClick={onCerrar} data-autofocus>Cancelar</button>
          <button type="button" className="btn-danger" onClick={confirmar} disabled={enviando}>
            {enviando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}{texto}
          </button>
        </div>
      </div>
    </Modal>
  )
}

/* ---------- Toasts ---------- */
type Toast = { id: number; msg: string; tipo: 'ok' | 'error' }
const ToastCtx = createContext<(msg: string, tipo?: 'ok' | 'error') => void>(() => {})
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([])
  const push = useCallback((msg: string, tipo: 'ok' | 'error' = 'ok') => {
    const id = Date.now() + Math.random()
    setItems((x) => [...x, { id, msg, tipo }])
    setTimeout(() => setItems((x) => x.filter((t) => t.id !== id)), 3500)
  }, [])
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div role="status" aria-live="polite" className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] flex flex-col gap-2 w-[min(92vw,420px)]">
        {items.map((t) => (
          <div key={t.id} className={cls('flex items-center gap-2 rounded-xl px-4 py-3 text-sm shadow-pop animate-fade-in', t.tipo === 'ok' ? 'bg-secondary text-white' : 'bg-error text-white')}>
            {t.tipo === 'ok' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}{t.msg}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}
export const useToast = () => useContext(ToastCtx)

/* ---------- Paginación ---------- */
export function usePaged<T>(rows: T[], size = 10) {
  const [page, setPage] = useState(1)
  const pages = Math.max(1, Math.ceil(rows.length / size))
  const p = Math.min(page, pages)
  return { page: p, pages, setPage, slice: rows.slice((p - 1) * size, p * size), total: rows.length, size }
}

export function Pager({ page, pages, setPage, total, size, unidad = 'registros' }: { page: number; pages: number; setPage: (n: number) => void; total: number; size: number; unidad?: string }) {
  if (total === 0) return null
  const from = (page - 1) * size + 1
  const to = Math.min(total, page * size)
  const nums = Array.from({ length: pages }, (_, i) => i + 1).filter((n) => n === 1 || n === pages || Math.abs(n - page) <= 1)
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-line text-sm text-neutral">
      <span>Mostrando <b className="text-on-surface">{from}–{to}</b> de <b className="text-on-surface">{total}</b> {unidad}</span>
      <div className="flex items-center gap-1">
        <button className="icon-btn" disabled={page === 1} onClick={() => setPage(page - 1)} aria-label="Anterior">‹</button>
        {nums.map((n, i) => (
          <span key={n} className="flex items-center">
            {i > 0 && nums[i - 1] !== n - 1 && <span className="px-1">…</span>}
            <button onClick={() => setPage(n)} aria-label={`Página ${n}`} aria-current={n === page ? 'page' : undefined} className={cls('min-w-8 h-8 px-2 rounded-lg text-sm font-medium', n === page ? 'bg-secondary text-white' : 'hover:bg-surface-low')}>{n}</button>
          </span>
        ))}
        <button className="icon-btn" disabled={page === pages} onClick={() => setPage(page + 1)} aria-label="Siguiente">›</button>
      </div>
    </div>
  )
}

import { Link } from 'react-router-dom'
import { DESARROLLADOR, INSTITUCION } from '../institucion'
import { cls } from '../utils'

const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
)
const GitHubIcon = () => (
  <svg viewBox="0 0 16 16" width="18" height="18" fill="currentColor" aria-hidden="true">
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
  </svg>
)

/** Datos del plantel y enlaces legales */
export function PieInstitucional({ className }: { className?: string }) {
  const i = INSTITUCION
  const datos = [i.cct && `CCT ${i.cct}`, i.domicilio, i.telefono && `Tel. ${i.telefono}`].filter(Boolean)
  return (
    <div className={cls('text-xs text-neutral space-y-1.5', className)}>
      <p><span className="font-semibold text-on-surface-variant">{i.corto}</span> · {i.ubicacion}{datos.length > 0 && <> · {datos.join(' · ')}</>}
        {i.correo && <> · <a className="underline hover:text-secondary" href={`mailto:${i.correo}`}>{i.correo}</a></>}</p>
      <nav aria-label="Información legal" className="flex flex-wrap gap-x-4 gap-y-1">
        <Link to="/privacidad" className="font-medium text-secondary hover:underline">Aviso de privacidad</Link>
        <Link to="/terminos" className="font-medium text-secondary hover:underline">Términos y condiciones</Link>
      </nav>
    </div>
  )
}

/** Franja de crédito del desarrollador (servicio social) */
export function CreditoDesarrollador() {
  const d = DESARROLLADOR
  return (
    <div className="bg-[#052e16] text-slate-300 text-sm">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-center sm:text-left">
          Desarrollado por <span className="font-semibold text-[#86efac]">{d.nombre}</span> · {d.titulo}
        </p>
        <div className="flex items-center gap-5">
          <a href={d.linkedin} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-white">
            <LinkedInIcon />LinkedIn<span className="sr-only"> (abre en una pestaña nueva)</span>
          </a>
          <a href={d.github} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-white">
            <GitHubIcon />GitHub<span className="sr-only"> (abre en una pestaña nueva)</span>
          </a>
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { Building2, Clock, Smartphone, Globe, WifiOff, ImageOff } from 'lucide-react'
import type { Empresa, Registro, Usuario } from '../types'
import { fmtHora, fotoSrc, nombreCompleto, ymd, fmtFechaLarga, cls } from '../utils'
import { Modal, TipoRegistroChip } from './ui'
import { LinkMaps, MapaPuntos, type Punto } from './Mapa'

export interface EvidenciaData {
  registro: Registro
  usuario?: Usuario
  empresa?: Empresa
}

/** Miniatura de la foto; al hacer clic abre la evidencia completa (foto + mapa) */
export function FotoThumb({ data, size = 40 }: { data: EvidenciaData; size?: number }) {
  const [open, setOpen] = useState(false)
  const r = data.registro
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} title="Ver evidencia" aria-label={`Ver evidencia de ${r.tipo === 'ENTRADA' ? 'entrada' : 'salida'} de las ${fmtHora(r.timestamp)}`}
        className="relative shrink-0 rounded-lg overflow-hidden ring-1 ring-line hover:ring-2 hover:ring-primary-container transition" style={{ width: size, height: size }}>
        {r.fotoUrl
          ? <img src={fotoSrc(r.fotoUrl)} alt="" className="w-full h-full object-cover" loading="lazy" />
          : <span className="w-full h-full flex items-center justify-center bg-surface-low text-neutral"><ImageOff className="w-4 h-4" /></span>}
        <span className={cls('absolute bottom-0 inset-x-0 h-1', r.tipo === 'ENTRADA' ? 'bg-primary-container' : 'bg-tertiary-container')} />
      </button>
      <EvidenciaModal data={open ? data : null} onClose={() => setOpen(false)} />
    </>
  )
}

export function EvidenciaModal({ data, onClose }: { data: EvidenciaData | null; onClose: () => void }) {
  if (!data) return null
  const { registro: r, usuario, empresa } = data
  const puntos: Punto[] = [{ lat: r.latitud, lng: r.longitud, titulo: `${r.tipo === 'ENTRADA' ? 'Entrada' : 'Salida'} · ${fmtHora(r.timestamp)}`, detalle: usuario ? nombreCompleto(usuario) : undefined }]
  if (empresa) puntos.push({ lat: empresa.latitud, lng: empresa.longitud, titulo: empresa.nombre, detalle: 'Ubicación registrada de la empresa', color: 'ambar' })
  return (
    <Modal open onClose={onClose} maxW="max-w-4xl" label="Evidencia del registro">
      <div className="grid md:grid-cols-2">
        <div className="bg-slate-900 flex items-center justify-center md:rounded-l-2xl rounded-t-2xl md:rounded-tr-none overflow-hidden">
          {r.fotoUrl
            ? <img src={fotoSrc(r.fotoUrl, `${usuario ? nombreCompleto(usuario) : ''} · ${fmtHora(r.timestamp)}`)}
                alt={`Foto de ${r.tipo === 'ENTRADA' ? 'entrada' : 'salida'}${usuario ? ` de ${nombreCompleto(usuario)}` : ''}, ${fmtHora(r.timestamp)}`} className="w-full max-h-[70vh] object-contain" />
            : <p className="flex flex-col items-center gap-2 text-slate-300 text-sm p-10 text-center"><ImageOff className="w-8 h-8" />La foto se eliminó al cumplir su plazo de conservación (1 año).</p>}
        </div>
        <div className="p-6 space-y-4">
          <div>
            <TipoRegistroChip tipo={r.tipo} />
            <h3 className="text-lg font-semibold mt-2">{usuario ? nombreCompleto(usuario) : 'Mi registro'}</h3>
            <p className="text-sm text-neutral">{fmtFechaLarga(ymd(new Date(r.timestamp)))}</p>
          </div>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div><dt className="eyebrow">Hora exacta</dt><dd className="font-semibold flex items-center gap-1.5 mt-0.5"><Clock className="w-4 h-4 text-neutral" />{new Date(r.timestamp).toLocaleTimeString('es-MX')}</dd></div>
            <div><dt className="eyebrow">Origen</dt><dd className="font-medium flex items-center gap-1.5 mt-0.5">
              {r.origen === 'APP' ? <><Smartphone className="w-4 h-4 text-neutral" />App Android</> : <><Globe className="w-4 h-4 text-neutral" />Web</>}
              {r.offline && <span className="chip bg-slate-100 text-slate-600"><WifiOff className="w-3 h-3" />Offline</span>}
            </dd></div>
            <div className="col-span-2"><dt className="eyebrow">Ubicación de la foto</dt><dd className="mt-0.5"><LinkMaps lat={r.latitud} lng={r.longitud} /></dd></div>
            {empresa && <div className="col-span-2"><dt className="eyebrow">Empresa asignada</dt><dd className="font-medium flex items-center gap-1.5 mt-0.5"><Building2 className="w-4 h-4 text-neutral" />{empresa.nombre}</dd></div>}
          </dl>
          <MapaPuntos puntos={puntos} height={220} />
          <p className="text-xs text-neutral flex items-center gap-3">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-secondary" />Donde se tomó la foto</span>
            {empresa && <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#b7791f]" />Empresa</span>}
          </p>
        </div>
      </div>
    </Modal>
  )
}

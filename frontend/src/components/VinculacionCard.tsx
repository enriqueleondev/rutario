import { Building2, MapPin, Phone, CalendarDays, User } from 'lucide-react'
import type { Empresa, Vinculacion } from '../types'
import { DIAS } from '../types'
import { fmtFecha } from '../utils'
import { TipoChip } from './ui'
import { MapaPuntos } from './Mapa'

export default function VinculacionCard({ v, empresa, mapa = true, compacta = false }: { v?: Vinculacion; empresa?: Empresa; mapa?: boolean; compacta?: boolean }) {
  if (!v || !empresa) {
    return (
      <div className="card p-5">
        <p className="eyebrow mb-2">Lugar de práctica</p>
        <p className="font-semibold">Sin empresa asignada</p>
        <p className="text-sm text-neutral mt-1">El vinculador aún no asigna empresa, tipo de práctica ni horario.</p>
      </div>
    )
  }
  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow mb-1">Lugar de práctica</p>
          <p className="font-semibold text-lg leading-snug flex items-center gap-2"><Building2 className="w-5 h-5 text-secondary shrink-0" />{empresa.nombre}</p>
          <p className="text-sm text-neutral flex items-start gap-1.5 mt-1"><MapPin className="w-4 h-4 mt-0.5 shrink-0" />{empresa.direccion}</p>
        </div>
        <TipoChip tipo={v.tipoPractica} />
      </div>
      {mapa && <MapaPuntos height={compacta ? 140 : 180} puntos={[{ lat: empresa.latitud, lng: empresa.longitud, titulo: empresa.nombre, detalle: empresa.direccion }]} />}
      {!compacta && (
        <>
          <div>
            <p className="eyebrow mb-1">Actividades</p>
            <p className="text-sm">{v.actividades}</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            {empresa.contactoNombre && <p className="flex items-center gap-2"><User className="w-4 h-4 text-neutral" />{empresa.contactoNombre}</p>}
            {empresa.contactoTelefono && <p className="flex items-center gap-2"><Phone className="w-4 h-4 text-neutral" />{empresa.contactoTelefono}</p>}
            {v.fechaInicio && <p className="flex items-center gap-2 sm:col-span-2"><CalendarDays className="w-4 h-4 text-neutral" />{fmtFecha(v.fechaInicio)} – {v.fechaFin ? fmtFecha(v.fechaFin) : 'sin fecha de término'}</p>}
          </div>
        </>
      )}
      <div>
        <p className="eyebrow mb-2">Horario</p>
        <div className="flex flex-wrap gap-1.5">
          {DIAS.filter((d) => v.horario.some((h) => h.dia === d.key)).map((d) => {
            const h = v.horario.find((x) => x.dia === d.key)!
            return <span key={d.key} className="chip bg-surface-low text-on-surface py-1 px-2.5"><b>{d.corto}</b> {h.inicio}–{h.fin}</span>
          })}
          {v.horario.length === 0 && <span className="text-sm text-neutral">Sin horario definido</span>}
        </div>
      </div>
    </div>
  )
}

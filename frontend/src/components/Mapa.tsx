import { useEffect, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import { Crosshair, ExternalLink } from 'lucide-react'
import { coords, mapsUrl } from '../utils'

// Centro aproximado del CBT (Chapultepec, Edo. Méx.)
export const CENTRO_CBT: [number, number] = [19.2006, -99.5617]

const pin = (color: string) =>
  L.divIcon({
    className: 'pin-icon',
    iconSize: [28, 36],
    iconAnchor: [14, 34],
    popupAnchor: [0, -30],
    html: `<svg width="28" height="36" viewBox="0 0 28 36"><path d="M14 35s12-11.6 12-21A12 12 0 0 0 2 14c0 9.4 12 21 12 21z" fill="${color}" stroke="#fff" stroke-width="2"/><circle cx="14" cy="14" r="4.5" fill="#fff"/></svg>`,
  })
export const PIN = { verde: pin('#0B7468'), ambar: pin('#E5532A'), azul: pin('#0B1630') }

export interface Punto {
  /** Puede faltar si la evidencia ya se depuró; esos puntos no se dibujan */
  lat?: number
  lng?: number
  titulo?: string
  detalle?: string
  color?: keyof typeof PIN
}

type PuntoOk = Punto & { lat: number; lng: number }
const conCoords = (ps: Punto[]) => ps.filter((p): p is PuntoOk => p.lat != null && p.lng != null)

function Ajustar({ puntos }: { puntos: PuntoOk[] }) {
  const map = useMap()
  useEffect(() => {
    if (puntos.length === 1) map.setView([puntos[0].lat, puntos[0].lng], 16, { animate: false })
    else if (puntos.length > 1) map.fitBounds(L.latLngBounds(puntos.map((p) => [p.lat, p.lng])), { padding: [30, 30], maxZoom: 15, animate: false })
  }, [map, puntos])
  return null
}

const Tiles = () => (
  <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
)

export function MapaPuntos({ puntos: todos, height = 260, className = '' }: { puntos: Punto[]; height?: number; className?: string }) {
  const puntos = conCoords(todos)
  return (
    <div className={`rounded-xl overflow-hidden border border-line bg-surface-container ${className}`} style={{ height }}>
      <MapContainer center={puntos[0] ? [puntos[0].lat, puntos[0].lng] : CENTRO_CBT} zoom={13} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
        <Tiles />
        <Ajustar puntos={puntos} />
        {puntos.map((p, i) => (
          <Marker key={i} position={[p.lat, p.lng]} icon={PIN[p.color ?? 'verde']}>
            {(p.titulo || p.detalle) && (
              <Popup>
                <b>{p.titulo}</b>
                {p.detalle && <div style={{ fontSize: 12, color: '#64748b' }}>{p.detalle}</div>}
              </Popup>
            )}
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}

function ClickPicker({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onPick(+e.latlng.lat.toFixed(6), +e.latlng.lng.toFixed(6)) })
  return null
}

function Recentrar({ lat, lng }: { lat?: number; lng?: number }) {
  const map = useMap()
  useEffect(() => { if (lat && lng) map.setView([lat, lng], Math.max(map.getZoom(), 16), { animate: false }) }, [map, lat, lng])
  return null
}

/** Selector de ubicación para empresas: clic en el mapa, arrastrar el pin o usar el GPS del dispositivo */
export function MapaSelector({ lat, lng, onChange }: { lat?: number; lng?: number; onChange: (lat: number, lng: number) => void }) {
  const [gpsError, setGpsError] = useState(false)
  const usarGps = () =>
    navigator.geolocation?.getCurrentPosition(
      (p) => { setGpsError(false); onChange(+p.coords.latitude.toFixed(6), +p.coords.longitude.toFixed(6)) },
      () => setGpsError(true),
      { enableHighAccuracy: true, timeout: 10000 },
    )
  return (
    <div className="space-y-2">
      <div className="relative rounded-xl overflow-hidden border border-line bg-surface-container" style={{ height: 280 }}>
        <MapContainer center={lat && lng ? [lat, lng] : CENTRO_CBT} zoom={lat ? 16 : 12} style={{ height: '100%', width: '100%' }}>
          <Tiles />
          <ClickPicker onPick={onChange} />
          <Recentrar lat={lat} lng={lng} />
          {lat && lng && (
            <Marker position={[lat, lng]} icon={PIN.verde} draggable
              eventHandlers={{ dragend: (e) => { const p = (e.target as L.Marker).getLatLng(); onChange(+p.lat.toFixed(6), +p.lng.toFixed(6)) } }} />
          )}
        </MapContainer>
        <button type="button" onClick={usarGps} className="absolute right-2 top-2 z-[2] btn-outline h-8 px-3 text-xs shadow-card">
          <Crosshair className="w-3.5 h-3.5" /> Mi ubicación
        </button>
      </div>
      <p className={gpsError ? 'text-xs text-error' : 'text-xs text-neutral'}>
        {gpsError ? 'No se pudo obtener tu ubicación; marca el punto en el mapa.' : 'Haz clic en el mapa o arrastra el pin para marcar la entrada de la empresa.'}
      </p>
    </div>
  )
}

export function LinkMaps({ lat, lng }: { lat?: number; lng?: number }) {
  if (lat == null || lng == null) return <span className="text-xs text-neutral">Eliminada al cumplir el plazo de conservación</span>
  return (
    <a href={mapsUrl(lat, lng)} target="_blank" rel="noreferrer" aria-label={`Abrir ${coords(lat, lng)} en Google Maps (nueva pestaña)`} className="inline-flex items-center gap-1 text-xs font-medium text-secondary hover:underline mono">
      {coords(lat, lng)} <ExternalLink className="w-3 h-3" />
    </a>
  )
}
